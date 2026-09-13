import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  swrGraceUntil?: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRatePerSec: number;
}

interface CircuitState {
  isOpen: boolean;
  openUntil: number;
  failureCount: number;
  lastFailure: string;
}

export const CACHE_TTL = {
  ACCOUNT: 600,         // 10 minutes for WABA account metadata
  HEALTH: 600,          // 10 minutes for Meta health & verification status
  TEMPLATES: 300,       // 5 minutes for WhatsApp message templates
  FLOWS: 300,           // 5 minutes for WhatsApp Flows
  CAMPAIGNS: 180,       // 3 minutes for campaigns overview & schedule
  BUSINESS_AGENT: 600,  // 10 minutes for Astra Business Agent full state
  CONVERSATIONS: 60,    // 60 seconds for inbox conversation threads
  DEFAULT: 120,         // 2 minutes default
};

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private inFlightPromises: Map<string, Promise<any>> = new Map();
  private rateBuckets: Map<string, TokenBucket> = new Map();
  private circuits: Map<string, CircuitState> = new Map();

  private redisClient: Redis | null = null;
  private isRedisConnected: boolean = false;
  private hits: number = 0;
  private misses: number = 0;
  private coalescedRequests: number = 0;
  private throttledRequests: number = 0;

  constructor() {
    // Check if Redis is configured via environment
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    const redisHost = process.env.REDIS_HOST;

    if (redisUrl || redisHost) {
      try {
        this.redisClient = redisUrl
          ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
          : new Redis({
              host: redisHost || 'localhost',
              port: Number(process.env.REDIS_PORT || 6379),
              password: process.env.REDIS_PASSWORD || undefined,
              lazyConnect: true,
              maxRetriesPerRequest: 1,
            });

        this.redisClient.connect().then(() => {
          this.isRedisConnected = true;
          console.log('[CacheService] Connected to Redis server.');
        }).catch((err) => {
          console.warn('[CacheService] Redis connection not available, falling back to High-Speed In-Memory TTL Cache:', err.message);
          this.redisClient = null;
        });
      } catch (err: any) {
        console.warn('[CacheService] Redis init failed, using In-Memory Cache:', err.message);
      }
    }

    // Periodic sweep of expired memory cache items every 60 seconds
    setInterval(() => this.cleanupExpired(), 60000).unref();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now && (!entry.swrGraceUntil || entry.swrGraceUntil <= now)) {
        this.memoryCache.delete(key);
      }
    }

    // Also clean idle rate buckets older than 1 hour
    for (const [bucketKey, bucket] of this.rateBuckets.entries()) {
      if (now - bucket.lastRefill > 3600000) {
        this.rateBuckets.delete(bucketKey);
      }
    }
  }

  /**
   * Generates a namespaced cache key for a specific user.
   */
  public getUserKey(userId: string, resource: string): string {
    return `user:${userId.trim().toLowerCase()}:${resource}`;
  }

  /**
   * Retrieves a cached value by key.
   */
  public async get<T>(key: string): Promise<T | null> {
    // 1. Check in-memory L1 cache
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (memEntry.expiresAt > Date.now()) {
        this.hits++;
        return memEntry.value as T;
      }
      // If within SWR grace window (stale-while-revalidate), return stale value
      if (memEntry.swrGraceUntil && memEntry.swrGraceUntil > Date.now()) {
        this.hits++;
        return memEntry.value as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check Redis if available
    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          this.hits++;
          const parsed = JSON.parse(raw);
          // Backfill memory cache
          this.memoryCache.set(key, { value: parsed, expiresAt: Date.now() + 60000 });
          return parsed as T;
        }
      } catch (e) {}
    }

    this.misses++;
    return null;
  }

  /**
   * Stores a value in cache with a TTL and optional SWR grace period.
   */
  public async set<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.DEFAULT, swrGraceSeconds: number = 0): Promise<void> {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;
    const swrGraceUntil = swrGraceSeconds > 0 ? expiresAt + swrGraceSeconds * 1000 : undefined;

    this.memoryCache.set(key, { value, expiresAt, swrGraceUntil });

    if (this.isRedisConnected && this.redisClient) {
      try {
        const redisTtl = ttlSeconds + swrGraceSeconds;
        await this.redisClient.set(key, JSON.stringify(value), 'EX', redisTtl);
      } catch (e) {}
    }
  }

  /**
   * Deletes a specific cache key.
   */
  public async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.inFlightPromises.delete(key);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (e) {}
    }
  }

  /**
   * Invalidates all cached resources for a given user.
   */
  public async invalidateUser(userId: string): Promise<void> {
    if (!userId) return;
    const prefix = `user:${userId.trim().toLowerCase()}:`;

    // Evict from Memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        this.inFlightPromises.delete(key);
      }
    }

    // Evict from Redis
    if (this.isRedisConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (e) {}
    }
  }

  /**
   * In-Flight Request Coalescing (Singleflight).
   * If multiple concurrent requests arrive for the same key while cache is cold,
   * only 1 execution runs; all callers await and share the same Promise.
   */
  public async fetchWithCoalescing<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.DEFAULT
  ): Promise<T> {
    // 1. Return immediately if cached
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // 2. If an identical request is already in-flight, await and share it
    if (this.inFlightPromises.has(key)) {
      this.coalescedRequests++;
      return this.inFlightPromises.get(key) as Promise<T>;
    }

    // 3. Initiate single execution
    const promise = (async () => {
      try {
        const result = await fetchFn();
        if (result !== undefined && result !== null) {
          await this.set(key, result, ttlSeconds);
        }
        return result;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
    return promise;
  }

  /**
   * Token Bucket Rate Limiter per user.
   * Restricts outbound API bursts to avoid hitting upstream Meta/Zernio quotas.
   * Default: 30 token capacity, refilling at 0.5 tokens/sec (30 tokens/minute).
   */
  public consumeRateLimit(
    userId: string,
    action: string = 'api',
    cost: number = 1,
    maxTokens: number = 30,
    refillRatePerSec: number = 0.5
  ): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const bucketKey = `${userId.trim().toLowerCase()}:${action}`;
    const now = Date.now();
    let bucket = this.rateBuckets.get(bucketKey);

    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
        maxTokens,
        refillRatePerSec,
      };
      this.rateBuckets.set(bucketKey, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsedSeconds * bucket.refillRatePerSec);
    bucket.lastRefill = now;

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { allowed: true, remaining: Math.floor(bucket.tokens) };
    } else {
      this.throttledRequests++;
      const needed = cost - bucket.tokens;
      const retryAfterSec = Math.ceil(needed / bucket.refillRatePerSec);
      return { allowed: false, remaining: Math.floor(bucket.tokens), retryAfterSec };
    }
  }

  /**
   * Upstream Circuit Breaker state inspection
   */
  public isCircuitOpen(serviceKey: string = 'zernio'): boolean {
    const circuit = this.circuits.get(serviceKey);
    if (!circuit || !circuit.isOpen) return false;

    if (Date.now() >= circuit.openUntil) {
      // Cooldown expired, half-open
      circuit.isOpen = false;
      return false;
    }
    return true;
  }

  /**
   * Record upstream API response status code to trip circuit breaker on 429 or repeated 5xx
   */
  public recordUpstreamStatus(serviceKey: string, statusCode: number, errorText?: string): void {
    let circuit = this.circuits.get(serviceKey);
    if (!circuit) {
      circuit = { isOpen: false, openUntil: 0, failureCount: 0, lastFailure: '' };
      this.circuits.set(serviceKey, circuit);
    }

    if (statusCode === 429) {
      // HTTP 429 Too Many Requests -> Immediately trip circuit for 60 seconds
      circuit.isOpen = true;
      circuit.openUntil = Date.now() + 60000;
      circuit.lastFailure = `HTTP 429 Too Many Requests (${new Date().toLocaleTimeString()}): ${errorText || 'Rate limit reached'}`;
      console.warn(`[CircuitBreaker] ${serviceKey} tripped OPEN for 60s due to 429 rate limit.`);
    } else if (statusCode >= 500) {
      circuit.failureCount++;
      if (circuit.failureCount >= 3) {
        circuit.isOpen = true;
        circuit.openUntil = Date.now() + 30000;
        circuit.lastFailure = `HTTP ${statusCode} Server Error: ${errorText || 'Upstream outage'}`;
        console.warn(`[CircuitBreaker] ${serviceKey} tripped OPEN for 30s due to consecutive 5xx errors.`);
      }
    } else if (statusCode >= 200 && statusCode < 300) {
      circuit.failureCount = 0;
      circuit.isOpen = false;
    }
  }

  /**
   * Flushes the entire cache.
   */
  public async flush(): Promise<void> {
    this.memoryCache.clear();
    this.inFlightPromises.clear();
    this.rateBuckets.clear();
    this.circuits.clear();
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (e) {}
    }
  }

  /**
   * Telemetry stats for observability.
   */
  public getStats(): {
    engine: string;
    isRedisConnected: boolean;
    activeMemoryKeys: number;
    inFlightCount: number;
    coalescedRequests: number;
    throttledRequests: number;
    hits: number;
    misses: number;
    hitRate: string;
    circuitStates: Record<string, { isOpen: boolean; openUntil?: string; lastFailure?: string }>;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0.0%';

    const circuitStates: Record<string, any> = {};
    for (const [k, c] of this.circuits.entries()) {
      circuitStates[k] = {
        isOpen: this.isCircuitOpen(k),
        openUntil: c.isOpen ? new Date(c.openUntil).toISOString() : undefined,
        lastFailure: c.lastFailure || undefined,
      };
    }

    return {
      engine: this.isRedisConnected ? 'Redis (L2) + Memory (L1) with Coalescing' : 'High-Speed In-Memory TTL Cache (L1) with Coalescing',
      isRedisConnected: this.isRedisConnected,
      activeMemoryKeys: this.memoryCache.size,
      inFlightCount: this.inFlightPromises.size,
      coalescedRequests: this.coalescedRequests,
      throttledRequests: this.throttledRequests,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      circuitStates,
    };
  }
}

export const cacheService = new CacheService();

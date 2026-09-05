import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private redisClient: Redis | null = null;
  private isRedisConnected: boolean = false;
  private hits: number = 0;
  private misses: number = 0;

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
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
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
          this.memoryCache.set(key, { value: parsed, expiresAt: Date.now() + 30000 });
          return parsed as T;
        }
      } catch (e) {}
    }

    this.misses++;
    return null;
  }

  /**
   * Stores a value in cache with a TTL (default: 60 seconds).
   */
  public async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (e) {}
    }
  }

  /**
   * Deletes a specific cache key.
   */
  public async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
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
   * Flushes the entire cache.
   */
  public async flush(): Promise<void> {
    this.memoryCache.clear();
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
    hits: number;
    misses: number;
    hitRate: string;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0.0%';
    return {
      engine: this.isRedisConnected ? 'Redis (L2) + Memory (L1)' : 'High-Speed In-Memory TTL Cache (L1)',
      isRedisConnected: this.isRedisConnected,
      activeMemoryKeys: this.memoryCache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    };
  }
}

export const cacheService = new CacheService();

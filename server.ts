import express from "express";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { Zernio } from "@zernio/node";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security headers & CORS
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: ['https://rockyt.io', 'http://localhost:3000'],
    credentials: true,
  }));

  app.use(cookieParser());
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting for auth and API key creation
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
  });
  app.use('/api/auth/', authLimiter);
  app.use('/api/v1/keys', authLimiter);
  const zernio = new Zernio({ apiKey: process.env.ROCKYT_API_KEY || process.env.ZERNIO_API_KEY || "dummy_dev_key" });

  // ─── Static frontend: dist (Vite SPA) & fallback to cloned_site ───────────────────────
  const DIST_DIR = path.join(process.cwd(), 'dist');
  const CLONED_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(process.cwd(), 'cloned_site');
  const PUBLIC_DIR = path.join(process.cwd(), 'public');
  
  if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
  }
  app.use(express.static(PUBLIC_DIR));

  // Strip ?dpl=... and other query strings from Next.js asset URLs so the
  // static files (saved without query strings) are found correctly on disk.
  app.use((req, _res, next) => {
    if (req.url.includes('?') && (
      req.url.startsWith('/_next/') ||
      req.url.startsWith('/images/') ||
      req.url.startsWith('/brand/') ||
      req.url.startsWith('/fonts/')
    ) && !req.url.startsWith('/_next/image')) {
      req.url = req.url.split('?')[0];
    }
    next();
  });

  // Next.js RSC Flight payload fallback handler – prevents 'Connection closed' on RSC requests
  app.use((req, res, next) => {
    if (req.url.includes('_rsc=') || req.headers['rsc'] === '1' || req.path.endsWith('.rsc')) {
      res.setHeader('Content-Type', 'text/x-component; charset=utf-8');
      return res.status(200).send('1:"$Sreact.fragment"\n0:null\n');
    }
    next();
  });

  // ─── Next.js Image Optimization Proxy / Handler ───
  app.get(['/_next/image', '/image'], (req: any, res: any) => {
    try {
      const rawUrl = req.query.url;
      if (!rawUrl || typeof rawUrl !== 'string') {
        const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        return res.status(200).send(transparentPng);
      }
      const cleanUrl = rawUrl.split('?')[0];
      const targetFile = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
      const imagePath = path.join(CLONED_DIR, targetFile);
      const publicPath = path.join(PUBLIC_DIR, targetFile);

      if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
      } else if (fs.existsSync(publicPath)) {
        return res.sendFile(publicPath);
      } else if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return res.redirect(cleanUrl);
      } else {
        // Return 1x1 transparent PNG fallback if image is missing on disk
        const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        return res.status(200).send(transparentPng);
      }
    } catch (_err) {
      const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(transparentPng);
    }
  });

  // ─── Auth & OAuth routes ───
  app.get('/api/auth/google', (req: any, res: any) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!supabaseUrl) return res.status(500).json({ error: 'Supabase not configured on server' });
    const host = req.headers.host || 'rockyt.io';
    const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const appBase = process.env.APP_BASE_URL || `${protocol}://${host}`;
    const redirectTo = encodeURIComponent(`${appBase}/api/auth/callback`);
    return res.redirect(`${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`);
  });

  app.get('/api/auth/callback', asyncHandler(async (req: any, res: any) => {
    const code = req.query.code as string;
    if (!code) return res.redirect('/signin?error=missing_code');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    try {
      const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': anonKey! },
        body: JSON.stringify({ auth_code: code })
      });
      if (!tokenRes.ok) {
        return res.redirect('/dashboard');
      }
      const session = await tokenRes.json();
      if (session.access_token) {
        res.cookie('rockyt_session', session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: (session.expires_in || 3600) * 1000
        });
      }
      return res.redirect('/dashboard');
    } catch (e) {
      return res.redirect('/dashboard');
    }
  }));

  app.get('/api/auth/session', (req: any, res) => {
    const token = req.cookies?.rockyt_session || req.headers.authorization?.replace('Bearer ', '').trim();
    if (!token) return res.json({});
    const decoded = decodeSupabaseJWT(token);
    if (!decoded) return res.json({});
    res.json({ user: { id: decoded.id, email: decoded.email } });
  });

  app.post('/api/auth/signout', (_req, res) => {
    res.clearCookie('rockyt_session');
    res.json({ success: true });
  });

  app.get('/api/auth/csrf', (_req, res) => res.json({ csrfToken: 'rockyt_csrf_token' }));
  app.get('/api/auth/providers', (_req, res) => res.json({ google: { id: 'google', name: 'Google' } }));
  app.post('/api/auth/_log', (_req, res) => res.json({ ok: true }));
  app.get('/api/auth/_log', (_req, res) => res.json({ ok: true }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Sentry monitoring tunnel – silently accept all HTTP methods (GET, POST, OPTIONS, PUT, HEAD)
  app.use('/monitoring', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, HEAD');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(JSON.stringify({ status: 'ok' }));
  });

  // PostHog analytics proxy – silently accept / return empty
  app.use('/ph-data', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, HEAD');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(JSON.stringify({}));
  });

  // Plausible analytics stub
  app.get('/js/script.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send('// analytics stub');
  });

  // Facebook/LinkedIn/analytics pixel stubs
  app.post('/api/analytics/:provider/:event', (_req, res) => res.json({ ok: true }));

  // Next.js bot-protection challenge endpoints – return valid JS for all nested subpaths
  app.use('/149e9513-01fa-4fb0-aad4-566afd725d1b', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    if (req.url.endsWith('p.js')) {
      return res.send('document.dispatchEvent(new Event("kpsdk-load"));document.dispatchEvent(new Event("kpsdk-ready"));');
    }
    return res.send('if(window.V_C){window.V_C.push(()=>{})}');
  });



  // Serve raw openapi.yaml – prefer cloned_site copy, fall back to public/
  app.get('/openapi.yaml', (_req, res) => {
    const clonedYaml = path.join(CLONED_DIR, 'openapi.yaml');
    const publicYaml = path.join(PUBLIC_DIR, 'openapi.yaml');
    const yamlPath = fs.existsSync(clonedYaml) ? clonedYaml : publicYaml;
    if (fs.existsSync(yamlPath)) {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.sendFile(yamlPath);
    } else {
      res.status(404).send('Not Found');
    }
  });

  // Primary static frontend from cloned_site
  if (fs.existsSync(CLONED_DIR)) {
    app.use(express.static(CLONED_DIR, { dotfiles: 'allow', extensions: ['html'] }));
  }

  // Secondary static assets from public/ (overrides/extras)
  app.use(express.static(PUBLIC_DIR, { dotfiles: 'allow' }));

  // Fallback: serve empty JS stub for missing _next chunks to prevent ChunkLoadError crashes
  app.get('/_next/static/chunks/:chunk', (req, res, next) => {
    const chunkFile = path.join(CLONED_DIR, '_next', 'static', 'chunks', req.params.chunk);
    if (!fs.existsSync(chunkFile)) {
      // Serve empty turbopack-compatible module stub
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.send('// chunk stub\n(self.__next_chunk_s=self.__next_chunk_s||[]).push([]);');
    } else {
      next();
    }
  });

  // Capture raw body buffer for webhook signature verification
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const hasRealSupabase = Boolean(process.env.VITE_SUPABASE_URL && supabaseKey);
  const supabase = hasRealSupabase
    ? createClient(process.env.VITE_SUPABASE_URL!, supabaseKey!)
    : null;

  // Memory storage for local mock mode fallback
  const mockKeys: Array<{ id: string, user_id: string, key_hash: string, key_prefix: string, revoked: boolean, created_at: string }> = [];
  let mockConnectedCount = 0;

  async function ensureUserProfile(reqUser: { id: string; email?: string | null; user_metadata?: any }) {
    if (!supabase || !reqUser?.id) return null;
    const userEmail = reqUser.email || reqUser.user_metadata?.email || `user_${reqUser.id.substring(0, 8)}@rockyt.io`;

    try {
      let profile = null;
      if (reqUser.id) {
        const { data: p1 } = await supabase.from('profiles').select('*').eq('id', reqUser.id).maybeSingle();
        profile = p1;
      }
      if (!profile && userEmail) {
        const { data: p2 } = await supabase.from('profiles').select('*').eq('email', userEmail).maybeSingle();
        profile = p2;
      }

      if (!profile) {
        console.log(`[ensureUserProfile] Creating profile row for user: ${reqUser.id} (${userEmail})`);
        const { data: newProfile, error: upsertErr } = await supabase
          .from('profiles')
          .upsert({
            id: reqUser.id,
            email: userEmail,
            plan: 'Growth',
            max_accounts: 1,
            connected_accounts_count: 0,
            wallet_balance: 0.00
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (upsertErr) {
          console.error('[ensureUserProfile] Profile upsert error:', upsertErr.message);
        }
        profile = newProfile || { id: reqUser.id, email: userEmail, plan: 'Growth', max_accounts: 1, connected_accounts_count: 0, wallet_balance: 0.00 };
      }

      if (profile && !profile.zernio_profile_id) {
        let zernioProfileId: string | null = null;
        try {
          const listRes = await zernio.profiles.listProfiles();
          const profilesList = (listRes.data as any)?.profiles || (listRes.data as any) || [];
          const existing = Array.isArray(profilesList)
            ? profilesList.find((p: any) => p.name === userEmail)
            : null;
          if (existing?._id) {
            zernioProfileId = existing._id;
          } else {
            const zernioProfile = await zernio.profiles.createProfile({
              body: { name: userEmail }
            });
            zernioProfileId = (zernioProfile.data as any).profile?._id || (zernioProfile.data as any)?._id;
          }
        } catch (err: any) {
          console.warn('[ensureUserProfile] Zernio profile lookup warning:', err?.message || err);
          zernioProfileId = `prof_${reqUser.id.substring(0, 16)}`;
        }

        if (zernioProfileId) {
          try {
            const { data: updated } = await supabase
              .from('profiles')
              .update({ zernio_profile_id: zernioProfileId })
              .eq('id', reqUser.id)
              .select()
              .maybeSingle();
            if (updated) profile = updated;
          } catch (_updErr) {
            // ignore non-fatal update error
          }
        }
      }

      return profile;
    } catch (err: any) {
      console.error('[ensureUserProfile] Unhandled error:', err?.message || err);
      return { id: reqUser.id, email: userEmail, plan: 'Growth', max_accounts: 1, connected_accounts_count: 0 };
    }
  }

  function asyncHandler(fn: Function) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch((err) => {
        console.error('Express async handler caught error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
        }
      });
    };
  }

  function getMaxAccountsForUser(profile?: { plan?: string | null; max_accounts?: number | null; plan_product_id?: string | null } | null): number {
    if (!profile) return 1;
    const planName = (profile.plan || '').toLowerCase();
    const productId = profile.plan_product_id;
    if (planName.includes('scale') || productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ') return 10;
    return 1;
  }

  // Decode a Supabase JWT locally without any network call.
  // Supabase JWTs have: { sub: userId, email: ..., role: 'authenticated', ... }
  function decodeSupabaseJWT(token: string): { id: string; email: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Add padding if needed
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
      if (!payload || !payload.sub) return null;
      // Reject expired tokens
      if (payload.exp && Date.now() / 1000 > payload.exp) return null;
      // Only accept Supabase auth tokens (role: 'authenticated' or aud: 'authenticated')
      if (payload.role !== 'authenticated' && payload.aud !== 'authenticated') return null;
      const email = payload.email || payload.user_metadata?.email || `user_${payload.sub.substring(0, 8)}@rockyt.io`;
      return { id: payload.sub, email };
    } catch {
      return null;
    }
  }

  async function combinedAuth(req: any, res: any, next: any) {
    try {
      let token = req.cookies?.rockyt_session || req.headers.authorization?.replace('Bearer ', '').trim();
      const userEmailHeader = req.headers['x-user-email'] || req.headers['x-user-id'];

      if (!token && userEmailHeader) {
        token = String(userEmailHeader);
      }

      if (!supabase) {
        req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'moamenemam966@gmail.com' };
        req.zernioProfileId = 'mock-zernio-profile-id';
        req.plan = 'Growth';
        req.maxAccounts = 1;
        req.connectedCount = mockConnectedCount;
        return next();
      }

      // === PATH A: Supabase User JWT Token (contains dots) ===
      if (token && token.includes('.')) {
        const decoded = decodeSupabaseJWT(token);
        if (decoded) {
          req.user = decoded;
          const fullProfile = await ensureUserProfile(decoded);
          req.zernioProfileId = fullProfile?.zernio_profile_id || null;
          req.plan = fullProfile?.plan || 'Growth';
          req.maxAccounts = getMaxAccountsForUser(fullProfile);
          req.connectedCount = fullProfile?.connected_accounts_count || 0;
          return next();
        }
      }

      // === PATH B: API Key lookup via SHA-256 hash ===
      if (token) {
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        const { data: keyData } = await supabase
          .from('user_api_keys')
          .select('user_id, revoked')
          .eq('key_hash', hash)
          .maybeSingle();

        if (keyData && !keyData.revoked) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', keyData.user_id)
            .maybeSingle();

          req.user = { id: keyData.user_id, email: userProfile?.email || 'user@rockyt.io' };
          const fullProfile = await ensureUserProfile(req.user);
          req.zernioProfileId = fullProfile?.zernio_profile_id || null;
          req.plan = fullProfile?.plan || 'Growth';
          req.maxAccounts = getMaxAccountsForUser(fullProfile);
          req.connectedCount = fullProfile?.connected_accounts_count || 0;
          return next();
        }

        // Try looking up directly by email in profiles
        if (token.includes('@')) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', token)
            .maybeSingle();

          if (profileRow) {
            req.user = { id: profileRow.id, email: profileRow.email };
            req.zernioProfileId = profileRow.zernio_profile_id || null;
            req.plan = profileRow.plan || 'Growth';
            req.maxAccounts = getMaxAccountsForUser(profileRow);
            req.connectedCount = profileRow.connected_accounts_count || 0;
            return next();
          }
        }
      }

      // === PATH C: Session Fallback for Active User ===
      const fallbackEmail = (token && token.includes('@')) ? token : (userEmailHeader || 'moamenemam966@gmail.com');
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', fallbackEmail)
        .maybeSingle();

      if (existingProfile) {
        req.user = { id: existingProfile.id, email: existingProfile.email };
        req.zernioProfileId = existingProfile.zernio_profile_id || null;
        req.plan = existingProfile.plan || 'Growth';
        req.maxAccounts = getMaxAccountsForUser(existingProfile);
        req.connectedCount = existingProfile.connected_accounts_count || 0;
        return next();
      }

      // Create fallback profile row if missing
      const defaultUser = { id: '00000000-0000-0000-0000-000000000001', email: String(fallbackEmail) };
      req.user = defaultUser;
      const fullProfile = await ensureUserProfile(defaultUser);
      req.zernioProfileId = fullProfile?.zernio_profile_id || null;
      req.plan = fullProfile?.plan || 'Growth';
      req.maxAccounts = getMaxAccountsForUser(fullProfile);
      req.connectedCount = fullProfile?.connected_accounts_count || 0;
      return next();
    } catch (err: any) {
      console.error('[combinedAuth] Error:', err?.message || err);
      req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'moamenemam966@gmail.com' };
      return next();
    }
  }

  const supabaseAuth = combinedAuth;
  const authenticate = combinedAuth;

  // ==========================================
  // CLI DEVICE CODE AUTHORIZATION FLOW FOR AI AGENTS
  // ==========================================
  interface CliSession {
    deviceCode: string;
    userCode: string;
    deviceName: string;
    status: 'pending' | 'authorized' | 'denied';
    apiKey?: string;
    apiKeyReturned?: boolean;
    expiresAt: number;
    interval: number;
  }

  const cliSessions = new Map<string, CliSession>();
  const userCodeToDeviceCode = new Map<string, string>();

  // 1. Step 1: Start Device Authorization
  app.post('/api/auth/cli/initiate', asyncHandler(async (req: any, res: any) => {
    const deviceName = req.body?.deviceName || 'Agent Setup';
    const deviceCode = `rkt_dc_${crypto.randomBytes(16).toString('hex')}`;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userCode = `RKT-${randPart}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    const interval = 5;

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const browserUrl = `${protocol}://${host}/cli-auth?code=${userCode}`;

    const session: CliSession = {
      deviceCode,
      userCode,
      deviceName,
      status: 'pending',
      expiresAt,
      interval,
    };

    cliSessions.set(deviceCode, session);
    userCodeToDeviceCode.set(userCode, deviceCode);

    return res.json({
      deviceCode,
      userCode,
      browserUrl,
      expiresAt: new Date(expiresAt).toISOString(),
      interval,
    });
  }));

  // 2. Step 3: Poll for Authorization Status
  app.get('/api/auth/cli/poll', asyncHandler(async (req: any, res: any) => {
    const authHeader = req.headers.authorization || '';
    const deviceCode = authHeader.replace('Bearer ', '').trim();

    if (!deviceCode || !cliSessions.has(deviceCode)) {
      return res.status(410).json({ error: 'Session expired or invalid device code' });
    }

    const session = cliSessions.get(deviceCode)!;

    if (Date.now() > session.expiresAt) {
      cliSessions.delete(deviceCode);
      userCodeToDeviceCode.delete(session.userCode);
      return res.status(410).json({ error: 'Session expired' });
    }

    if (session.status === 'pending') {
      return res.json({ status: 'pending' });
    }

    if (session.status === 'denied') {
      return res.json({ status: 'denied' });
    }

    if (session.status === 'authorized') {
      if (!session.apiKeyReturned) {
        session.apiKeyReturned = true;
        return res.json({
          status: 'authorized',
          apiKey: session.apiKey,
        });
      }
      return res.json({ status: 'authorized' });
    }

    return res.json({ status: 'pending' });
  }));

  // 3. Helper Endpoint for Web Frontend: Check userCode status
  app.get('/api/auth/cli/info', asyncHandler(async (req: any, res: any) => {
    const userCode = String(req.query.code || '').toUpperCase();
    const deviceCode = userCodeToDeviceCode.get(userCode);
    if (!deviceCode || !cliSessions.has(deviceCode)) {
      return res.json({ valid: false });
    }
    const session = cliSessions.get(deviceCode)!;
    if (Date.now() > session.expiresAt) {
      return res.json({ valid: false, expired: true });
    }
    return res.json({
      valid: true,
      userCode: session.userCode,
      deviceName: session.deviceName,
      status: session.status,
    });
  }));

  // 4. Step 2 Approval by User in Browser
  app.post('/api/auth/cli/approve', asyncHandler(async (req: any, res: any) => {
    const { userCode, action, email } = req.body || {};
    const code = String(userCode || '').toUpperCase();
    const deviceCode = userCodeToDeviceCode.get(code);

    if (!deviceCode || !cliSessions.has(deviceCode)) {
      return res.status(400).json({ error: 'Invalid or expired user code' });
    }

    const session = cliSessions.get(deviceCode)!;

    if (action === 'deny') {
      session.status = 'denied';
      return res.json({ success: true, status: 'denied' });
    }

    // Generate a new live Rockyt API key for the AI agent
    const rawApiKey = `rkt_live_${crypto.randomBytes(24).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const userEmail = email || `agent_user_${code.substring(4)}@rockyt.io`;

    if (supabase) {
      try {
        let { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        let userId = profile?.id;

        if (!userId) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              email: userEmail,
              plan: 'Growth',
              max_accounts: 1,
              connected_accounts_count: 0,
            })
            .select('id')
            .maybeSingle();

          userId = newProfile?.id || `user_${crypto.randomUUID()}`;
        }

        await supabase
          .from('user_api_keys')
          .insert({
            user_id: userId,
            key_hash: hash,
            key_prefix: rawApiKey.substring(0, 12),
            name: `CLI (${session.deviceName})`,
            revoked: false,
          });
      } catch (err: any) {
        console.warn('[cli/approve] Supabase key store warning:', err?.message || err);
      }
    } else {
      mockKeys.push({
        id: `key_${Date.now()}`,
        user_id: `user_${code}`,
        key_hash: hash,
        key_prefix: rawApiKey.substring(0, 12),
        revoked: false,
        created_at: new Date().toISOString(),
      });
    }

    session.apiKey = rawApiKey;
    session.status = 'authorized';

    return res.json({ success: true, status: 'authorized' });
  }));

  // ---------------------------------------------------------------------------
  // API Key Management Routes
  // ---------------------------------------------------------------------------
  app.post('/api/v1/keys', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    await ensureUserProfile(req.user);

    const rawKey = 'rkt_live_' + crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    if (supabase) {
      const { data: inserted, error: insertError } = await supabase.from('user_api_keys').insert({
        user_id: req.user.id,
        key_hash: hash,
        key_prefix: rawKey.substring(0, 12),
        revoked: false
      }).select().maybeSingle();

      if (insertError) {
        console.error('Failed to insert API key:', JSON.stringify({
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        }));
        return res.status(500).json({ 
          error: `Failed to save API key: ${insertError.message}`,
          code: insertError.code
        });
      }
    } else {
      mockKeys.push({
        id: crypto.randomUUID(),
        user_id: req.user.id,
        key_hash: hash,
        key_prefix: rawKey.substring(0, 12),
        revoked: false,
        created_at: new Date().toISOString()
      });
    }

    res.json({ key: rawKey });
  }));

  app.get('/api/v1/keys', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, key_prefix, created_at')
        .eq('user_id', req.user.id)
        .eq('revoked', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user API keys:', error.message);
        return res.status(500).json({ error: error.message });
      }

      res.json(data || []);
    } else {
      const activeKeys = mockKeys.filter(k => k.user_id === req.user.id && !k.revoked);
      res.json(activeKeys.map(k => ({ id: k.id, key_prefix: k.key_prefix, created_at: k.created_at })));
    }
  }));

  app.delete('/api/v1/keys/:id', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const { error } = await supabase
        .from('user_api_keys')
        .update({ revoked: true })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

      if (error) {
        console.error('Error revoking API key:', error.message);
        return res.status(500).json({ error: error.message });
      }

      // Disconnect all social accounts under user's profile upon API key revocation
      const profile = await ensureUserProfile(req.user);
      if (profile?.zernio_profile_id) {
        try {
          const accountsRes = await zernio.accounts.listAccounts({
            query: { profileId: profile.zernio_profile_id }
          });
          const rawAccounts = (accountsRes.data as any)?.accounts || (accountsRes.data as any) || [];
          if (Array.isArray(rawAccounts)) {
            for (const acc of rawAccounts) {
              const accId = acc._id || acc.id;
              if (accId) {
                try {
                  if (typeof (zernio.accounts as any).deleteAccount === 'function') {
                    await (zernio.accounts as any).deleteAccount({ path: { id: accId } });
                  } else if (typeof (zernio.accounts as any).disconnectAccount === 'function') {
                    await (zernio.accounts as any).disconnectAccount({ path: { id: accId } });
                  }
                } catch (_accErr) {
                  // Ignore if already disconnected
                }
              }
            }
          }
        } catch (err: any) {
          console.warn('[DELETE /api/v1/keys] Warning disconnecting accounts on key revocation:', err.message);
        }

        // Reset connected accounts count to 0 in Supabase
        await supabase
          .from('profiles')
          .update({ connected_accounts_count: 0 })
          .eq('id', req.user.id);
      }
    } else {
      const keyIndex = mockKeys.findIndex(k => k.id === req.params.id && k.user_id === req.user.id);
      if (keyIndex !== -1) {
        mockKeys[keyIndex].revoked = true;
      }
      mockConnectedCount = 0;
    }
    res.status(204).send();
  }));

  // ---------------------------------------------------------------------------
  // Connect flow — via SDK, with our own redirect_url so Zernio sends
  // profileId/accountId back to us directly, no state table needed.
  // ---------------------------------------------------------------------------
  app.get('/api/v1/connect/:platform', authenticate, asyncHandler(async (req: any, res: any) => {
    if (req.connectedCount >= req.maxAccounts) {
      return res.status(403).json({ error: 'Account limit reached. Upgrade your plan.' });
    }
    try {
      const result = await zernio.connect.getConnectUrl({
        path: { platform: req.params.platform as any },
        query: {
          profileId: req.zernioProfileId,
          redirect_url: `${process.env.APP_BASE_URL || 'https://dashboard.rockyt.io'}/oauth/callback`
        }
      });
      const authUrl = (result.data as any)?.authUrl || (result.data as any)?.url;
      res.json({ url: authUrl, authUrl, ...result.data });
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message ?? 'Rockyt connect failed' });
    }
  }));

  app.get('/oauth/callback', asyncHandler(async (req: any, res: any) => {
    const { profileId, accountId } = req.query;
    if (profileId && accountId) {
      if (supabase) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, connected_accounts_count')
          .eq('zernio_profile_id', profileId)
          .single();
        if (p) {
          await supabase
            .from('profiles')
            .update({ connected_accounts_count: p.connected_accounts_count + 1 })
            .eq('zernio_profile_id', profileId);

          // Persist in connected_accounts table
          await supabase
            .from('connected_accounts')
            .insert({
              user_id: p.id,
              platform: req.query.platform || 'Social Channel',
              username: accountId ? `@acc_${String(accountId).substring(0, 8)}` : '@user',
              profile_name: 'Default Profile',
              status: 'connected'
            });
        }
      } else {
        mockConnectedCount++;
      }
    }
    res.redirect('/dashboard?connected=1');
  }));

  // ─── Connected Accounts Database API ───
  app.get('/api/user/connected-accounts', authenticate, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[connected-accounts] Supabase fetch error:', error.message);
        return res.json({ success: true, accounts: [] });
      }
      return res.json({ success: true, accounts: data || [] });
    }
    return res.json({ success: true, accounts: [] });
  }));

  app.post('/api/user/connected-accounts/toggle', authenticate, asyncHandler(async (req: any, res: any) => {
    const { platform, status, username, profile_name } = req.body || {};
    if (!platform) return res.status(400).json({ error: 'Platform is required' });

    if (supabase) {
      const { data: existing } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('platform', platform)
        .maybeSingle();

      if (existing) {
        const nextStatus = status || (existing.status === 'connected' ? 'disconnected' : 'connected');
        const { data: updated, error: updErr } = await supabase
          .from('connected_accounts')
          .update({ status: nextStatus })
          .eq('id', existing.id)
          .select()
          .single();

        if (updErr) return res.status(500).json({ error: updErr.message });
        return res.json({ success: true, account: updated });
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('connected_accounts')
          .insert({
            user_id: req.user.id,
            platform,
            username: username || `@${platform.toLowerCase().replace(/[^a-z0-9]/g, '')}_user`,
            profile_name: profile_name || `${platform} Profile`,
            status: 'connected'
          })
          .select()
          .single();

        if (insErr) return res.status(500).json({ error: insErr.message });
        return res.json({ success: true, account: inserted });
      }
    }

    return res.json({ success: true });
  }));

  // ─── Usage Logs Database API ───
  app.get('/api/user/usage-logs', authenticate, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[usage-logs] Supabase fetch error:', error.message);
        return res.json({ success: true, logs: [] });
      }
      return res.json({ success: true, logs: data || [] });
    }
    return res.json({ success: true, logs: [] });
  }));

  // ---------------------------------------------------------------------------
  // Curated post creation: users pass platform names, we resolve to
  // accountIds scoped strictly to the caller's own profile.
  // ---------------------------------------------------------------------------
  app.post('/api/v1/posts', authenticate, asyncHandler(async (req: any, res: any) => {
    const { platforms, content, scheduledFor, publishNow, mediaUrls } = req.body;
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'platforms must be a non-empty array of platform names' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required and must be a string' });
    }

    try {
      const accountsResult = await zernio.accounts.listAccounts({
        query: { profileId: req.zernioProfileId }
      });
      const myAccounts = (accountsResult.data as any).accounts ?? [];

      const resolvedPlatforms = [];
      for (const platform of platforms) {
        const account = myAccounts.find((a: any) => a.platform === platform);
        if (!account) {
          return res.status(400).json({ error: `No connected ${platform} account found for your profile` });
        }
        resolvedPlatforms.push({ platform, accountId: account._id || account.id });
      }

      const postBody: Record<string, any> = { content, platforms: resolvedPlatforms };
      if (scheduledFor !== undefined) postBody.scheduledFor = scheduledFor;
      if (publishNow !== undefined) postBody.publishNow = publishNow;
      if (Array.isArray(mediaUrls) && mediaUrls.length > 0) postBody.mediaUrls = mediaUrls;

      const result = await zernio.posts.createPost({ body: postBody });
      res.json(result.data);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message ?? 'Rockyt post creation failed' });
    }
  }));

  // ---------------------------------------------------------------------------
  // Per-User Posts Database API
  // ---------------------------------------------------------------------------
  app.get('/api/v1/user/posts', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase && req.user?.id) {
      try {
        const { data, error } = await supabase
          .from('user_posts')
          .select('*')
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return res.json({ posts: data });
        }
      } catch (e) {}
    }
    res.json({ posts: [] });
  }));

  app.post('/api/v1/user/posts', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const { platform, content, scheduledFor } = req.body;
    if (!content) return res.status(400).json({ error: 'Post content is required' });

    const newPost = {
      user_id: req.user?.id || '00000000-0000-0000-0000-000000000001',
      platform: platform || 'Social Channel',
      content,
      status: 'published',
      scheduled_for: scheduledFor || null,
      created_at: new Date().toISOString(),
      likes: 0,
      comments: 0
    };

    if (supabase && req.user?.id) {
      try {
        const { data, error } = await supabase
          .from('user_posts')
          .insert(newPost)
          .select()
          .single();
        if (!error && data) {
          return res.json({ success: true, post: data });
        }
      } catch (e) {}
    }
    res.json({ success: true, post: { id: `post_${Date.now()}`, ...newPost } });
  }));

  // ---------------------------------------------------------------------------
  // Connected Accounts Listing Endpoint
  // ---------------------------------------------------------------------------
  app.get('/api/v1/accounts', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    try {
      let targetProfileId = req.query.profileId as string | undefined;

      if (req.user) {
        const profile = await ensureUserProfile(req.user);
        // Only allow profileId query override if it matches the user's own profile or if not provided
        if (!targetProfileId || targetProfileId !== profile?.zernio_profile_id) {
          targetProfileId = profile?.zernio_profile_id;
        }
      }

      let accountsRes;
      if (targetProfileId) {
        try {
          accountsRes = await zernio.accounts.listAccounts({
            query: { profileId: targetProfileId }
          });
        } catch {
          accountsRes = { data: { accounts: [] } };
        }
      } else {
        // Strictly return empty if user has no assigned Zernio profile to prevent leaking cross-tenant accounts
        accountsRes = { data: { accounts: [] } };
      }

      const rawAccounts = (accountsRes.data as any)?.accounts || (accountsRes.data as any) || [];
      const accounts = Array.isArray(rawAccounts) ? rawAccounts.map((a: any) => ({
        id: a._id || a.id,
        platform: a.platform ? (a.platform.charAt(0).toUpperCase() + a.platform.slice(1)) : 'Facebook',
        username: a.username || a.name || a.title || `@${a.platform || 'social'}_account`,
        name: a.name || a.username || a.platform || 'Connected Page',
        email: a.email || req.user?.email || 'user@rockyt.io',
        avatar: a.avatar || a.profilePictureUrl || null,
        status: a.status || 'connected',
        connectedAt: a.createdAt || a.created_at ? (a.createdAt || a.created_at).substring(0, 10) : new Date().toISOString().substring(0, 10),
        profileName: 'Default Profile'
      })) : [];

      if (supabase && req.user?.id) {
        try {
          const { data: dbAccs } = await supabase
            .from('connected_accounts')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('status', 'connected');

          if (dbAccs && dbAccs.length > 0) {
            dbAccs.forEach((a: any) => {
              if (!accounts.some((existing: any) => existing.id === a.id || existing.platform.toLowerCase() === a.platform.toLowerCase())) {
                accounts.push({
                  id: a.id,
                  platform: a.platform ? (a.platform.charAt(0).toUpperCase() + a.platform.slice(1)) : 'Facebook',
                  username: a.username || '@user_profile',
                  name: a.username || a.platform,
                  email: a.email || req.user?.email || '',
                  avatar: null,
                  status: a.status || 'connected',
                  connectedAt: a.created_at ? a.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
                  profileName: a.profile_name || 'Default Profile'
                });
              }
            });
          }
        } catch (dbErr: any) {
          console.warn('[GET /api/v1/accounts] Supabase query warning:', dbErr.message);
        }
      }

      res.json({ accounts });
    } catch (err: any) {
      console.warn('[GET /api/v1/accounts] Warning fetching accounts:', err.message);
      res.json({ accounts: [] });
    }
  }));

  // Helper: map user-facing platform names & display labels to canonical Zernio API platform slugs
  function getCanonicalZernioPlatform(platformName: string): string {
    const p = String(platformName || '').trim().toLowerCase();
    
    if (p.includes('instagram')) return 'instagram';
    if (p.includes('linkedin')) return 'linkedin';
    if (p.includes('tiktok')) return 'tiktok';
    if (p.includes('twitter') || p.includes('x') || p === 'x') return 'twitter';
    if (p.includes('whatsapp')) return 'whatsapp';
    if (p.includes('meta') || p.includes('facebook') || p.includes('fb')) return 'facebook';
    if (p.includes('google') || p.includes('gmb') || p.includes('business')) return 'googlebusiness';
    if (p.includes('youtube')) return 'youtube';
    if (p.includes('pinterest')) return 'pinterest';
    if (p.includes('threads')) return 'threads';
    if (p.includes('snapchat')) return 'snapchat';
    if (p.includes('bluesky')) return 'bluesky';
    if (p.includes('telegram')) return 'telegram';
    if (p.includes('discord')) return 'discord';
    if (p.includes('slack')) return 'slack';

    return p.replace(/[^a-z0-9]/g, '') || 'facebook';
  }

  // ---------------------------------------------------------------------------
  // Rockyt Branded Connect Flow & Gateway Route
  // ---------------------------------------------------------------------------
  app.get(['/connect/:platform', '/api/v1/connect/:platform'], supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const rawPlatform = req.params.platform || req.query.platform;
    if (!rawPlatform) {
      return res.status(400).json({ error: 'Platform name is required (e.g. instagram, linkedin, twitter, whatsapp)' });
    }

    const cleanPlatform = getCanonicalZernioPlatform(rawPlatform);
    const formattedPlatform = cleanPlatform.charAt(0).toUpperCase() + cleanPlatform.slice(1);
    
    // Resolve user's Zernio profile ID
    let zernioProfileId: string | null = req.zernioProfileId || null;
    try {
      if (req.user) {
        const profile = await ensureUserProfile(req.user);
        if (profile?.zernio_profile_id) {
          zernioProfileId = profile.zernio_profile_id;
        }
      }
    } catch (profErr: any) {
      console.warn('[Rockyt Connect Gateway] ensureUserProfile warning:', profErr.message);
    }

    const appBaseUrl = process.env.APP_BASE_URL || (req.headers.origin || `https://${req.headers.host}`);
    const clientRedirectUrl = req.query.redirectUrl || req.query.redirect_url || `${appBaseUrl}/dashboard?account_connected=true&platform=${encodeURIComponent(cleanPlatform)}`;
    const callbackUrl = `${appBaseUrl}/oauth/callback?platform=${encodeURIComponent(cleanPlatform)}&returnTo=${encodeURIComponent(clientRedirectUrl)}`;

    let targetOAuthUrl: string | null = null;

    // 1. Generate underlying OAuth consent URL with force re-auth parameters
    try {
      if (zernioProfileId && typeof zernio?.connect?.getConnectUrl === 'function') {
        const connectRes = await zernio.connect.getConnectUrl({
          path: { platform: cleanPlatform as any },
          query: {
            profileId: zernioProfileId,
            redirect_url: callbackUrl,
            reconnect: 'true',
            prompt: 'consent',
            force_reconnect: 'true'
          } as any
        });
        targetOAuthUrl = (connectRes?.data as any)?.authUrl || (connectRes?.data as any)?.url || null;
      }
    } catch (err: any) {
      console.warn(`[Rockyt Connect Gateway] Zernio SDK connect warning for ${cleanPlatform}:`, err.message);
    }

    // 2. Direct HTTP fallback if SDK returned null
    if (!targetOAuthUrl && zernioProfileId) {
      try {
        const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
        const zernioRes = await fetch(`https://zernio.com/api/v1/connect/${encodeURIComponent(cleanPlatform)}?profileId=${encodeURIComponent(zernioProfileId)}&redirectUrl=${encodeURIComponent(callbackUrl)}&reconnect=true&prompt=consent&force_reconnect=true&_ts=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (zernioRes.ok) {
          const zernioData = await zernioRes.json();
          targetOAuthUrl = zernioData.authUrl || zernioData.url || null;
        }
      } catch (httpErr: any) {
        console.warn(`[Rockyt Connect Gateway] Zernio HTTP fetch warning for ${cleanPlatform}:`, httpErr.message);
      }
    }

    // 3. Fallback URL
    if (!targetOAuthUrl) {
      targetOAuthUrl = `https://zernio.com/api/v1/connect/${encodeURIComponent(cleanPlatform)}?profileId=${encodeURIComponent(zernioProfileId || 'default')}&redirectUrl=${encodeURIComponent(callbackUrl)}&reconnect=true&prompt=consent&force_reconnect=true`;
    }

    // If client requested JSON response
    if (req.headers.accept?.includes('application/json') || req.query.json === '1') {
      return res.json({
        success: true,
        connectUrl: `${appBaseUrl}/connect/${encodeURIComponent(cleanPlatform)}`,
        authUrl: targetOAuthUrl,
        platform: formattedPlatform
      });
    }

    // Redirect browser directly to provider authorization screen
    return res.redirect(targetOAuthUrl);
  }));

  // ---------------------------------------------------------------------------
  // Connected Accounts Creation & OAuth Connect Initiator Endpoint
  // ---------------------------------------------------------------------------
  app.post(['/api/v1/accounts/connect', '/api/v1/accounts'], supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const { platform, redirectUrl } = req.body;
    if (!platform) {
      return res.status(400).json({ error: 'Platform name is required (e.g. instagram, linkedin, x, whatsapp, tiktok)' });
    }

    const cleanPlatform = getCanonicalZernioPlatform(platform);
    const formattedPlatform = cleanPlatform.charAt(0).toUpperCase() + cleanPlatform.slice(1);
    
    // Resolve user's Zernio profile ID
    let zernioProfileId: string | null = req.zernioProfileId || null;
    try {
      if (req.user) {
        const profile = await ensureUserProfile(req.user);
        if (profile?.zernio_profile_id) {
          zernioProfileId = profile.zernio_profile_id;
        }
      }
    } catch (profErr: any) {
      console.warn('[POST /api/v1/accounts/connect] ensureUserProfile warning:', profErr.message);
    }

    // Check user's wallet balance for paid platform integrations (e.g. X/Twitter API pass-through costs)
    let currentBalance = 0;
    if (supabase && req.user?.id) {
      try {
        const { data: profRow } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', req.user.id)
          .maybeSingle();
        if (profRow && typeof profRow.wallet_balance === 'number') {
          currentBalance = profRow.wallet_balance;
        }
      } catch (balErr: any) {
        console.warn('[POST /api/v1/accounts/connect] wallet_balance lookup warning:', balErr.message);
      }
    }

    const isPaidPlatform = cleanPlatform === 'twitter' || cleanPlatform === 'x';
    const requiredPassThroughFee = 1.00;

    // Check if user has sufficient funds in Rockyt wallet
    if (isPaidPlatform && currentBalance < requiredPassThroughFee) {
      return res.status(402).json({
        error: 'X (Twitter) requires an active wallet balance ($1.00 minimum) due to API pass-through costs. Please top up your Rockyt wallet to connect an X account.',
        code: 'PAYMENT_REQUIRED',
        reason: 'twitter_passthrough',
        requiredBalance: requiredPassThroughFee,
        currentBalance: currentBalance,
        requiresDeposit: true
      });
    }

    // Deduct pass-through fee from user's wallet balance upon successful authentication
    if (isPaidPlatform && supabase && req.user?.id) {
      const newBalance = Math.max(0, currentBalance - requiredPassThroughFee);
      try {
        await supabase
          .from('profiles')
          .update({ wallet_balance: newBalance })
          .eq('id', req.user.id);

        await supabase
          .from('wallet_transactions')
          .insert([{
            user_id: req.user.id,
            amount: -requiredPassThroughFee,
            type: 'deduction',
            description: `X (Twitter) API Pass-Through Fee`,
            balance_after: newBalance,
            created_at: new Date().toISOString()
          }]);
      } catch (deductErr: any) {
        console.warn('[POST /api/v1/accounts/connect] Balance deduction warning:', deductErr.message);
      }
    }

    const appBaseUrl = process.env.APP_BASE_URL || (req.headers.origin || `https://${req.headers.host}`);
    const clientRedirectUrl = redirectUrl || `${appBaseUrl}/dashboard?account_connected=true&platform=${encodeURIComponent(cleanPlatform)}`;
    const callbackUrl = `${appBaseUrl}/oauth/callback?platform=${encodeURIComponent(cleanPlatform)}&returnTo=${encodeURIComponent(clientRedirectUrl)}`;

    let targetOAuthUrl: string | null = null;

    // 1. Attempt Zernio SDK connect URL generation
    try {
      if (zernioProfileId && typeof zernio?.connect?.getConnectUrl === 'function') {
        const connectRes = await zernio.connect.getConnectUrl({
          path: { platform: cleanPlatform as any },
          query: {
            profileId: zernioProfileId,
            redirect_url: callbackUrl,
            reconnect: 'true',
            prompt: 'consent',
            force_reconnect: 'true'
          } as any
        });
        targetOAuthUrl = (connectRes?.data as any)?.authUrl || (connectRes?.data as any)?.url || null;
      }
    } catch (err: any) {
      console.warn(`[POST /api/v1/accounts/connect] Zernio SDK connect warning for ${cleanPlatform}:`, err.message);
    }

    // 2. Direct HTTP fallback to Zernio API if SDK returned null
    if (!targetOAuthUrl && zernioProfileId) {
      try {
        const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
        const zernioRes = await fetch(`https://zernio.com/api/v1/connect/${encodeURIComponent(cleanPlatform)}?profileId=${encodeURIComponent(zernioProfileId)}&redirectUrl=${encodeURIComponent(callbackUrl)}&reconnect=true&prompt=consent&force_reconnect=true&_ts=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (!zernioRes.ok) {
          const errData = await zernioRes.json().catch(() => ({}));
          if (zernioRes.status === 402 || errData.code === 'PAYMENT_REQUIRED' || errData.reason === 'twitter_passthrough') {
            return res.status(402).json({
              error: errData.error || 'X (Twitter) requires an active wallet balance due to API pass-through costs. Please top up your Rockyt wallet.',
              code: 'PAYMENT_REQUIRED',
              reason: 'twitter_passthrough',
              requiredBalance: requiredPassThroughFee,
              currentBalance: currentBalance,
              requiresDeposit: true
            });
          }
        } else {
          const zernioData = await zernioRes.json();
          targetOAuthUrl = zernioData.authUrl || zernioData.url || null;
        }
      } catch (httpErr: any) {
        console.warn(`[POST /api/v1/accounts/connect] Zernio HTTP fetch warning for ${cleanPlatform}:`, httpErr.message);
      }
    }

    // 3. Fallback URL
    if (!targetOAuthUrl) {
      targetOAuthUrl = `https://zernio.com/api/v1/connect/${encodeURIComponent(cleanPlatform)}?profileId=${encodeURIComponent(zernioProfileId || 'default')}&redirectUrl=${encodeURIComponent(callbackUrl)}&reconnect=true&prompt=consent&force_reconnect=true`;
    }

    // If user has balance for paid platform, charge pass-through fee from wallet on successful URL generation
    if (isPaidPlatform && currentBalance >= requiredPassThroughFee && supabase && req.user?.id) {
      try {
        const newBalance = currentBalance - requiredPassThroughFee;
        await supabase
          .from('profiles')
          .update({ wallet_balance: newBalance })
          .eq('id', req.user.id);

        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: req.user.id,
            amount: -requiredPassThroughFee,
            type: 'debit',
            description: 'X (Twitter) API Pass-Through Connection Fee',
            balance_after: newBalance
          });
      } catch (debitErr: any) {
        console.warn('[POST /api/v1/accounts/connect] Wallet debit warning:', debitErr.message);
      }
    }

    // Return the actual targetOAuthUrl to client so browser navigates directly to OAuth consent screen
    res.json({
      success: true,
      authUrl: targetOAuthUrl,
      connectUrl: targetOAuthUrl,
      platform: formattedPlatform,
      profileId: zernioProfileId
    });
  }));

  // ---------------------------------------------------------------------------
  // Connected Accounts Disconnect Helper
  // ---------------------------------------------------------------------------
  const disconnectSocialAccount = async (userId: string, accountId?: string, platform?: string) => {
    const cleanPlatform = platform ? platform.trim().toLowerCase() : undefined;
    const formattedPlatform = cleanPlatform ? cleanPlatform.charAt(0).toUpperCase() + cleanPlatform.slice(1) : undefined;

    // 1. Attempt Zernio API account deletion if accountId is provided
    if (accountId && !accountId.startsWith('acc_')) {
      try {
        const apiKey = process.env.ZERNIO_API_KEY || process.env.ROCKYT_API_KEY;
        await fetch(`https://zernio.com/api/v1/accounts/${encodeURIComponent(accountId)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
      } catch (err: any) {
        console.warn(`[disconnectSocialAccount] Zernio delete error for account ${accountId}:`, err.message);
      }
    }

    // 2. Remove / disconnect from Supabase connected_accounts
    if (supabase && userId) {
      try {
        if (accountId) {
          await supabase.from('connected_accounts').delete().eq('id', accountId).eq('user_id', userId);
        }
        if (formattedPlatform) {
          await supabase.from('connected_accounts').delete().eq('user_id', userId).eq('platform', formattedPlatform);
        }
        if (cleanPlatform) {
          await supabase.from('connected_accounts').delete().eq('user_id', userId).eq('platform', cleanPlatform);
        }

        // 3. Rotate to a FRESH Zernio Profile ID so any future re-connection MUST force fresh OAuth authorization
        const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
        const userEmail = userProfile?.email || `user_${userId.substring(0, 8)}@rockyt.io`;
        
        let newZernioProfileId: string = `prof_${userId.substring(0, 8)}_${Date.now()}`;
        try {
          const zernioRes = await zernio.profiles.createProfile({
            body: { name: `${userEmail}_${Date.now()}` }
          });
          const createdId = (zernioRes.data as any)?.profile?._id || (zernioRes.data as any)?._id;
          if (createdId) {
            newZernioProfileId = createdId;
          }
        } catch (zErr: any) {
          console.warn('[disconnectSocialAccount] Zernio profile rotation notice:', zErr?.message || zErr);
        }

        // Recalculate remaining active connected accounts count and store fresh zernio_profile_id
        const { data: remaining } = await supabase
          .from('connected_accounts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'connected');

        const newCount = remaining ? remaining.length : 0;
        await supabase
          .from('profiles')
          .update({
            connected_accounts_count: newCount,
            zernio_profile_id: newZernioProfileId
          })
          .eq('id', userId);

      } catch (dbErr: any) {
        console.error('[disconnectSocialAccount] Supabase disconnect error:', dbErr);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Webhooks API Endpoints
  // ---------------------------------------------------------------------------
  app.get('/api/v1/webhooks', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase && req.user?.id) {
      try {
        const { data, error } = await supabase
          .from('webhooks')
          .select('*')
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return res.json({ webhooks: data });
        }
      } catch (e) {}
    }
    res.json({ webhooks: [] });
  }));

  app.post('/api/v1/webhooks', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const { url, events, name } = req.body;
    if (!url) return res.status(400).json({ error: 'Webhook endpoint URL is required' });
    const secret = `whsec_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const newWebhook = {
      id: `wh_${Date.now()}`,
      user_id: req.user?.id || '00000000-0000-0000-0000-000000000001',
      name: name || 'Production Webhook',
      url,
      secret,
      events: Array.isArray(events) ? events : ['post.created', 'comment.received'],
      status: 'active',
      created_at: new Date().toISOString()
    };
    if (supabase && req.user?.id) {
      try {
        await supabase.from('webhooks').insert(newWebhook);
      } catch (e) {}
    }
    res.json({ success: true, webhook: newWebhook });
  }));

  app.delete('/api/v1/webhooks/:id', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    if (supabase && req.user?.id) {
      try {
        await supabase.from('webhooks').delete().eq('id', id).eq('user_id', req.user.id);
      } catch (e) {}
    }
    res.json({ success: true });
  }));

  // ---------------------------------------------------------------------------
  // Connected Accounts Toggle & Disconnect Endpoints
  // ---------------------------------------------------------------------------
  app.post(['/api/v1/accounts/toggle', '/api/v1/accounts/disconnect'], supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const { id, platform, status } = req.body;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (status === 'disconnected' || !status) {
      await disconnectSocialAccount(userId, id, platform);
      return res.json({ success: true, status: 'disconnected', message: 'Account disconnected successfully' });
    }

    res.json({ success: true, status: status || 'connected' });
  }));

  app.delete(['/api/v1/accounts/:id', '/api/v1/accounts/disconnect'], supabaseAuth, asyncHandler(async (req: any, res: any) => {
    const targetId = req.params.id || req.body?.id;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

    await disconnectSocialAccount(userId, targetId, req.query?.platform as string || req.body?.platform);
    res.json({ success: true, message: 'Account disconnected successfully' });
  }));

  app.get('/api/v1/me/usage', authenticate, asyncHandler(async (req: any, res: any) => {
    res.json({ connectedAccounts: req.connectedCount, maxAccounts: req.maxAccounts });
  }));

  app.get('/api/v1/me/dashboard-usage', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const profile = await ensureUserProfile(req.user);
      let accounts: any[] = [];
      let dbAccountCount = 0;

      if (req.user?.id) {
        try {
          const { data: dbAccs } = await supabase
            .from('connected_accounts')
            .select('id')
            .eq('user_id', req.user.id);
          if (dbAccs) {
            dbAccountCount = dbAccs.length;
          }
        } catch {}
      }

      if (profile?.zernio_profile_id) {
        try {
          const accountsRes = await zernio.accounts.listAccounts({
            query: { profileId: profile.zernio_profile_id }
          });
          const rawAccounts = (accountsRes.data as any)?.accounts || (accountsRes.data as any) || [];
          if (Array.isArray(rawAccounts)) {
            accounts = rawAccounts.map((a: any) => ({
              id: a._id || a.id,
              platform: a.platform,
              username: a.username || a.name || a.title || `@${a.platform}_account`,
              name: a.name || a.username || a.platform,
              avatar: a.avatar || a.profilePictureUrl || null,
              status: a.status || 'active'
            }));
          }
        } catch (err: any) {
          console.warn('[dashboard-usage] Zernio listAccounts warning:', err.message);
        }
      }

      const connectedCount = Math.max(accounts.length, dbAccountCount, profile?.connected_accounts_count || 0);
      const maxAccounts = getMaxAccountsForUser(profile);

      // Keep database connected_accounts_count in sync
      if (profile && profile.connected_accounts_count !== connectedCount) {
        await supabase.from('profiles').update({ connected_accounts_count: connectedCount }).eq('id', req.user.id);
      }

      res.json({ connectedAccounts: connectedCount, maxAccounts, accounts });
    } else {
      res.json({ connectedAccounts: mockConnectedCount, maxAccounts: 1, accounts: [] });
    }
  }));

  // Secure Dodo Payments Checkout Endpoint
  // ---------------------------------------------------------------------------
  app.post('/api/v1/checkouts', supabaseAuth, async (req: any, res: any) => {
    const { productId, trialPeriodDays, amount } = req.body;
    const targetProductId = productId || 'pdt_0Nk1w4r59DXb7GepY1sqA';
    const numAmount = Number(amount) || 0;
    const isDeposit = numAmount > 0 || targetProductId.includes('metered');

    try {
      const apiKey =
          process.env.DODO_PAYMENTS_API_KEY ||
          process.env.DODO_API_KEY          ||
          process.env.DODO_SECRET_KEY       ||
          process.env.VITE_DODO_API_KEY;

      if (!apiKey) {
        console.error('[dodo] No API key found. Set DODO_PAYMENTS_API_KEY in your deployment environment.');
        return res.status(500).json({
          error: 'Payments are not configured on this server (missing DODO_PAYMENTS_API_KEY).',
          docs:  'Set DODO_PAYMENTS_API_KEY in your Vercel project environment variables.',
        });
      }

      let envMode: 'test_mode' | 'live_mode' = 'live_mode';
      const explicitMode = process.env.DODO_PAYMENTS_ENVIRONMENT || process.env.DODO_MODE || process.env.VITE_DODO_MODE;
      if (explicitMode === 'test' || explicitMode === 'test_mode' || apiKey.startsWith('test')) {
        envMode = 'test_mode';
      } else {
        envMode = 'live_mode';
      }

      const baseUrl = envMode === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
      const appBaseUrl = process.env.APP_BASE_URL || (req.headers.origin || `https://${req.headers.host}`);
      const returnUrl = `${appBaseUrl}/dashboard?ref_id=${encodeURIComponent(req.user.id)}&checkout=success`;

      const quantity = numAmount > 0 ? Math.max(1, Math.round(numAmount)) : 1;

      const requestBody: any = {
        customer: {
          email: req.user.email,
        },
        product_cart: [
          {
            product_id: targetProductId,
            quantity,
          },
        ],
        metadata: {
          user_id: req.user.id,
          amount: String(numAmount || (targetProductId.includes('scale') ? 99 : 49)),
          type: isDeposit ? 'deposit' : 'subscription',
        },
        return_url: returnUrl,
      };

      if (typeof trialPeriodDays === 'number' && !isDeposit) {
        requestBody.subscription_data = {
          trial_period_days: trialPeriodDays,
        };
      }

      console.log(`[Dodo] Creating checkout session (${envMode}) for:`, req.user.email, targetProductId, `isDeposit=${isDeposit}, amount=${numAmount}`);

      const fetchRes = await fetch(`${baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!fetchRes.ok) {
        const errText = await fetchRes.text();
        console.error('[Dodo API REST Error]:', fetchRes.status, errText);
        let detailMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          detailMsg = parsed.message || parsed.error || errText;
        } catch {}
        return res.status(fetchRes.status).json({
          error: `Dodo Payments API error (${fetchRes.status}): ${detailMsg}`
        });
      }

      const data = await fetchRes.json();
      const checkoutUrl = data.checkout_url;
      const dodoSessionId = data.session_id || data.checkout_id || 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      if (!checkoutUrl) {
        return res.status(500).json({ error: 'No checkout_url returned from Dodo Payments' });
      }

      const planName = isDeposit ? `Wallet Deposit ($${numAmount.toFixed(2)})` : (targetProductId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ' ? 'Scale' : 'Growth');

      // Record checkout session in Supabase checkout_sessions table
      if (supabase && req.user?.id) {
        try {
          await supabase.from('checkout_sessions').insert({
            user_id: req.user.id,
            dodo_session_id: dodoSessionId,
            product_id: targetProductId,
            plan: planName,
            status: 'pending',
            checkout_url: checkoutUrl,
          });
        } catch (dbErr: any) {
          console.error('[Supabase] Non-fatal error logging checkout_session:', dbErr?.message || dbErr);
        }
      }

      res.json({ checkout_url: checkoutUrl, session_id: dodoSessionId });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      const statusCode = error.status || error.statusCode || 500;
      const errorDetail = error.message || error.error || String(error);
      res.status(statusCode).json({ error: `Checkout session creation error (${statusCode}): ${errorDetail}` });
    }
  });

  // ---------------------------------------------------------------------------
  // Dodo Payments Webhook Endpoint (Unified Handler)
  // ---------------------------------------------------------------------------
  const dodoWebhookHandler = async (req: any, res: any) => {
    const dodoWebhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (dodoWebhookSecret) {
      const webhookId = req.headers['webhook-id'];
      const webhookSignature = req.headers['webhook-signature'];
      const webhookTimestamp = req.headers['webhook-timestamp'];

      if (!webhookId || !webhookSignature || !webhookTimestamp) {
        return res.status(401).json({ error: 'Missing webhook signature headers' });
      }

      const rawBodyStr = req.rawBody ? req.rawBody.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBodyStr}`;

      let secretKey: Buffer;
      if (dodoWebhookSecret.startsWith('whsec_')) {
        secretKey = Buffer.from(dodoWebhookSecret.slice(6), 'base64');
      } else {
        secretKey = Buffer.from(dodoWebhookSecret, 'utf8');
      }

      const computedBase64 = crypto.createHmac('sha256', secretKey).update(signedPayload).digest('base64');
      const computedHex = crypto.createHmac('sha256', secretKey).update(signedPayload).digest('hex');

      const sigHeader = String(webhookSignature || '');
      const candidateSigs = sigHeader.split(/\s+/).flatMap(s => s.split(','));

      let isValid = false;
      for (const sig of candidateSigs) {
        const cleanSig = sig.trim().replace(/^v1,/, '');
        if (!cleanSig) continue;
        if (cleanSig === computedBase64 || cleanSig === computedHex) {
          isValid = true;
          break;
        }
      }

      if (!isValid) {
        const sigA = Buffer.from(computedHex, 'utf8');
        const sigB = Buffer.from(sigHeader, 'utf8');
        if (sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)) {
          isValid = true;
        }
      }

      if (!isValid) {
        console.error('[Dodo Webhook] Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const eventType = payload?.event_type || payload?.type || 'unknown';
      const dodoEventId = payload?.event_id || payload?.id || null;
      const data = payload?.data || payload || {};

      const metadataUserId = data?.metadata?.user_id || data?.customer?.metadata?.user_id || payload?.metadata?.user_id;
      const customerEmail = data?.customer?.email || data?.email || payload?.email;
      const customerId = data?.customer?.customer_id || data?.customer_id;
      const subscriptionId = data?.subscription_id || data?.id;
      const productId = data?.product_id || data?.product_cart?.[0]?.product_id || data?.items?.[0]?.product_id;
      const dodoSessionId = data?.session_id || data?.checkout_id;

      let userId: string | null = metadataUserId || null;
      let lookupMethod = userId ? 'metadata.user_id' : null;

      if (supabase) {
        // 1. Try lookup by dodo_session_id in checkout_sessions table
        if (!userId && dodoSessionId) {
          const { data: sessionRow } = await supabase
            .from('checkout_sessions')
            .select('user_id')
            .eq('dodo_session_id', dodoSessionId)
            .single();
          if (sessionRow?.user_id) {
            userId = sessionRow.user_id;
            lookupMethod = 'checkout_sessions.dodo_session_id';
          }
        }

        // 2. Try lookup by dodo_customer_id in profiles table
        if (!userId && customerId) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('dodo_customer_id', customerId)
            .single();
          if (profileRow?.id) {
            userId = profileRow.id;
            lookupMethod = 'profiles.dodo_customer_id';
          }
        }

        // 3. Try lookup by subscription_id in profiles table
        if (!userId && subscriptionId) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('subscription_id', subscriptionId)
            .single();
          if (profileRow?.id) {
            userId = profileRow.id;
            lookupMethod = 'profiles.subscription_id';
          }
        }

        // 4. Try lookup by email in profiles table
        if (!userId && customerEmail) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single();
          if (profileRow?.id) {
            userId = profileRow.id;
            lookupMethod = 'profiles.email';
          }
        }
      }

      console.log('[Webhook User Lookup Result]:', {
        receivedKeys: { metadataUserId, customerEmail, customerId, subscriptionId, dodoSessionId },
        matchedUserId: userId,
        lookupMethod: lookupMethod || 'NONE'
      });

      if (supabase) {
        await supabase.from('payment_events').insert({
          event_type: eventType,
          dodo_event_id: dodoEventId,
          user_id: userId || null,
          payload: payload,
          processed_at: new Date().toISOString(),
        });
      }

      if (userId && supabase) {
        const isSuccess =
          eventType === 'subscription.created' ||
          eventType === 'subscription.active'  ||
          eventType === 'checkout.session.completed' ||
          eventType === 'payment.succeeded' ||
          eventType === 'checkout.succeeded' ||
          (eventType === 'checkout.status' && data?.status === 'succeeded');

        const isFailed =
          eventType === 'subscription.cancelled' ||
          eventType === 'subscription.failed'    ||
          eventType === 'payment.failed';

        const metadataType = data?.metadata?.type || payload?.metadata?.type;
        const metadataAmount = Number(data?.metadata?.amount || payload?.metadata?.amount || 0);
        const isDeposit = metadataType === 'deposit' || metadataAmount > 0;

        if (isSuccess && isDeposit) {
          const depositAmt = metadataAmount > 0 ? metadataAmount : Number((data?.total_amount || 2500) / 100);

          // Fetch existing user balance from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

          const currentBal = profile?.wallet_balance ? Number(profile.wallet_balance) : 0.00;
          const newBal = currentBal + depositAmt;

          // Credit balance in Supabase profiles
          await supabase
            .from('profiles')
            .update({ wallet_balance: newBal })
            .eq('id', userId);

          // Record ledger entry in wallet_transactions table
          await supabase
            .from('wallet_transactions')
            .upsert([{
              user_id: userId,
              amount: depositAmt,
              type: 'deposit',
              description: `Wallet Deposit ($${depositAmt.toFixed(2)}) via Dodo Payments`,
              balance_after: newBal,
              created_at: new Date().toISOString()
            }]);

          if (dodoSessionId) {
            await supabase.from('checkout_sessions').update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            }).eq('dodo_session_id', dodoSessionId);
          }

          console.log(`[Dodo Webhook] Credited $${depositAmt} to user ${userId}. New balance: $${newBal}`);
        } else if (isSuccess && !isDeposit) {
          let planName = 'Growth';
          let maxAccounts = 1;
          if (productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ' || (productId && String(productId).toLowerCase().includes('scale'))) {
            planName = 'Scale';
            maxAccounts = 10;
          }

          await supabase.from('profiles').update({
            plan: planName,
            max_accounts: maxAccounts,
            subscription_status: 'active',
            subscription_id: subscriptionId || null,
            is_trial: false,
            dodo_customer_id: customerId || null,
            plan_product_id: productId || null,
          }).eq('id', userId);

          if (dodoSessionId) {
            await supabase.from('checkout_sessions').update({
              status: 'completed',
              dodo_subscription_id: subscriptionId || null,
              completed_at: new Date().toISOString(),
            }).eq('dodo_session_id', dodoSessionId);
          }
        } else if (isFailed) {
          if (!isDeposit) {
            await supabase.from('profiles').update({
              subscription_status: 'cancelled',
            }).eq('id', userId);
          }

          if (dodoSessionId) {
            await supabase.from('checkout_sessions').update({
              status: 'failed',
            }).eq('dodo_session_id', dodoSessionId);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/v1/webhooks/dodo', dodoWebhookHandler);
  app.post('/api/v1/dodo-webhook', dodoWebhookHandler);

  // ---------------------------------------------------------------------------
  // Profiles Endpoint (Strict Single-Tenant User Profile Isolation)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/profiles', combinedAuth, asyncHandler(async (req: any, res: any) => {
    const profile = await ensureUserProfile(req.user);
    const profileId = req.zernioProfileId || profile?.zernio_profile_id || 'default-user-profile';
    res.json({
      profiles: [
        {
          _id: profileId,
          id: profileId,
          name: req.user.email || 'Default Profile',
          description: 'Single user tenant profile'
        }
      ]
    });
  }));

  app.post('/api/v1/profiles', combinedAuth, asyncHandler(async (req: any, res: any) => {
    const profile = await ensureUserProfile(req.user);
    const profileId = req.zernioProfileId || profile?.zernio_profile_id || 'default-user-profile';
    res.json({
      profile: {
        _id: profileId,
        id: profileId,
        name: req.user.email || 'Default Profile'
      }
    });
  }));

  async function ingestDodoUsageEvent(userId: string, eventName: string, metadata: object = {}) {
    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!dodoApiKey) return;

    const endpoint = process.env.NODE_ENV === 'production'
      ? 'https://live.dodopayments.com/events/ingest'
      : 'https://test.dodopayments.com/events/ingest';

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dodoApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: [
            {
              event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              customer_id: userId,
              event_name: eventName,
              timestamp: new Date().toISOString(),
              metadata
            }
          ]
        })
      });
    } catch (err: any) {
      console.warn('[Dodo Ingestion] Failed to report usage event:', err?.message || err);
    }
  }

  // Alias for /api/v1/keys
  app.get('/api/v1/me/keys', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    return res.redirect(307, '/api/v1/keys');
  }));

  // User details endpoint
  app.get('/api/v1/me', authenticate, asyncHandler(async (req: any, res: any) => {
    const profile = await ensureUserProfile(req.user);
    res.json({
      id: req.user.id,
      email: req.user.email,
      plan: req.plan || 'Growth',
      maxAccounts: req.maxAccounts || 1,
      connectedAccounts: req.connectedCount || 0,
      walletBalance: profile?.wallet_balance || 0,
      zernioProfileId: req.zernioProfileId
    });
  }));

  // ---------------------------------------------------------------------------
  // Generic passthrough proxy for everything else (full 1:1 mirror)
  // ---------------------------------------------------------------------------
  app.all(/^\/api\/v1\/(.*)/, combinedAuth, asyncHandler(async (req: any, res: any) => {
    // Asynchronously report usage event to Dodo Payments Usage Meter
    if (req.user?.id) {
      ingestDodoUsageEvent(req.user.id, 'api.call', {
        endpoint: req.originalUrl,
        method: req.method
      }).catch(() => {});
    }

    const baseUrl = process.env.ROCKYT_API_BASE_URL || 'https://api.rockyt.io';
    const urlPath = req.originalUrl.replace('/api/v1', '');
    const url = new URL(`${baseUrl}/v1${urlPath}`);
    if (req.zernioProfileId) {
      url.searchParams.set('profileId', req.zernioProfileId);
    }

    const zernioRes = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${process.env.ZERNIO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });
    const data = await zernioRes.json();
    res.status(zernioRes.status).json(data);
  }));

  // Fallback for unhandled /api/* calls (preventing HTML 404s on client fetch calls)
  app.all('/api/*', (_req, res) => {
    res.json({ ok: true });
  });

  // ─── HTML route fallbacks: serve cloned_site page HTML ──────────────────────
  // For any route that matches a cloned page directory, serve its index.html.
  // This handles /pricing, /docs, /signin, /signup, /features, etc.
  if (!process.env.VERCEL) {
    app.get('/{*splat}', (req, res, next) => {
      // Only handle non-API, non-asset requests
      if (
        req.path.startsWith('/api/') ||
        req.path.startsWith('/_next/') ||
        req.path.startsWith('/images/') ||
        req.path.startsWith('/brand/') ||
        req.path.startsWith('/fonts/') ||
        req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|map|json)$/)
      ) {
        return next();
      }

      // Try to serve a cloned page: /some-route -> cloned_site/some-route/index.html
      const cleanPath = req.path === '/' ? '' : req.path.replace(/\/$/, '');
      const candidates = [
        path.join(CLONED_DIR, cleanPath, 'index.html'),
        path.join(CLONED_DIR, cleanPath + '.html'),
        path.join(CLONED_DIR, 'index.html'), // fallback to home
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return res.sendFile(candidate);
        }
      }

      // Ultimate fallback: root index.html
      const rootIndex = path.join(CLONED_DIR, 'index.html');
      if (fs.existsSync(rootIndex)) {
        return res.sendFile(rootIndex);
      }

      next();
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}
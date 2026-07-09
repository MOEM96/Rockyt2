import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { Zernio } from "@zernio/node";
import crypto from "crypto";

// Instantiated once at module load — the SDK's client is a shared
// singleton internally, so this must NOT be created per-request.
const zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY! });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  async function supabaseAuth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing auth token' });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  }

  async function authenticate(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing API key' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('user_id, revoked, profiles(zernio_profile_id, max_accounts, connected_accounts_count)')
      .eq('key_hash', hash)
      .single();

    if (error || !data || data.revoked) return res.status(401).json({ error: 'Invalid API key' });

    req.zernioProfileId = data.profiles.zernio_profile_id;
    req.maxAccounts = data.profiles.max_accounts;
    req.connectedCount = data.profiles.connected_accounts_count;
    next();
  }

  // API Key Management Routes
  app.post('/api/v1/keys', supabaseAuth, async (req: any, res: any) => {
    let { data: profile } = await supabase.from('profiles').select('zernio_profile_id').eq('id', req.user.id).single();

    if (!profile?.zernio_profile_id) {
      const zernioProfile = await zernio.profiles.createProfile({
        body: { name: req.user.email }
      });
      const zernioProfileId = (zernioProfile.data as any)._id;

      await supabase.from('profiles').update({ zernio_profile_id: zernioProfileId }).eq('id', req.user.id);
      profile = { zernio_profile_id: zernioProfileId };
    }

    const rawKey = 'zwl_' + crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    await supabase.from('user_api_keys').insert({
      user_id: req.user.id,
      key_hash: hash,
      key_prefix: rawKey.substring(0, 8)
    });

    res.json({ key: rawKey });
  });

  app.get('/api/v1/keys', supabaseAuth, async (req: any, res: any) => {
    const { data } = await supabase.from('user_api_keys').select('id, key_prefix, created_at').eq('user_id', req.user.id).eq('revoked', false);
    res.json(data);
  });

  app.delete('/api/v1/keys/:id', supabaseAuth, async (req: any, res: any) => {
    await supabase.from('user_api_keys').update({ revoked: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.status(204).send();
  });

  // Connect flow — via SDK, with our own redirect_url so Zernio sends
  // profileId/accountId back to us directly, no state table needed.
  app.get('/api/v1/connect/:platform', authenticate, async (req: any, res: any) => {
    if (req.connectedCount >= req.maxAccounts) {
      return res.status(403).json({ error: 'Account limit reached. Upgrade your plan.' });
    }
    try {
      const result = await zernio.connect.getConnectUrl({
        path: { platform: req.params.platform as any },
        query: {
          profileId: req.zernioProfileId,
          redirect_url: `${process.env.APP_BASE_URL}/oauth/callback`
        }
      });
      res.json(result.data);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message ?? 'Zernio connect failed' });
    }
  });

  app.get('/oauth/callback', async (req: any, res: any) => {
    const { profileId, accountId } = req.query;
    if (profileId && accountId) {
      const { data: p } = await supabase
        .from('profiles')
        .select('connected_accounts_count')
        .eq('zernio_profile_id', profileId)
        .single();
      if (p) {
        await supabase
          .from('profiles')
          .update({ connected_accounts_count: p.connected_accounts_count + 1 })
          .eq('zernio_profile_id', profileId);
      }
    }
    res.redirect('/dashboard?connected=1');
  });

  // Curated post creation: users pass platform names, we resolve to
  // accountIds scoped strictly to the caller's own profile.
  app.post('/api/v1/posts', authenticate, async (req: any, res: any) => {
    const { platforms, content, scheduledFor, publishNow } = req.body;
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'platforms must be a non-empty array of platform names' });
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
        resolvedPlatforms.push({ platform, accountId: account.id });
      }

      const result = await zernio.posts.createPost({
        body: { content, scheduledFor, publishNow, platforms: resolvedPlatforms }
      });
      res.json(result.data);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message ?? 'Zernio post creation failed' });
    }
  });

  app.get('/api/v1/me/usage', authenticate, (req: any, res: any) => {
    res.json({ connectedAccounts: req.connectedCount, maxAccounts: req.maxAccounts });
  });

  app.get('/api/v1/me/dashboard-usage', supabaseAuth, async (req: any, res: any) => {
    const { data: profile } = await supabase.from('profiles').select('max_accounts, connected_accounts_count').eq('id', req.user.id).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ connectedAccounts: profile.connected_accounts_count, maxAccounts: profile.max_accounts });
  });

  // Generic passthrough proxy for everything else (full 1:1 mirror)
  app.all(/^\/api\/v1\/(.*)/, authenticate, async (req: any, res: any) => {
    const path = req.originalUrl.replace('/api/v1', '');
    const url = new URL(`https://zernio.com/api/v1${path}`);
    url.searchParams.set('profileId', req.zernioProfileId);

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
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Admin client
  // Assuming these are available in environment
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Middleware to authenticate via custom API Key
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

  // API routes
  app.get('/api/v1/connect/:platform', authenticate, async (req: any, res: any) => {
    if (req.connectedCount >= req.maxAccounts) {
      return res.status(403).json({ error: 'Account limit reached. Upgrade your plan.' });
    }
    const zernioRes = await fetch(`https://zernio.com/api/v1/connect/${req.params.platform}?profileId=${req.zernioProfileId}`, {
      headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` }
    });
    const data = await zernioRes.json();
    res.status(zernioRes.status).json(data);
  });

  app.get('/api/v1/me/usage', authenticate, (req: any, res: any) => {
    res.json({ connectedAccounts: req.connectedCount, maxAccounts: req.maxAccounts });
  });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

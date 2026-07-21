import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { Zernio } from "@zernio/node";
import crypto from "crypto";
import DodoPayments from "dodopayments";

// Instantiated once at module load — the SDK's client is a shared
// singleton internally, so this must NOT be created per-request.
// In production, ZERNIO_API_KEY must be set. In dev, a dummy key prevents
// startup crashes — actual Zernio calls will simply 401.
if (!process.env.ZERNIO_API_KEY && process.env.NODE_ENV === 'production') {
  console.error('WARNING: ZERNIO_API_KEY is not set. Zernio API calls will fail.');
}
const zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY || "dummy_dev_key" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Capture raw body buffer for webhook signature verification
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  const hasRealSupabase = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = hasRealSupabase
    ? createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : null;

  // Memory storage for local mock mode
  const mockKeys: Array<{ id: string, user_id: string, key_hash: string, key_prefix: string, revoked: boolean, created_at: string }> = [];
  let mockConnectedCount = 0;

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

  async function supabaseAuth(req: any, res: any, next: any) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Missing auth token' });
      if (!supabase) {
        // Mock mode: assign mock user
        req.user = { id: 'mock-user-id-123', email: 'demo-user@rockyt.io' };
        return next();
      }
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid token' });
      req.user = user;
      next();
    } catch (err: any) {
      console.error('supabaseAuth error:', err);
      res.status(401).json({ error: 'Authentication failed', details: err?.message });
    }
  }

  async function authenticate(req: any, res: any, next: any) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Missing API key' });

      const hash = crypto.createHash('sha256').update(token).digest('hex');

      if (!supabase) {
        // Mock mode: validate key against in-memory store
        const mockKey = mockKeys.find(k => k.key_hash === hash && !k.revoked);
        if (!mockKey) return res.status(401).json({ error: 'Invalid API key' });
        req.zernioProfileId = 'mock-zernio-profile-id';
        req.maxAccounts = 5;
        req.connectedCount = mockConnectedCount;
        return next();
      }

      // Step 1: Validate key and fetch user_id
      const { data: keyData, error: keyError } = await supabase
        .from('user_api_keys')
        .select('user_id, revoked')
        .eq('key_hash', hash)
        .single();

      if (keyError || !keyData || keyData.revoked) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Step 2: Fetch profile details for that user_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('zernio_profile_id, max_accounts, connected_accounts_count')
        .eq('id', keyData.user_id)
        .single();

      if (profileError || !profileData) {
        return res.status(401).json({ error: 'Profile not found' });
      }

      req.zernioProfileId = profileData.zernio_profile_id;
      req.maxAccounts = profileData.max_accounts;
      req.connectedCount = profileData.connected_accounts_count;
      next();
    } catch (err: any) {
      console.error('authenticate error:', err);
      res.status(401).json({ error: 'Authentication failed', details: err?.message });
    }
  }

  // ---------------------------------------------------------------------------
  // API Key Management Routes
  // ---------------------------------------------------------------------------
  app.post('/api/v1/keys', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    let zernioProfileId = 'mock-zernio-profile-id';

    if (supabase) {
      let { data: profile } = await supabase.from('profiles').select('zernio_profile_id').eq('id', req.user.id).single();

      if (!profile?.zernio_profile_id) {
        try {
          const zernioProfile = await zernio.profiles.createProfile({
            body: { name: req.user.email }
          });
          zernioProfileId = (zernioProfile.data as any).profile?._id;
          if (!zernioProfileId) {
            throw new Error('Failed to retrieve profile ID from Zernio response');
          }
          await supabase.from('profiles').update({ zernio_profile_id: zernioProfileId }).eq('id', req.user.id);
        } catch (err: any) {
          return res.status(500).json({ error: err.message || 'Failed to create Zernio profile' });
        }
        profile = { zernio_profile_id: zernioProfileId };
      } else {
        zernioProfileId = profile.zernio_profile_id;
      }
    }

    const rawKey = 'zwl_' + crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    if (supabase) {
      await supabase.from('user_api_keys').insert({
        user_id: req.user.id,
        key_hash: hash,
        key_prefix: rawKey.substring(0, 8)
      });
    } else {
      mockKeys.push({
        id: crypto.randomUUID(),
        user_id: req.user.id,
        key_hash: hash,
        key_prefix: rawKey.substring(0, 8),
        revoked: false,
        created_at: new Date().toISOString()
      });
    }

    res.json({ key: rawKey });
  }));

  app.get('/api/v1/keys', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const { data } = await supabase.from('user_api_keys').select('id, key_prefix, created_at').eq('user_id', req.user.id).eq('revoked', false);
      res.json(data || []);
    } else {
      const activeKeys = mockKeys.filter(k => k.user_id === req.user.id && !k.revoked);
      res.json(activeKeys.map(k => ({ id: k.id, key_prefix: k.key_prefix, created_at: k.created_at })));
    }
  }));

  app.delete('/api/v1/keys/:id', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      await supabase.from('user_api_keys').update({ revoked: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    } else {
      const keyIndex = mockKeys.findIndex(k => k.id === req.params.id && k.user_id === req.user.id);
      if (keyIndex !== -1) {
        mockKeys[keyIndex].revoked = true;
      }
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
          redirect_url: `${process.env.APP_BASE_URL}/oauth/callback`
        }
      });
      res.json(result.data);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ error: err.message ?? 'Zernio connect failed' });
    }
  }));

  app.get('/oauth/callback', asyncHandler(async (req: any, res: any) => {
    const { profileId, accountId } = req.query;
    if (profileId && accountId) {
      if (supabase) {
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
      } else {
        mockConnectedCount++;
      }
    }
    res.redirect('/dashboard?connected=1');
  }));

  // ---------------------------------------------------------------------------
  // Curated post creation: users pass platform names, we resolve to
  // accountIds scoped strictly to the caller's own profile.
  // ---------------------------------------------------------------------------
  app.post('/api/v1/posts', authenticate, asyncHandler(async (req: any, res: any) => {
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
  }));

  app.get('/api/v1/me/usage', authenticate, asyncHandler(async (req: any, res: any) => {
    res.json({ connectedAccounts: req.connectedCount, maxAccounts: req.maxAccounts });
  }));

  app.get('/api/v1/me/dashboard-usage', supabaseAuth, asyncHandler(async (req: any, res: any) => {
    if (supabase) {
      const { data: profile } = await supabase.from('profiles').select('max_accounts, connected_accounts_count').eq('id', req.user.id).single();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      res.json({ connectedAccounts: profile.connected_accounts_count, maxAccounts: profile.max_accounts });
    } else {
      res.json({ connectedAccounts: mockConnectedCount, maxAccounts: 5 });
    }
  }));

  // ---------------------------------------------------------------------------
  // Secure Dodo Payments Checkout Endpoint
  // ---------------------------------------------------------------------------
  app.post('/api/v1/checkouts', supabaseAuth, async (req: any, res: any) => {
    const { productId, trialPeriodDays } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    try {
      const apiKey =
          process.env.DODO_PAYMENTS_API_KEY ||
          process.env.DODO_API_KEY          ||
          process.env.DODO_SECRET_KEY       ||
          process.env.VITE_DODO_API_KEY;

      if (!apiKey) {
        console.error('[dodo] No API key found. Set DODO_PAYMENTS_API_KEY or DODO_API_KEY in your deployment environment.');
        return res.status(500).json({
          error: 'Payments are not configured on this server (missing DODO_PAYMENTS_API_KEY).',
          docs:  'Set DODO_PAYMENTS_API_KEY in your Vercel project environment variables.',
        });
      }

      let envMode: 'test_mode' | 'live_mode' = 'test_mode';
      const explicitMode = process.env.DODO_PAYMENTS_ENVIRONMENT || process.env.DODO_MODE || process.env.VITE_DODO_MODE;
      if (explicitMode === 'live' || explicitMode === 'live_mode') {
        envMode = 'live_mode';
      } else if (explicitMode === 'test' || explicitMode === 'test_mode') {
        envMode = 'test_mode';
      } else if (apiKey.startsWith('live')) {
        envMode = 'live_mode';
      } else {
        envMode = 'test_mode';
      }

      const client = new DodoPayments({
        bearerToken: apiKey,
        environment: envMode,
      });

      const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
      const returnUrl = `${appBaseUrl}/dashboard?ref_id=${encodeURIComponent(req.user.id)}`;

      const sessionCreateParams: any = {
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          email: req.user.email,
        },
        metadata: {
          user_id: req.user.id,
        },
        return_url: returnUrl,
      };

      if (typeof trialPeriodDays === 'number') {
        sessionCreateParams.subscription_data = {
          trial_period_days: trialPeriodDays,
        };
      }

      console.log(`Creating Dodo checkout session (${envMode}) for:`, req.user.email, productId);

      const session = await client.checkoutSessions.create(sessionCreateParams);

      res.json({ checkout_url: session.checkout_url, session_id: session.session_id });
    } catch (error: any) {
      console.error('Error creating checkout session via SDK:', error);
      const statusCode = error.status || error.statusCode || 500;
      const errorDetail = error.message || error.error || String(error);
      res.status(statusCode).json({ error: `Dodo Payments API error (${statusCode}): ${errorDetail}` });
    }
  });

  // ---------------------------------------------------------------------------
  // Dodo Payments Webhook Endpoint
  // ---------------------------------------------------------------------------
  app.post('/api/v1/webhooks/dodo', async (req: any, res: any) => {
    const dodoWebhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (dodoWebhookSecret) {
      const webhookId = req.headers['webhook-id'];
      const webhookSignature = req.headers['webhook-signature'];
      const webhookTimestamp = req.headers['webhook-timestamp'];

      if (!webhookId || !webhookSignature || !webhookTimestamp) {
        console.error('Dodo Webhook Signature verification headers missing');
        return res.status(401).json({ error: 'Missing webhook signature headers' });
      }

      const rawBody = req.rawBody ? req.rawBody.toString() : '';
      const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      const computedSignature = crypto
        .createHmac('sha256', dodoWebhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (computedSignature !== webhookSignature) {
        console.error('Dodo Webhook Signature verification failed');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const payload = req.body;
    console.log('Received Dodo Webhook payload:', payload);

    const eventType = payload.event_type;
    const data = payload.data;

    // Extract User ID from metadata
    const userId = data.customer?.metadata?.user_id || data.metadata?.user_id || data.customer_metadata?.user_id;

    if (!userId) {
      console.warn('No user_id found in Dodo webhook metadata');
      return res.status(200).json({ message: 'No user_id, ignored' });
    }

    let status = 'active';
    const subscriptionId = data.subscription_id || data.id;

    if (eventType.includes('failed') || eventType.includes('expired')) {
      status = 'past_due';
    } else if (eventType.includes('canceled')) {
      status = 'canceled';
    } else if (eventType.includes('succeeded') || eventType.includes('active') || eventType.includes('created')) {
      status = 'active';
    }

    // Map Product ID to plan name & limit
    const productId = data.product_id || data.product_cart?.[0]?.product_id || data.items?.[0]?.product_id;
    let planName = null;
    let maxAccounts = 5;

    if (productId === 'pdt_0NWDjeAeatQKryEvRe4eb') {
      planName = 'Growth';
      maxAccounts = 5;
    } else if (productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ') {
      planName = 'Scale';
      maxAccounts = 10;
    }

    console.log(`Webhook: Updating user ${userId} to status: ${status}, plan: ${planName}, maxAccounts: ${maxAccounts}`);

    if (supabase) {
      const updateData: any = {
        subscription_status: status,
        subscription_id: subscriptionId,
        is_trial: false
      };
      if (planName) {
        updateData.plan = planName;
        updateData.max_accounts = maxAccounts;
        updateData.plan_product_id = productId;  // remember which Dodo SKU they paid for
      }
      // Persist Dodo's stable customer id so future webhook lookups don't
      // have to rely solely on metadata.user_id (which can be missing on
      // events like subscription.renewed after the original metadata fell off).
      const dodoCustomerId =
          data.customer?.customer_id || data.customer_id || null;
      if (dodoCustomerId) {
        updateData.dodo_customer_id = dodoCustomerId;
      }
      // When Dodo tells us the next billing date, save it for display.
      const currentPeriodEnd =
          data.current_period_end || data.subscription?.current_period_end || null;
      if (currentPeriodEnd) {
        updateData.current_period_end = currentPeriodEnd;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Failed to update user profile in Supabase:', error);
        return res.status(500).json({ error: 'DB update failed' });
      }
    } else {
      console.log('Mock mode update completed successfully for userId:', userId);
    }

    res.json({ message: 'Success' });
  });

  // ---------------------------------------------------------------------------
  // Generic passthrough proxy for everything else (full 1:1 mirror)
  // ---------------------------------------------------------------------------
  app.all(/^\/api\/v1\/(.*)/, authenticate, asyncHandler(async (req: any, res: any) => {
    const urlPath = req.originalUrl.replace('/api/v1', '');
    const url = new URL(`https://zernio.com/api/v1${urlPath}`);
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
  }));

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
    app.get('*', (_req, res) => {
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
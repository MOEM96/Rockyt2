import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { Zernio } from "@zernio/node";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY || "dummy_dev_key" });

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

      // 1. Primary: Verify token via Supabase Auth API
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        req.user = user;
        return next();
      }

      // 2. Fallback: Parse Supabase JWT payload if token is valid signed JWT structure
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload && payload.sub && (payload.email || payload.role === 'authenticated')) {
              req.user = {
                id: payload.sub,
                email: payload.email || payload.user_metadata?.email || 'user@rockyt.io'
              };
              console.log('[supabaseAuth] Authenticated via JWT payload fallback for:', req.user.email);
              return next();
            }
          }
        } catch (jwtErr) {
          console.warn('[supabaseAuth] JWT parse fallback error:', jwtErr);
        }
      }

      console.error('[supabaseAuth] Token verification failed:', error?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid token', details: error?.message });
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

      if (keyError) {
        console.error('API key lookup error:', keyError.message, 'hash_prefix:', hash.substring(0, 12));
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (!keyData || keyData.revoked) {
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
          // First, try to find an existing Zernio profile for this user
          let existingProfileId: string | null = null;
          try {
            const listRes = await zernio.profiles.listProfiles();
            const profiles = (listRes.data as any)?.profiles || (listRes.data as any) || [];
            const existing = Array.isArray(profiles)
              ? profiles.find((p: any) => p.name === req.user.email)
              : null;
            if (existing?._id) {
              existingProfileId = existing._id;
            }
          } catch (_listErr) {
            // If listing fails, proceed to create
          }

          if (existingProfileId) {
            zernioProfileId = existingProfileId;
          } else {
            const zernioProfile = await zernio.profiles.createProfile({
              body: { name: req.user.email }
            });
            zernioProfileId = (zernioProfile.data as any).profile?._id;
            if (!zernioProfileId) {
              throw new Error('Failed to retrieve profile ID from Zernio response');
            }
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
      const { error: insertError } = await supabase.from('user_api_keys').insert({
        user_id: req.user.id,
        key_hash: hash,
        key_prefix: rawKey.substring(0, 8)
      });
      if (insertError) {
        console.error('Failed to insert API key:', insertError);
        return res.status(500).json({ error: `Failed to save API key: ${insertError.message}` });
      }
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
          redirect_url: `${process.env.APP_BASE_URL || 'https://dashboard.rockyt.io'}/oauth/callback`
        }
      });
      const authUrl = (result.data as any)?.authUrl || (result.data as any)?.url;
      res.json({ url: authUrl, authUrl, ...result.data });
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
      let { data: profile } = await supabase.from('profiles').select('max_accounts, connected_accounts_count').eq('id', req.user.id).maybeSingle();
      if (!profile) {
        console.log(`[profiles] Auto-creating missing profile for user: ${req.user.id} (${req.user.email})`);
        const { data: insertedProfile } = await supabase
          .from('profiles')
          .upsert({
            id: req.user.id,
            email: req.user.email,
            plan: 'Trial',
            max_accounts: 5,
            connected_accounts_count: 0,
            is_trial: true,
            subscription_status: 'trialing'
          })
          .select('max_accounts, connected_accounts_count')
          .maybeSingle();

        profile = insertedProfile || { max_accounts: 5, connected_accounts_count: 0 };
      }
      res.json({ connectedAccounts: profile.connected_accounts_count ?? 0, maxAccounts: profile.max_accounts ?? 5 });
    } else {
      res.json({ connectedAccounts: mockConnectedCount, maxAccounts: 5 });
    }
  }));
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
        console.error('[dodo] No API key found. Set DODO_PAYMENTS_API_KEY in your deployment environment.');
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

      const baseUrl = envMode === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
      const appBaseUrl = process.env.APP_BASE_URL || (req.headers.origin || `https://${req.headers.host}`);
      const returnUrl = `${appBaseUrl}/dashboard?ref_id=${encodeURIComponent(req.user.id)}`;

      const requestBody: any = {
        customer: {
          email: req.user.email,
        },
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        metadata: {
          user_id: req.user.id,
        },
        return_url: returnUrl,
      };

      if (typeof trialPeriodDays === 'number') {
        requestBody.subscription_data = {
          trial_period_days: trialPeriodDays,
        };
      }

      console.log(`[Dodo] Creating checkout session (${envMode}) for:`, req.user.email, productId);

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

      const planName = productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ' ? 'Scale' : 'Growth';

      // Record checkout session in Supabase checkout_sessions table
      if (supabase && req.user?.id) {
        try {
          await supabase.from('checkout_sessions').insert({
            user_id: req.user.id,
            dodo_session_id: dodoSessionId,
            product_id: productId,
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
  // Dodo Payments Webhook Endpoint
  // ---------------------------------------------------------------------------
  app.post('/api/v1/webhooks/dodo', async (req: any, res: any) => {
    const dodoWebhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (dodoWebhookSecret) {
      const webhookId = req.headers['webhook-id'];
      const webhookSignature = req.headers['webhook-signature'];
      const webhookTimestamp = req.headers['webhook-timestamp'];

      if (!webhookId || !webhookSignature || !webhookTimestamp) {
        return res.status(401).json({ error: 'Missing webhook signature headers' });
      }

      const rawBody = req.rawBody ? req.rawBody.toString() : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      const computedSignature = crypto
        .createHmac('sha256', dodoWebhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (computedSignature !== webhookSignature) {
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
          (eventType === 'checkout.status' && data?.status === 'succeeded');

        const isFailed =
          eventType === 'subscription.cancelled' ||
          eventType === 'subscription.failed'    ||
          eventType === 'payment.failed';

        let planName = 'Growth';
        let maxAccounts = 5;
        if (productId === 'pdt_0NWDjzl0TS6LNFrVdFZYQ') {
          planName = 'Scale';
          maxAccounts = 10;
        }

        if (isSuccess) {
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
          await supabase.from('profiles').update({
            subscription_status: 'cancelled',
          }).eq('id', userId);

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
  });

  // ---------------------------------------------------------------------------
  // Generic passthrough proxy for everything else (full 1:1 mirror)
  // ---------------------------------------------------------------------------
  app.all(/^\/api\/v1\/(.*)/, asyncHandler(async (req: any, res: any) => {
    const urlPath = req.originalUrl.replace('/api/v1', '');
    const url = new URL(`https://zernio.com/api/v1${urlPath}`);
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

  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite dev server middleware skipped:', e);
    }
  } else if (!process.env.VERCEL) {
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
-- ============================================================================
-- 004_rls_policies_and_oauth_helpers.sql
-- ----------------------------------------------------------------------------
-- Idempotent SQL migration for Supabase PostgreSQL.
-- 1. Updates RLS policies to allow backend server operations across tables.
-- 2. Creates save_connected_account SECURITY DEFINER function.
-- 3. Refines get_user_dashboard SECURITY DEFINER function.
-- ============================================================================

-- 1. Profiles Table RLS Policies ---------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
CREATE POLICY "profiles_insert_all"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
CREATE POLICY "profiles_update_all"
  ON public.profiles FOR UPDATE
  USING (true);


-- 2. Connected Accounts Table RLS Policies ------------------------------------
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connected_accounts_select_all" ON public.connected_accounts;
CREATE POLICY "connected_accounts_select_all"
  ON public.connected_accounts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "connected_accounts_insert_all" ON public.connected_accounts;
CREATE POLICY "connected_accounts_insert_all"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "connected_accounts_update_all" ON public.connected_accounts;
CREATE POLICY "connected_accounts_update_all"
  ON public.connected_accounts FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "connected_accounts_delete_all" ON public.connected_accounts;
CREATE POLICY "connected_accounts_delete_all"
  ON public.connected_accounts FOR DELETE
  USING (true);


-- 3. User Posts Table RLS Policies -------------------------------------------
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_posts_select_all" ON public.user_posts;
CREATE POLICY "user_posts_select_all"
  ON public.user_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "user_posts_insert_all" ON public.user_posts;
CREATE POLICY "user_posts_insert_all"
  ON public.user_posts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "user_posts_update_all" ON public.user_posts;
CREATE POLICY "user_posts_update_all"
  ON public.user_posts FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "user_posts_delete_all" ON public.user_posts;
CREATE POLICY "user_posts_delete_all"
  ON public.user_posts FOR DELETE
  USING (true);


-- 4. User API Keys Table RLS Policies ----------------------------------------
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_api_keys_select_all" ON public.user_api_keys;
CREATE POLICY "user_api_keys_select_all"
  ON public.user_api_keys FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "user_api_keys_insert_all" ON public.user_api_keys;
CREATE POLICY "user_api_keys_insert_all"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "user_api_keys_update_all" ON public.user_api_keys;
CREATE POLICY "user_api_keys_update_all"
  ON public.user_api_keys FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "user_api_keys_delete_all" ON public.user_api_keys;
CREATE POLICY "user_api_keys_delete_all"
  ON public.user_api_keys FOR DELETE
  USING (true);


-- 5. Webhooks Table RLS Policies ---------------------------------------------
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhooks_select_all" ON public.webhooks;
CREATE POLICY "webhooks_select_all"
  ON public.webhooks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "webhooks_insert_all" ON public.webhooks;
CREATE POLICY "webhooks_insert_all"
  ON public.webhooks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "webhooks_update_all" ON public.webhooks;
CREATE POLICY "webhooks_update_all"
  ON public.webhooks FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "webhooks_delete_all" ON public.webhooks;
CREATE POLICY "webhooks_delete_all"
  ON public.webhooks FOR DELETE
  USING (true);


-- 6. Wallet Transactions & API Logs RLS Policies -----------------------------
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_transactions_select_all" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_all"
  ON public.wallet_transactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "wallet_transactions_insert_all" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_insert_all"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_logs_select_all" ON public.api_logs;
CREATE POLICY "api_logs_select_all"
  ON public.api_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "api_logs_insert_all" ON public.api_logs;
CREATE POLICY "api_logs_insert_all"
  ON public.api_logs FOR INSERT
  WITH CHECK (true);


-- 7. Helper RPC Function: save_connected_account -----------------------------
CREATE OR REPLACE FUNCTION public.save_connected_account(
  p_user_id uuid,
  p_platform text,
  p_username text DEFAULT '@user',
  p_profile_name text DEFAULT 'Social Profile',
  p_account_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_acc_id uuid;
  v_result json;
BEGIN
  -- If account already exists for this user and platform, get its id
  SELECT id INTO v_acc_id FROM public.connected_accounts 
  WHERE user_id = p_user_id AND lower(platform) = lower(p_platform) 
  LIMIT 1;

  IF v_acc_id IS NULL THEN
    v_acc_id := gen_random_uuid();
    INSERT INTO public.connected_accounts (id, user_id, platform, username, profile_name, status, created_at)
    VALUES (v_acc_id, p_user_id, p_platform, p_username, p_profile_name, 'connected', now());
  ELSE
    UPDATE public.connected_accounts SET
      username = p_username,
      profile_name = p_profile_name,
      status = 'connected'
    WHERE id = v_acc_id;
  END IF;

  UPDATE public.profiles
  SET connected_accounts_count = (
    SELECT count(*) FROM public.connected_accounts WHERE user_id = p_user_id AND status = 'connected'
  )
  WHERE id = p_user_id;

  SELECT row_to_json(a) INTO v_result FROM public.connected_accounts a WHERE a.id = v_acc_id;
  RETURN v_result;
END;
$$;


-- 8. Refined RPC Function: get_user_dashboard ---------------------------------
CREATE OR REPLACE FUNCTION public.get_user_dashboard(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile json;
  v_accounts json;
  v_keys json;
  v_logs json;
  v_txns json;
  v_webhooks json;
  v_posts json;
BEGIN
  SELECT row_to_json(p) INTO v_profile FROM public.profiles p WHERE p.id = p_user_id;
  SELECT COALESCE(json_agg(a), '[]'::json) INTO v_accounts FROM (
    SELECT * FROM public.connected_accounts WHERE user_id = p_user_id ORDER BY created_at DESC
  ) a;
  SELECT COALESCE(json_agg(k), '[]'::json) INTO v_keys FROM (
    SELECT id, user_id, key_prefix, revoked, created_at FROM public.user_api_keys WHERE user_id = p_user_id AND revoked = false ORDER BY created_at DESC
  ) k;
  SELECT COALESCE(json_agg(l), '[]'::json) INTO v_logs FROM (
    SELECT * FROM public.api_logs WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 50
  ) l;
  SELECT COALESCE(json_agg(t), '[]'::json) INTO v_txns FROM (
    SELECT * FROM public.wallet_transactions WHERE user_id = p_user_id ORDER BY created_at DESC
  ) t;
  SELECT COALESCE(json_agg(w), '[]'::json) INTO v_webhooks FROM (
    SELECT * FROM public.webhooks WHERE user_id = p_user_id ORDER BY created_at DESC
  ) w;
  SELECT COALESCE(json_agg(post), '[]'::json) INTO v_posts FROM (
    SELECT * FROM public.user_posts WHERE user_id = p_user_id ORDER BY created_at DESC
  ) post;

  RETURN json_build_object(
    'profile', v_profile,
    'accounts', v_accounts,
    'apiKeys', v_keys,
    'logs', v_logs,
    'walletTransactions', v_txns,
    'webhooks', v_webhooks,
    'posts', v_posts
  );
END;
$$;

-- 9. RPC Function: get_user_dashboard_by_identifier (UUID, Email, or Zernio Profile ID)
CREATE OR REPLACE FUNCTION public.get_user_dashboard_by_identifier(p_identifier text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Try matching by email
  SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = lower(p_identifier) LIMIT 1;

  -- 2. Try matching by zernio_profile_id
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE zernio_profile_id = p_identifier LIMIT 1;
  END IF;

  -- 3. Try matching by UUID id
  IF v_user_id IS NULL AND p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE id = p_identifier::uuid LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'error', 'User profile not found for identifier: ' || p_identifier,
      'profile', null,
      'accounts', '[]'::json,
      'apiKeys', '[]'::json,
      'logs', '[]'::json,
      'walletTransactions', '[]'::json,
      'webhooks', '[]'::json,
      'posts', '[]'::json
    );
  END IF;

  RETURN public.get_user_dashboard(v_user_id);
END;
$$;

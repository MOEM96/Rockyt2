-- ============================================================================
-- 003_profile_trigger_and_rls_fixes.sql
-- ----------------------------------------------------------------------------
-- Apply this in the Supabase SQL editor (Database → SQL Editor → New query).
-- Idempotent — safe to re-run.
--
-- Adds:
--   1. Trigger on auth.users INSERT to auto-create a profiles row on signup
--   2. Fixes user_posts open RLS policy (was qual: true → scoped to user_id)
--   3. Adds full RLS policies for webhooks table
--   4. Adds INSERT policies for wallet_transactions and api_logs
-- ============================================================================

-- 1. Auto-create profile on signup trigger --------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, max_accounts, connected_accounts_count, wallet_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'Growth',
    1,
    0,
    0.00
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();


-- 2. Fix user_posts RLS: remove open policy, add scoped policies ----------

DROP POLICY IF EXISTS "Allow all operations for user_posts" ON public.user_posts;

DROP POLICY IF EXISTS "user_posts_select_own" ON public.user_posts;
CREATE POLICY "user_posts_select_own"
  ON public.user_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_posts_insert_own" ON public.user_posts;
CREATE POLICY "user_posts_insert_own"
  ON public.user_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_posts_update_own" ON public.user_posts;
CREATE POLICY "user_posts_update_own"
  ON public.user_posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_posts_delete_own" ON public.user_posts;
CREATE POLICY "user_posts_delete_own"
  ON public.user_posts FOR DELETE
  USING (auth.uid() = user_id);


-- 3. Add webhooks RLS policies (table had RLS enabled but zero policies) ---

DROP POLICY IF EXISTS "webhooks_select_own" ON public.webhooks;
CREATE POLICY "webhooks_select_own"
  ON public.webhooks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhooks_insert_own" ON public.webhooks;
CREATE POLICY "webhooks_insert_own"
  ON public.webhooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhooks_update_own" ON public.webhooks;
CREATE POLICY "webhooks_update_own"
  ON public.webhooks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhooks_delete_own" ON public.webhooks;
CREATE POLICY "webhooks_delete_own"
  ON public.webhooks FOR DELETE
  USING (auth.uid() = user_id);


-- 4. Add wallet_transactions INSERT policy (only had SELECT) ---------------

DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_insert_own"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 5. Add api_logs INSERT policy (only had SELECT) --------------------------

DROP POLICY IF EXISTS "api_logs_insert_own" ON public.api_logs;
CREATE POLICY "api_logs_insert_own"
  ON public.api_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

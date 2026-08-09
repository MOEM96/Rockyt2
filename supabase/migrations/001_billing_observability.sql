-- ============================================================================
-- 001_billing_observability.sql
-- ----------------------------------------------------------------------------
-- Apply this ONCE in the Supabase SQL editor (Database → SQL Editor → New query).
-- Idempotent — safe to re-run.
--
-- Adds:
--   1. Two columns on profiles (dodo_customer_id, plan_product_id)  that the
--      webhook writes back on payment so we can identify the user + product
--      without relying on metadata that's already been mutated.
--   2. public.checkout_sessions   —  one row per checkout-session creation
--      request, so we can correlate which button click resulted in which
--      Dodo session and what eventually happened to it.
--   3. public.payment_events      —  append-only log of webhook deliveries,
--      deduped on (event_type, dodo_event_id) so retries are no-ops.
--
-- NO changes to auth, NO changes to existing RLS on profiles, NO production
-- data movement.
-- ============================================================================

-- 1a. Profiles bookkeeping --------------------------------------------------
alter table public.profiles
  add column if not exists dodo_customer_id  text null,
  add column if not exists plan_product_id   text null;

create index if not exists idx_profiles_dodo_customer
  on public.profiles using btree (dodo_customer_id)
  where dodo_customer_id is not null
  tablespace pg_default;


-- 2. checkout_sessions: what we ASKED Dodo to create -----------------------
create table if not exists public.checkout_sessions (
  id                   uuid         not null default gen_random_uuid(),
  user_id              uuid         not null,
  dodo_session_id      text         not null,
  dodo_subscription_id text         null,
  product_id           text         not null,
  plan                 text         not null,
  status               text         not null default 'pending'
                                    check (status in ('pending','completed','expired','failed','abandoned')),
  checkout_url         text         not null,
  created_at           timestamptz  not null default timezone('utc'::text, now()),
  completed_at         timestamptz  null,
  constraint checkout_sessions_pkey           primary key (id),
  constraint checkout_sessions_session_uniq  unique (dodo_session_id),
  constraint checkout_sessions_user_fkey     foreign key (user_id)
    references auth.users(id) on delete cascade
) tablespace pg_default;

create index if not exists idx_checkout_sessions_user
  on public.checkout_sessions using btree (user_id, created_at desc)
  tablespace pg_default;

create index if not exists idx_checkout_sessions_sub
  on public.checkout_sessions using btree (dodo_subscription_id)
  tablespace pg_default;


-- 3. payment_events: what Dodo TOLD us happened ----------------------------
create table if not exists public.payment_events (
  id            uuid        not null default gen_random_uuid(),
  event_type    text        not null,
  dodo_event_id text        null,
  user_id       uuid        null,
  payload       jsonb       not null,
  received_at   timestamptz not null default timezone('utc'::text, now()),
  processed_at  timestamptz null,
  constraint payment_events_pkey primary key (id)
) tablespace pg_default;

-- Dedupe: same event from Dodo retries → unique violation → no-op.
create unique index if not exists idx_payment_events_dedupe
  on public.payment_events (event_type, dodo_event_id)
  where dodo_event_id is not null
  tablespace pg_default;

create index if not exists idx_payment_events_user
  on public.payment_events using btree (user_id, received_at desc)
  tablespace pg_default;


-- 4. RLS ---------------------------------------------------------------------
--   - Service role key fully bypasses RLS, so the server-side webhook and
--     checkout endpoints can still write.
--   - The end user can SELECT their own checkout_sessions; can NOT read
--     payment_events (which holds the full payload incl. customer email).
alter table public.checkout_sessions enable row level security;
alter table public.payment_events    enable row level security;

drop policy if exists "checkout_sessions_select_own" on public.checkout_sessions;
create policy "checkout_sessions_select_own"
  on public.checkout_sessions for select
  using (auth.uid() = user_id);

-- payment_events intentionally has NO select policy — it stays server-only.

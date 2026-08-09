-- ============================================================================
-- 002_connected_accounts.sql
-- ----------------------------------------------------------------------------
-- Apply this in the Supabase SQL editor (Database → SQL Editor → New query).
-- Idempotent — safe to re-run.
--
-- Creates public.connected_accounts table so social channel connections
-- (Facebook, Instagram, LinkedIn, TikTok, Twitter/X, WhatsApp, etc.) are persisted
-- in Supabase and stay in sync across Desktop and Mobile devices.
-- ============================================================================

create table if not exists public.connected_accounts (
  id           uuid        not null default gen_random_uuid(),
  user_id      uuid        not null,
  platform     text        not null,
  username     text        not null,
  email        text        null,
  status       text        not null default 'connected',
  profile_name text        not null default 'Default Profile',
  created_at   timestamptz not null default timezone('utc'::text, now()),
  constraint connected_accounts_pkey primary key (id),
  constraint connected_accounts_user_fkey foreign key (user_id)
    references public.profiles(id) on delete cascade
) tablespace pg_default;

create index if not exists idx_connected_accounts_user
  on public.connected_accounts using btree (user_id, created_at desc)
  tablespace pg_default;

-- RLS Configuration: enable RLS and grant users access to manage their own connected accounts
alter table public.connected_accounts enable row level security;

drop policy if exists "connected_accounts_select_own" on public.connected_accounts;
create policy "connected_accounts_select_own"
  on public.connected_accounts for select
  using (auth.uid() = user_id);

drop policy if exists "connected_accounts_insert_own" on public.connected_accounts;
create policy "connected_accounts_insert_own"
  on public.connected_accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "connected_accounts_update_own" on public.connected_accounts;
create policy "connected_accounts_update_own"
  on public.connected_accounts for update
  using (auth.uid() = user_id);

drop policy if exists "connected_accounts_delete_own" on public.connected_accounts;
create policy "connected_accounts_delete_own"
  on public.connected_accounts for delete
  using (auth.uid() = user_id);

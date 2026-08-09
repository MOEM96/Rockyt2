-- Migration: 005_ads_and_conversion_attribution.sql
-- Description: Tables for Ads API, Conversion API (CAPI), and Closed-Loop Revenue Attribution

-- 1. Table: public.ad_campaigns
create table if not exists public.ad_campaigns (
  id text primary key default ('camp_' || replace(gen_random_uuid()::text, '-', '')),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  platform text not null,
  objective text default 'CONVERSIONS',
  status text default 'DRAFT' check (status in ('ACTIVE', 'DRAFT', 'PAUSED', 'COMPLETED')),
  daily_budget numeric(12,2) default 100.00,
  spend numeric(12,2) default 0.00,
  impressions bigint default 0,
  clicks bigint default 0,
  conversions bigint default 0,
  roas numeric(6,2) default 0.00,
  targeting jsonb default '{}'::jsonb,
  creative jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table: public.conversion_events
create table if not exists public.conversion_events (
  id text primary key default ('conv_' || replace(gen_random_uuid()::text, '-', '')),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  user_payload jsonb default '{}'::jsonb,
  posthog_distinct_id text,
  click_id text,
  status text default 'relayed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Table: public.revenue_attributions
create table if not exists public.revenue_attributions (
  id text primary key default ('attr_' || replace(gen_random_uuid()::text, '-', '')),
  user_id uuid references auth.users(id) on delete set null,
  amount numeric(12,2) not null,
  currency text default 'USD',
  click_id text,
  customer_id text,
  order_id text,
  status text default 'attributed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.ad_campaigns enable row level security;
alter table public.conversion_events enable row level security;
alter table public.revenue_attributions enable row level security;

-- 5. RLS Policies for ad_campaigns
create policy "Users can view their own ad campaigns"
  on public.ad_campaigns for select
  using (auth.uid() = user_id);

create policy "Users can manage their own ad campaigns"
  on public.ad_campaigns for all
  using (auth.uid() = user_id);

-- 6. RLS Policies for conversion_events
create policy "Users can view their conversion events"
  on public.conversion_events for select
  using (auth.uid() = user_id or user_id is null);

create policy "Allow insert conversion events"
  on public.conversion_events for insert
  with check (true);

-- 7. RLS Policies for revenue_attributions
create policy "Users can view revenue attributions"
  on public.revenue_attributions for select
  using (auth.uid() = user_id or user_id is null);

create policy "Allow insert revenue attributions"
  on public.revenue_attributions for insert
  with check (true);

-- 8. Indexes for fast query performance
create index if not exists idx_ad_campaigns_user_id on public.ad_campaigns(user_id);
create index if not exists idx_conversion_events_click_id on public.conversion_events(click_id);
create index if not exists idx_revenue_attributions_click_id on public.revenue_attributions(click_id);

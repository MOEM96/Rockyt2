-- Supabase Migration for Rockyt Platform & Reselling Engine

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: public.user_profiles
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text not null,
  zernio_profile_id text,
  full_name text,
  company_name text,
  role text default 'user',
  tier text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.api_keys
create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key_name text default 'Default API Key',
  key_prefix text not null,
  key_hash text not null,
  zernio_scoped_key text,
  status text default 'active' check (status in ('active', 'revoked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

-- Table: public.usage_logs
create table if not exists public.usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  method text not null,
  status_code integer not null,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.usage_logs enable row level security;

-- Policies for user_profiles
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

-- Policies for api_keys
create policy "Users can view their own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can manage their own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- Function: Handle New User Signup Auto-Provisioning
create or replace function public.handle_new_rockyt_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );

  return new;
end;
$$;

-- Trigger on auth.users creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_rockyt_user();

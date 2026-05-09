-- Run this in your Supabase SQL editor

-- Profiles table
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  share_token uuid not null unique,
  name text,
  history text,
  loves text,
  hates text,
  sensitivities text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photos table
create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Row-level security
alter table profiles enable row level security;
alter table photos enable row level security;

-- Profiles: owner can read/write their own
create policy "owner can manage profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profiles: anyone with the share token can read (handled in app via anon key)
create policy "public can read by share token"
  on profiles for select
  using (true);

-- Photos: owner can manage
create policy "owner can manage photos"
  on photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Photos: public can read (so share page can display them)
create policy "public can read photos"
  on photos for select
  using (true);

-- Storage bucket (create manually in Supabase dashboard: Storage > New bucket > "hair-photos", set to Public)

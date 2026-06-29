-- Swagger Editor App — initial schema
-- Run this in the Supabase SQL Editor (or via the Supabase CLI).

-- ---------------------------------------------------------------------------
-- schemas: one saved OpenAPI/Swagger spec per user (restored on next login)
-- ---------------------------------------------------------------------------
create table if not exists public.schemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  format text not null check (format in ('json', 'yaml')),
  updated_at timestamptz not null default now()
);

-- One spec per user -> enables upsert on user_id.
create unique index if not exists schemas_user_id_key on public.schemas (user_id);

-- ---------------------------------------------------------------------------
-- requests: executed-request history & analytics
-- ---------------------------------------------------------------------------
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  method text not null,
  url text not null,
  endpoint_path text,
  status_code integer,
  duration_ms integer not null default 0,
  request_size integer not null default 0,
  response_size integer not null default 0,
  error_detail text
);

-- Fast "my requests, newest first" lookups.
create index if not exists requests_user_created_idx
  on public.requests (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: every user can only read/write their own rows
-- ---------------------------------------------------------------------------
alter table public.schemas enable row level security;
alter table public.requests enable row level security;

create policy "schemas_select_own" on public.schemas
  for select using (auth.uid() = user_id);
create policy "schemas_insert_own" on public.schemas
  for insert with check (auth.uid() = user_id);
create policy "schemas_update_own" on public.schemas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "schemas_delete_own" on public.schemas
  for delete using (auth.uid() = user_id);

create policy "requests_select_own" on public.requests
  for select using (auth.uid() = user_id);
create policy "requests_insert_own" on public.requests
  for insert with check (auth.uid() = user_id);
create policy "requests_delete_own" on public.requests
  for delete using (auth.uid() = user_id);

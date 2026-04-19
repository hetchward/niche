-- Run once in Supabase → SQL Editor (new project).
create table if not exists public.niche_share (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists niche_share_created_at_idx
  on public.niche_share (created_at desc);

alter table public.niche_share enable row level security;
-- RLS on with no policies: anon/authenticated cannot read/write.
-- The service role key (used only from your Vercel server) bypasses RLS.

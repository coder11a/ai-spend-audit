create extension if not exists "pgcrypto";

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  share_id text not null unique,
  input jsonb not null,
  result jsonb not null,
  public_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_name text,
  role text,
  team_size integer,
  share_id text references public.audits(share_id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  share_id text not null unique references public.audits(share_id) on delete cascade,
  public_payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.audits enable row level security;
alter table public.leads enable row level security;
alter table public.shared_reports enable row level security;

create policy "Public reports are readable by share id"
  on public.shared_reports for select
  using (true);

create index if not exists audits_share_id_idx on public.audits(share_id);
create index if not exists shared_reports_share_id_idx on public.shared_reports(share_id);
create index if not exists leads_share_id_idx on public.leads(share_id);

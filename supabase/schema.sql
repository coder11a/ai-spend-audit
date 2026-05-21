create extension if not exists "pgcrypto";

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  share_id text not null unique,
  user_email text,
  input_stack jsonb,
  output_result jsonb,
  pricing_snapshot jsonb,
  created_at timestamptz not null default now()
);

alter table public.audits add column if not exists user_email text;
alter table public.audits add column if not exists input_stack jsonb;
alter table public.audits add column if not exists output_result jsonb;
alter table public.audits add column if not exists pricing_snapshot jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'audits'
      and column_name = 'input'
  ) then
    execute $migration$
      update public.audits
      set
        user_email = coalesce(user_email, nullif(input->>'email', '')),
        input_stack = coalesce(input_stack, input),
        output_result = coalesce(output_result, result)
      where input_stack is null
         or output_result is null
         or user_email is null
    $migration$;
  end if;
end
$$;

update public.audits
set pricing_snapshot = coalesce(
  pricing_snapshot,
  jsonb_build_object(
    'capturedAt',
    created_at,
    'tools',
    '[]'::jsonb
  )
)
where pricing_snapshot is null;

alter table public.audits alter column input_stack set not null;
alter table public.audits alter column output_result set not null;
alter table public.audits alter column pricing_snapshot set not null;
alter table public.audits drop column if exists input;
alter table public.audits drop column if exists result;
alter table public.audits drop column if exists public_payload;

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
create index if not exists audits_user_email_idx on public.audits(user_email);
create index if not exists shared_reports_share_id_idx on public.shared_reports(share_id);
create index if not exists leads_share_id_idx on public.leads(share_id);

create table if not exists public.jobs (
  id text primary key,
  title text not null,
  company text not null,
  location text not null,
  source text not null,
  apply_url text not null,
  description text,
  category text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  active boolean not null default true,
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_active_last_seen_idx
  on public.jobs (active, last_seen_at desc);

create index if not exists jobs_source_idx
  on public.jobs (source);

create index if not exists jobs_last_seen_posted_idx
  on public.jobs (last_seen_at desc, posted_at desc);

alter table public.jobs
  add column if not exists description text;

alter table public.jobs
  add column if not exists posted_at timestamptz;

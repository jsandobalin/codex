create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  query jsonb not null,
  snapshot_hash text not null unique,
  result text not null check (result in ('processing', 'accepted', 'rejected')),
  source_count integer not null default 0 check (source_count >= 0),
  signal_count integer not null default 0 check (signal_count >= 0),
  validation_count integer not null default 0 check (validation_count >= 0),
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  published_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signals (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source_id uuid not null references public.sources(id) on delete restrict,
  ingestion_run_id uuid not null references public.ingestion_runs(id) on delete restrict,
  title text not null,
  evidence text not null,
  impact_level text not null check (impact_level in ('low', 'medium', 'medium-high', 'high')),
  impact_summary text not null,
  action text not null,
  status_label text not null,
  status_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signal_validations (
  id uuid primary key default gen_random_uuid(),
  ingestion_run_id uuid not null references public.ingestion_runs(id) on delete cascade,
  signal_external_id text not null,
  is_valid boolean not null,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (ingestion_run_id, signal_external_id)
);

create index signals_source_id_idx on public.signals (source_id);
create index signals_ingestion_run_id_idx on public.signals (ingestion_run_id);
create index signal_validations_ingestion_run_id_idx on public.signal_validations (ingestion_run_id);

alter table public.ingestion_runs enable row level security;
alter table public.sources enable row level security;
alter table public.signals enable row level security;
alter table public.signal_validations enable row level security;

revoke all on table public.ingestion_runs, public.sources, public.signals, public.signal_validations from anon, authenticated;

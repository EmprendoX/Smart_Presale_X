-- Smart Pre-Sale core schema for Supabase
-- Run this file in the SQL editor of your Supabase project

-- Extensions --------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Tenancy ----------------------------------------------------------------
create table if not exists tenants (
  id text primary key,
  slug text unique not null,
  name text not null,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  region text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references tenants(id) on delete cascade,
  logo_url text,
  dark_logo_url text,
  square_logo_url text,
  favicon_url text,
  primary_color text,
  primary_color_foreground text,
  secondary_color text,
  accent_color text,
  background_color text,
  surface_color text,
  foreground_color text,
  font_family text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_settings_unique unique (tenant_id)
);

create table if not exists app_users (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  role text not null check (role in ('buyer','developer','admin')),
  kyc_status text not null check (kyc_status in ('none','basic','verified')),
  email text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- KYC Profiles & Documents ------------------------------------------------
create table if not exists kyc_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique references app_users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birthdate date not null,
  country text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text,
  postal_code text,
  status text not null default 'pending' check (status in ('pending','basic','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references app_users(id) on delete cascade,
  type text not null check (type in ('id_front','id_back','proof_of_address')),
  path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create table if not exists developers (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  user_id text not null,
  company text not null,
  verified_at timestamptz
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','inactive','invited')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects & rounds ------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text not null,
  country text not null,
  currency text not null check (currency in ('USD','MXN')),
  status text not null check (status in ('draft','review','published')),
  tenant_id text not null references tenants(id) on delete cascade,
  images text[] default '{}',
  video_url text,
  description text not null,
  developer_id text not null,
  created_at timestamptz not null default now(),
  listing_type text not null default 'presale' check (listing_type in ('presale','sale')),
  stage text,
  availability_status text,
  ticker text,
  total_units integer,
  attributes text[],
  specs jsonb,
  zone jsonb,
  property_type text,
  property_price numeric,
  development_stage text,
  asking_price numeric,
  property_details jsonb,
  tags text[],
  featured boolean,
  automation_ready boolean,
  agent_ids text[],
  seo jsonb
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  goal_type text not null check (goal_type in ('reservations','amount')),
  goal_value integer not null,
  deposit_amount integer not null,
  slots_per_person integer not null,
  deadline_at timestamptz not null,
  rule text not null check (rule in ('all_or_nothing','partial')),
  partial_threshold numeric default 0.7,
  status text not null check (status in ('open','nearly_full','closed','not_met','fulfilled')),
  created_at timestamptz not null default now(),
  group_slots integer
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  user_id text not null,
  slots integer not null,
  amount integer not null,
  status text not null check (status in ('pending','confirmed','refunded','assigned','waitlisted')),
  tx_id text,
  created_at timestamptz not null default now(),
  lead_source text,
  campaign text,
  journey_stage text check (journey_stage in ('lead','nurturing','reserved','closed_won','closed_lost')),
  last_engagement_at timestamptz
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  provider text not null check (provider in ('simulated','stripe','escrow')),
  amount integer not null,
  currency text not null check (currency in ('USD','MXN')),
  status text not null check (status in ('pending','succeeded','refunded')),
  payout_at timestamptz,
  provider_reference text,
  metadata jsonb default '{}'::jsonb,
  raw_response jsonb,
  client_secret text,
  created_at timestamptz not null default now()
);

create table if not exists payment_webhooks (
  id text primary key,
  provider text not null check (provider in ('simulated','stripe','escrow')),
  event_type text not null,
  payload jsonb not null,
  reservation_id uuid references reservations(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  status text default 'pending'
);

-- Research & market data -------------------------------------------------
create table if not exists research_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text not null check (type in ('study','report','news','data')),
  title text not null,
  source text,
  url text,
  published_at timestamptz
);

create table if not exists price_points (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  ts timestamptz not null,
  price numeric not null,
  volume numeric
);

-- Secondary market -------------------------------------------------------
create table if not exists secondary_listings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  round_id uuid references rounds(id) on delete cascade,
  seller_user_id text not null,
  slots integer not null,
  ask numeric not null,
  currency text not null check (currency in ('USD','MXN')),
  status text not null check (status in ('active','sold','cancelled')),
  created_at timestamptz not null default now(),
  filled_at timestamptz
);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references secondary_listings(id) on delete cascade,
  buyer_user_id text not null,
  price numeric not null,
  slots integer not null,
  created_at timestamptz not null default now()
);

-- Documents & communities ------------------------------------------------
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text,
  url text not null,
  access text,
  title text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  scope text not null check (scope in ('global','campaign')),
  tenant_id text not null references tenants(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  round_id uuid references rounds(id) on delete cascade,
  cover_image text,
  tags text[],
  member_count integer not null default 0,
  featured_posts jsonb,
  moderators text[],
  threads jsonb,
  badges jsonb,
  notification_channels jsonb,
  push_topic text
);

-- Automations & agents ---------------------------------------------------
create table if not exists intelligent_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  persona text not null check (persona in ('sales','concierge','community','operations')),
  status text not null check (status in ('training','ready','paused')),
  playbook text not null,
  handoff_email text,
  languages text[] default '{}',
  project_ids uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null check (status in ('draft','active','paused')),
  trigger text not null check (trigger in ('new_lead','new_reservation','milestone','manual')),
  channel text not null check (channel in ('email','whatsapp','slack','crm')),
  project_id uuid references projects(id) on delete set null,
  agent_id uuid references intelligent_agents(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes ----------------------------------------------------------------
create index if not exists idx_projects_tenant_id on projects(tenant_id);
create index if not exists idx_app_users_tenant_id on app_users(tenant_id);
create index if not exists idx_developers_tenant_id on developers(tenant_id);
create index if not exists idx_projects_developer_id on projects(developer_id);
create index if not exists idx_rounds_project_id on rounds(project_id);
create index if not exists idx_reservations_round_id on reservations(round_id);
create index if not exists idx_reservations_user_id on reservations(user_id);
create index if not exists idx_transactions_reservation_id on transactions(reservation_id);
create index if not exists idx_research_project_id on research_items(project_id);
create index if not exists idx_price_points_project_id on price_points(project_id);
create index if not exists idx_listings_project_id on secondary_listings(project_id);
create index if not exists idx_documents_project_id on project_documents(project_id);
create index if not exists idx_communities_project_id on communities(project_id);
create index if not exists idx_communities_tenant_id on communities(tenant_id);
create index if not exists idx_tenant_settings_tenant_id on tenant_settings(tenant_id);
create index if not exists idx_clients_tenant_id on clients(tenant_id);
create index if not exists idx_kyc_profiles_user_id on kyc_profiles(user_id);
create index if not exists idx_kyc_documents_user_id on kyc_documents(user_id);
create index if not exists idx_kyc_documents_status on kyc_documents(status);

-- Row Level Security -----------------------------------------------------
alter table tenants enable row level security;
alter table tenant_settings enable row level security;
alter table app_users enable row level security;
alter table kyc_profiles enable row level security;
alter table kyc_documents enable row level security;
alter table developers enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table rounds enable row level security;
alter table reservations enable row level security;
alter table transactions enable row level security;
alter table research_items enable row level security;
alter table price_points enable row level security;
alter table secondary_listings enable row level security;
alter table trades enable row level security;
alter table project_documents enable row level security;
alter table communities enable row level security;
alter table automation_workflows enable row level security;
alter table intelligent_agents enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "tenants_select_public" on tenants;
drop policy if exists "tenant_settings_select_public" on tenant_settings;
drop policy if exists "app_users_self_select" on app_users;
drop policy if exists "kyc_profiles_self_select" on kyc_profiles;
drop policy if exists "kyc_profiles_self_insert" on kyc_profiles;
drop policy if exists "kyc_profiles_self_update" on kyc_profiles;
drop policy if exists "kyc_documents_self_select" on kyc_documents;
drop policy if exists "kyc_documents_self_insert" on kyc_documents;
drop policy if exists "kyc_documents_service_modify" on kyc_documents;
drop policy if exists "developers_select_public" on developers;
drop policy if exists "clients_select_public" on clients;
drop policy if exists "projects_select_public" on projects;
drop policy if exists "rounds_select_public" on rounds;
drop policy if exists "reservations_select_owner" on reservations;
drop policy if exists "transactions_select_service" on transactions;
drop policy if exists "research_select_public" on research_items;
drop policy if exists "price_points_select_public" on price_points;
drop policy if exists "listings_select_public" on secondary_listings;
drop policy if exists "trades_select_public" on trades;
drop policy if exists "documents_select_public" on project_documents;
drop policy if exists "communities_select_public" on communities;
drop policy if exists "automations_select_public" on automation_workflows;
drop policy if exists "agents_select_public" on intelligent_agents;
drop policy if exists "tenants_modify_service" on tenants;
drop policy if exists "tenant_settings_modify_service" on tenant_settings;
drop policy if exists "app_users_modify_service" on app_users;
drop policy if exists "kyc_profiles_modify_service" on kyc_profiles;
drop policy if exists "developers_modify_service" on developers;
drop policy if exists "clients_modify_service" on clients;
drop policy if exists "projects_modify_service" on projects;
drop policy if exists "rounds_modify_service" on rounds;
drop policy if exists "reservations_modify_service" on reservations;
drop policy if exists "transactions_modify_service" on transactions;
drop policy if exists "research_modify_service" on research_items;
drop policy if exists "price_points_modify_service" on price_points;
drop policy if exists "listings_modify_service" on secondary_listings;
drop policy if exists "trades_modify_service" on trades;
drop policy if exists "documents_modify_service" on project_documents;
drop policy if exists "communities_modify_service" on communities;
drop policy if exists "automations_modify_service" on automation_workflows;
drop policy if exists "agents_modify_service" on intelligent_agents;

-- Public read access policies
create policy "tenants_select_public" on tenants for select using (true);
create policy "tenant_settings_select_public" on tenant_settings for select using (true);
create policy "app_users_self_select" on app_users for select using (auth.uid()::text = id or auth.role() = 'service_role' or auth.role() = 'anon');
create policy "kyc_profiles_self_select" on kyc_profiles for select using (auth.uid()::text = user_id or auth.role() = 'service_role');
create policy "kyc_profiles_self_insert" on kyc_profiles for insert with check (auth.uid()::text = user_id or auth.role() = 'service_role');
create policy "kyc_profiles_self_update" on kyc_profiles for update using (auth.uid()::text = user_id or auth.role() = 'service_role');
create policy "kyc_documents_self_select" on kyc_documents for select using (auth.uid()::text = user_id or auth.role() = 'service_role');
create policy "kyc_documents_self_insert" on kyc_documents for insert with check (auth.uid()::text = user_id or auth.role() = 'service_role');
create policy "kyc_documents_service_modify" on kyc_documents for all using (auth.role() = 'service_role');
create policy "developers_select_public" on developers for select using (true);
create policy "clients_select_public" on clients for select using (auth.role() = 'service_role' or auth.role() = 'authenticated');
create policy "projects_select_public" on projects for select using (true);
create policy "rounds_select_public" on rounds for select using (true);
create policy "reservations_select_owner" on reservations for select using (auth.uid()::text = user_id or auth.role() = 'service_role');
create policy "transactions_select_service" on transactions for select using (auth.role() = 'service_role');
create policy "research_select_public" on research_items for select using (true);
create policy "price_points_select_public" on price_points for select using (true);
create policy "listings_select_public" on secondary_listings for select using (true);
create policy "trades_select_public" on trades for select using (true);
create policy "documents_select_public" on project_documents for select using (true);
create policy "communities_select_public" on communities for select using (true);
create policy "automations_select_public" on automation_workflows for select using (auth.role() = 'service_role');
create policy "agents_select_public" on intelligent_agents for select using (true);

-- Service-role write access
create policy "tenants_modify_service" on tenants for all using (auth.role() = 'service_role');
create policy "tenant_settings_modify_service" on tenant_settings for all using (auth.role() = 'service_role');
create policy "app_users_modify_service" on app_users for all using (auth.role() = 'service_role');
create policy "kyc_profiles_modify_service" on kyc_profiles for all using (auth.role() = 'service_role');
create policy "developers_modify_service" on developers for all using (auth.role() = 'service_role');
create policy "clients_modify_service" on clients for all using (auth.role() = 'service_role');
create policy "projects_modify_service" on projects for all using (auth.role() = 'service_role');
create policy "rounds_modify_service" on rounds for all using (auth.role() = 'service_role');
create policy "reservations_modify_service" on reservations for all using (auth.role() = 'service_role');
create policy "transactions_modify_service" on transactions for all using (auth.role() = 'service_role');
create policy "research_modify_service" on research_items for all using (auth.role() = 'service_role');
create policy "price_points_modify_service" on price_points for all using (auth.role() = 'service_role');
create policy "listings_modify_service" on secondary_listings for all using (auth.role() = 'service_role');
create policy "trades_modify_service" on trades for all using (auth.role() = 'service_role');
create policy "documents_modify_service" on project_documents for all using (auth.role() = 'service_role');
create policy "communities_modify_service" on communities for all using (auth.role() = 'service_role');
create policy "automations_modify_service" on automation_workflows for all using (auth.role() = 'service_role');
create policy "agents_modify_service" on intelligent_agents for all using (auth.role() = 'service_role');

-- Seed default tenant ----------------------------------------------------
insert into tenants (id, slug, name, status, metadata)
values ('tenant_default', 'smart-presale', 'Smart Pre-Sale', 'active', '{"default": true}')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into tenant_settings (
  tenant_id,
  logo_url,
  dark_logo_url,
  square_logo_url,
  favicon_url,
  primary_color,
  primary_color_foreground,
  secondary_color,
  accent_color,
  background_color,
  surface_color,
  foreground_color,
  font_family,
  metadata
)
values (
  'tenant_default',
  null,
  null,
  null,
  null,
  '#1e3a8a',
  '#ffffff',
  '#10b981',
  '#f97316',
  '#f9fafb',
  '#ffffff',
  '#111827',
  'Inter',
  '{"default": true}'
)
on conflict (tenant_id) do update set
  logo_url = excluded.logo_url,
  dark_logo_url = excluded.dark_logo_url,
  square_logo_url = excluded.square_logo_url,
  favicon_url = excluded.favicon_url,
  primary_color = excluded.primary_color,
  primary_color_foreground = excluded.primary_color_foreground,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  background_color = excluded.background_color,
  surface_color = excluded.surface_color,
  foreground_color = excluded.foreground_color,
  font_family = excluded.font_family,
  metadata = excluded.metadata,
  updated_at = now();

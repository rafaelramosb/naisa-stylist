-- NAISA Stylist IA — esquema (aplicado en producción como migración separada)

create extension if not exists pgcrypto;

-- ─────────────────────────────── Configuración privada
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.config (
  key text primary key,
  value text not null
);
revoke all on private.config from public, anon, authenticated;

-- ─────────────────────────────── Perfiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  city text,
  gender_expression text not null default 'femenino'
    check (gender_expression in ('femenino','masculino','neutro')),
  style_profile jsonb not null default '{}'::jsonb,
  body_analysis jsonb,
  body_analyzed_at timestamptz,
  plan text not null default 'free' check (plan in ('free','premium')),
  plan_interval text check (plan_interval in ('monthly','yearly')),
  plan_renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "perfil: leer propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil: actualizar propio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Solo columnas no sensibles son editables por el usuario
revoke update on public.profiles from authenticated, anon;
grant update (full_name, city, gender_expression, style_profile, body_analysis, body_analyzed_at, updated_at)
  on public.profiles to authenticated;

-- ─────────────────────────────── Prendas (clóset)
create table public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  image_path text,
  name text not null,
  category text not null check (category in
    ('top','bottom','dress','outerwear','shoes','bag','accessory','jewelry','suit')),
  subcategory text,
  colors text[] not null default '{}',
  color_hex text[] not null default '{}',
  pattern text not null default 'liso',
  material text,
  fit text not null default 'regular' check (fit in ('ajustado','regular','holgado','estructurado','fluido')),
  formality smallint not null default 3 check (formality between 1 and 5),
  seasons text[] not null default '{}',
  style_tags text[] not null default '{}',
  silhouette_tags text[] not null default '{}',
  times_worn integer not null default 0,
  last_worn_at date,
  created_at timestamptz not null default now()
);
create index garments_user_idx on public.garments(user_id, created_at desc);

alter table public.garments enable row level security;
create policy "prendas: crud propio" on public.garments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ─────────────────────────────── Recomendaciones e historial
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  occasion text not null,
  context jsonb not null default '{}'::jsonb,
  result jsonb not null,
  engine text not null default 'claude',
  latency_ms integer,
  feedback smallint check (feedback in (-1, 1)),
  chosen_outfit smallint,
  worn_on date,
  created_at timestamptz not null default now()
);
create index recommendations_user_idx on public.recommendations(user_id, created_at desc);

alter table public.recommendations enable row level security;
create policy "recomendaciones: leer propias" on public.recommendations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "recomendaciones: crear propias" on public.recommendations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "recomendaciones: feedback propio" on public.recommendations
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recomendaciones: borrar propias" on public.recommendations
  for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.recommendations from authenticated, anon;
grant update (feedback, chosen_outfit, worn_on) on public.recommendations to authenticated;

-- ─────────────────────────────── Uso (cuotas freemium)
create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('recommendation','garment_scan','body_scan')),
  created_at timestamptz not null default now()
);
create index usage_user_kind_idx on public.usage_events(user_id, kind, created_at desc);
alter table public.usage_events enable row level security;
create policy "uso: leer propio" on public.usage_events
  for select to authenticated using (user_id = (select auth.uid()));
-- sin políticas de insert: solo vía consume_quota()

-- ─────────────────────────────── Suscripciones (Mercado Pago)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_id text not null unique,
  plan_interval text not null check (plan_interval in ('monthly','yearly')),
  status text not null,
  amount numeric(12,2),
  currency text default 'COP',
  next_payment_date timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "suscripciones: leer propias" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

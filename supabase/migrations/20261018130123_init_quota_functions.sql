-- NAISA Stylist IA — esquema (aplicado en producción como migración separada)

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Límites del plan gratis (por mes calendario, America/Bogota)
create or replace function public.plan_limits(p_plan text)
returns jsonb language sql immutable set search_path = '' as $$
  select case when p_plan = 'premium'
    then '{"recommendation": 100000, "garment_scan": 100000, "body_scan": 100000, "garments": 100000}'::jsonb
    else '{"recommendation": 5, "garment_scan": 25, "body_scan": 1, "garments": 30}'::jsonb
  end
$$;

create or replace function public.usage_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  v_plan text;
  month_start timestamptz := date_trunc('month', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  result jsonb;
begin
  if uid is null then raise exception 'no autenticado'; end if;
  select plan into v_plan from public.profiles where id = uid;
  select jsonb_build_object(
    'plan', coalesce(v_plan, 'free'),
    'limits', public.plan_limits(coalesce(v_plan, 'free')),
    'used', jsonb_build_object(
      'recommendation', (select count(*) from public.usage_events where user_id = uid and kind = 'recommendation' and created_at >= month_start),
      'garment_scan',   (select count(*) from public.usage_events where user_id = uid and kind = 'garment_scan' and created_at >= month_start),
      'body_scan',      (select count(*) from public.usage_events where user_id = uid and kind = 'body_scan' and created_at >= month_start),
      'garments',       (select count(*) from public.garments where user_id = uid)
    )
  ) into result;
  return result;
end $$;

-- Consume una unidad de cuota; devuelve false si se agotó
create or replace function public.consume_quota(p_kind text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  v_plan text;
  v_limit int;
  v_used int;
  month_start timestamptz := date_trunc('month', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
begin
  if uid is null then raise exception 'no autenticado'; end if;
  if p_kind not in ('recommendation','garment_scan','body_scan') then raise exception 'tipo inválido'; end if;
  select coalesce(plan, 'free') into v_plan from public.profiles where id = uid;
  v_limit := (public.plan_limits(coalesce(v_plan,'free')) ->> p_kind)::int;
  select count(*) into v_used from public.usage_events
    where user_id = uid and kind = p_kind and created_at >= month_start;
  if v_used >= v_limit then return false; end if;
  insert into public.usage_events(user_id, kind) values (uid, p_kind);
  return true;
end $$;

-- Límite de prendas en el plan gratis
create or replace function public.enforce_garment_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_plan text; v_count int;
begin
  select coalesce(plan,'free') into v_plan from public.profiles where id = new.user_id;
  select count(*) into v_count from public.garments where user_id = new.user_id;
  if v_count >= (public.plan_limits(v_plan) ->> 'garments')::int then
    raise exception 'LIMITE_PRENDAS' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger garments_limit before insert on public.garments
  for each row execute function public.enforce_garment_limit();

revoke execute on function public.consume_quota(text) from public, anon;
grant execute on function public.consume_quota(text) to authenticated;
revoke execute on function public.usage_summary() from public, anon;
grant execute on function public.usage_summary() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_garment_limit() from public, anon, authenticated;

-- NAISA Stylist IA — esquema (aplicado en producción como migración separada)

-- Aplicada por el webhook del servidor. Exige el secreto guardado en private.config.
create or replace function public.mp_apply_subscription(
  p_secret text, p_user_id uuid, p_provider_id text, p_interval text, p_status text,
  p_amount numeric, p_next_payment timestamptz, p_raw jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare v_expected text;
begin
  select value into v_expected from private.config where key = 'webhook_secret';
  if v_expected is null or p_secret is distinct from v_expected then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  insert into public.subscriptions(user_id, provider_id, plan_interval, status, amount, next_payment_date, raw, updated_at)
  values (p_user_id, p_provider_id, p_interval, p_status, p_amount, p_next_payment, p_raw, now())
  on conflict (provider_id) do update
    set status = excluded.status, amount = excluded.amount,
        next_payment_date = excluded.next_payment_date, raw = excluded.raw, updated_at = now();

  if p_status = 'authorized' then
    update public.profiles set plan = 'premium', plan_interval = p_interval,
      plan_renews_at = p_next_payment, updated_at = now() where id = p_user_id;
  elsif p_status in ('cancelled','paused') then
    -- solo baja a free si no queda otra suscripción activa
    if not exists (select 1 from public.subscriptions
                   where user_id = p_user_id and status = 'authorized' and provider_id <> p_provider_id) then
      update public.profiles set plan = 'free', plan_interval = null, plan_renews_at = null, updated_at = now()
        where id = p_user_id;
    end if;
  end if;
end $$;

-- ─────────────────────────────── Borrado de datos (derecho de supresión, Ley 1581/2012)
-- El usuario borra prendas y recomendaciones vía RLS; la cuenta de auth se elimina desde
-- /api/account/delete con SUPABASE_SERVICE_ROLE_KEY (auth.admin.deleteUser) y todo cae en cascada.

revoke execute on function public.mp_apply_subscription(text, uuid, text, text, text, numeric, timestamptz, jsonb) from public;
grant execute on function public.mp_apply_subscription(text, uuid, text, text, text, numeric, timestamptz, jsonb) to anon, authenticated;

-- Registro inmediato: crea la cuenta confirmada sin depender del envío de correos.
-- Solo lo puede usar el servidor de la app (exige el secreto de private.config).
create or replace function public.register_user(p_secret text, p_email text, p_password text, p_full_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_expected text;
  v_email text := lower(trim(p_email));
  v_id uuid := gen_random_uuid();
begin
  select value into v_expected from private.config where key = 'webhook_secret';
  if v_expected is null or p_secret is distinct from v_expected then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then return 'email_invalido'; end if;
  if length(coalesce(p_password, '')) < 8 or length(p_password) > 72 then return 'password_debil'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then return 'existe'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', left(coalesce(p_full_name, ''), 120)),
    now(), now(), '', '', '', '');

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());

  return 'ok';
end $$;

revoke execute on function public.register_user(text, text, text, text) from public;
grant execute on function public.register_user(text, text, text, text) to anon, authenticated;

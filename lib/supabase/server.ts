import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // llamado desde un Server Component: el middleware refresca la sesión
        }
      },
    },
  });
}

/** Cliente anónimo sin sesión (webhooks). */
export function createAnonClient() {
  return createAdmin(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente con service role (solo servidor). Devuelve null si no está configurado. */
export function createServiceClient() {
  // Clave de servicio del proyecto naisa-stylist (no la de la integración de Vercel)
  const key = process.env.NAISA_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createAdmin(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

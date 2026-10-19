import { aiEnabled } from "@/lib/claude";
import { mpEnabled } from "@/lib/mercadopago";
import { json } from "@/lib/http";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Diagnóstico rápido de la configuración de producción (sin exponer secretos).
export async function GET() {
  const url = SUPABASE_URL;
  const ref = /https:\/\/([a-z0-9]+)\.supabase\.co/.exec(url)?.[1] ?? null;
  let schema: "ok" | "faltante" | "error" = "error";
  try {
    const r = await fetch(`${url}/rest/v1/profiles?select=id&limit=0`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      cache: "no-store",
    });
    schema = r.ok ? "ok" : r.status === 404 ? "faltante" : "error";
  } catch {
    schema = "error";
  }
  return json({
    ok: schema === "ok",
    supabase_project: ref,
    schema,
    ai: aiEnabled() ? "claude" : "reglas",
    payments: mpEnabled() ? "mercadopago" : "no_configurado",
    subscription_secret: !!process.env.SUBSCRIPTION_APPLY_SECRET,
    time: new Date().toISOString(),
  }, schema === "ok" ? 200 : 503);
}

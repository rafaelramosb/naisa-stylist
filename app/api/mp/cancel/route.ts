import { fail, json } from "@/lib/http";
import { cancelSubscription } from "@/lib/mercadopago";
import { syncPreapproval } from "@/lib/subscriptions";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const { supabase, user } = await requireUser();
  if (!user) return fail("No autenticado", 401);
  const { data: sub } = await supabase.from("subscriptions").select("provider_id")
    .eq("user_id", user.id).eq("status", "authorized").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!sub) return fail("No tienes una suscripción activa", 404);
  try {
    await cancelSubscription(sub.provider_id);
    await syncPreapproval(sub.provider_id, user.id);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return fail("No pudimos cancelar. Intenta de nuevo o escríbenos.", 502);
  }
}

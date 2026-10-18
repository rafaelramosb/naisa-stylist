import { fail, json } from "@/lib/http";
import { mpEnabled } from "@/lib/mercadopago";
import { syncPreapproval } from "@/lib/subscriptions";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Al volver del checkout: confirma el estado sin esperar al webhook.
export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return fail("No autenticado", 401);
  if (!mpEnabled()) return fail("Pagos no configurados", 503);
  const { preapproval_id } = await req.json().catch(() => ({}));
  if (typeof preapproval_id !== "string" || !/^[\w-]{6,64}$/.test(preapproval_id)) return fail("Identificador inválido");
  try {
    const sub = await syncPreapproval(preapproval_id, user.id);
    if (!sub) return fail("La suscripción no corresponde a tu cuenta", 403);
    return json({ status: sub.status });
  } catch (e) {
    console.error(e);
    return fail("No pudimos confirmar el pago todavía", 502);
  }
}

import { createSubscription, mpEnabled } from "@/lib/mercadopago";
import { fail, json } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user?.email) return fail("Inicia sesión para suscribirte", 401);
  if (!mpEnabled()) return fail("Los pagos aún no están habilitados. Escríbenos para activar tu plan.", 503);

  const { interval } = await req.json().catch(() => ({}));
  if (interval !== "monthly" && interval !== "yearly") return fail("Plan inválido");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  try {
    const sub = await createSubscription({ userId: user.id, email: user.email, interval, siteUrl });
    return json({ init_point: sub.init_point, id: sub.id });
  } catch (e) {
    console.error(e);
    return fail("Mercado Pago no respondió. Intenta de nuevo en unos minutos.", 502);
  }
}

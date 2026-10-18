import { getAuthorizedPayment, verifySignature } from "@/lib/mercadopago";
import { syncPreapproval } from "@/lib/subscriptions";
import { json } from "@/lib/http";

export const runtime = "nodejs";

// Mercado Pago reintenta si no recibe 200/201; respondemos rápido y de forma idempotente.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const type = (body.type as string) ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = ((body.data as { id?: string })?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id"))?.toString() ?? null;

  if (!verifySignature({ signature: req.headers.get("x-signature"), requestId: req.headers.get("x-request-id"), dataId })) {
    return json({ ok: false, error: "firma inválida" }, 401);
  }
  if (!dataId) return json({ ok: true, ignored: true });

  try {
    if (type === "subscription_preapproval" || type === "preapproval") {
      await syncPreapproval(dataId);
    } else if (type === "subscription_authorized_payment") {
      const payment = await getAuthorizedPayment(dataId);
      if (payment.preapproval_id) await syncPreapproval(payment.preapproval_id);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("mp webhook", e);
    return json({ ok: false }, 500);
  }
}

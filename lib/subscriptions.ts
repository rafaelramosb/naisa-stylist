import { createAnonClient } from "./supabase/server";
import { getSubscription, type Preapproval } from "./mercadopago";
import { serverSecret } from "./server-secret";

/** Consulta la suscripción en Mercado Pago (fuente de verdad) y la aplica en la base. */
export async function syncPreapproval(id: string, expectedUserId?: string): Promise<Preapproval | null> {
  const sub = await getSubscription(id);
  const [userId, interval] = (sub.external_reference ?? "").split(":");
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return null;
  if (expectedUserId && expectedUserId !== userId) return null;
  const secret = serverSecret();
  if (!secret) throw new Error("SUBSCRIPTION_APPLY_SECRET no configurado");

  const { error } = await createAnonClient().rpc("mp_apply_subscription", {
    p_secret: secret,
    p_user_id: userId,
    p_provider_id: sub.id,
    p_interval: interval === "yearly" ? "yearly" : "monthly",
    p_status: sub.status,
    p_amount: sub.auto_recurring?.transaction_amount ?? null,
    p_next_payment: sub.next_payment_date ?? null,
    p_raw: sub as unknown as Record<string, unknown>,
  });
  if (error) throw new Error(`No se pudo aplicar la suscripción: ${error.message}`);
  return sub;
}

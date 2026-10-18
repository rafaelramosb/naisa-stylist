import crypto from "node:crypto";
import { PRICES } from "./plans";

const API = "https://api.mercadopago.com";

export const mpEnabled = () => !!process.env.MP_ACCESS_TOKEN;

async function mp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  return body as T;
}

export interface Preapproval {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  payer_email?: string;
  external_reference?: string;
  init_point?: string;
  next_payment_date?: string;
  auto_recurring?: { frequency: number; frequency_type: string; transaction_amount: number; currency_id: string };
}

/** Crea una suscripción (preapproval sin plan) y devuelve el checkout de Mercado Pago. */
export async function createSubscription(opts: { userId: string; email: string; interval: "monthly" | "yearly"; siteUrl: string }) {
  const amount = opts.interval === "monthly" ? PRICES.monthly : PRICES.yearly;
  return mp<Preapproval>("/preapproval", {
    method: "POST",
    headers: { "X-Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({
      reason: `NAISA Stylist IA Premium (${opts.interval === "monthly" ? "mensual" : "anual"})`,
      external_reference: `${opts.userId}:${opts.interval}`,
      payer_email: opts.email,
      back_url: `${opts.siteUrl}/app/plan?estado=retorno`,
      status: "pending",
      auto_recurring: {
        frequency: opts.interval === "monthly" ? 1 : 12,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "COP",
      },
    }),
  });
}

export const getSubscription = (id: string) => mp<Preapproval>(`/preapproval/${encodeURIComponent(id)}`);

export const cancelSubscription = (id: string) =>
  mp<Preapproval>(`/preapproval/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });

/**
 * Valida la cabecera x-signature de Mercado Pago:
 * ts=...,v1=HMAC_SHA256(secret, "id:{data.id};request-id:{x-request-id};ts:{ts};")
 */
export function verifySignature(opts: { signature: string | null; requestId: string | null; dataId: string | null }) {
  const secret = process.env.MP_WEBHOOK_SIGNING_SECRET;
  if (!secret) return true; // sin secreto configurado se valida consultando la API (ver webhook)
  if (!opts.signature) return false;
  const parts = Object.fromEntries(opts.signature.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  let manifest = "";
  if (opts.dataId) manifest += `id:${/^[a-z0-9]+$/i.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

export const getAuthorizedPayment = (id: string) =>
  mp<{ id: number; preapproval_id?: string; status?: string }>(`/authorized_payments/${encodeURIComponent(id)}`);

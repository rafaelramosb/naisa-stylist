import { z } from "zod";
import { fail, json } from "@/lib/http";
import { createAnonClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Registro inmediato: crea la cuenta ya confirmada, sin depender del envío de correos.
const Body = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72),
  name: z.string().max(120).optional(),
  consent: z.literal(true),
});

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return fail("Demasiados intentos. Espera unos minutos.", 429);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return fail(field === "password" ? "La contraseña debe tener al menos 8 caracteres." : field === "consent" ? "Debes aceptar la política de tratamiento de datos." : "Revisa el correo ingresado.");
  }
  const secret = process.env.SUBSCRIPTION_APPLY_SECRET;
  if (!secret) return fail("Registro no disponible en este momento.", 503);

  const { data, error } = await createAnonClient().rpc("register_user", {
    p_secret: secret, p_email: parsed.data.email, p_password: parsed.data.password, p_full_name: parsed.data.name ?? "",
  });
  if (error) { console.error("register_user", error); return fail("No pudimos crear la cuenta. Intenta de nuevo.", 500); }
  if (data === "existe") return fail("Ese correo ya tiene una cuenta. Inicia sesión o usa “¿Olvidaste tu contraseña?”.", 409, { exists: true });
  if (data === "email_invalido") return fail("Revisa el correo ingresado.");
  if (data === "password_debil") return fail("La contraseña debe tener al menos 8 caracteres.");
  return json({ ok: true });
}

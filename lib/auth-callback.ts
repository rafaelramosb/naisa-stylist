import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirmación de correo y enlaces mágicos.
 * - `token_hash` (plantilla recomendada): funciona aunque el correo se abra en otro dispositivo.
 * - `code` (PKCE): solo crea sesión en el mismo navegador; si falla, el correo ya quedó
 *   confirmado por Supabase, así que se invita a iniciar sesión en lugar de mostrar un error.
 */
export async function handleAuthRedirect(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/app";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (url.searchParams.get("error") || url.searchParams.get("error_description")) return to("/ingresar?error=enlace");

  const supabase = await createClient();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return error ? to("/ingresar?error=enlace") : to(safeNext);
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? to("/ingresar?confirmado=1") : to(safeNext);
  }
  return to("/ingresar");
}

// Traduce los errores de Supabase Auth a mensajes claros en español.
export type AuthIssue = { text: string; canResend?: boolean };

export function authErrorEs(err: unknown): AuthIssue {
  const e = err as { code?: string; message?: string; status?: number } | null;
  const code = e?.code ?? "";
  const msg = (e?.message ?? "").toLowerCase();

  if (code === "over_email_send_rate_limit" || msg.includes("email rate limit") || code === "over_request_rate_limit" || e?.status === 429)
    return { text: "Estamos recibiendo muchos registros en este momento y el envío de correos está en pausa. Intenta de nuevo en unos minutos." };
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return { text: "Aún no has confirmado tu correo. Revisa tu bandeja (y la carpeta de spam) o pide un nuevo enlace.", canResend: true };
  if (code === "user_already_exists" || msg.includes("already registered"))
    return { text: "Ese correo ya tiene una cuenta. Inicia sesión o recupera tu acceso con un enlace por correo." };
  if (code === "weak_password" || msg.includes("password should"))
    return { text: "La contraseña es muy débil: usa al menos 8 caracteres combinando letras y números." };
  if (code === "invalid_credentials" || msg.includes("invalid login"))
    return { text: "Correo o contraseña incorrectos." };
  if (code === "email_address_invalid" || msg.includes("invalid") && msg.includes("email"))
    return { text: "Ese correo no parece válido. Revísalo e intenta de nuevo." };
  if (code === "signup_disabled") return { text: "Los registros están cerrados temporalmente." };
  if (msg.includes("fetch") || msg.includes("network")) return { text: "Sin conexión. Revisa tu internet e intenta de nuevo." };
  return { text: e?.message || "Algo salió mal. Intenta de nuevo." };
}

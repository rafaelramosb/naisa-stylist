import crypto from "node:crypto";

/** Secreto compartido entre el servidor y la base (private.config). Tolera espacios accidentales. */
export function serverSecret(): string | null {
  const raw = process.env.NAISA_SERVER_SECRET ?? process.env.SUBSCRIPTION_APPLY_SECRET;
  const v = raw?.trim();
  return v ? v : null;
}

/** Huella pública (SHA-256) del secreto, para diagnosticar sin exponerlo. */
export function serverSecretFingerprint(): string | null {
  const s = serverSecret();
  return s ? crypto.createHash("sha256").update(s).digest("hex") : null;
}

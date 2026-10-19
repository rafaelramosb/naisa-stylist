"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";
import { authErrorEs } from "@/lib/auth-errors";

function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const initialMode = params.get("modo");
  const [mode, setMode] = useState<"login" | "registro" | "recuperar">(initialMode === "registro" || initialMode === "recuperar" ? initialMode : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const notice = params.get("confirmado") ? { kind: "ok" as const, text: "¡Correo confirmado! Ingresa con tu correo y contraseña." }
    : params.get("error") === "enlace" ? { kind: "err" as const, text: "El enlace de confirmación expiró o ya se usó. Ingresa o pide uno nuevo." } : null;
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(notice);
  const [canResend, setCanResend] = useState(params.get("error") === "enlace");
  const plan = params.get("plan");
  const next = params.get("next") ?? (plan ? `/app/plan?elegir=${plan}` : "/app");
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null); setCanResend(false);
    const supabase = createClient();
    try {
      if (mode === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/restablecer")}`,
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: `Si ${email} tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa también spam.` });
        return;
      }
      if (mode === "registro") {
        if (!consent) throw new Error("Debes aceptar la política de tratamiento de datos.");
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: redirectTo() },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg({ kind: "ok", text: `Te enviamos un correo a ${email} para confirmar tu cuenta. Si no llega en 2 minutos, revisa spam o reenvíalo.` });
          setCanResend(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      const issue = authErrorEs(err);
      setMsg({ kind: "err", text: issue.text });
      if (issue.canResend) setCanResend(true);
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    if (!email) { setMsg({ kind: "err", text: "Escribe tu correo primero." }); return; }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), shouldCreateUser: false } });
    setBusy(false);
    setMsg(error ? { kind: "err", text: authErrorEs(error).text } : { kind: "ok", text: "Revisa tu correo: te enviamos un enlace de acceso." });
  }

  async function resend() {
    if (!email) { setMsg({ kind: "err", text: "Escribe tu correo para reenviarte el enlace." }); return; }
    setBusy(true);
    const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    setMsg(error ? { kind: "err", text: authErrorEs(error).text } : { kind: "ok", text: `Listo, reenviamos el enlace a ${email}.` });
  }

  const TITLES = {
    login: ["Bienvenida de nuevo", "Entra para ver tu clóset y tus looks."],
    registro: ["Crea tu cuenta", "Gratis, sin tarjeta. Tu clóset digital en minutos."],
    recuperar: ["Recupera tu acceso", "Te enviaremos un enlace para crear una nueva contraseña."],
  } as const;
  const switchTo = (m: typeof mode) => { setMode(m); setMsg(null); setCanResend(false); };

  return (
    <form onSubmit={submit} className="card stack" style={{ width: "100%", maxWidth: 420 }}>
      <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
        <h2>{TITLES[mode][0]}</h2>
        <p className="muted small">{TITLES[mode][1]}</p>
      </div>
      {mode === "registro" && (
        <label>Nombre<input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
      )}
      <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
      {mode !== "recuperar" && (
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete={mode === "registro" ? "new-password" : "current-password"} required /></label>
      )}
      {mode === "login" && (
        <button type="button" className="link small" style={{ alignSelf: "flex-end", marginTop: -6 }} onClick={() => switchTo("recuperar")}>¿Olvidaste tu contraseña?</button>
      )}
      {mode === "registro" && (
        <label style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 4 }} />
          <span className="small">Autorizo el tratamiento de mis datos e imágenes según la <Link href="/privacidad" className="link">política de privacidad</Link> (Ley 1581 de 2012).</span>
        </label>
      )}
      {msg && <div className={`alert ${msg.kind === "ok" ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
      {canResend && <button type="button" className="btn btn-ghost btn-block" onClick={resend} disabled={busy}>Reenviar correo de confirmación</button>}
      <button className="btn btn-block" disabled={busy}>
        {busy ? <span className="spin" /> : mode === "registro" ? "Crear cuenta gratis" : mode === "recuperar" ? "Enviar enlace" : "Entrar"}
      </button>
      {mode === "login" && <button type="button" className="btn btn-ghost btn-block" onClick={magicLink} disabled={busy}>Entrar sin contraseña (enlace por correo)</button>}
      <p className="small muted" style={{ textAlign: "center" }}>
        {mode === "registro" ? "¿Ya tienes cuenta? " : mode === "recuperar" ? "¿La recordaste? " : "¿Primera vez? "}
        <button type="button" className="link" onClick={() => switchTo(mode === "login" ? "registro" : "login")}>
          {mode === "login" ? "Crea tu cuenta" : "Entra aquí"}
        </button>
      </p>
    </form>
  );
}

export default function Page() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "32px 16px", background: "linear-gradient(160deg, var(--ivory), var(--champagne))" }}>
      <div className="stack" style={{ alignItems: "center", width: "100%", "--gap": "24px" } as React.CSSProperties}>
        <Brand />
        <Suspense fallback={<div className="card skeleton" style={{ width: 420, height: 420 }} />}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}

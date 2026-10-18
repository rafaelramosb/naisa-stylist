"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "registro">(params.get("modo") === "registro" ? "registro" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const plan = params.get("plan");
  const next = params.get("next") ?? (plan ? `/app/plan?elegir=${plan}` : "/app");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "registro") {
        if (!consent) throw new Error("Debes aceptar la política de tratamiento de datos.");
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg({ kind: "ok", text: "Te enviamos un correo para confirmar tu cuenta. Ábrelo desde este dispositivo." });
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Correo o contraseña incorrectos.");
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Algo salió mal" });
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    if (!email) { setMsg({ kind: "err", text: "Escribe tu correo primero." }); return; }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    setBusy(false);
    setMsg(error ? { kind: "err", text: error.message } : { kind: "ok", text: "Revisa tu correo: te enviamos un enlace de acceso." });
  }

  return (
    <form onSubmit={submit} className="card stack" style={{ width: "100%", maxWidth: 420 }}>
      <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
        <h2>{mode === "registro" ? "Crea tu cuenta" : "Bienvenida de nuevo"}</h2>
        <p className="muted small">{mode === "registro" ? "Gratis, sin tarjeta. Tu clóset digital en minutos." : "Entra para ver tu clóset y tus looks."}</p>
      </div>
      {mode === "registro" && (
        <label>Nombre<input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
      )}
      <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete={mode === "registro" ? "new-password" : "current-password"} required /></label>
      {mode === "registro" && (
        <label style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 4 }} />
          <span className="small">Autorizo el tratamiento de mis datos e imágenes según la <Link href="/privacidad" className="link">política de privacidad</Link> (Ley 1581 de 2012).</span>
        </label>
      )}
      {msg && <div className={`alert ${msg.kind === "ok" ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
      <button className="btn btn-block" disabled={busy}>{busy ? <span className="spin" /> : mode === "registro" ? "Crear cuenta gratis" : "Entrar"}</button>
      {mode === "login" && <button type="button" className="btn btn-ghost btn-block" onClick={magicLink} disabled={busy}>Recibir enlace por correo</button>}
      <p className="small muted" style={{ textAlign: "center" }}>
        {mode === "registro" ? "¿Ya tienes cuenta? " : "¿Primera vez? "}
        <button type="button" className="link" onClick={() => { setMode(mode === "registro" ? "login" : "registro"); setMsg(null); }}>
          {mode === "registro" ? "Entra aquí" : "Crea tu cuenta"}
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

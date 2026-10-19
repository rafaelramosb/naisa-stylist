"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { authErrorEs } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

export default function Restablecer() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState<"cargando" | "ok" | "sin-sesion">("cargando");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setReady(data.user ? "ok" : "sin-sesion"));
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setMsg({ kind: "err", text: "Usa al menos 8 caracteres." }); return; }
    if (pw !== pw2) { setMsg({ kind: "err", text: "Las contraseñas no coinciden." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: error.code === "same_password" ? "La nueva contraseña debe ser distinta a la anterior." : authErrorEs(error).text });
      return;
    }
    setMsg({ kind: "ok", text: "Contraseña actualizada. Te llevamos a tu clóset…" });
    setTimeout(() => { router.replace("/app"); router.refresh(); }, 1200);
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "32px 16px", background: "linear-gradient(160deg, var(--ivory), var(--champagne))" }}>
      <div className="stack" style={{ alignItems: "center", width: "100%", "--gap": "24px" } as React.CSSProperties}>
        <Brand />
        <div className="card stack" style={{ width: "100%", maxWidth: 420 }}>
          <h2>Nueva contraseña</h2>
          {ready === "cargando" && <div className="skeleton" style={{ height: 120 }} />}
          {ready === "sin-sesion" && (
            <>
              <div className="alert alert-err">El enlace expiró o se abrió en otro navegador. Pide uno nuevo.</div>
              <Link href="/ingresar?modo=recuperar" className="btn btn-block">Pedir un enlace nuevo</Link>
            </>
          )}
          {ready === "ok" && (
            <form onSubmit={submit} className="stack">
              <label>Nueva contraseña<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} autoComplete="new-password" required /></label>
              <label>Repítela<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} autoComplete="new-password" required /></label>
              {msg && <div className={`alert ${msg.kind === "ok" ? "alert-ok" : "alert-err"}`} role="status">{msg.text}</div>}
              <button className="btn btn-block" disabled={busy}>{busy ? <span className="spin" /> : "Guardar contraseña"}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

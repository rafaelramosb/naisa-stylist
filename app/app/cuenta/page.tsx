"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export default function Cuenta() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function del() {
    setBusy(true);
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    const b = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(b.error); return; }
    setMsg(b.accountDeleted ? "Tu cuenta y todos tus datos fueron eliminados." : "Tus fotos y datos fueron eliminados. La cuenta de acceso se cerrará en 24 horas.");
    setTimeout(() => router.replace("/"), 2500);
  }

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <span className="eyebrow">Cuenta y privacidad</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Tus datos, bajo tu control</h1>
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <h3>Cómo protegemos tu información</h3>
          <ul className="check small">
            <li>Fotos en almacenamiento privado con acceso por fila (RLS): nadie más puede leerlas.</li>
            <li>Las imágenes se ven con enlaces temporales que vencen en 1 hora.</li>
            <li>La foto de cuerpo completo no se guarda salvo que lo autorices.</li>
            <li>Las fotos se envían a la IA solo para analizarlas; no se usan para entrenar modelos.</li>
            <li>Conexión cifrada (HTTPS/TLS) y cabeceras de seguridad estrictas.</li>
          </ul>
          <Link href="/privacidad" className="link small">Política de tratamiento de datos</Link>
        </div>
        <div className="card stack">
          <h3>Descargar mis datos</h3>
          <p className="small muted">Un archivo JSON con tu perfil, prendas, recomendaciones y suscripciones.</p>
          <a href="/api/account/export" className="btn btn-ghost" style={{ alignSelf: "flex-start" }}><Icon name="download" size={18} /> Exportar</a>
          <hr className="divider" />
          <form action="/auth/signout" method="post"><button className="btn btn-ghost"><Icon name="logout" size={18} /> Cerrar sesión</button></form>
        </div>
      </div>

      <div className="card stack" style={{ borderColor: "#e9c7c7" }}>
        <h3>Eliminar mi cuenta</h3>
        <p className="small muted">Borra de forma permanente tus fotos, prendas, análisis e historial. Si tienes Premium, cancélalo antes en Plan.</p>
        <label>Escribe ELIMINAR para confirmar<input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        <button className="btn" style={{ background: "var(--danger)", alignSelf: "flex-start" }} disabled={confirm !== "ELIMINAR" || busy} onClick={del}>
          {busy ? <span className="spin" /> : <Icon name="trash" size={18} />} Eliminar definitivamente
        </button>
        {msg && <div className="alert alert-warn">{msg}</div>}
      </div>
    </div>
  );
}

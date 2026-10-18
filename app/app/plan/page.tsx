"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PLAN_FEATURES, PRICES, formatCOP } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

interface Usage { plan: string; limits: Record<string, number>; used: Record<string, number> }

function Plan() {
  const params = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [usage, setUsage] = useState<Usage | null>(null);
  const [renews, setRenews] = useState<string | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "warn"; text: string } | null>(null);

  const load = useCallback(async () => {
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase.rpc("usage_summary"),
      supabase.from("profiles").select("plan_renews_at").single(),
    ]);
    setUsage(u as Usage);
    setRenews(p?.plan_renews_at ?? null);
  }, [supabase]);

  useEffect(() => {
    load();
    const preapproval = params.get("preapproval_id");
    if (preapproval) {
      setMsg({ kind: "warn", text: "Confirmando tu pago con Mercado Pago…" });
      fetch("/api/mp/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preapproval_id: preapproval }) })
        .then((r) => r.json())
        .then((b) => {
          setMsg(b.status === "authorized" ? { kind: "ok", text: "¡Bienvenida a Premium! Ya tienes todo desbloqueado." }
            : { kind: "warn", text: "Tu pago está en proceso. Te avisaremos cuando se confirme." });
          load();
        });
    }
  }, [params, load]);

  async function subscribe(interval: "monthly" | "yearly") {
    setBusy(interval); setMsg(null);
    const r = await fetch("/api/mp/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interval }) });
    const b = await r.json();
    setBusy("");
    if (!r.ok || !b.init_point) { setMsg({ kind: "err", text: b.error ?? "No se pudo iniciar el pago" }); return; }
    window.location.href = b.init_point;
  }

  async function cancel() {
    if (!confirm("¿Cancelar tu suscripción Premium? Mantendrás tu clóset; volverás a los límites del plan gratis.")) return;
    setBusy("cancel");
    const r = await fetch("/api/mp/cancel", { method: "POST" });
    const b = await r.json();
    setBusy("");
    setMsg(r.ok ? { kind: "ok", text: "Suscripción cancelada." } : { kind: "err", text: b.error });
    load();
  }

  const premium = usage?.plan === "premium";
  const savings = Math.round((1 - PRICES.yearly / (PRICES.monthly * 12)) * 100);
  const highlight = params.get("elegir");

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <span className="eyebrow">Tu plan</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>{premium ? "Eres Premium" : "Desbloquea tu estilista sin límites"}</h1>
        {premium && renews && <p className="muted">Próxima renovación: {new Date(renews).toLocaleDateString("es-CO", { dateStyle: "long" })}</p>}
      </div>

      {msg && <div className={`alert ${msg.kind === "ok" ? "alert-ok" : msg.kind === "warn" ? "alert-warn" : "alert-err"}`} role="status">{msg.text}</div>}

      {!premium && (
        <div className="grid grid-2">
          <div className={`card price-card stack ${highlight !== "monthly" ? "featured" : ""}`}>
            <span className="pill pill-gold" style={{ alignSelf: "flex-start" }}>Ahorra {savings}%</span>
            <h3>Premium anual</h3>
            <div className="price">{formatCOP(PRICES.yearly)}<span className="small muted"> /año</span></div>
            <p className="small muted">{formatCOP(Math.round(PRICES.yearly / 12))} al mes</p>
            <button className="btn btn-gold btn-block" onClick={() => subscribe("yearly")} disabled={!!busy}>{busy === "yearly" ? <span className="spin" /> : "Suscribirme anual"}</button>
          </div>
          <div className={`card price-card stack ${highlight === "monthly" ? "featured" : ""}`}>
            <h3>Premium mensual</h3>
            <div className="price">{formatCOP(PRICES.monthly)}<span className="small muted"> /mes</span></div>
            <p className="small muted">Cancela cuando quieras</p>
            <button className="btn btn-block" onClick={() => subscribe("monthly")} disabled={!!busy}>{busy === "monthly" ? <span className="spin" /> : "Suscribirme mensual"}</button>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card stack"><h3>Esencial (gratis)</h3><ul className="check small">{PLAN_FEATURES.free.map((f) => <li key={f}>{f}</li>)}</ul></div>
        <div className="card stack"><h3>Premium</h3><ul className="check small">{PLAN_FEATURES.premium.map((f) => <li key={f}>{f}</li>)}</ul></div>
      </div>

      {usage && !premium && (
        <div className="card stack">
          <h3>Tu uso este mes</h3>
          {[["Recomendaciones", "recommendation"], ["Escaneos de prendas", "garment_scan"], ["Análisis de silueta", "body_scan"], ["Prendas", "garments"]].map(([l, k]) => (
            <div key={k} className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
              <div className="row between small"><span>{l}</span><span className="muted">{usage.used[k]} / {usage.limits[k]}</span></div>
              <div className="meter"><div style={{ width: `${Math.min(100, (usage.used[k] / usage.limits[k]) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <p className="small muted row" style={{ "--gap": "6px" } as React.CSSProperties}><Icon name="shield" size={16} /> Pagos procesados por Mercado Pago. NAISA nunca ve ni guarda los datos de tu tarjeta.</p>
      {premium && <button className="link small" style={{ alignSelf: "flex-start" }} onClick={cancel} disabled={busy === "cancel"}>Cancelar suscripción</button>}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="skeleton" style={{ height: 300 }} />}><Plan /></Suspense>;
}

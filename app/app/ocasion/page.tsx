"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { OutfitCard } from "@/components/OutfitCard";
import { OCCASIONS, OCCASION_GROUPS, OCCASION_MAP } from "@/lib/occasions";
import { createClient } from "@/lib/supabase/client";
import type { Garment, OccasionContext, OccasionId, RecommendationResult } from "@/lib/types";
import { useSignedUrls } from "@/lib/use-signed-urls";

type Response = RecommendationResult & { id?: string; premium: boolean; shopping_locked: boolean; shopping_count: number };

function Wizard() {
  const params = useSearchParams();
  const [supabase] = useState(() => createClient());
  const initial = params.get("o") as OccasionId | null;
  const [ctx, setCtx] = useState<OccasionContext>({ occasion: initial && OCCASION_MAP[initial] ? initial : "entrevista" });
  const [step, setStep] = useState<1 | 2 | 3>(initial ? 2 : 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ text: string; upgrade?: boolean } | null>(null);
  const [res, setRes] = useState<Response | null>(null);
  const [closet, setCloset] = useState<Garment[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { supabase.from("garments").select("*").then(({ data }) => setCloset((data ?? []) as Garment[])); }, [supabase]);
  const byId = useMemo(() => new Map(closet.map((g) => [g.id, g])), [closet]);
  const usedPaths = res?.outfits.flatMap((o) => o.pieces.map((p) => (p.garment_id ? byId.get(p.garment_id)?.image_path : null))) ?? [];
  const urls = useSignedUrls(usedPaths);
  const occ = OCCASION_MAP[ctx.occasion];
  const isWedding = ctx.occasion.startsWith("boda");

  async function run() {
    setBusy(true); setErr(null); setRes(null); setChosen(null); setFeedback(null);
    const t0 = performance.now();
    const timer = setInterval(() => setElapsed((performance.now() - t0) / 1000), 100);
    try {
      const r = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ctx) });
      const body = await r.json();
      if (!r.ok) { setErr({ text: body.error, upgrade: body.upgrade }); return; }
      setRes(body); setStep(3);
      setElapsed((performance.now() - t0) / 1000);
    } catch {
      setErr({ text: "Sin conexión. Intenta de nuevo." });
    } finally {
      clearInterval(timer); setBusy(false);
    }
  }

  async function choose(i: number) {
    if (!res?.id) return;
    setChosen(i);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("recommendations").update({ chosen_outfit: i, worn_on: today }).eq("id", res.id);
    const ids = res.outfits[i].pieces.map((p) => p.garment_id).filter(Boolean) as string[];
    await Promise.all(ids.map((id) => {
      const g = byId.get(id);
      return supabase.from("garments").update({ times_worn: (g?.times_worn ?? 0) + 1, last_worn_at: today }).eq("id", id);
    }));
  }

  async function rate(v: 1 | -1) {
    if (!res?.id) return;
    setFeedback(v);
    await supabase.from("recommendations").update({ feedback: v }).eq("id", res.id);
  }

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <span className="eyebrow">Recomendación por ocasión</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>{step === 1 ? "¿Para qué ocasión te vistes?" : occ.label}</h1>
        {step > 1 && <p className="muted">{occ.dressCode} · {occ.description} <button className="link" onClick={() => { setStep(1); setRes(null); }}>Cambiar</button></p>}
      </div>

      {closet.length < 3 && (
        <div className="alert alert-warn">Tienes {closet.length} prenda(s). Con pocas prendas te sugeriremos piezas complementarias. <Link className="link" href="/app/closet">Escanear más</Link></div>
      )}

      {step === 1 && OCCASION_GROUPS.map((group) => (
        <section key={group} className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
          <h3 style={{ fontSize: "1.2rem" }}>{group}</h3>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", "--gap": "10px" } as React.CSSProperties}>
            {OCCASIONS.filter((o) => o.group === group).map((o) => (
              <button key={o.id} className="card row" style={{ cursor: "pointer", textAlign: "left", padding: 14, flexWrap: "nowrap" }}
                onClick={() => { setCtx({ occasion: o.id }); setStep(2); }}>
                <span className="feature-icon"><Icon name={o.icon} /></span>
                <span className="stack" style={{ "--gap": "2px" } as React.CSSProperties}><strong style={{ fontWeight: 500 }}>{o.label}</strong><span className="tiny muted">{o.dressCode}</span></span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {step >= 2 && (
        <div className="card stack">
          <div className="grid grid-3">
            {isWedding && (
              <label>Tu rol
                <select value={ctx.role ?? "invitada"} onChange={(e) => setCtx({ ...ctx, role: e.target.value as OccasionContext["role"] })}>
                  <option value="invitada">Invitada / invitado</option>
                  <option value="madrina">Madrina / padrino (Premium)</option>
                  <option value="novia">Novia / novio (Premium)</option>
                </select>
              </label>
            )}
            {ctx.occasion === "entrevista" && (
              <label>Sector
                <select value={ctx.industry ?? ""} onChange={(e) => setCtx({ ...ctx, industry: (e.target.value || undefined) as OccasionContext["industry"] })}>
                  <option value="">Sin especificar</option><option value="corporativa">Corporativo / banca</option><option value="creativa">Creativo / moda</option>
                  <option value="tecnologia">Tecnología / startup</option><option value="salud">Salud</option><option value="gobierno">Sector público</option>
                </select>
              </label>
            )}
            {(ctx.occasion === "reunion_formal" || ctx.occasion === "evento_gala") && (
              <label>Tu rol
                <select value={ctx.role ?? ""} onChange={(e) => setCtx({ ...ctx, role: (e.target.value || undefined) as OccasionContext["role"] })}>
                  <option value="">Asistente</option><option value="anfitriona">Anfitriona / anfitrión</option><option value="ponente">Ponente (Premium)</option>
                </select>
              </label>
            )}
            <label>Clima
              <select value={ctx.climate ?? ""} onChange={(e) => setCtx({ ...ctx, climate: (e.target.value || undefined) as OccasionContext["climate"] })}>
                <option value="">Sin especificar</option><option value="calido">Cálido (Cartagena, Cali)</option><option value="templado">Templado (Medellín)</option><option value="frio">Frío (Bogotá)</option>
              </select>
            </label>
            <label>Momento del día
              <select value={ctx.time ?? ""} onChange={(e) => setCtx({ ...ctx, time: (e.target.value || undefined) as OccasionContext["time"] })}>
                <option value="">Sin especificar</option><option value="manana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option>
              </select>
            </label>
          </div>
          <label>Detalles (opcional)
            <textarea rows={2} maxLength={500} placeholder="Ej. Boda en hacienda, ceremonia al aire libre; quiero algo cómodo para bailar." value={ctx.notes ?? ""} onChange={(e) => setCtx({ ...ctx, notes: e.target.value || undefined })} />
          </label>
          <div className="row">
            <button className="btn btn-gold" onClick={run} disabled={busy}>
              {busy ? <><span className="spin" /> Creando tus looks… {elapsed.toFixed(1)} s</> : <><Icon name="sparkle" size={18} /> {res ? "Generar de nuevo" : "Ver mis 3 outfits"}</>}
            </button>
            <span className="tiny muted">Respuesta en menos de 5 segundos</span>
          </div>
          {err && <div className="alert alert-err">{err.text} {err.upgrade && <Link className="link" href="/app/plan">Desbloquear Premium</Link>}</div>}
        </div>
      )}

      {busy && <div className="grid grid-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 420 }} />)}</div>}

      {res && !busy && (
        <>
          <div className="row between">
            <span className="row small muted" style={{ "--gap": "8px" } as React.CSSProperties}>
              <span className="pill pill-sage"><Icon name="bolt" size={14} /> {(res.latency_ms / 1000).toFixed(1)} s</span>
              <span className="pill">{res.engine === "claude" ? "IA + verificación de protocolo" : "Motor de protocolo"}</span>
            </span>
            <span className="row small" style={{ "--gap": "6px" } as React.CSSProperties}>
              ¿Te sirvió?
              <button className="chip" aria-pressed={feedback === 1} onClick={() => rate(1)} aria-label="Me sirvió"><Icon name="thumbup" size={16} /></button>
              <button className="chip" aria-pressed={feedback === -1} onClick={() => rate(-1)} aria-label="No me sirvió"><Icon name="thumbdown" size={16} /></button>
            </span>
          </div>

          <div className="grid grid-3" style={{ alignItems: "start" }}>
            {res.outfits.map((o, i) => <OutfitCard key={i} outfit={o} index={i} garments={byId} urls={urls} chosen={chosen === i} onChoose={() => choose(i)} />)}
          </div>

          <div className="grid grid-2" style={{ alignItems: "start" }}>
            <div className="card stack">
              <h3>Protocolo de {occ.label.toLowerCase()}</h3>
              <ul className="check small">{res.protocol_summary.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <div className="card stack">
              <h3>Para ti</h3>
              <ul className="check small">{res.personal_tips.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          </div>

          {(res.shopping.length > 0 || res.shopping_locked) && (
            <div className="card stack">
              <div className="row between"><h3>Completa tu clóset</h3>{res.insufficient_wardrobe && <span className="pill pill-gold">Te faltan piezas clave</span>}</div>
              {res.shopping_locked ? (
                <div className="card-soft row between">
                  <span className="small">Encontramos {res.shopping_count} pieza(s) que elevarían estos looks. Las sugerencias de compra exactas son Premium.</span>
                  <Link href="/app/plan" className="btn btn-gold btn-sm"><Icon name="crown" size={16} /> Ver sugerencias</Link>
                </div>
              ) : (
                <div className="grid grid-3">
                  {res.shopping.map((s) => (
                    <div key={s.name} className="card-soft stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                      <div className="row between"><strong style={{ fontWeight: 500 }}>{s.name}</strong><span className={`pill ${s.priority === "alta" ? "pill-mauve" : ""}`}>{s.priority}</span></div>
                      <span className="small muted">{s.why}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="skeleton" style={{ height: 300 }} />}><Wizard /></Suspense>;
}

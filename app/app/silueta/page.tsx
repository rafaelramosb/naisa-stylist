"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { fileToResizedDataUrl } from "@/lib/image-client";
import { createClient } from "@/lib/supabase/client";
import type { BodyAnalysis, BodyShape } from "@/lib/types";

const SHAPES: { id: BodyShape; label: string; hint: string; path: string }[] = [
  { id: "reloj_de_arena", label: "Reloj de arena", hint: "Hombros y caderas similares, cintura marcada", path: "M14 4h12l-4 16 4 16H14l4-16z" },
  { id: "triangulo", label: "Triángulo (pera)", hint: "Caderas más anchas que hombros", path: "M16 4h8l2 16 6 16H8l6-16z" },
  { id: "triangulo_invertido", label: "Triángulo invertido", hint: "Hombros más anchos que caderas", path: "M8 4h24l-6 16-2 16h-8l-2-16z" },
  { id: "rectangulo", label: "Rectángulo", hint: "Hombros, cintura y caderas alineados", path: "M12 4h16l-1 16 1 16H12l1-16z" },
  { id: "ovalo", label: "Óvalo", hint: "Volumen en la zona media", path: "M14 4h12c6 8 6 24 0 32H14c-6-8-6-24 0-32z" },
];

const PROPORTION_LABEL: Record<string, string> = {
  mas_anchos: "Hombros más anchos que caderas", equilibrados: "Hombros y caderas equilibrados", mas_estrechos: "Hombros más estrechos que caderas",
  torso_largo: "Torso largo", equilibrado: "Torso y piernas equilibrados", piernas_largas: "Piernas largas",
  marcada: "Cintura marcada", media: "Cintura media", poco_marcada: "Cintura poco marcada",
  petite: "Estatura petite", alta: "Estatura alta",
};

export default function SiluetaPage() {
  const [supabase] = useState(() => createClient());
  const [analysis, setAnalysis] = useState<BodyAnalysis | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [store, setStore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ text: string; upgrade?: boolean } | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("profiles").select("body_analysis").single().then(({ data }) => setAnalysis((data?.body_analysis as BodyAnalysis) ?? null));
  }, [supabase]);

  async function analyze(file?: File) {
    if (!file) return;
    setErr(null); setBusy(true);
    try {
      const image = await fileToResizedDataUrl(file, 1280);
      setPreview(image);
      const t0 = performance.now();
      const res = await fetch("/api/body/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, store }) });
      const body = await res.json();
      if (!res.ok) { setErr({ text: body.error, upgrade: body.upgrade }); return; }
      setAnalysis(body.analysis);
      setElapsed((performance.now() - t0) / 1000);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
      if (!store) setTimeout(() => setPreview(null), 400); // la foto no permanece en pantalla ni en memoria
    }
  }

  async function manual(shape: BodyShape) {
    setBusy(true); setErr(null);
    const res = await fetch("/api/body/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manualShape: shape }) });
    const body = await res.json();
    setBusy(false);
    if (res.ok) setAnalysis(body.analysis); else setErr({ text: body.error });
  }

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <span className="eyebrow">Silueta y proporciones</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Conoce lo que te favorece</h1>
        <p className="muted">Usamos tu silueta para ponderar cada outfit. Hablamos de proporciones, nunca de peso.</p>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card stack">
          <h3>Foto de cuerpo completo</h3>
          <ul className="check small">
            <li>De frente, de pies a cabeza, con ropa ajustada o ligera.</li>
            <li>Luz pareja y fondo despejado; brazos ligeramente separados.</li>
            <li>Se reduce en tu teléfono y no se guarda salvo que lo elijas.</li>
          </ul>
          <label style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <input type="checkbox" checked={store} onChange={(e) => setStore(e.target.checked)} />
            <span className="small">Guardar la foto en mi cuenta privada (opcional)</span>
          </label>
          <input ref={ref} type="file" accept="image/*" capture="user" hidden onChange={(e) => analyze(e.target.files?.[0])} />
          <button className="btn" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <><span className="spin" /> Analizando…</> : <><Icon name="camera" size={18} /> Tomar o subir foto</>}
          </button>
          {preview && busy && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" style={{ maxHeight: 220, objectFit: "contain", borderRadius: 12 }} />
          )}
          {err && <div className="alert alert-err">{err.text} {err.upgrade && <Link className="link" href="/app/plan">Ver Premium</Link>}</div>}
        </div>

        <div className="card stack">
          <h3>¿Prefieres elegirla tú?</h3>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", "--gap": "10px" } as React.CSSProperties}>
            {SHAPES.map((s) => (
              <button key={s.id} className="chip" style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left", borderRadius: 14, padding: 10 }}
                aria-pressed={analysis?.shape === s.id} onClick={() => manual(s.id)} disabled={busy}>
                <svg width="28" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d={s.path} fill="currentColor" opacity=".7" /></svg>
                <span className="stack" style={{ "--gap": "2px" } as React.CSSProperties}><strong style={{ fontWeight: 500, fontSize: ".85rem" }}>{s.label}</strong><span className="tiny" style={{ opacity: .75 }}>{s.hint}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="card stack fade-in">
          <div className="row between">
            <div className="stack" style={{ "--gap": "2px" } as React.CSSProperties}>
              <span className="eyebrow">Tu silueta</span>
              <h2>{analysis.shape_label}</h2>
            </div>
            <div className="row">
              {analysis.advanced ? <span className="pill pill-gold">Análisis avanzado</span> : <span className="pill">Análisis básico</span>}
              {elapsed && <span className="pill pill-sage">{elapsed.toFixed(1)} s</span>}
            </div>
          </div>
          {analysis.proportions && (
            <div className="chips">
              {Object.values(analysis.proportions).filter(Boolean).map((v) => <span key={v} className="pill pill-mauve">{PROPORTION_LABEL[v as string] ?? v}</span>)}
            </div>
          )}
          {analysis.notes && <p>{analysis.notes}</p>}
          <div className="grid grid-3">
            <div className="stack"><strong style={{ fontWeight: 500 }}>Objetivos</strong><ul className="check small">{analysis.goals.map((g) => <li key={g}>{g}</li>)}</ul></div>
            <div className="stack"><strong style={{ fontWeight: 500 }}>Te favorece</strong><div className="chips">{analysis.favor.map((f) => <span key={f} className="pill pill-sage">{f}</span>)}</div></div>
            <div className="stack"><strong style={{ fontWeight: 500 }}>Mejor evitar</strong><div className="chips">{analysis.avoid.map((f) => <span key={f} className="pill">{f}</span>)}</div></div>
          </div>
          {!analysis.advanced && <p className="small muted">El análisis avanzado de proporciones (hombros, torso, piernas y cintura) está incluido en <Link href="/app/plan" className="link">Premium</Link>.</p>}
          <Link href="/app/ocasion" className="btn btn-gold" style={{ alignSelf: "flex-start" }}><Icon name="sparkle" size={18} /> Ver outfits para mi silueta</Link>
        </div>
      )}
    </div>
  );
}

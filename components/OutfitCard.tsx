"use client";
import { GarmentArt } from "./GarmentArt";
import { Icon } from "./Icon";
import { ScoreRing } from "./ScoreRing";
import { COLOR_NAMES } from "@/lib/color";
import type { Garment, Outfit } from "@/lib/types";

const BARS: [keyof Outfit["score"], string][] = [
  ["protocol", "Protocolo"], ["color", "Color"], ["silhouette", "Silueta"], ["style", "Estilo"],
];

export function OutfitCard({ outfit, index, garments, urls, onChoose, chosen }: {
  outfit: Outfit; index: number; garments: Map<string, Garment>; urls: Record<string, string>;
  onChoose?: () => void; chosen?: boolean;
}) {
  const recommended = outfit.score.total >= 85;
  return (
    <article className="card outfit fade-in" style={{ animationDelay: `${index * 80}ms`, borderColor: chosen ? "var(--gold)" : undefined }}>
      <div className="row between" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
        <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
          <span className="eyebrow">Opción {index + 1}</span>
          <h3>{outfit.title}</h3>
          {recommended ? <span className="pill pill-sage" style={{ alignSelf: "flex-start" }}><Icon name="check" size={14} /> Recomendado</span>
            : <span className="pill" style={{ alignSelf: "flex-start" }}>Alternativa</span>}
        </div>
        <ScoreRing value={outfit.score.total} />
      </div>

      <div className="outfit-board">
        {outfit.pieces.slice(0, 6).map((p, i) => {
          if (p.garment_id) {
            const g = garments.get(p.garment_id);
            if (!g) return null;
            return (
              <div key={i} className="piece">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {g.image_path && urls[g.image_path] ? <img src={urls[g.image_path]} alt={g.name} /> : <GarmentArt category={g.category} color={g.color_hex[0] ?? COLOR_NAMES[g.colors[0]]} />}
                <span className="piece-label">{g.name}</span>
              </div>
            );
          }
          const m = p.missing!;
          return (
            <div key={i} className="piece missing" title={m.why}>
              <GarmentArt category={m.category} color={m.color ? COLOR_NAMES[m.color] ?? "#efe4cf" : "#efe4cf"} />
              <span className="piece-label"><Icon name="bag" size={11} /> {m.name}</span>
            </div>
          );
        })}
      </div>

      <p className="small">{outfit.rationale}</p>

      <div className="bars" aria-label="Desglose de compatibilidad">
        {BARS.map(([k, label]) => (
          <div key={k} className="bar">
            <span>{label}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${outfit.score[k]}%`, background: (outfit.score[k] as number) >= 85 ? "var(--sage)" : (outfit.score[k] as number) >= 70 ? "var(--gold)" : "var(--blush-deep)" }} /></div>
            <span>{outfit.score[k] as number}</span>
          </div>
        ))}
      </div>

      {outfit.styling_tips?.length > 0 && (
        <div className="card-soft stack" style={{ "--gap": "6px", padding: 14 } as React.CSSProperties}>
          <strong style={{ fontWeight: 500 }} className="small">Consejos de estilismo</strong>
          <ul className="check small">{outfit.styling_tips.slice(0, 3).map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}

      {outfit.score.flags.length > 0 && (
        <details className="small">
          <summary className="muted" style={{ cursor: "pointer" }}>Observaciones de protocolo ({outfit.score.flags.length})</summary>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{outfit.score.flags.slice(0, 5).map((f) => <li key={f}>{f}</li>)}</ul>
        </details>
      )}

      {onChoose && (
        <button className={chosen ? "btn btn-gold" : "btn btn-ghost"} onClick={onChoose}>
          <Icon name={chosen ? "check" : "heart"} size={18} /> {chosen ? "Elegido para hoy" : "Usaré este look"}
        </button>
      )}
    </article>
  );
}

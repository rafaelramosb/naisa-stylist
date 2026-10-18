import Link from "next/link";
import { Icon } from "@/components/Icon";
import { OCCASION_MAP } from "@/lib/occasions";
import { createClient } from "@/lib/supabase/server";
import type { OccasionId, RecommendationResult } from "@/lib/types";

export default async function Historial() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user!.id).single();
  const premium = profile?.plan === "premium";
  const { data: recs } = await supabase.from("recommendations")
    .select("id, occasion, created_at, result, chosen_outfit, worn_on, feedback")
    .order("created_at", { ascending: false }).limit(premium ? 200 : 1);

  const worn = (recs ?? []).filter((r) => r.worn_on);
  const liked = (recs ?? []).filter((r) => r.feedback === 1).length;
  const rated = (recs ?? []).filter((r) => r.feedback !== null).length;

  return (
    <div className="stack fade-in" style={{ "--gap": "24px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
        <span className="eyebrow">Historial de outfits</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Lo que has usado y para qué</h1>
        <p className="muted">Evita repetir look con el mismo grupo y descubre tus fórmulas ganadoras.</p>
      </div>

      {premium && (
        <div className="grid grid-3">
          <div className="card"><span className="small muted">Recomendaciones</span><div className="price">{recs?.length ?? 0}</div></div>
          <div className="card"><span className="small muted">Looks usados</span><div className="price">{worn.length}</div></div>
          <div className="card"><span className="small muted">Satisfacción</span><div className="price">{rated ? Math.round((liked / rated) * 100) : "—"}{rated ? "%" : ""}</div></div>
        </div>
      )}

      {(recs ?? []).map((r) => {
        const result = r.result as RecommendationResult;
        const pick = r.chosen_outfit !== null ? result.outfits[r.chosen_outfit] : result.outfits[0];
        return (
          <div key={r.id} id={r.id} className="card row between">
            <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
              <div className="row" style={{ "--gap": "8px" } as React.CSSProperties}>
                <span className="pill">{OCCASION_MAP[r.occasion as OccasionId]?.label ?? r.occasion}</span>
                {r.worn_on && <span className="pill pill-sage">Usado el {new Date(r.worn_on + "T12:00:00").toLocaleDateString("es-CO")}</span>}
              </div>
              <strong style={{ fontWeight: 500 }}>{pick?.title}</strong>
              <span className="small muted">{new Date(r.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })} · {result.outfits.length} opciones · mejor {result.outfits[0]?.score.total}%</span>
            </div>
            <span className="price" style={{ fontSize: "1.8rem" }}>{pick?.score.total}%</span>
          </div>
        );
      })}

      {!recs?.length && <div className="card-soft">Aún no tienes recomendaciones. <Link href="/app/ocasion" className="link">Crea tu primer look</Link>.</div>}

      {!premium && (
        <div className="card stack" style={{ alignItems: "flex-start" }}>
          <h3>El historial completo es Premium</h3>
          <p className="small muted">Guarda todos tus looks, marca cuándo los usaste y mide qué te funciona.</p>
          <Link href="/app/plan" className="btn btn-gold"><Icon name="crown" size={18} /> Pasar a Premium</Link>
        </div>
      )}
    </div>
  );
}

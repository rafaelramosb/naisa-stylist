import Link from "next/link";
import { Icon } from "@/components/Icon";
import { OCCASIONS, OCCASION_MAP } from "@/lib/occasions";
import { createClient } from "@/lib/supabase/server";
import type { OccasionId } from "@/lib/types";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: usage }, { data: last }] = await Promise.all([
    supabase.from("profiles").select("full_name, plan, body_analysis, style_profile").eq("id", user!.id).single(),
    supabase.rpc("usage_summary"),
    supabase.from("recommendations").select("id, occasion, created_at, result").order("created_at", { ascending: false }).limit(3),
  ]);
  const u = usage as { plan: string; limits: Record<string, number>; used: Record<string, number> } | null;
  const premium = profile?.plan === "premium";
  const first = (profile?.full_name ?? "").split(" ")[0];
  const garments = u?.used.garments ?? 0;
  const hasStyle = !!(profile?.style_profile as { styles?: string[] } | null)?.styles?.length;

  const steps = [
    { done: garments >= 5, label: `Escanea al menos 5 prendas (${garments}/5)`, href: "/app/closet", icon: "camera" },
    { done: !!profile?.body_analysis, label: "Analiza tu silueta", href: "/app/silueta", icon: "body" },
    { done: hasStyle, label: "Cuéntanos tu estilo", href: "/app/estilo", icon: "palette" },
  ];

  return (
    <div className="stack fade-in" style={{ "--gap": "28px" } as React.CSSProperties}>
      <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
        <span className="eyebrow">Tu estudio de estilo</span>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Hola{first ? `, ${first}` : ""}. ¿A dónde vas hoy?</h1>
      </div>

      {steps.some((s) => !s.done) && (
        <div className="card stack">
          <h3>Completa tu perfil para recomendaciones más precisas</h3>
          <div className="grid grid-3">
            {steps.map((s) => (
              <Link key={s.label} href={s.href} className="card-soft row" style={{ textDecoration: "none", opacity: s.done ? 0.55 : 1 }}>
                <Icon name={s.done ? "check" : s.icon} /> <span className="small">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="stack">
        <div className="row between"><h2 style={{ fontSize: "1.7rem" }}>Elige la ocasión</h2><Link href="/app/ocasion" className="link small">Ver todas</Link></div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {OCCASIONS.map((o) => (
            <Link key={o.id} href={`/app/ocasion?o=${o.id}`} className="card stack" style={{ textDecoration: "none", padding: 16, "--gap": "8px" } as React.CSSProperties}>
              <Icon name={o.icon} size={24} />
              <strong style={{ fontWeight: 500 }}>{o.label}</strong>
              <span className="tiny muted">{o.dressCode}</span>
            </Link>
          ))}
        </div>
      </section>

      {u && !premium && (
        <section className="card stack">
          <div className="row between"><h3>Tu plan Esencial este mes</h3><Link href="/app/plan" className="btn btn-gold btn-sm"><Icon name="crown" size={16} /> Premium</Link></div>
          <div className="grid grid-3">
            {[
              ["Recomendaciones", "recommendation"],
              ["Escaneos de prendas", "garment_scan"],
              ["Prendas en clóset", "garments"],
            ].map(([label, k]) => (
              <div key={k} className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
                <div className="row between small"><span>{label}</span><span className="muted">{u.used[k]} / {u.limits[k]}</span></div>
                <div className="meter"><div style={{ width: `${Math.min(100, (u.used[k] / u.limits[k]) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!last?.length && (
        <section className="stack">
          <h2 style={{ fontSize: "1.7rem" }}>Tus últimos looks</h2>
          <div className="grid grid-3">
            {last.map((r) => {
              const best = (r.result as { outfits: { title: string; score: { total: number } }[] }).outfits?.[0];
              return (
                <Link key={r.id} href={`/app/historial#${r.id}`} className="card stack" style={{ textDecoration: "none", "--gap": "6px" } as React.CSSProperties}>
                  <span className="pill">{OCCASION_MAP[r.occasion as OccasionId]?.label ?? r.occasion}</span>
                  <strong style={{ fontWeight: 500 }}>{best?.title}</strong>
                  <span className="small muted">{best?.score.total}% compatible · {new Date(r.created_at).toLocaleDateString("es-CO")}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

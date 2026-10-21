import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PublicShell } from "@/components/PublicShell";
import { VideoShowcase } from "@/components/VideoShowcase";
import { VIDEO_HISTORIA, VIDEO_RAPIDO, type VideoInfo } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description: "Videos y guía paso a paso: escanea tu clóset, analiza tu silueta y recibe 3 outfits por ocasión con NAISA Stylist IA.",
  openGraph: { videos: [{ url: VIDEO_HISTORIA.src, type: "video/mp4", width: 1080, height: 1920 }] },
};

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naisa-stylist.vercel.app";
const toIso = (d: string) => { const [m, s] = d.split(":").map(Number); return `PT${m}M${s}S`; };
const ld = (v: VideoInfo) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: v.title,
  description: v.subtitle,
  thumbnailUrl: `${site}${v.poster}`,
  contentUrl: `${site}${v.src}`,
  uploadDate: "2026-10-20",
  duration: toIso(v.duration),
  inLanguage: "es-CO",
  hasPart: v.chapters.map((c, i) => ({
    "@type": "Clip", name: c.title, startOffset: Math.floor(c.t),
    endOffset: Math.floor(v.chapters[i + 1]?.t ?? Number(v.duration.split(":")[1])), url: `${site}/como-funciona#${v.id}`,
  })),
});

const TIPS = [
  { icon: "camera", t: "Fotos de prendas", d: "Fondo liso y buena luz. Puedes fotografiar varias prendas juntas sobre la cama." },
  { icon: "body", t: "Foto de cuerpo completo", d: "De frente, de pies a cabeza, con ropa ajustada o ligera. Si prefieres, elige tu silueta a mano." },
  { icon: "sparkle", t: "Mejores recomendaciones", d: "Con 10 o más prendas (incluye calzado) los 3 looks salen con tu ropa, sin compras sugeridas." },
  { icon: "shield", t: "Tu privacidad", d: "Tus fotos son privadas. La foto de cuerpo completo no se guarda si no lo autorizas." },
];

export default function ComoFunciona() {
  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ld(VIDEO_HISTORIA), ld(VIDEO_RAPIDO)]) }} />
      <span className="eyebrow">Guía en video</span>
      <h1 style={{ fontSize: "clamp(2.4rem,6vw,3.4rem)" }}>Así funciona NAISA Stylist IA</h1>
      <p className="muted">Dos videos cortos y cuatro consejos para que tus recomendaciones salgan perfectas desde el primer día.</p>

      <section id={VIDEO_HISTORIA.id} className="card stack" style={{ "--gap": "18px", marginTop: 12 } as React.CSSProperties}>
        <VideoShowcase video={VIDEO_HISTORIA} />
      </section>

      <section id={VIDEO_RAPIDO.id} className="card stack" style={{ "--gap": "18px" } as React.CSSProperties}>
        <VideoShowcase video={VIDEO_RAPIDO} />
      </section>

      <h2 style={{ marginTop: 16 }}>Consejos para mejores resultados</h2>
      <div className="grid grid-2">
        {TIPS.map((t) => (
          <div key={t.t} className="card feature">
            <div className="feature-icon"><Icon name={t.icon} /></div>
            <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}><strong style={{ fontWeight: 500 }}>{t.t}</strong><span className="small muted">{t.d}</span></div>
          </div>
        ))}
      </div>

      <div className="card-soft row between" style={{ marginTop: 8 }}>
        <span>¿Lista para probarlo? Es gratis y sin tarjeta.</span>
        <Link href="/ingresar?modo=registro" className="btn btn-gold">Crear mi cuenta <Icon name="arrow" size={18} /></Link>
      </div>
    </PublicShell>
  );
}

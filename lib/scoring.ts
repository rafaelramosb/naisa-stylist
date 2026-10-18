// Motor de compatibilidad determinista y auditable.
// Claude propone combinaciones; este motor las verifica contra protocolo, color, silueta y estilo.
import { colorHarmony, isNeutral, tonality } from "./color.ts";
import { OCCASION_MAP, type ProtocolRule } from "./occasions.ts";
import type {
  BodyAnalysis, Category, Garment, OccasionContext, OutfitPiece, ScoreBreakdown, StyleProfile,
} from "./types.ts";

export const CORE: Category[] = ["top", "bottom", "dress", "suit", "shoes", "outerwear"];
export const WEIGHTS = { protocol: 0.4, color: 0.25, silhouette: 0.2, style: 0.15 };
export const RECOMMEND_THRESHOLD = 85;

const lc = (s?: string | null) => (s ?? "").toLowerCase();
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function defaultRole(ctx: OccasionContext) {
  if (ctx.role) return ctx.role;
  return ctx.occasion.startsWith("boda") ? "invitada" : undefined;
}

function ruleMatches(rule: ProtocolRule, g: Garment): boolean {
  if (rule.categories && !rule.categories.includes(g.category)) return false;
  const vals = rule.values.map(lc);
  const has = (s: string) => vals.some((v) => s.includes(v));
  switch (rule.test) {
    case "color": return g.colors.some((c) => vals.includes(lc(c)));
    case "subcategory": return has(lc(g.subcategory)) || has(lc(g.name));
    case "style_tag": return g.style_tags.some((t) => vals.includes(lc(t)));
    case "pattern": return has(lc(g.pattern));
    case "material": return has(lc(g.material));
    case "fit": return vals.includes(lc(g.fit));
  }
}

export function protocolScore(garments: Garment[], ctx: OccasionContext) {
  const occ = OCCASION_MAP[ctx.occasion];
  const flags: string[] = [];
  let score = 100;
  let prohibited = false;
  const [min, max] = occ.formality;
  const core = garments.filter((g) => CORE.includes(g.category));
  const role = defaultRole(ctx);

  for (const g of core) {
    if (g.formality < min) { score -= 14 * (min - g.formality); flags.push(`${g.name}: más informal de lo que pide el protocolo.`); }
    if (g.formality > max) { score -= 7 * (g.formality - max); flags.push(`${g.name}: algo más formal de lo necesario.`); }
  }

  for (const rule of occ.rules) {
    if (rule.onlyRole && (!role || !rule.onlyRole.includes(role))) continue;
    for (const g of garments) {
      if (ruleMatches(rule, g)) {
        if (rule.severity === "prohibido") { score -= 40; prohibited = true; }
        else score -= 12;
        flags.push(`${g.name}: ${rule.reason}`);
      }
    }
  }

  const tones = core.map((g) => tonality({ name: g.colors[0], hex: g.color_hex[0] }));
  const dark = tones.filter((t) => t === "oscuro").length;
  const light = tones.filter((t) => t === "claro").length;
  const effectivePalette = ctx.time === "noche" && occ.palette === "libre" ? "oscuros" : occ.palette;
  // La pieza protagonista (vestido o traje) pesa más que el resto en la lectura de tono
  const hero = garments.find((g) => g.category === "dress" || g.category === "suit");
  const heroTone = hero ? tonality({ name: hero.colors[0], hex: hero.color_hex[0] }) : null;
  if (effectivePalette === "claros" && (heroTone === "oscuro" || (dark > light && dark >= 2))) { score -= 12; flags.push("Para el día favorecen tonos claros o medios."); }
  if (effectivePalette === "oscuros" && (heroTone === "claro" || (light > dark && light >= 2))) { score -= 14; flags.push("Para la noche favorecen tonos profundos o joya."); }
  if (effectivePalette === "neutros") {
    const loud = core.filter((g) => !isNeutral(g.colors[0], g.color_hex[0])).length;
    if (loud > 1) { score -= 8; flags.push("Este protocolo pide base neutra con un solo acento."); }
  }

  let bonus = 0;
  for (const cat of occ.recommended) if (garments.some((g) => g.category === cat)) bonus += 3;
  score += Math.min(bonus, 6);
  // Capa de día sobre un look de etiqueta rompe la línea del protocolo nocturno
  if (min >= 4 && occ.palette === "oscuros" && garments.some((g) => g.category === "outerwear" && g.formality < 5) && garments.some((g) => g.category === "dress")) {
    score -= 6; flags.push("Sobre un vestido de etiqueta, mejor un chal o abrigo de noche que un blazer de día.");
  }

  if (ctx.climate === "calido" && garments.some((g) => /lana|terciopelo|cuero|paño/.test(lc(g.material)))) {
    score -= 6; flags.push("Tejido pesado para clima cálido.");
  }
  if (ctx.climate === "frio" && !garments.some((g) => g.category === "outerwear")) {
    score -= 5; flags.push("Clima frío: suma una capa exterior.");
  }

  return { score: clamp(score), flags, prohibited };
}

export function completenessScore(garments: Garment[], missing: OutfitPiece["missing"][], ctx: OccasionContext) {
  const occ = OCCASION_MAP[ctx.occasion];
  const cats = new Set<Category>([...garments.map((g) => g.category), ...missing.filter(Boolean).map((m) => m!.category)]);
  const satisfied = occ.structures.some((s) => s.every((c) => cats.has(c)));
  if (!satisfied) return 40;
  return clamp(100 - missing.filter(Boolean).length * 12);
}

const SHAPE_RULES: Record<BodyAnalysis["shape"], { favor: string[]; avoid: string[]; favorFit?: string[]; avoidFit?: string[] }> = {
  triangulo: {
    favor: ["hombros marcados", "escote barco", "a-line", "wide-leg", "pierna recta", "estructurado arriba", "manga abullonada"],
    avoid: ["ajustado en cadera", "bolsillos en cadera", "pitillo claro", "falda lápiz clara"],
  },
  triangulo_invertido: {
    favor: ["escote v", "wide-leg", "a-line", "volumen abajo", "falda plisada", "palazzo"],
    avoid: ["hombreras", "manga abullonada", "escote barco", "volumen arriba"],
  },
  rectangulo: {
    favor: ["cintura marcada", "cruzado", "wrap", "peplum", "cinturón", "volumen arriba", "a-line"],
    avoid: ["recto sin forma", "oversize total"],
    avoidFit: ["holgado"],
  },
  reloj_de_arena: {
    favor: ["cintura marcada", "cruzado", "wrap", "entallado", "lápiz", "cinturón"],
    avoid: ["oversize total", "recto sin forma"],
    favorFit: ["ajustado", "estructurado"],
    avoidFit: ["holgado"],
  },
  ovalo: {
    favor: ["escote v", "línea vertical", "monocromo", "imperio", "fluido", "pierna recta", "abierto"],
    avoid: ["ajustado en abdomen", "cinturón en cintura", "pretina alta ajustada"],
    favorFit: ["fluido", "estructurado"],
    avoidFit: ["ajustado"],
  },
};

export function silhouetteScore(garments: Garment[], body?: BodyAnalysis | null) {
  if (!body) return { score: 85, notes: ["Sube una foto de cuerpo completo para ajustar a tu silueta."] };
  const rules = SHAPE_RULES[body.shape];
  const favor = [...rules.favor, ...(body.favor ?? [])].map(lc);
  const avoid = [...rules.avoid, ...(body.avoid ?? [])].map(lc);
  let score = 78;
  const notes: string[] = [];
  for (const g of garments.filter((x) => CORE.includes(x.category))) {
    const tags = [...g.silhouette_tags, g.subcategory ?? "", g.name].map(lc).join(" | ");
    const fav = favor.filter((f) => tags.includes(f));
    const avo = avoid.filter((a) => tags.includes(a));
    if (fav.length) { score += 7 * Math.min(fav.length, 2); notes.push(`${g.name} favorece tu silueta (${fav[0]}).`); }
    if (avo.length) { score -= 12; notes.push(`${g.name} puede desequilibrar tu silueta (${avo[0]}).`); }
    if (rules.favorFit?.includes(g.fit)) score += 3;
    if (rules.avoidFit?.includes(g.fit)) { score -= 6; }
  }
  if (body.shape === "ovalo") {
    const core = garments.filter((g) => CORE.includes(g.category) && g.category !== "shoes");
    const mono = core.length > 1 && core.every((g) => lc(g.colors[0]) === lc(core[0].colors[0]));
    if (mono) { score += 6; notes.push("El monocromo crea una línea vertical continua."); }
  }
  return { score: clamp(score), notes };
}

export function styleScore(garments: Garment[], profile?: StyleProfile | null) {
  if (!profile || (!profile.styles?.length && !profile.favorite_colors?.length && !profile.avoid_colors?.length)) {
    return { score: 85, notes: [] as string[] };
  }
  const styles = (profile.styles ?? []).map(lc);
  const core = garments.filter((g) => CORE.includes(g.category));
  let score = 72;
  if (styles.length && core.length) {
    const matching = core.filter((g) => g.style_tags.some((t) => styles.includes(lc(t)))).length;
    score += 28 * (matching / core.length);
  } else score = 85;
  const avoid = (profile.avoid_colors ?? []).map(lc);
  const fav = (profile.favorite_colors ?? []).map(lc);
  const notes: string[] = [];
  for (const g of garments) {
    if (g.colors.some((c) => avoid.includes(lc(c)))) { score -= 15; notes.push(`${g.name} usa un color que prefieres evitar.`); }
    if (g.colors.some((c) => fav.includes(lc(c)))) score += 4;
  }
  return { score: clamp(score), notes };
}

export function scoreOutfit(
  garments: Garment[],
  missing: OutfitPiece["missing"][],
  ctx: OccasionContext,
  body?: BodyAnalysis | null,
  profile?: StyleProfile | null,
): ScoreBreakdown {
  const p = protocolScore(garments, ctx);
  const colorInputs = [
    ...garments.flatMap((g) => g.colors.slice(0, 2).map((c, i) => ({ name: c, hex: g.color_hex[i] }))),
    ...missing.filter(Boolean).map((m) => ({ name: m!.color })),
  ];
  const c = colorHarmony(colorInputs);
  const s = silhouetteScore(garments, body);
  const st = styleScore(garments, profile);
  const comp = completenessScore(garments, missing, ctx);

  let total = p.score * WEIGHTS.protocol + c.score * WEIGHTS.color + s.score * WEIGHTS.silhouette + st.score * WEIGHTS.style;
  total -= (100 - comp) * 0.3;
  if (p.prohibited) total = Math.min(total, 60);

  return {
    protocol: p.score,
    color: c.score,
    silhouette: s.score,
    style: st.score,
    completeness: comp,
    total: clamp(total),
    flags: [...p.flags, ...c.notes.filter(() => c.score < 75), ...s.notes.filter((n) => n.includes("desequilibrar")), ...st.notes],
  };
}

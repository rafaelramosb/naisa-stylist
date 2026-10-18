// Generador determinista de outfits: respaldo cuando la IA no está disponible y
// fuente adicional de candidatos para garantizar siempre 3 propuestas.
import { OCCASION_MAP } from "./occasions.ts";
import { CORE, RECOMMEND_THRESHOLD, scoreOutfit } from "./scoring.ts";
import type {
  BodyAnalysis, Category, Garment, OccasionContext, OccasionId, Outfit, OutfitPiece, StyleProfile,
} from "./types.ts";

type Missing = NonNullable<OutfitPiece["missing"]>;

// Piezas sugeridas cuando el clóset no alcanza (por ocasión y categoría)
const SUGGESTIONS: Partial<Record<OccasionId, Partial<Record<Category, Omit<Missing, "category">>>>> = {
  entrevista: {
    suit: { name: "Traje sastre azul marino", color: "azul marino", why: "La base más versátil para entrevistas corporativas." },
    outerwear: { name: "Blazer estructurado negro o camel", color: "camel", why: "Eleva cualquier combinación a business formal." },
    top: { name: "Blusa de seda blanca o camisa popelina", color: "blanco", why: "Neutro impecable bajo blazer." },
    bottom: { name: "Pantalón sastre de pierna recta", color: "gris", why: "Proyecta orden y es cómodo." },
    shoes: { name: "Stilettos o mocasines de cuero nude", color: "nude", why: "Alargan la figura y combinan con todo." },
    dress: { name: "Vestido funda midi", color: "azul marino", why: "Una sola pieza resuelve el look profesional." },
  },
  boda_dia: {
    dress: { name: "Vestido midi de gasa en tono pastel", color: "rosa palo", why: "Protocolo de día: claro, fluido y sin blanco." },
    shoes: { name: "Sandalia de tacón medio nude", color: "nude", why: "Cómoda para ceremonia y fiesta." },
    bag: { name: "Clutch metalizado dorado", color: "dorado", why: "Acento festivo sin recargar." },
    jewelry: { name: "Aretes largos dorados", color: "dorado", why: "Ilumina el rostro en fotos de día." },
  },
  boda_noche: {
    dress: { name: "Vestido largo de satén en tono joya", color: "esmeralda", why: "Protocolo nocturno: largo y tejido noble." },
    shoes: { name: "Sandalia de tacón fino dorada", color: "dorado", why: "Completa el largo al piso." },
    bag: { name: "Clutch joya", color: "dorado", why: "Cartera pequeña, obligatoria de noche." },
    suit: { name: "Traje oscuro de corte slim", color: "azul marino", why: "La alternativa de etiqueta a vestido largo." },
    jewelry: { name: "Pendientes statement", color: "plata", why: "El brillo se admite de noche en un solo foco." },
  },
  boda_playa: {
    dress: { name: "Vestido midi de lino o gasa con estampado floral", color: "coral", why: "Fresco y formal para clima tropical." },
    shoes: { name: "Sandalia plana trenzada o tacón ancho", color: "camel", why: "Estable sobre arena." },
    accessory: { name: "Sombrero de paja fina o pashmina", color: "arena", why: "Protege del sol con elegancia." },
  },
  evento_gala: {
    dress: { name: "Vestido largo de gala", color: "negro", why: "Black tie exige largo al piso." },
    suit: { name: "Esmoquin", color: "negro", why: "Black tie masculino." },
    shoes: { name: "Tacón de satén", color: "negro", why: "Formalidad máxima." },
    bag: { name: "Minaudière", color: "dorado", why: "La cartera de etiqueta por excelencia." },
  },
  coctel: {
    dress: { name: "Vestido cóctel a la rodilla", color: "vino", why: "Largo y formalidad exactos para cóctel." },
    shoes: { name: "Tacón medio de charol", color: "negro", why: "Sube un punto la formalidad." },
  },
  reunion_formal: {
    suit: { name: "Traje de dos piezas gris oscuro", color: "gris oscuro", why: "Autoridad y sobriedad." },
    shoes: { name: "Zapato cerrado de cuero", color: "negro", why: "Business formal exige calzado cerrado." },
    top: { name: "Camisa blanca entallada", color: "blanco", why: "Base neutra imprescindible." },
  },
  reunion_informal: {
    outerwear: { name: "Blazer desestructurado", color: "beige", why: "La pieza que convierte casual en smart casual." },
    bottom: { name: "Jean oscuro recto", color: "azul marino", why: "Base smart casual por excelencia." },
    shoes: { name: "Tenis blancos de cuero minimalistas", color: "blanco", why: "Cómodos y pulidos." },
    top: { name: "Suéter fino de punto", color: "camel", why: "Textura y calidez sin perder pulido." },
  },
};

const GENERIC: Record<Category, Omit<Missing, "category">> = {
  top: { name: "Blusa neutra de tejido fluido", color: "blanco", why: "Base comodín." },
  bottom: { name: "Pantalón sastre negro", color: "negro", why: "Combina con todo tu clóset." },
  dress: { name: "Vestido midi liso", color: "azul marino", why: "Resuelve ocasiones con una sola pieza." },
  outerwear: { name: "Blazer neutro", color: "camel", why: "Capa que estructura cualquier look." },
  shoes: { name: "Zapato nude de tacón medio", color: "nude", why: "Alarga la pierna y combina con todo." },
  bag: { name: "Bolso estructurado mediano", color: "camel", why: "Completa looks de día." },
  accessory: { name: "Cinturón de cuero fino", color: "café", why: "Define la cintura." },
  jewelry: { name: "Aretes dorados discretos", color: "dorado", why: "Iluminan el rostro." },
  suit: { name: "Traje sastre neutro", color: "gris", why: "Base para contextos formales." },
};

export function suggestPiece(occasion: OccasionId, category: Category): Missing {
  const s = SUGGESTIONS[occasion]?.[category] ?? GENERIC[category];
  return { ...s, category };
}

function formalityFit(g: Garment, [min, max]: [number, number]) {
  if (g.formality >= min && g.formality <= max) return 0;
  return g.formality < min ? min - g.formality : (g.formality - max) * 0.5;
}

export interface Candidate {
  title?: string;
  garmentIds: string[];
  missing: Missing[];
  rationale?: string;
  styling_tips?: string[];
}

/** Enumera combinaciones válidas con lo disponible y rellena huecos con piezas sugeridas. */
export function generateCandidates(closet: Garment[], ctx: OccasionContext, limit = 40): Candidate[] {
  const occ = OCCASION_MAP[ctx.occasion];
  const byCat = new Map<Category, Garment[]>();
  for (const g of closet) {
    const arr = byCat.get(g.category) ?? [];
    arr.push(g);
    byCat.set(g.category, arr);
  }
  for (const [k, arr] of byCat) {
    byCat.set(k, [...arr].sort((a, b) => formalityFit(a, occ.formality) - formalityFit(b, occ.formality)).slice(0, 4));
  }

  const out: Candidate[] = [];
  // Look "con una compra": la pieza protagonista sugerida + lo mejor del clóset para el resto.
  // Garantiza alternativas válidas cuando el clóset no alcanza o tiene prendas fuera de protocolo.
  for (const structure of occ.structures) {
    const [hero, ...rest] = structure;
    const restIds = rest.map((cat) => byCat.get(cat)?.[0]?.id).filter((x): x is string => !!x);
    const restMissing = rest.filter((cat) => !byCat.get(cat)?.length).map((cat) => suggestPiece(ctx.occasion, cat));
    out.push({ garmentIds: restIds, missing: [suggestPiece(ctx.occasion, hero), ...restMissing] });
  }
  for (const structure of occ.structures) {
    const pools: (Garment | Missing)[][] = structure.map((cat) => {
      const pool = byCat.get(cat) ?? [];
      return pool.length ? pool : [suggestPiece(ctx.occasion, cat)];
    });
    const combos: (Garment | Missing)[][] = [[]];
    for (const pool of pools) {
      const next: (Garment | Missing)[][] = [];
      for (const c of combos) for (const p of pool) next.push([...c, p]);
      combos.splice(0, combos.length, ...next.slice(0, 64));
    }
    for (const combo of combos) {
      const garments = combo.filter((x): x is Garment => "id" in x);
      const missing = combo.filter((x): x is Missing => !("id" in x));
      const extras: string[] = [];
      for (const cat of occ.recommended) {
        if (cat === "outerwear" && structure.includes("dress") && ctx.climate !== "frio" && occ.formality[0] >= 4) continue;
        const pick = byCat.get(cat)?.[0];
        if (pick && !structure.includes(cat)) extras.push(pick.id);
      }
      out.push({ garmentIds: [...garments.map((g) => g.id), ...extras], missing });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

const TIP_LIBRARY: Record<string, string> = {
  reloj_de_arena: "Marca la cintura: es tu punto de equilibrio natural.",
  triangulo: "Atrae la mirada hacia arriba con escotes amplios y hombros definidos.",
  triangulo_invertido: "Suma volumen abajo (wide-leg, faldas en A) para equilibrar hombros.",
  rectangulo: "Crea curvas con cinturones, cruzados y peplum.",
  ovalo: "Busca líneas verticales: escote en V, prendas abiertas y monocromo.",
};

export function describeOutfit(garments: Garment[], missing: Missing[], ctx: OccasionContext, body?: BodyAnalysis | null) {
  const occ = OCCASION_MAP[ctx.occasion];
  const main = garments.find((g) => g.category === "dress" || g.category === "suit") ?? garments.find((g) => g.category === "top");
  const title = main ? main.name : `Look ${occ.label.toLowerCase()}`;
  const tips = [occ.protocol[0]];
  if (body) tips.push(TIP_LIBRARY[body.shape]);
  if (missing.length) tips.push(`Para cerrar el look te falta: ${missing.map((m) => m.name.toLowerCase()).join(", ")}.`);
  return { title, rationale: `Combinación que respeta el código ${occ.dressCode.toLowerCase()} con lo que ya tienes en tu clóset.`, tips };
}

/** Puntúa candidatos, elimina duplicados y devuelve los 3 mejores con diversidad de pieza principal. */
export function pickTop(
  candidates: Candidate[], closet: Garment[], ctx: OccasionContext,
  body?: BodyAnalysis | null, profile?: StyleProfile | null, n = 3,
): Outfit[] {
  const byId = new Map(closet.map((g) => [g.id, g]));
  const seen = new Set<string>();
  const scored = candidates
    .map((c) => {
      const garments = [...new Set(c.garmentIds)].map((id) => byId.get(id)).filter((g): g is Garment => !!g);
      const key = [...garments.map((g) => g.id).sort(), ...c.missing.map((m) => m.name)].join("|");
      return { c, garments, key, score: scoreOutfit(garments, c.missing, ctx, body, profile) };
    })
    .filter((x) => x.garments.length + x.c.missing.length > 0 && !seen.has(x.key) && seen.add(x.key))
    .sort((a, b) => b.score.total - a.score.total);

  // 1) Variedad: una pieza protagonista distinta por opción, solo entre opciones competitivas
  const best = scored[0]?.score.total ?? 0;
  const competitive = (t: number) => t >= Math.max(70, best - 15);
  const picked: typeof scored = [];
  const usedMain = new Set<string>();
  for (const s of scored) {
    if (!competitive(s.score.total)) break;
    const main = s.garments.find((g) => ["dress", "suit", "top"].includes(g.category))?.id ?? s.key;
    if (usedMain.has(main)) continue;
    usedMain.add(main);
    picked.push(s);
    if (picked.length === n) break;
  }
  // 2) Completar por puntaje (variantes de accesorios o calzado del mejor look)
  for (const s of scored) {
    if (picked.length >= n) break;
    if (!picked.includes(s)) picked.push(s);
  }
  picked.sort((a, b) => b.score.total - a.score.total);

  return picked.map(({ c, garments, score }) => {
    const d = describeOutfit(garments, c.missing, ctx, body);
    return {
      title: c.title ?? d.title,
      rationale: c.rationale ?? d.rationale,
      styling_tips: c.styling_tips?.length ? c.styling_tips : d.tips,
      pieces: [...garments.map((g) => ({ garment_id: g.id })), ...c.missing.map((m) => ({ missing: m }))],
      score,
    };
  });
}

export function needsShopping(closet: Garment[], ctx: OccasionContext): Missing[] {
  const occ = OCCASION_MAP[ctx.occasion];
  const cats = new Set(closet.filter((g) => {
    const [min, max] = occ.formality;
    return !CORE.includes(g.category) || (g.formality >= min - 1 && g.formality <= max + 1);
  }).map((g) => g.category));
  const best = occ.structures
    .map((s) => s.filter((c) => !cats.has(c)))
    .sort((a, b) => a.length - b.length)[0];
  return (best ?? []).map((c) => suggestPiece(ctx.occasion, c));
}

export { RECOMMEND_THRESHOLD };

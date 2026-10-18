import Anthropic from "@anthropic-ai/sdk";
import type { BodyAnalysis, Garment, OccasionContext, StyleProfile } from "./types";
import { OCCASION_MAP } from "./occasions";

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 1 });
  return client;
}

const FAST = () => process.env.CLAUDE_MODEL_FAST || "claude-haiku-5-5";
const ADVANCED = () => process.env.CLAUDE_MODEL_ADVANCED || "claude-sonnet-5-5";

const SYSTEM_STYLIST = `Eres la estilista principal de NAISA BALLESTEROS, casa colombiana de alta costura.
Experta en protocolo y etiqueta, colorimetría, morfología corporal y moda latinoamericana.
Hablas en español de Colombia, cálido y preciso, sin tecnicismos innecesarios.
Nunca comentes el peso ni juzgues el cuerpo: hablas de proporciones, equilibrio y lo que favorece.`;

type ImageMedia = "image/jpeg" | "image/png" | "image/webp";

async function callTool<T>(opts: {
  model: string; maxTokens: number; toolName: string; toolDescription: string;
  schema: Record<string, unknown>; content: Anthropic.MessageParam["content"]; system?: string;
}): Promise<T> {
  const res = await getClient().messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.system ?? SYSTEM_STYLIST,
    tools: [{ name: opts.toolName, description: opts.toolDescription, input_schema: opts.schema as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.content }],
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("La IA no devolvió un resultado estructurado");
  return block.input as T;
}

// ──────────────────────────── Reconocimiento de prendas
const CATEGORY_ENUM = ["top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory", "jewelry", "suit"];
const FIT_ENUM = ["ajustado", "regular", "holgado", "estructurado", "fluido"];

const garmentSchema = {
  type: "object",
  properties: {
    garments: {
      type: "array",
      description: "Una entrada por cada prenda visible y distinguible en la foto (máximo 8).",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre corto y descriptivo en español, p.ej. 'Blazer cruzado camel'" },
          category: { type: "string", enum: CATEGORY_ENUM },
          subcategory: { type: "string", description: "p.ej. 'pantalón wide-leg', 'vestido midi', 'stiletto', 'tenis', 'jean'" },
          colors: { type: "array", items: { type: "string" }, description: "Nombres de color en español, del dominante al secundario (máx 3). Usa: negro, blanco, marfil, crema, gris, beige, camel, azul marino, azul, celeste, verde, verde oliva, verde salvia, esmeralda, rojo, vino, borgoña, coral, naranja, terracota, amarillo, mostaza, dorado, rosa, rosa palo, fucsia, lila, lavanda, morado, malva, café, nude, champaña, plata." },
          color_hex: { type: "array", items: { type: "string" }, description: "Hex aproximado de cada color, mismo orden" },
          pattern: { type: "string", description: "liso, rayas, cuadros, floral, animal print, lunares, geométrico, tropical…" },
          material: { type: "string", description: "Tejido probable: seda, satén, lino, algodón, denim, lana, cuero, gasa, crepé, punto, lentejuelas…" },
          fit: { type: "string", enum: FIT_ENUM },
          formality: { type: "integer", minimum: 1, maximum: 5, description: "1 deportivo, 2 casual, 3 smart casual, 4 formal, 5 etiqueta" },
          seasons: { type: "array", items: { type: "string", enum: ["calido", "templado", "frio"] } },
          style_tags: { type: "array", items: { type: "string", enum: ["clasico", "minimalista", "romantico", "bohemio", "urbano", "vanguardista", "sensual", "deportivo", "casual", "playero", "ejecutivo"] } },
          silhouette_tags: { type: "array", items: { type: "string" }, description: "Rasgos de corte: escote v, escote barco, cruzado, wrap, peplum, a-line, wide-leg, pierna recta, pitillo, lápiz, cintura marcada, hombreras, manga abullonada, imperio, oversize, palazzo, fluido…" },
        },
        required: ["name", "category", "colors", "color_hex", "pattern", "fit", "formality", "style_tags", "silhouette_tags"],
      },
    },
    photo_quality: { type: "string", enum: ["buena", "aceptable", "mala"] },
    tip: { type: "string", description: "Consejo breve para mejorar la foto si la calidad no es buena" },
  },
  required: ["garments", "photo_quality"],
};

export type DetectedGarment = Omit<Garment, "id">;

export async function detectGarments(base64: string, media: ImageMedia) {
  return callTool<{ garments: DetectedGarment[]; photo_quality: string; tip?: string }>({
    model: FAST(),
    maxTokens: 1500,
    toolName: "registrar_prendas",
    toolDescription: "Registra en el clóset digital cada prenda detectada con sus atributos de estilismo.",
    schema: garmentSchema,
    content: [
      { type: "image", source: { type: "base64", media_type: media, data: base64 } },
      { type: "text", text: "Cataloga las prendas de esta foto para el clóset digital. Ignora fondo, personas y objetos que no sean ropa, calzado o accesorios." },
    ],
  });
}

// ──────────────────────────── Silueta y proporciones
const bodySchema = (advanced: boolean) => ({
  type: "object",
  properties: {
    is_full_body: { type: "boolean", description: "true si se ve una persona de pies a cabeza" },
    shape: { type: "string", enum: ["reloj_de_arena", "triangulo", "triangulo_invertido", "rectangulo", "ovalo"] },
    shape_label: { type: "string", description: "Nombre amable en español: 'Reloj de arena', 'Triángulo (pera)', 'Triángulo invertido', 'Rectángulo', 'Óvalo'" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    ...(advanced ? {
      proportions: {
        type: "object",
        properties: {
          shoulders_vs_hips: { type: "string", enum: ["mas_anchos", "equilibrados", "mas_estrechos"] },
          torso_vs_legs: { type: "string", enum: ["torso_largo", "equilibrado", "piernas_largas"] },
          waist_definition: { type: "string", enum: ["marcada", "media", "poco_marcada"] },
          height_impression: { type: "string", enum: ["petite", "media", "alta"] },
        },
        required: ["shoulders_vs_hips", "torso_vs_legs", "waist_definition"],
      },
      notes: { type: "string", description: "2-3 frases de estilismo personalizado" },
    } : {}),
    goals: { type: "array", items: { type: "string" }, description: "Objetivos de estilismo (máx 3), p.ej. 'equilibrar hombros y caderas'" },
    favor: { type: "array", items: { type: "string" }, description: "Rasgos de corte que favorecen (usa términos como escote v, a-line, wide-leg, cintura marcada, cruzado, línea vertical…)" },
    avoid: { type: "array", items: { type: "string" }, description: "Rasgos de corte a evitar" },
  },
  required: ["is_full_body", "shape", "shape_label", "confidence", "goals", "favor", "avoid"],
});

export async function analyzeBody(base64: string, media: ImageMedia, advanced: boolean) {
  const r = await callTool<BodyAnalysis & { is_full_body: boolean }>({
    model: advanced ? ADVANCED() : FAST(),
    maxTokens: advanced ? 1200 : 700,
    toolName: "analisis_silueta",
    toolDescription: "Registra el análisis de silueta y proporciones para personalizar recomendaciones.",
    schema: bodySchema(advanced),
    content: [
      { type: "image", source: { type: "base64", media_type: media, data: base64 } },
      { type: "text", text: "Analiza la silueta y proporciones visibles (hombros, cintura, cadera, torso y piernas) para recomendar cortes. Si no es una foto de cuerpo completo, indícalo con is_full_body=false." },
    ],
  });
  return { ...r, advanced };
}

// ──────────────────────────── Propuesta de outfits
const outfitSchema = {
  type: "object",
  properties: {
    outfits: {
      type: "array",
      description: "Entre 4 y 6 outfits distintos para la ocasión",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Nombre evocador del look (máx 6 palabras)" },
          garment_ids: { type: "array", items: { type: "string" }, description: "IDs EXACTOS del clóset" },
          missing: {
            type: "array",
            description: "Piezas que faltan en el clóset para completar este look (vacío si no falta nada)",
            items: {
              type: "object",
              properties: {
                name: { type: "string" }, category: { type: "string", enum: CATEGORY_ENUM },
                color: { type: "string" }, why: { type: "string" },
              },
              required: ["name", "category", "why"],
            },
          },
          rationale: { type: "string", description: "Por qué funciona para el protocolo, la silueta y el estilo (1-2 frases)" },
          styling_tips: { type: "array", items: { type: "string" }, description: "2-3 consejos concretos: cómo llevarlo, peinado, accesorio, maquillaje" },
        },
        required: ["title", "garment_ids", "missing", "rationale", "styling_tips"],
      },
    },
    personal_tips: { type: "array", items: { type: "string" }, description: "2-3 consejos de estilismo personalizados para esta persona" },
  },
  required: ["outfits", "personal_tips"],
};

export interface ClaudeOutfitProposal {
  outfits: { title: string; garment_ids: string[]; missing: { name: string; category: Garment["category"]; color?: string; why: string }[]; rationale: string; styling_tips: string[] }[];
  personal_tips: string[];
}

export async function proposeOutfits(input: {
  closet: Garment[]; ctx: OccasionContext; body?: BodyAnalysis | null; profile?: StyleProfile | null;
  gender: string; allowShopping: boolean; advanced: boolean;
}) {
  const occ = OCCASION_MAP[input.ctx.occasion];
  const compact = input.closet.map((g) =>
    [g.id, g.category, g.subcategory ?? "", g.name, g.colors.join("/"), g.material ?? "", g.fit, `f${g.formality}`, g.pattern, g.silhouette_tags.join(",")].join(" | "),
  ).join("\n");

  const brief = [
    `OCASIÓN: ${occ.label} — código ${occ.dressCode}. ${occ.description}`,
    `PROTOCOLO: ${occ.protocol.join(" ")}`,
    `Formalidad requerida: ${occ.formality[0]}–${occ.formality[1]} (1 deportivo … 5 etiqueta).`,
    input.ctx.role ? `Rol: ${input.ctx.role}.` : "",
    input.ctx.industry ? `Sector: ${input.ctx.industry}.` : "",
    input.ctx.climate ? `Clima: ${input.ctx.climate}.` : "",
    input.ctx.time ? `Momento: ${input.ctx.time}.` : "",
    input.ctx.notes ? `Detalles del usuario: ${input.ctx.notes.slice(0, 400)}` : "",
    `Expresión de género de las prendas: ${input.gender}.`,
    input.body ? `SILUETA: ${input.body.shape_label}. Favorece: ${input.body.favor.join(", ")}. Evitar: ${input.body.avoid.join(", ")}.` : "SILUETA: sin análisis.",
    input.profile?.styles?.length ? `ESTILO PERSONAL: ${input.profile.styles.join(", ")}.` : "",
    input.profile?.favorite_colors?.length ? `Colores favoritos: ${input.profile.favorite_colors.join(", ")}.` : "",
    input.profile?.avoid_colors?.length ? `Colores a evitar: ${input.profile.avoid_colors.join(", ")}.` : "",
    input.profile?.heels ? `Tacones: ${input.profile.heels}.` : "",
    "",
    "CLÓSET (id | categoría | subcategoría | nombre | colores | material | ajuste | formalidad | estampado | corte):",
    compact || "(vacío)",
    "",
    "Reglas: usa solo IDs exactos del clóset. Cada outfit debe estar completo (vestido+zapatos, top+bottom+zapatos o traje+top+zapatos).",
    input.allowShopping
      ? "Si el clóset no alcanza, completa con piezas en 'missing' (nombre concreto, color y por qué)."
      : "Si el clóset no alcanza, completa con piezas en 'missing' de forma genérica (sin marca).",
    "Respeta el protocolo estrictamente (p.ej. nada blanco para invitadas a una boda).",
  ].filter(Boolean).join("\n");

  return callTool<ClaudeOutfitProposal>({
    // Siempre el modelo rápido: el presupuesto de respuesta es < 5 s.
    model: FAST(),
    maxTokens: input.advanced ? 2200 : 1600,
    toolName: "proponer_outfits",
    toolDescription: "Propone outfits completos con prendas del clóset para la ocasión.",
    schema: outfitSchema,
    content: [{ type: "text", text: brief }],
  });
}

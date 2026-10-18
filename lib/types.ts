export type Category =
  | "top" | "bottom" | "dress" | "outerwear" | "shoes" | "bag" | "accessory" | "jewelry" | "suit";

export type Fit = "ajustado" | "regular" | "holgado" | "estructurado" | "fluido";

export interface Garment {
  id: string;
  name: string;
  category: Category;
  subcategory?: string | null;
  colors: string[];
  color_hex: string[];
  pattern: string;
  material?: string | null;
  fit: Fit;
  formality: number; // 1 deportivo … 5 etiqueta
  seasons: string[];
  style_tags: string[];
  silhouette_tags: string[];
  image_path?: string | null;
  times_worn?: number;
  last_worn_at?: string | null;
}

export type BodyShape = "reloj_de_arena" | "triangulo" | "triangulo_invertido" | "rectangulo" | "ovalo";

export interface BodyAnalysis {
  shape: BodyShape;
  shape_label: string;
  confidence: number; // 0..1
  proportions?: {
    shoulders_vs_hips: "mas_anchos" | "equilibrados" | "mas_estrechos";
    torso_vs_legs: "torso_largo" | "equilibrado" | "piernas_largas";
    waist_definition: "marcada" | "media" | "poco_marcada";
    height_impression?: "petite" | "media" | "alta";
  };
  goals: string[]; // p.ej. "equilibrar hombros y caderas"
  favor: string[]; // siluetas que favorecen
  avoid: string[];
  advanced?: boolean;
  notes?: string;
}

export type OccasionId =
  | "entrevista" | "boda_dia" | "boda_noche" | "boda_playa" | "evento_gala" | "coctel"
  | "reunion_formal" | "reunion_informal" | "cita" | "dia_casual";

export interface OccasionContext {
  occasion: OccasionId;
  industry?: "corporativa" | "creativa" | "tecnologia" | "salud" | "gobierno";
  role?: "invitada" | "madrina" | "novia" | "anfitriona" | "ponente";
  climate?: "calido" | "templado" | "frio";
  time?: "manana" | "tarde" | "noche";
  notes?: string;
}

export interface OutfitPiece {
  garment_id?: string; // prenda del clóset
  missing?: { name: string; category: Category; color?: string; why: string }; // pieza sugerida para comprar
}

export interface ScoreBreakdown {
  protocol: number;
  color: number;
  silhouette: number;
  style: number;
  completeness: number;
  total: number;
  flags: string[];
}

export interface Outfit {
  title: string;
  pieces: OutfitPiece[];
  rationale: string;
  styling_tips: string[];
  score: ScoreBreakdown;
}

export interface RecommendationResult {
  occasion: OccasionId;
  outfits: Outfit[];
  protocol_summary: string[];
  shopping: { name: string; category: Category; color?: string; why: string; priority: "alta" | "media" }[];
  personal_tips: string[];
  engine: "claude" | "reglas";
  latency_ms: number;
  insufficient_wardrobe: boolean;
}

export interface StyleProfile {
  styles?: string[]; // clasico, minimalista, romantico, bohemio, urbano, vanguardista, sensual, deportivo
  favorite_colors?: string[];
  avoid_colors?: string[];
  comfort_priority?: number; // 1..5
  heels?: "si" | "a_veces" | "no";
}

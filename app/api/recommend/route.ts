import { z } from "zod";
import { aiEnabled, proposeOutfits, type ClaudeOutfitProposal } from "@/lib/claude";
import { fail, json } from "@/lib/http";
import { OCCASION_MAP } from "@/lib/occasions";
import { generateCandidates, needsShopping, pickTop, type Candidate } from "@/lib/rules-engine";
import { RECOMMEND_THRESHOLD } from "@/lib/scoring";
import { requireUser } from "@/lib/supabase/server";
import type { BodyAnalysis, Garment, OccasionContext, RecommendationResult, StyleProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 15;

const AI_BUDGET_MS = 4200; // presupuesto total < 5 s

const Ctx = z.object({
  occasion: z.enum(Object.keys(OCCASION_MAP) as [keyof typeof OCCASION_MAP, ...(keyof typeof OCCASION_MAP)[]]),
  industry: z.enum(["corporativa", "creativa", "tecnologia", "salud", "gobierno"]).optional(),
  role: z.enum(["invitada", "madrina", "novia", "anfitriona", "ponente"]).optional(),
  climate: z.enum(["calido", "templado", "frio"]).optional(),
  time: z.enum(["manana", "tarde", "noche"]).optional(),
  notes: z.string().max(500).optional(),
});

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

export async function POST(req: Request) {
  const started = Date.now();
  const { supabase, user } = await requireUser();
  if (!user) return fail("Inicia sesión para continuar", 401);

  const parsed = Ctx.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("Datos de la ocasión inválidos");
  const ctx: OccasionContext = parsed.data;

  const [{ data: profile }, { data: closetRows }] = await Promise.all([
    supabase.from("profiles").select("plan, body_analysis, style_profile, gender_expression").eq("id", user.id).single(),
    supabase.from("garments").select("*").eq("user_id", user.id).limit(400),
  ]);
  const premium = profile?.plan === "premium";
  if (!premium && ctx.role && ["madrina", "novia", "ponente"].includes(ctx.role)) {
    return fail("Los protocolos de madrina, novia y ponente son Premium", 402, { upgrade: true });
  }

  const { data: ok, error: qErr } = await supabase.rpc("consume_quota", { p_kind: "recommendation" });
  if (qErr) return fail("No pudimos validar tu plan", 500);
  if (!ok) return fail("Usaste tus 5 recomendaciones gratis de este mes", 402, { upgrade: true });

  const closet = (closetRows ?? []) as Garment[];
  const body = (profile?.body_analysis ?? null) as BodyAnalysis | null;
  const style = (profile?.style_profile ?? null) as StyleProfile | null;

  // 1) Candidatos deterministas (instantáneos)
  const candidates: Candidate[] = generateCandidates(closet, ctx, premium ? 60 : 30);

  // 2) Candidatos de Claude dentro del presupuesto de tiempo
  let engine: RecommendationResult["engine"] = "reglas";
  let personal: string[] = [];
  if (aiEnabled() && closet.length > 0) {
    const ai = await withTimeout<ClaudeOutfitProposal | null>(
      proposeOutfits({
        closet, ctx, body, profile: style, gender: profile?.gender_expression ?? "femenino",
        allowShopping: premium, advanced: premium,
      }).catch((e) => { console.error("proposeOutfits", e); return null; }),
      AI_BUDGET_MS - (Date.now() - started),
    );
    if (ai?.outfits?.length) {
      engine = "claude";
      personal = ai.personal_tips ?? [];
      const valid = new Set(closet.map((g) => g.id));
      // Las propuestas de la IA van primero: ante empate de puntaje, ganan por su redacción
      candidates.unshift(...ai.outfits.map((o) => ({
        title: o.title,
        garmentIds: o.garment_ids.filter((id) => valid.has(id)),
        missing: (o.missing ?? []).slice(0, 3),
        rationale: o.rationale,
        styling_tips: o.styling_tips,
      })));
    }
  }

  // 3) Verificación y selección de los 3 mejores
  const outfits = pickTop(candidates, closet, ctx, body, style, 3);
  const shoppingNeeds = needsShopping(closet, ctx);
  const fromOutfits = outfits.flatMap((o) => o.pieces.filter((p) => p.missing).map((p) => p.missing!));
  const seen = new Set<string>();
  const shopping = [...shoppingNeeds, ...fromOutfits]
    .filter((m) => !seen.has(m.name) && seen.add(m.name))
    .slice(0, 5)
    .map((m, i) => ({ ...m, priority: (i < shoppingNeeds.length ? "alta" : "media") as "alta" | "media" }));

  const occ = OCCASION_MAP[ctx.occasion];
  if (!personal.length) {
    personal = [
      body ? `Tu silueta ${body.shape_label.toLowerCase()}: ${body.goals[0] ?? "busca equilibrio"}.` : "Sube tu foto de cuerpo completo para consejos según tu silueta.",
      outfits[0]?.score.total >= RECOMMEND_THRESHOLD ? "Tu mejor opción supera el 85% de compatibilidad: sal con confianza." : "Ninguna opción alcanza el 85%: revisa las compras sugeridas para elevar el look.",
    ];
  }

  const result: RecommendationResult = {
    occasion: ctx.occasion,
    outfits: premium ? outfits : outfits.map((o) => ({ ...o, pieces: o.pieces.map((p) => (p.missing ? { missing: { ...p.missing, name: p.missing.category === "shoes" ? "Calzado complementario" : "Pieza complementaria", why: "Desbloquea Premium para ver la sugerencia exacta." } } : p)) })),
    protocol_summary: occ.protocol,
    shopping: premium ? shopping : [],
    personal_tips: personal,
    engine,
    latency_ms: Date.now() - started,
    insufficient_wardrobe: shoppingNeeds.length > 0,
  };

  const { data: saved } = await supabase.from("recommendations").insert({
    user_id: user.id, occasion: ctx.occasion, context: ctx, result, engine, latency_ms: result.latency_ms,
  }).select("id").single();

  return json({ id: saved?.id, ...result, premium, shopping_locked: !premium && shopping.length > 0, shopping_count: shopping.length });
}

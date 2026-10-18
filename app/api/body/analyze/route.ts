import { aiEnabled, analyzeBody } from "@/lib/claude";
import { fail, json, parseDataUrl } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";
import type { BodyAnalysis, BodyShape } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const LABELS: Record<BodyShape, string> = {
  reloj_de_arena: "Reloj de arena",
  triangulo: "Triángulo (pera)",
  triangulo_invertido: "Triángulo invertido",
  rectangulo: "Rectángulo",
  ovalo: "Óvalo",
};

const MANUAL_GUIDE: Record<BodyShape, Pick<BodyAnalysis, "goals" | "favor" | "avoid">> = {
  reloj_de_arena: { goals: ["Mantener la cintura como protagonista"], favor: ["cintura marcada", "cruzado", "wrap", "entallado"], avoid: ["oversize total", "recto sin forma"] },
  triangulo: { goals: ["Equilibrar hombros y caderas"], favor: ["hombros marcados", "escote barco", "a-line", "wide-leg"], avoid: ["ajustado en cadera", "pitillo claro"] },
  triangulo_invertido: { goals: ["Sumar volumen en la parte inferior"], favor: ["escote v", "wide-leg", "a-line", "palazzo"], avoid: ["hombreras", "manga abullonada"] },
  rectangulo: { goals: ["Crear curvas y definir la cintura"], favor: ["cintura marcada", "peplum", "cinturón", "cruzado"], avoid: ["recto sin forma"] },
  ovalo: { goals: ["Alargar con líneas verticales"], favor: ["escote v", "línea vertical", "monocromo", "fluido"], avoid: ["ajustado en abdomen", "cinturón en cintura"] },
};

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return fail("Inicia sesión para continuar", 401);
  const body = await req.json().catch(() => null);

  // Selección manual (sin foto): siempre disponible y sin costo de cuota
  if (body?.manualShape && body.manualShape in LABELS) {
    const shape = body.manualShape as BodyShape;
    const analysis: BodyAnalysis = { shape, shape_label: LABELS[shape], confidence: 0.6, ...MANUAL_GUIDE[shape], advanced: false };
    await supabase.from("profiles").update({ body_analysis: analysis, body_analyzed_at: new Date().toISOString() }).eq("id", user.id);
    return json({ analysis });
  }

  const img = parseDataUrl(body?.image);
  if (!img) return fail("Imagen inválida o demasiado grande");
  if (!aiEnabled()) return fail("El análisis por foto requiere la IA activa; elige tu silueta manualmente.", 503, { manual: true });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const premium = profile?.plan === "premium";

  const { data: ok } = await supabase.rpc("consume_quota", { p_kind: "body_scan" });
  if (!ok) return fail("Tu plan gratis incluye 1 análisis de silueta al mes", 402, { upgrade: true });

  const started = Date.now();
  try {
    const r = await analyzeBody(img.base64, img.media, premium);
    if (!r.is_full_body) return fail("Necesitamos una foto de cuerpo completo, de frente y con buena luz.", 422);
    const { is_full_body: _ignored, ...analysis } = r;
    void _ignored;

    let stored_path: string | null = null;
    if (body?.store === true) {
      const path = `${user.id}/silueta-${Date.now()}.${img.media.split("/")[1]}`;
      const up = await supabase.storage.from("body").upload(path, Buffer.from(img.base64, "base64"), { contentType: img.media, upsert: false });
      if (!up.error) stored_path = path;
    }

    await supabase.from("profiles").update({ body_analysis: analysis, body_analyzed_at: new Date().toISOString() }).eq("id", user.id);
    return json({ analysis, stored: !!stored_path, latency_ms: Date.now() - started });
  } catch (e) {
    console.error("analyzeBody", e);
    return fail("No pudimos analizar la foto. Intenta con otra o elige tu silueta manualmente.", 502, { manual: true });
  }
}

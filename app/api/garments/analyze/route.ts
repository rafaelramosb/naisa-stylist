import { aiEnabled, detectGarments } from "@/lib/claude";
import { fail, json, parseDataUrl } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return fail("Inicia sesión para continuar", 401);

  const body = await req.json().catch(() => null);
  const img = parseDataUrl(body?.image);
  if (!img) return fail("Imagen inválida o demasiado grande (máx. 4 MB, JPG/PNG/WebP)");

  if (!aiEnabled()) return json({ mode: "manual", garments: [] });

  const { data: ok, error } = await supabase.rpc("consume_quota", { p_kind: "garment_scan" });
  if (error) return fail("No pudimos validar tu plan", 500);
  if (!ok) return fail("Llegaste al límite de escaneos de tu plan este mes", 402, { upgrade: true });

  const started = Date.now();
  try {
    const result = await detectGarments(img.base64, img.media);
    return json({ mode: "ai", ...result, latency_ms: Date.now() - started });
  } catch (e) {
    console.error("detectGarments", e);
    return json({ mode: "manual", garments: [], warning: "La IA no respondió; registra la prenda manualmente." });
  }
}

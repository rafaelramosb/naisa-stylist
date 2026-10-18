import { aiEnabled } from "@/lib/claude";
import { mpEnabled } from "@/lib/mercadopago";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({
    ok: true,
    ai: aiEnabled() ? "claude" : "reglas",
    payments: mpEnabled() ? "mercadopago" : "no_configurado",
    database: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    time: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Portabilidad: descarga todos tus datos en JSON.
export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return fail("No autenticado", 401);
  const [profile, garments, recs, subs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("garments").select("*").eq("user_id", user.id),
    supabase.from("recommendations").select("*").eq("user_id", user.id),
    supabase.from("subscriptions").select("provider_id, plan_interval, status, amount, currency, next_payment_date, created_at").eq("user_id", user.id),
  ]);
  const data = { exported_at: new Date().toISOString(), email: user.email, profile: profile.data, garments: garments.data, recommendations: recs.data, subscriptions: subs.data };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="naisa-stylist-mis-datos.json"` },
  });
}

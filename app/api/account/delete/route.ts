import { fail, json } from "@/lib/http";
import { createServiceClient, requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function removeFolder(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], bucket: string, uid: string) {
  for (let i = 0; i < 20; i++) {
    const { data } = await supabase.storage.from(bucket).list(uid, { limit: 100 });
    if (!data?.length) return;
    await supabase.storage.from(bucket).remove(data.map((f) => `${uid}/${f.name}`));
  }
}

// Derecho de supresión (Ley 1581 de 2012): borra fotos, prendas, historial y la cuenta.
export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return fail("No autenticado", 401);
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "ELIMINAR") return fail("Escribe ELIMINAR para confirmar");

  await removeFolder(supabase, "wardrobe", user.id);
  await removeFolder(supabase, "body", user.id);
  await supabase.from("garments").delete().eq("user_id", user.id);
  await supabase.from("recommendations").delete().eq("user_id", user.id);
  await supabase.from("profiles").update({ body_analysis: null, body_analyzed_at: null, style_profile: {}, city: null }).eq("id", user.id);

  const admin = createServiceClient();
  let accountDeleted = false;
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    accountDeleted = !error;
  }
  await supabase.auth.signOut();
  return json({ ok: true, accountDeleted });
}

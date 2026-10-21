import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { BottomNav, SideNav } from "@/components/AppNav";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");
  const { data: profile } = await supabase.from("profiles").select("full_name, plan").eq("id", user.id).single();
  const premium = profile?.plan === "premium";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div style={{ padding: "0 8px 18px" }}><Brand href="/app" /></div>
        <SideNav />
        <div style={{ marginTop: "auto" }} className="card-soft stack">
          <span className="small">{profile?.full_name ?? user.email}</span>
          {premium ? <span className="pill pill-gold"><Icon name="crown" size={14} /> Premium</span>
            : <Link href="/app/plan" className="btn btn-gold btn-sm">Pasar a Premium</Link>}
          <Link href="/como-funciona" className="link small">Ver cómo funciona</Link>
          <form action="/auth/signout" method="post"><button className="link small">Cerrar sesión</button></form>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="mobile-top">
          <Brand href="/app" />
          {premium ? <span className="pill pill-gold"><Icon name="crown" size={14} /> Premium</span>
            : <Link href="/app/plan" className="btn btn-gold btn-sm">Premium</Link>}
        </div>
        <main className="app-main"><div className="container">{children}</div></main>
      </div>
      <BottomNav />
    </div>
  );
}

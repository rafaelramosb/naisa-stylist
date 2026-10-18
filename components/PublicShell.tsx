import Link from "next/link";
import { Brand } from "./Brand";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="container"><Brand /><nav className="nav-links"><Link href="/ingresar" className="btn btn-sm">Entrar</Link></nav></div>
      </header>
      <main className="section"><div className="container stack" style={{ maxWidth: 820, "--gap": "18px" } as React.CSSProperties}>{children}</div></main>
      <footer className="site-footer"><div className="container row between"><span>© {new Date().getFullYear()} NAISA BALLESTEROS</span><span className="row"><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link></span></div></footer>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPWA() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (done) return <span className="pill pill-sage">Instalada</span>;
  if (!evt) return <p className="small muted">En Chrome: menú ⋮ → &ldquo;Agregar a pantalla principal&rdquo;. En iPhone: Compartir → &ldquo;Agregar a inicio&rdquo;.</p>;
  return <button className="btn" onClick={async () => { await evt.prompt(); const c = await evt.userChoice; if (c.outcome === "accepted") setDone(true); }}>Instalar ahora</button>;
}

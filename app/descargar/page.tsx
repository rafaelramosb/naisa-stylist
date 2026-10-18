import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { PublicShell } from "@/components/PublicShell";
import { InstallPWA } from "@/components/InstallPWA";

export const metadata: Metadata = { title: "Descargar la app Android" };

export default function Descargar() {
  return (
    <PublicShell>
      <span className="eyebrow">App Android</span>
      <h1 style={{ fontSize: "2.6rem" }}>Instala NAISA Stylist IA en tu teléfono</h1>
      <div className="grid grid-2">
        <div className="card stack">
          <Icon name="phone" size={32} />
          <h3>APK oficial</h3>
          <p className="small muted">Android 7.0 o superior. Acceso a cámara para escanear tu clóset.</p>
          <a className="btn btn-gold" href="/descargas/naisa-stylist.apk" download><Icon name="download" size={18} /> Descargar APK</a>
          <ol className="small" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Abre el archivo descargado.</li>
            <li>Si Android lo pide, permite &ldquo;Instalar apps de esta fuente&rdquo;.</li>
            <li>Abre NAISA Stylist e inicia sesión.</li>
          </ol>
        </div>
        <div className="card stack">
          <Icon name="sparkle" size={32} />
          <h3>Sin descargar archivos</h3>
          <p className="small muted">Agrégala a tu pantalla de inicio desde Chrome. Funciona en Android, iPhone y escritorio.</p>
          <InstallPWA />
        </div>
      </div>
    </PublicShell>
  );
}

import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { PRICES, formatCOP } from "@/lib/plans";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function Terminos() {
  return (
    <PublicShell>
      <h1 style={{ fontSize: "2.6rem" }}>Términos y condiciones</h1>
      <p className="muted small">Última actualización: 18 de octubre de 2026</p>
      <h3>Servicio</h3>
      <p>NAISA Stylist IA ofrece recomendaciones de vestuario generadas con inteligencia artificial y reglas de protocolo. Son sugerencias de estilismo; la decisión final es tuya.</p>
      <h3>Planes</h3>
      <p>Esencial es gratuito con límites mensuales. Premium cuesta {formatCOP(PRICES.monthly)} al mes o {formatCOP(PRICES.yearly)} al año (IVA incluido cuando aplique), con renovación automática a través de Mercado Pago.</p>
      <h3>Cancelación y retracto</h3>
      <p>Puedes cancelar en cualquier momento desde Plan; conservas Premium hasta el fin del periodo pagado. En suscripciones nuevas aplica el derecho de retracto de 5 días hábiles del Estatuto del Consumidor (Ley 1480 de 2011).</p>
      <h3>Uso aceptable</h3>
      <p>Sube solo imágenes propias o con autorización. No subas fotos de menores de edad ni contenido íntimo.</p>
      <h3>Contacto</h3>
      <p>soporte@vb-society.co</p>
    </PublicShell>
  );
}

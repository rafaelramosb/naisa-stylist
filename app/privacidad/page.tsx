import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = { title: "Política de tratamiento de datos" };

export default function Privacidad() {
  return (
    <PublicShell>
      <span className="eyebrow">Ley 1581 de 2012 · Decreto 1377 de 2013</span>
      <h1 style={{ fontSize: "2.6rem" }}>Política de tratamiento de datos personales</h1>
      <p className="muted small">Última actualización: 18 de octubre de 2026</p>
      <h3>Responsable</h3>
      <p>NAISA BALLESTEROS, con el soporte tecnológico de Virtual Business Society S.A.S. (NIT 900969456). Contacto: privacidad@vb-society.co.</p>
      <h3>Datos que tratamos</h3>
      <p>Correo y nombre; fotografías de prendas; opcionalmente, una fotografía de cuerpo completo; preferencias de estilo; historial de recomendaciones; y estado de la suscripción. No almacenamos datos de tarjetas: los procesa Mercado Pago.</p>
      <h3>Finalidad</h3>
      <p>Catalogar tu clóset, analizar silueta y proporciones para recomendar prendas, generar outfits por ocasión, gestionar tu plan y mejorar la precisión del servicio con tu retroalimentación agregada.</p>
      <h3>Imágenes y datos sensibles</h3>
      <p>La fotografía de cuerpo completo puede considerarse dato sensible. Su análisis es voluntario y requiere tu autorización expresa. Por defecto se procesa y se descarta; solo se guarda si marcas la opción. Puedes elegir tu silueta manualmente sin subir ninguna foto.</p>
      <h3>Encargados</h3>
      <p>Supabase (base de datos y almacenamiento), Vercel (alojamiento), Anthropic (análisis de imágenes con IA, sin uso de tus datos para entrenamiento) y Mercado Pago (pagos). Las transferencias internacionales se realizan con garantías contractuales adecuadas.</p>
      <h3>Tus derechos</h3>
      <p>Conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización. Desde Cuenta y privacidad puedes exportar o eliminar toda tu información en un clic. También puedes escribirnos; respondemos en máximo 15 días hábiles.</p>
      <h3>Seguridad</h3>
      <p>Cifrado en tránsito, almacenamiento privado con control de acceso por usuario, enlaces temporales para ver imágenes y registro mínimo de datos.</p>
    </PublicShell>
  );
}

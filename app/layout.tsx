import type { Metadata, Viewport } from "next";
import { SWRegister } from "@/components/SWRegister";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naisa-stylist.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "NAISA Stylist IA — Tu estilista de protocolo con inteligencia artificial", template: "%s · NAISA Stylist IA" },
  description:
    "Escanea tu clóset, analiza tu silueta y recibe 3 outfits con % de compatibilidad para entrevistas, matrimonios, eventos y reuniones. Por NAISA BALLESTEROS.",
  applicationName: "NAISA Stylist IA",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  openGraph: {
    title: "NAISA Stylist IA",
    description: "¿Qué me pongo? 3 outfits perfectos para cada ocasión, con lo que ya tienes.",
    images: ["/og.png"],
    locale: "es_CO",
    type: "website",
  },
  appleWebApp: { capable: true, title: "NAISA Stylist", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#3e2c26",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}

import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export default function NotFound() {
  return <PublicShell><h1 style={{ fontSize: "2.6rem" }}>Esta página no existe</h1><Link href="/" className="btn" style={{ alignSelf: "flex-start" }}>Volver al inicio</Link></PublicShell>;
}

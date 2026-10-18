"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const ITEMS = [
  { href: "/app", label: "Inicio", icon: "home" },
  { href: "/app/closet", label: "Clóset", icon: "closet" },
  { href: "/app/ocasion", label: "Outfits", icon: "sparkle" },
  { href: "/app/silueta", label: "Silueta", icon: "body" },
  { href: "/app/estilo", label: "Mi estilo", icon: "palette" },
  { href: "/app/historial", label: "Historial", icon: "history" },
  { href: "/app/plan", label: "Plan", icon: "crown" },
  { href: "/app/cuenta", label: "Cuenta y privacidad", icon: "shield" },
];
const MOBILE = ["/app", "/app/closet", "/app/ocasion", "/app/silueta", "/app/cuenta"];

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

export function SideNav() {
  const path = usePathname();
  return (
    <>
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} className="side-link" aria-current={isActive(path, i.href) ? "page" : undefined}>
          <Icon name={i.icon} /> {i.label}
        </Link>
      ))}
    </>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Navegación">
      {ITEMS.filter((i) => MOBILE.includes(i.href)).map((i) => (
        <Link key={i.href} href={i.href} aria-current={isActive(path, i.href) ? "page" : undefined}>
          <Icon name={i.icon} size={22} />
          {i.href === "/app/cuenta" ? "Cuenta" : i.label}
        </Link>
      ))}
    </nav>
  );
}

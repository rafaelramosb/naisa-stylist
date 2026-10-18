import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="NAISA Stylist IA, inicio">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="#3e2c26" />
        <path d="M12 28V12l16 16V12" fill="none" stroke="#c9a75c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span className="brand-mark">NAISA</span>
        <span className="brand-sub">Stylist IA</span>
      </span>
    </Link>
  );
}

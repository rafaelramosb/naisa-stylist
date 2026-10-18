// Ilustración del hero: figura de alta costura + tarjetas de la app (todo SVG, sin imágenes externas).
export function HeroArt() {
  return (
    <svg viewBox="0 0 400 500" width="100%" height="100%" role="img" aria-label="Ilustración de una figura con vestido de gala y tarjetas de recomendación">
      <defs>
        <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e6d3" />
          <stop offset="1" stopColor="#e8c4c0" />
        </linearGradient>
        <linearGradient id="dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d5a6b" />
          <stop offset="1" stopColor="#5a3d4c" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8bb73" />
          <stop offset="1" stopColor="#a7863f" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#hbg)" />
      <circle cx="300" cy="90" r="120" fill="#fbf7f2" opacity=".35" />
      <path d="M40 460 Q200 400 360 460" stroke="#b8964e" strokeOpacity=".35" fill="none" />
      {/* figura */}
      <g transform="translate(118 40)">
        <ellipse cx="62" cy="28" rx="17" ry="20" fill="#e3bfa7" />
        <path d="M46 20c2-18 30-18 34 0 4 10-2 26-8 30 10-20-6-30-26-30z" fill="#3e2c26" />
        <path d="M56 46h12l2 12H54z" fill="#e3bfa7" />
        <path d="M40 60c8-6 36-6 44 0l-6 50c-2 10-30 10-32 0z" fill="url(#dress)" />
        <path d="M44 108c10 6 26 6 36 0l46 312H-2z" fill="url(#dress)" />
        <path d="M46 110c10 5 22 5 32 0" stroke="url(#gold)" strokeWidth="4" fill="none" />
        <path d="M40 62c-10 10-16 40-14 70" stroke="#e3bfa7" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M84 62c10 10 16 40 14 70" stroke="#e3bfa7" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M30 420c20-30 26-190 30-300M94 420c-20-30-26-190-30-300" stroke="#fbf7f2" strokeOpacity=".12" fill="none" />
      </g>
      {/* tarjeta puntuación */}
      <g transform="translate(18 120)">
        <rect width="132" height="86" rx="16" fill="#fff" />
        <circle cx="34" cy="43" r="20" fill="none" stroke="#eadfd3" strokeWidth="5" />
        <circle cx="34" cy="43" r="20" fill="none" stroke="#6f7d58" strokeWidth="5" strokeDasharray="118 126" transform="rotate(-90 34 43)" strokeLinecap="round" />
        <text x="34" y="49" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="17" fill="#3e2c26">94</text>
        <text x="64" y="38" fontFamily="Jost, sans-serif" fontSize="10" fill="#7a6a63">Boda de noche</text>
        <text x="64" y="54" fontFamily="Jost, sans-serif" fontSize="11" fill="#3e2c26" fontWeight="500">Compatible</text>
      </g>
      {/* tarjeta protocolo */}
      <g transform="translate(250 300)">
        <rect width="132" height="96" rx="16" fill="#fff" />
        <text x="14" y="24" fontFamily="Jost, sans-serif" fontSize="8" letterSpacing="2" fill="#b8964e">PROTOCOLO</text>
        <circle cx="20" cy="44" r="4" fill="#a3b18a" />
        <text x="30" y="47" fontFamily="Jost, sans-serif" fontSize="10" fill="#3e2c26">Largo al piso</text>
        <circle cx="20" cy="62" r="4" fill="#a3b18a" />
        <text x="30" y="65" fontFamily="Jost, sans-serif" fontSize="10" fill="#3e2c26">Tono joya</text>
        <circle cx="20" cy="80" r="4" fill="#c98f8a" />
        <text x="30" y="83" fontFamily="Jost, sans-serif" fontSize="10" fill="#3e2c26">Sin blanco</text>
      </g>
      {/* paleta */}
      <g transform="translate(262 70)">
        <rect width="110" height="40" rx="20" fill="#fff" />
        {["#7d5a6b", "#b8964e", "#a3b18a", "#e8c4c0"].map((c, i) => (
          <circle key={c} cx={22 + i * 22} cy="20" r="9" fill={c} />
        ))}
      </g>
    </svg>
  );
}

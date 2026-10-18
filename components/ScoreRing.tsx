export function ScoreRing({ value, size = 74 }: { value: number; size?: number }) {
  const r = 32, c = 2 * Math.PI * r;
  const color = value >= 85 ? "#6f7d58" : value >= 70 ? "#b8964e" : "#a33a3a";
  return (
    <div className="score-ring" style={{ width: size, height: size, flexBasis: size }} aria-label={`Compatibilidad ${value}%`}>
      <svg viewBox="0 0 74 74" width={size} height={size}>
        <circle cx="37" cy="37" r={r} fill="none" stroke="#eadfd3" strokeWidth="6" />
        <circle cx="37" cy="37" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 37 37)" />
      </svg>
      <span><b style={{ fontWeight: 400, whiteSpace: "nowrap" }}>{value}<small style={{ fontSize: ".75rem" }}>%</small></b></span>
    </div>
  );
}

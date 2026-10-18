const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  closet: "M5 3h14v18H5zM12 3v18M9.5 11v2M14.5 11v2",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  body: "M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 8h8l-1 6h-2v8h-2v-8H9z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5z",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 3",
  camera: "M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14",
  check: "M5 12l5 5L20 7",
  close: "M6 6l12 12M18 6 6 18",
  heart: "M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z",
  briefcase: "M3 7h18v13H3zM8 7V4h8v3M3 13h18",
  rings: "M9 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM15 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  wave: "M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M12 3l2 6h-4z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  glass: "M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v7M8 21h8",
  table: "M3 8h18M5 8v12M19 8v12M8 4h8v4H8z",
  coffee: "M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  bag: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.5 1-2.5 2.5-2.5H18a3 3 0 0 0 3-3c0-6-4-11-9-11zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  phone: "M7 2h10v20H7zM11 18h2",
  logout: "M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10",
  thumbup: "M7 10v11H3V10zM7 10l4-8a2 2 0 0 1 2 2v5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7",
  thumbdown: "M7 14V3H3v11zM7 14l4 8a2 2 0 0 0 2-2v-5h6a2 2 0 0 0 2-2.3l-1.4-7A2 2 0 0 0 17.6 3H7",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

export function Icon({ name, size = 20, stroke = 1.6, className }: { name: keyof typeof PATHS | string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={PATHS[name] ?? PATHS.sparkle} />
    </svg>
  );
}

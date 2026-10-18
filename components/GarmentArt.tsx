// Ilustración SVG de respaldo por categoría, teñida con el color de la prenda.
const SHAPES: Record<string, string> = {
  top: "M30 22 42 16h16l12 6 10 16-12 6-4-6v42H36V38l-4 6-12-6z",
  bottom: "M34 16h32l4 72H54l-4-48-4 48H30z",
  dress: "M40 14h20l-2 12 6 6-4 10 16 46H24l16-46-4-10 6-6z",
  outerwear: "M30 18 42 14l8 10 8-10 12 4 10 22-10 4v44H30V48l-10-4z",
  suit: "M30 18 42 14l8 14 8-14 12 4 8 24-8 2v42H30V48l-8-2z",
  shoes: "M18 62c10 0 18-14 26-14 6 0 8 10 18 12 10 2 20 4 20 12v4H18z",
  bag: "M24 40h52l-4 44H28zM38 40v-8a12 12 0 0 1 24 0v8",
  accessory: "M20 48c0-8 60-8 60 0s-60 8-60 0zM46 44h8v8h-8z",
  jewelry: "M50 20a24 24 0 1 0 .1 0zM50 62l6 8-6 8-6-8z",
};

export function GarmentArt({ category, color = "#d9c7a7", label }: { category: string; color?: string; label?: string }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label={label ?? category}>
      <rect width="100" height="100" fill="#f6eee4" />
      <path d={SHAPES[category] ?? SHAPES.top} fill={color} stroke="#3e2c26" strokeOpacity=".25" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

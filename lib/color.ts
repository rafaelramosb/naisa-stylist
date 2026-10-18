// Teoría del color aplicada a moda: neutros, armonías y temperatura.

export const COLOR_NAMES: Record<string, string> = {
  negro: "#151515", blanco: "#F7F5F0", marfil: "#F3EBDD", crema: "#EFE4CF", hueso: "#E9E1D2", perla: "#EAE6DF",
  gris: "#8A8A8A", "gris oscuro": "#4A4A4A", plata: "#C0C0C0", beige: "#D9C7A7", camel: "#B8875A", arena: "#D6C2A0",
  "azul marino": "#1F2A44", azul: "#2F5DA8", "azul cielo": "#9CC3E6", celeste: "#A8D0EB", turquesa: "#3AB5B0",
  verde: "#3E7D4F", "verde oliva": "#6B6B3A", "verde salvia": "#A3B18A", esmeralda: "#1E7A57", menta: "#B6E2CC",
  rojo: "#B3261E", vino: "#6D1A2B", borgoña: "#701C30", coral: "#F07A63", naranja: "#E07B2A", terracota: "#B5573B",
  amarillo: "#E8C547", mostaza: "#C99A2E", dorado: "#C8A24D", rosa: "#E8A0B4", "rosa palo": "#E9C4C4", fucsia: "#C2185B",
  lila: "#B9A3D0", lavanda: "#C7B8E0", morado: "#5E3A7E", malva: "#9C6B8A", café: "#5A3B2A", chocolate: "#4A2C21",
  caqui: "#A89F79", mocca: "#6F4E37", nude: "#E3BFA7", champaña: "#E8D6B5",
};

export const NEUTRALS = new Set([
  "negro", "blanco", "marfil", "crema", "hueso", "perla", "gris", "gris oscuro", "plata", "beige", "camel", "arena",
  "azul marino", "café", "chocolate", "caqui", "nude", "champaña", "mocca", "dorado",
]);

export function normalizeColor(name: string): string {
  return name.trim().toLowerCase().normalize("NFC");
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m.padEnd(6, "0").slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function isNeutral(name: string | undefined, hex?: string): boolean {
  if (name && NEUTRALS.has(normalizeColor(name))) return true;
  if (hex) {
    const { s, l } = hexToHsl(hex);
    return s < 0.18 || l < 0.12 || l > 0.92;
  }
  return false;
}

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export interface ColorInput { name?: string; hex?: string }

/** Puntúa la armonía cromática de un outfit (0–100) y explica el esquema. */
export function colorHarmony(colors: ColorInput[]): { score: number; scheme: string; notes: string[] } {
  const notes: string[] = [];
  const resolved = colors
    .map((c) => ({ name: c.name, hex: c.hex ?? (c.name ? COLOR_NAMES[normalizeColor(c.name)] : undefined) }))
    .filter((c) => c.hex || c.name);

  const chromatic = resolved.filter((c) => !isNeutral(c.name, c.hex) && c.hex);
  const uniqueHues: number[] = [];
  for (const c of chromatic) {
    const { h } = hexToHsl(c.hex!);
    if (!uniqueHues.some((u) => hueDistance(u, h) < 15)) uniqueHues.push(h);
  }

  if (uniqueHues.length === 0) return { score: 92, scheme: "neutro", notes: ["Paleta neutra: elegante y segura."] };
  if (uniqueHues.length === 1) return { score: 95, scheme: "acento único", notes: ["Neutros con un solo acento de color: equilibrio clásico."] };

  if (uniqueHues.length === 2) {
    const d = hueDistance(uniqueHues[0], uniqueHues[1]);
    if (d <= 45) return { score: 93, scheme: "análogo", notes: ["Colores vecinos en la rueda: armonía suave."] };
    if (d >= 150) return { score: 88, scheme: "complementario", notes: ["Complementarios: contraste con energía; deja uno dominante."] };
    if (d >= 100 && d < 150) return { score: 80, scheme: "complementario dividido", notes: ["Contraste moderado; ancla con neutros."] };
    notes.push("Dos colores sin relación clara; suma un neutro que los separe.");
    return { score: 68, scheme: "libre", notes };
  }

  if (uniqueHues.length === 3) {
    const sorted = [...uniqueHues].sort((a, b) => a - b);
    const gaps = [sorted[1] - sorted[0], sorted[2] - sorted[1], 360 - sorted[2] + sorted[0]];
    if (gaps.every((g) => g > 90 && g < 150)) return { score: 78, scheme: "tríada", notes: ["Tríada: audaz; funciona mejor con un color en accesorios."] };
    return { score: 60, scheme: "recargado", notes: ["Tres colores protagonistas compiten; reduce a dos."] };
  }

  return { score: 45, scheme: "recargado", notes: ["Demasiados colores; la regla de oro es máximo tres."] };
}

/** ¿El color es claro/pastel (día) u oscuro/joya (noche)? */
export function tonality(c: ColorInput): "claro" | "oscuro" | "medio" {
  const hex = c.hex ?? (c.name ? COLOR_NAMES[normalizeColor(c.name)] : undefined);
  if (!hex) return "medio";
  const { l } = hexToHsl(hex);
  if (l >= 0.68) return "claro";
  if (l <= 0.35) return "oscuro";
  return "medio";
}

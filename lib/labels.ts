import type { Category } from "./types";

export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Blusas y camisas",
  bottom: "Pantalones y faldas",
  dress: "Vestidos",
  outerwear: "Blazers y abrigos",
  suit: "Trajes",
  shoes: "Calzado",
  bag: "Bolsos",
  accessory: "Accesorios",
  jewelry: "Joyería",
};

export const CATEGORY_SINGULAR: Record<Category, string> = {
  top: "Top", bottom: "Inferior", dress: "Vestido", outerwear: "Capa", suit: "Traje",
  shoes: "Calzado", bag: "Bolso", accessory: "Accesorio", jewelry: "Joya",
};

export const FORMALITY_LABEL = ["", "Deportivo", "Casual", "Smart casual", "Formal", "Etiqueta"];

export const STYLES = [
  { id: "clasico", label: "Clásico" },
  { id: "minimalista", label: "Minimalista" },
  { id: "romantico", label: "Romántico" },
  { id: "bohemio", label: "Bohemio" },
  { id: "urbano", label: "Urbano" },
  { id: "vanguardista", label: "Vanguardista" },
  { id: "sensual", label: "Sensual" },
  { id: "ejecutivo", label: "Ejecutivo" },
];

export const PALETTE_CHOICES = [
  "negro", "blanco", "beige", "camel", "gris", "azul marino", "azul", "celeste", "verde salvia", "esmeralda", "verde oliva",
  "rojo", "vino", "coral", "terracota", "mostaza", "dorado", "rosa palo", "fucsia", "lavanda", "morado", "malva", "café", "nude",
];

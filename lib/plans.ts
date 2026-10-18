export const PRICES = {
  monthly: Number(process.env.MP_PRICE_MONTHLY_COP ?? 24900),
  yearly: Number(process.env.MP_PRICE_YEARLY_COP ?? 199000),
};

export const FREE_LIMITS = { recommendation: 5, garment_scan: 25, body_scan: 1, garments: 30 };

export const PLAN_FEATURES = {
  free: [
    "Clóset digital de hasta 30 prendas",
    "25 escaneos de prendas con IA al mes",
    "5 recomendaciones por ocasión al mes",
    "Análisis básico de silueta (1 al mes)",
    "3 outfits con % de compatibilidad",
    "Sin anuncios",
  ],
  premium: [
    "Recomendaciones y escaneos ilimitados",
    "Clóset ilimitado",
    "Análisis avanzado de silueta y proporciones",
    "Sugerencias de compra para completar cada look",
    "Historial y calendario de outfits",
    "Protocolos especiales: madrina, novia, ponente",
  ],
};

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

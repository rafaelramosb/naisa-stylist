import type { Category, OccasionId } from "./types";

export interface ProtocolRule {
  id: string;
  test: "color" | "subcategory" | "style_tag" | "pattern" | "material" | "fit";
  values: string[];
  categories?: Category[]; // a qué prendas aplica (todas si se omite)
  severity: "prohibido" | "evitar";
  reason: string;
  onlyRole?: string[]; // aplica solo a estos roles
}

export interface Occasion {
  id: OccasionId;
  group: "Entrevistas de trabajo" | "Matrimonios" | "Eventos especiales" | "Reuniones" | "Día a día";
  label: string;
  dressCode: string;
  description: string;
  formality: [number, number];
  structures: Category[][]; // combinaciones base válidas
  recommended: Category[]; // suma puntos si está
  palette: "claros" | "oscuros" | "neutros" | "libre";
  rules: ProtocolRule[];
  protocol: string[]; // reglas de protocolo explicadas al usuario
  icon: string; // nombre de icono
}

const BASE_FORMAL_RULES: ProtocolRule[] = [
  { id: "no-deportivo", test: "style_tag", values: ["deportivo", "athleisure"], severity: "prohibido", reason: "Las prendas deportivas rompen el código formal." },
  { id: "no-tenis", test: "subcategory", values: ["tenis", "sneakers", "chanclas", "sandalia playera", "crocs"], categories: ["shoes"], severity: "prohibido", reason: "El calzado deportivo o de playa no corresponde a este protocolo." },
];

export const OCCASIONS: Occasion[] = [
  {
    id: "entrevista",
    group: "Entrevistas de trabajo",
    label: "Entrevista de trabajo",
    dressCode: "Business / smart formal",
    description: "Proyecta competencia y confianza sin robar protagonismo a tu discurso.",
    formality: [3, 5],
    structures: [["suit", "top", "shoes"], ["top", "bottom", "shoes"], ["dress", "shoes"]],
    recommended: ["outerwear", "bag"],
    palette: "neutros",
    icon: "briefcase",
    rules: [
      ...BASE_FORMAL_RULES,
      { id: "no-escote", test: "subcategory", values: ["crop top", "top strapless", "bralette", "body escotado"], severity: "prohibido", reason: "Escotes y abdomen descubierto distraen en una entrevista." },
      { id: "no-jean-roto", test: "subcategory", values: ["jean roto", "short", "minifalda"], severity: "prohibido", reason: "Demasiado informal para una primera impresión profesional." },
      { id: "estampado-fuerte", test: "pattern", values: ["animal print", "neón", "tie-dye"], severity: "evitar", reason: "Los estampados muy llamativos compiten con tu mensaje." },
      { id: "brillo", test: "material", values: ["lentejuelas", "lamé", "glitter"], severity: "prohibido", reason: "Los brillos son de noche, no de oficina." },
    ],
    protocol: [
      "Prioriza neutros (azul marino, gris, camel, blanco, negro) con un solo acento de color.",
      "Un blazer estructurado eleva cualquier combinación en sectores corporativos.",
      "Accesorios discretos: una pieza protagonista como máximo.",
      "En sectores creativos o tech puedes bajar un punto de formalidad, nunca dos.",
    ],
  },
  {
    id: "boda_dia",
    group: "Matrimonios",
    label: "Matrimonio de día",
    dressCode: "Formal de día / cóctel",
    description: "Ceremonias antes de las 6 p.m.: frescura, tonos claros y tejidos ligeros.",
    formality: [3, 4],
    structures: [["dress", "shoes"], ["top", "bottom", "shoes"], ["suit", "top", "shoes"]],
    recommended: ["bag", "jewelry"],
    palette: "claros",
    icon: "rings",
    rules: [
      ...BASE_FORMAL_RULES,
      { id: "no-blanco", test: "color", values: ["blanco", "marfil", "crema", "hueso", "perla"], categories: ["dress", "top", "bottom", "suit", "outerwear"], severity: "prohibido", reason: "El blanco y sus matices se reservan para la novia.", onlyRole: ["invitada", "madrina", "anfitriona"] },
      { id: "no-negro-total", test: "color", values: ["negro"], categories: ["dress", "suit"], severity: "evitar", reason: "El negro total es poco habitual en bodas de día; prefiere color." },
      { id: "no-lentejuela-dia", test: "material", values: ["lentejuelas", "lamé"], severity: "evitar", reason: "Los brillos intensos son de protocolo nocturno." },
      { id: "no-jean", test: "subcategory", values: ["jean", "jean roto", "short"], severity: "prohibido", reason: "El denim no corresponde a una boda." },
    ],
    protocol: [
      "Nunca blanco, marfil ni crema si no eres la novia.",
      "Largo midi o a la rodilla es el punto ideal; el largo al piso es para la noche.",
      "Tejidos ligeros: gasa, lino fino, crepé, seda lavada.",
      "Si eres madrina, coordina el tono con la familia de los novios.",
    ],
  },
  {
    id: "boda_noche",
    group: "Matrimonios",
    label: "Matrimonio de noche",
    dressCode: "Etiqueta / black tie opcional",
    description: "Después de las 6 p.m.: largos, tejidos nobles y tonos profundos.",
    formality: [4, 5],
    structures: [["dress", "shoes"], ["suit", "top", "shoes"], ["top", "bottom", "shoes"]],
    recommended: ["bag", "jewelry", "outerwear"],
    palette: "oscuros",
    icon: "moon",
    rules: [
      ...BASE_FORMAL_RULES,
      { id: "no-blanco", test: "color", values: ["blanco", "marfil", "crema", "hueso", "perla"], categories: ["dress", "top", "bottom", "suit", "outerwear"], severity: "prohibido", reason: "El blanco y sus matices se reservan para la novia.", onlyRole: ["invitada", "madrina", "anfitriona"] },
      { id: "no-casual", test: "style_tag", values: ["casual", "playero"], severity: "prohibido", reason: "Una boda de noche exige formalidad plena." },
      { id: "no-algodon", test: "material", values: ["algodón", "denim", "jersey deportivo"], categories: ["dress", "suit", "bottom"], severity: "evitar", reason: "Tejidos nobles (seda, satén, crepé, terciopelo) son el estándar de noche." },
    ],
    protocol: [
      "Largo al piso o midi en tejido noble; para hombres, traje oscuro o esmoquin si lo pide la invitación.",
      "Tonos joya (esmeralda, borgoña, zafiro) y oscuros son los protagonistas.",
      "El brillo se admite: lentejuela, satén o joyería statement, pero solo un foco.",
      "Cartera pequeña tipo clutch; nunca bolso de día.",
    ],
  },
  {
    id: "boda_playa",
    group: "Matrimonios",
    label: "Matrimonio en playa",
    dressCode: "Formal tropical",
    description: "Cartagena, Santa Marta, San Andrés: elegancia que respira.",
    formality: [3, 4],
    structures: [["dress", "shoes"], ["top", "bottom", "shoes"]],
    recommended: ["accessory", "jewelry"],
    palette: "claros",
    icon: "wave",
    rules: [
      { id: "no-deportivo", test: "style_tag", values: ["deportivo"], severity: "prohibido", reason: "Lo deportivo no corresponde a una boda." },
      { id: "no-blanco", test: "color", values: ["blanco", "marfil", "crema", "hueso", "perla"], categories: ["dress", "top", "bottom", "suit"], severity: "prohibido", reason: "El blanco se reserva para la novia.", onlyRole: ["invitada", "madrina", "anfitriona"] },
      { id: "no-tacon-aguja", test: "subcategory", values: ["tacón aguja", "stiletto"], categories: ["shoes"], severity: "evitar", reason: "En arena, mejor sandalia plana elegante o tacón ancho." },
      { id: "no-pesados", test: "material", values: ["terciopelo", "lana", "cuero"], severity: "evitar", reason: "Tejidos pesados son incómodos con calor y humedad." },
    ],
    protocol: [
      "Lino, gasa, algodón fino y seda: frescura sin perder formalidad.",
      "Sandalia elegante plana o de tacón ancho; nunca aguja en arena.",
      "Estampados tropicales o florales sí, siempre que el resto sea sobrio.",
    ],
  },
  {
    id: "evento_gala",
    group: "Eventos especiales",
    label: "Gala / evento de etiqueta",
    dressCode: "Black tie",
    description: "Premiaciones, galas benéficas y cenas de etiqueta.",
    formality: [5, 5],
    structures: [["dress", "shoes"], ["suit", "top", "shoes"]],
    recommended: ["bag", "jewelry"],
    palette: "oscuros",
    icon: "star",
    rules: [
      ...BASE_FORMAL_RULES,
      { id: "no-casual", test: "style_tag", values: ["casual", "urbano"], severity: "prohibido", reason: "Black tie no admite piezas casuales." },
      { id: "no-corto", test: "subcategory", values: ["minivestido", "minifalda", "short"], severity: "prohibido", reason: "Black tie exige largo al piso o esmoquin." },
    ],
    protocol: [
      "Largo al piso (mujeres) o esmoquin (hombres) es la norma.",
      "Un solo punto focal: escote, espalda, joyería o tejido, no todos.",
      "Peinado y maquillaje forman parte del protocolo.",
    ],
  },
  {
    id: "coctel",
    group: "Eventos especiales",
    label: "Cóctel / celebración",
    dressCode: "Cocktail",
    description: "Lanzamientos, cumpleaños elegantes, inauguraciones.",
    formality: [3, 4],
    structures: [["dress", "shoes"], ["top", "bottom", "shoes"], ["suit", "top", "shoes"]],
    recommended: ["bag", "jewelry"],
    palette: "libre",
    icon: "glass",
    rules: [
      ...BASE_FORMAL_RULES,
      { id: "no-largo-piso", test: "subcategory", values: ["vestido largo de gala"], categories: ["dress"], severity: "evitar", reason: "El largo al piso es excesivo para un cóctel." },
    ],
    protocol: [
      "Largo a la rodilla o midi; permite más color y textura que una boda.",
      "Es el momento ideal para una pieza statement.",
    ],
  },
  {
    id: "reunion_formal",
    group: "Reuniones",
    label: "Reunión formal",
    dressCode: "Business formal",
    description: "Juntas directivas, clientes, comités o presentaciones.",
    formality: [4, 5],
    structures: [["suit", "top", "shoes"], ["top", "bottom", "shoes"], ["dress", "shoes"]],
    recommended: ["outerwear", "bag"],
    palette: "neutros",
    icon: "table",
    rules: [
      ...BASE_FORMAL_RULES,
      { id: "no-informal", test: "subcategory", values: ["jean", "jean roto", "short", "camiseta estampada", "crop top"], severity: "prohibido", reason: "Demasiado informal para una reunión formal." },
      { id: "brillo", test: "material", values: ["lentejuelas", "lamé", "glitter"], severity: "prohibido", reason: "Brillos fuera de lugar en contexto ejecutivo." },
    ],
    protocol: [
      "Traje o conjunto de dos piezas en neutros profundos transmite autoridad.",
      "Ajuste impecable antes que marca: una prenda bien entallada eleva todo.",
    ],
  },
  {
    id: "reunion_informal",
    group: "Reuniones",
    label: "Reunión informal",
    dressCode: "Smart casual",
    description: "Almuerzos de trabajo, coworking, reuniones con amigos.",
    formality: [2, 3],
    structures: [["top", "bottom", "shoes"], ["dress", "shoes"]],
    recommended: ["outerwear", "accessory"],
    palette: "libre",
    icon: "coffee",
    rules: [
      { id: "no-gala", test: "material", values: ["lentejuelas", "lamé"], severity: "evitar", reason: "Demasiado arreglado para un contexto relajado." },
      { id: "no-chanclas", test: "subcategory", values: ["chanclas", "crocs"], categories: ["shoes"], severity: "evitar", reason: "Smart casual pide al menos un calzado cuidado." },
    ],
    protocol: [
      "Fórmula base: una prenda estructurada + una relajada (blazer con jean oscuro, por ejemplo).",
      "Tenis limpios y minimalistas son válidos en smart casual.",
    ],
  },
  {
    id: "cita",
    group: "Eventos especiales",
    label: "Cita / cena",
    dressCode: "Smart casual elevado",
    description: "Cenas, primeras citas o aniversarios.",
    formality: [2, 4],
    structures: [["dress", "shoes"], ["top", "bottom", "shoes"]],
    recommended: ["jewelry", "bag"],
    palette: "libre",
    icon: "heart",
    rules: [
      { id: "no-deportivo", test: "style_tag", values: ["deportivo"], severity: "evitar", reason: "Mejor algo que muestre intención." },
    ],
    protocol: [
      "Vístete como la mejor versión de ti, no como otra persona.",
      "Comodidad primero: si no puedes caminar con el tacón, no es el tacón.",
    ],
  },
  {
    id: "dia_casual",
    group: "Día a día",
    label: "Día a día",
    dressCode: "Casual",
    description: "Tu outfit diario con lo que ya tienes.",
    formality: [1, 3],
    structures: [["top", "bottom", "shoes"], ["dress", "shoes"]],
    recommended: ["outerwear", "bag"],
    palette: "libre",
    icon: "sun",
    rules: [],
    protocol: ["Repite fórmulas que te funcionan; varía con un accesorio."],
  },
];

export const OCCASION_MAP = Object.fromEntries(OCCASIONS.map((o) => [o.id, o])) as Record<OccasionId, Occasion>;

export const OCCASION_GROUPS = ["Entrevistas de trabajo", "Matrimonios", "Eventos especiales", "Reuniones", "Día a día"] as const;

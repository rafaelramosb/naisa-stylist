export interface Chapter { t: number; title: string; text: string }
export interface VideoInfo { id: string; src: string; webm: string; poster: string; title: string; subtitle: string; duration: string; chapters: Chapter[] }

export const VIDEO_HISTORIA: VideoInfo = {
  id: "historia-valentina",
  src: "/videos/historia-valentina.mp4",
  webm: "/videos/historia-valentina.webm",
  poster: "/videos/historia-valentina.jpg",
  title: "La historia de Valentina",
  subtitle: "Una boda, un clóset lleno y ninguna idea. Así lo resolvió en segundos.",
  duration: "0:31",
  chapters: [
    { t: 0, title: "La duda", text: "La noche antes del evento: el clóset lleno y la pregunta de siempre, ¿qué me pongo?" },
    { t: 4.3, title: "Foto de cuerpo completo", text: "Una foto basta para conocer tu silueta y los cortes que te favorecen. Puedes no guardarla." },
    { t: 8.6, title: "Escanea tu clóset", text: "Fotografía tus prendas: la IA reconoce tipo, color, tejido y nivel de formalidad." },
    { t: 11.6, title: "Elige la ocasión", text: "Entrevista, boda, gala o reunión. Cada ocasión trae su protocolo real." },
    { t: 14.6, title: "3 looks con % de compatibilidad", text: "Recibes 3 outfits con tus prendas, verificados por protocolo, color, silueta y estilo." },
    { t: 23.2, title: "El resultado", text: "Llegas segura, con el look correcto para el evento." },
  ],
};

export const VIDEO_RAPIDO: VideoInfo = {
  id: "en-20-segundos",
  src: "/videos/en-20-segundos.mp4",
  webm: "/videos/en-20-segundos.webm",
  poster: "/videos/en-20-segundos.jpg",
  title: "NAISA Stylist en 20 segundos",
  subtitle: "Los tres pasos de la app, de un vistazo.",
  duration: "0:22",
  chapters: [
    { t: 0, title: "¿Qué me pongo?", text: "La pregunta que la app responde por ti." },
    { t: 3.2, title: "Escanea tu clóset", text: "Tus prendas, catalogadas automáticamente." },
    { t: 7, title: "Elige la ocasión", text: "Ocho ocasiones con su código de vestimenta." },
    { t: 10.4, title: "3 outfits en segundos", text: "Cada uno con su porcentaje de compatibilidad." },
    { t: 15.2, title: "Protocolo real", text: "Código de vestimenta, silueta y estilo personal." },
  ],
};

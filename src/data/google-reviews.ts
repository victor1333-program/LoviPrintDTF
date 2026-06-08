export interface GoogleReview {
  name: string
  initials: string
  color: string
  rating: number
  date: string
  text: string
}

export const googleReviews: GoogleReview[] = [
  {
    name: "María García",
    initials: "MG",
    color: "bg-orange-500",
    rating: 5,
    date: "hace 2 semanas",
    text: "Calidad excelente, los colores salen súper vibrantes y el acabado es perfecto. Pedí 5 metros y llegaron en 24h. Repetiré seguro."
  },
  {
    name: "Carlos Rodríguez",
    initials: "CR",
    color: "bg-blue-500",
    rating: 5,
    date: "hace 1 mes",
    text: "Llevo pidiéndoles DTF para mi tienda desde hace meses. Servicio impecable y los transfers aguantan perfectamente los lavados."
  },
  {
    name: "Ana Martínez",
    initials: "AM",
    color: "bg-purple-500",
    rating: 5,
    date: "hace 3 semanas",
    text: "Muy profesionales. Tenía dudas con la maquetación y me ayudaron por WhatsApp en minutos. El resultado, espectacular."
  },
  {
    name: "Javier López",
    initials: "JL",
    color: "bg-green-500",
    rating: 4,
    date: "hace 2 meses",
    text: "Buena calidad y precio competitivo. La entrega fue rapidísima, en 48h estaba en mi taller. Solo pondría 5 estrellas si hubiera más descuentos por volumen."
  },
  {
    name: "Laura Sánchez",
    initials: "LS",
    color: "bg-pink-500",
    rating: 5,
    date: "hace 1 semana",
    text: "Primer pedido y encantada. El fondo blanco queda perfecto y la aplicación con la plancha casera funcionó a la primera siguiendo las instrucciones."
  },
  {
    name: "Pedro Ruiz",
    initials: "PR",
    color: "bg-red-500",
    rating: 5,
    date: "hace 3 meses",
    text: "Como profesional del textil, puedo decir que la calidad del DTF de LoviPrint está al nivel de las mejores imprentas. 100% recomendado."
  },
  {
    name: "Sandra Fernández",
    initials: "SF",
    color: "bg-cyan-500",
    rating: 5,
    date: "hace 4 días",
    text: "Perfecto para mi pequeña marca de ropa. Atención cercana, precios justos y los diseños salen tal cual los mando. Muy satisfecha."
  },
]

export const GOOGLE_REVIEWS_META = {
  ratingAverage: 4.6,
  totalReviews: 127,
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=LoviPrintDTF+Hellin",
} as const

import type { ParsedRequest, Provider } from "@/lib/types";

export const MOCK_USER_NAME = "María";

export const EXAMPLE_PARSED_REQUEST: ParsedRequest = {
  raw_intent: "fotógrafo para sesión de marca",
  category_hints: ["fotografía", "comercial"],
  urgency: "scheduled",
  is_remote: false,
  requires_presence: true,
  estimated_complexity: "medium",
  ambiguity_level: "low",
  clarification_needed: [],
  confidence: 0.92,
  summary: "Sesión fotográfica de marca con presencia en CABA",
  category: "Fotografía",
  categorySlug: "fotografia",
  location: "CABA",
};

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: "prov-1",
    name: "Martín Ríos",
    initials: "MR",
    category: "Cerrajería",
    categorySlug: "cerrajeria",
    rating: 4.9,
    reviewCount: 128,
    jobsCompleted: 340,
    responseTime: "~8 min",
    isVerified: true,
    description:
      "Apertura de puertas, cambio de cerraduras y urgencias 24/7 en zona norte y CABA.",
    priceMin: 12000,
    priceMax: 25000,
    distanceKm: 1.2,
    etaMinutes: 12,
    availableNow: true,
    nextAvailability: "Disponible ahora",
  },
  {
    id: "prov-2",
    name: "Laura Vega",
    initials: "LV",
    category: "Fotografía",
    categorySlug: "fotografia",
    rating: 4.8,
    reviewCount: 96,
    jobsCompleted: 210,
    responseTime: "~2 h",
    isVerified: true,
    description:
      "Fotografía comercial y de marca. Estudio propio y locación. Entrega en 48 h.",
    priceMin: 45000,
    priceMax: 90000,
    distanceKm: 3.4,
    etaMinutes: 25,
    availableNow: false,
    nextAvailability: "Mañana 10:00",
  },
  {
    id: "prov-3",
    name: "Pablo Soto",
    initials: "PS",
    category: "Electricista",
    categorySlug: "electricista",
    rating: 4.7,
    reviewCount: 74,
    jobsCompleted: 185,
    responseTime: "~1 h",
    isVerified: true,
    description:
      "Instalaciones, tableros y reparaciones eléctricas con matrícula habilitante.",
    priceMin: 15000,
    priceMax: 40000,
    distanceKm: 2.8,
    etaMinutes: 18,
    availableNow: true,
    nextAvailability: "Hoy 16:00",
  },
  {
    id: "prov-4",
    name: "Ana Morales",
    initials: "AM",
    category: "Plomería",
    categorySlug: "plomeria",
    rating: 4.5,
    reviewCount: 52,
    jobsCompleted: 142,
    responseTime: "~3 h",
    isVerified: false,
    description:
      "Destapes, pérdidas y reparaciones de baños y cocina. Atención en el día.",
    priceMin: 10000,
    priceMax: 28000,
    distanceKm: 4.1,
    etaMinutes: 30,
    availableNow: false,
    nextAvailability: "Hoy 18:30",
  },
  {
    id: "prov-5",
    name: "Diego Fuentes",
    initials: "DF",
    category: "Abogado",
    categorySlug: "abogado",
    rating: 4.9,
    reviewCount: 61,
    jobsCompleted: 98,
    responseTime: "~4 h",
    isVerified: true,
    description:
      "Asesoría en contratos, consumidor y derecho laboral. Primera consulta online.",
    priceMin: 20000,
    priceMax: 55000,
    distanceKm: 0,
    etaMinutes: 0,
    availableNow: true,
    nextAvailability: "Consulta hoy",
  },
  {
    id: "prov-6",
    name: "Carla Núñez",
    initials: "CN",
    category: "Contador",
    categorySlug: "contador",
    rating: 4.6,
    reviewCount: 44,
    jobsCompleted: 120,
    responseTime: "~6 h",
    isVerified: true,
    description:
      "Monotributo, IVA y liquidación de sueldos para pymes y freelancers.",
    priceMin: 18000,
    priceMax: 42000,
    distanceKm: 0,
    etaMinutes: 0,
    availableNow: false,
    nextAvailability: "Lunes 09:00",
  },
  {
    id: "prov-7",
    name: "Sofía Lin",
    initials: "SL",
    category: "Diseño",
    categorySlug: "diseno",
    rating: 4.8,
    reviewCount: 88,
    jobsCompleted: 176,
    responseTime: "~5 h",
    isVerified: true,
    description:
      "Identidad visual, piezas para redes y packaging. Proceso colaborativo.",
    priceMin: 35000,
    priceMax: 80000,
    distanceKm: 0,
    etaMinutes: 0,
    availableNow: true,
    nextAvailability: "Disponible hoy",
  },
  {
    id: "prov-8",
    name: "Tomás Gil",
    initials: "TG",
    category: "Fotografía",
    categorySlug: "fotografia",
    rating: 4.7,
    reviewCount: 67,
    jobsCompleted: 154,
    responseTime: "~3 h",
    isVerified: true,
    description:
      "Sesiones de producto y retrato corporativo. Equipo full frame y luz de estudio.",
    priceMin: 40000,
    priceMax: 85000,
    distanceKm: 5.2,
    etaMinutes: 35,
    availableNow: false,
    nextAvailability: "Viernes 14:00",
  },
];

export function formatPriceRange(min: number, max: number): string {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(min)} – ${formatter.format(max)}`;
}

export function getProvidersByCategorySlug(slug: string): Provider[] {
  if (slug === "ver-mas") {
    return MOCK_PROVIDERS;
  }

  return MOCK_PROVIDERS.filter((provider) => provider.categorySlug === slug);
}

export function getRankedUrgentProviders(categorySlug?: string): Provider[] {
  const pool = categorySlug
    ? MOCK_PROVIDERS.filter((provider) => provider.categorySlug === categorySlug)
    : MOCK_PROVIDERS.filter((provider) => provider.availableNow);

  return [...pool]
    .sort((a, b) => {
      const scoreA = a.rating * 10 - a.distanceKm - a.etaMinutes * 0.1;
      const scoreB = b.rating * 10 - b.distanceKm - b.etaMinutes * 0.1;
      return scoreB - scoreA;
    })
    .slice(0, 3);
}

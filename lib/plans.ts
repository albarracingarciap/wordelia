// Fuente única de los planes de usuario. La consumen la sección de precios de la
// home (components/landing/Pricing.tsx) y la página de pago (app/planes/page.tsx),
// para que ambas muestren SIEMPRE lo mismo. Los precios de cobro reales viven en
// lib/pricing.ts (en céntimos); aquí solo están las cadenas de display.
//
// Los IDs (explorador / voraz / ai) se mantienen estables: alimentan /register,
// el checkout de PayPal (referenceId) y el desbloqueo de recursos (resolveAccess:
// plan "ai" libera guías, "voraz"/"ai" liberan genomas).

export type PlanId = "explorador" | "voraz" | "ai";

export interface PlanFeature {
    text: string;
    included: boolean;
}

export interface Plan {
    id: PlanId;
    name: string;
    monthlyPrice: string;
    annualPrice: string;
    description: string;
    cta: string;
    popular?: boolean;
    founderClubs: number;
    features: PlanFeature[];
    /** Nota al pie de la tarjeta (p. ej. aclaración del asterisco de las funciones IA). */
    footnote?: string;
}

export const PLANS: Plan[] = [
    {
        id: "explorador",
        name: "Lector Explorador",
        monthlyPrice: "0€",
        annualPrice: "0€",
        description: "Para empezar a organizar tu biblioteca, registrar sesiones y guardar lo que te mueve.",
        cta: "Empezar gratis",
        founderClubs: 1,
        features: [
            { text: "Biblioteca personal", included: true },
            { text: "Seguimiento de lecturas y rachas", included: true },
            { text: "Notas, citas y emociones", included: true },
            { text: "Unirse a clubs públicos y de Wordelia", included: true },
            { text: "Crear 1 club público", included: true },
            { text: "Muestra de guía y genoma", included: true },
            { text: "Genomas literarios ilimitados", included: false },
            { text: "Clubs privados y secretos", included: false },
        ],
    },
    {
        id: "voraz",
        name: "Lector Voraz",
        monthlyPrice: "6,99€",
        annualPrice: "67,10€",
        description: "Para profundizar en cada libro, crear tus clubs y desbloquear todos los Genomas literarios sin límites.",
        cta: "Elegir este plan",
        popular: true,
        founderClubs: 2,
        features: [
            { text: "Todo lo del plan Explorador", included: true },
            { text: "Genomas literarios ilimitados", included: true },
            { text: "Nuevos genomas cada mes", included: true },
            { text: "Mapas emocionales completos", included: true },
            { text: "Crear y moderar clubs", included: true },
            { text: "Estadísticas avanzadas", included: true },
            { text: "Sin publicidad", included: true },
            { text: "Guías de discusión ilimitadas", included: false },
            { text: "Asistente literario IA", included: false },
        ],
    },
    {
        id: "ai",
        name: "Bibliófilo",
        monthlyPrice: "14,99€",
        annualPrice: "143,90€",
        description: "Acceso total: todas las guías y genomas sin límite, más tu asistente literario con IA.",
        cta: "Elegir este plan",
        founderClubs: 3,
        features: [
            { text: "Todo lo del plan Voraz", included: true },
            { text: "Guías de discusión ilimitadas", included: true },
            { text: "Nuevas guías y genomas cada mes", included: true },
            { text: "Recomendaciones de lectura con IA *", included: true },
            { text: "Tus estadísticas contadas por IA *", included: true },
            { text: "Herramientas de club con IA (mapa emocional y sesiones) *", included: true },
            { text: "Acceso anticipado a novedades", included: true },
            { text: "Soporte prioritario", included: true },
        ],
        footnote: "* Las funciones con IA estarán disponibles en septiembre de 2026.",
    },
];

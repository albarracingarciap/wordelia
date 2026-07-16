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
            { text: "Unirse a clubs públicos", included: true },
            { text: "Muestra de guía y genoma", included: true },
            { text: "Genomas (ADN) ilimitados", included: false },
            { text: "Crear clubs privados", included: false },
        ],
    },
    {
        id: "voraz",
        name: "Lector Voraz",
        monthlyPrice: "6,99€",
        annualPrice: "67,10€",
        description: "Para profundizar en cada libro, crear tus clubs y desbloquear el ADN literario sin límites.",
        cta: "Elegir este plan",
        popular: true,
        founderClubs: 2,
        features: [
            { text: "Todo lo del plan Explorador", included: true },
            { text: "Genomas (ADN) ilimitados", included: true },
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
            { text: "Genomas (ADN) ilimitados", included: true },
            { text: "Nuevas guías y genomas cada mes", included: true },
            { text: "Asistente literario IA", included: true },
            { text: "Sugerencias para tus clubs", included: true },
            { text: "Acceso anticipado a novedades", included: true },
            { text: "Soporte prioritario", included: true },
        ],
    },
];

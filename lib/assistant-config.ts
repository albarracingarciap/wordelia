// Configuración única de las funciones de IA (asistente literario, plan Bibliófilo).
// NO es un chatbot: son funciones-motor con tarea acotada. Ver memoria
// asistente-literario-ia. Proveedor: Claude (Anthropic), server-side con
// ANTHROPIC_API_KEY. Modelo por función: Haiku para las tareas acotadas,
// Sonnet para "preparar sesión" (comprensión literaria de guía + genoma).

export type AssistantFeature = "next_read" | "stats_narrative" | "club_emotions" | "club_session";

export type AssistantModel = "claude-haiku-5-5" | "claude-sonnet-5-5";

export const FEATURE_MODEL: Record<AssistantFeature, AssistantModel> = {
    next_read: "claude-haiku-5-5",
    stats_narrative: "claude-haiku-5-5",
    club_emotions: "claude-haiku-5-5",
    club_session: "claude-sonnet-5-5",
};

// Esfuerzo (profundidad del razonamiento previo, que se factura como salida).
export const FEATURE_EFFORT: Record<AssistantFeature, "low" | "medium"> = {
    next_read: "low",
    stats_narrative: "low",
    club_emotions: "low",
    club_session: "medium",
};

// Techo de tokens de salida por función. Incluye el razonamiento previo del
// modelo, así que va holgado: se factura lo que se genera, no el techo.
export const FEATURE_MAX_TOKENS: Record<AssistantFeature, number> = {
    next_read: 2000,
    stats_narrative: 2000,
    club_emotions: 2000,
    club_session: 8000,
};

// Precio en $ por millón de tokens (API de Anthropic, nov. 2026; Haiku 5.5 con
// prompts ≤100K tokens, que es siempre nuestro caso).
export const MODEL_PRICES: Record<AssistantModel, { input: number; output: number }> = {
    "claude-haiku-5-5": { input: 0.1, output: 0.5 },
    "claude-sonnet-5-5": { input: 2, output: 10 },
};

// TTL de la caché de salidas por función (ms). Evita regenerar en cada vista.
export const FEATURE_CACHE_TTL_MS: Record<AssistantFeature, number> = {
    next_read: 24 * 60 * 60 * 1000,        // 1 día
    stats_narrative: 7 * 24 * 60 * 60 * 1000, // 1 semana
    club_emotions: 12 * 60 * 60 * 1000,    // 12 h
    club_session: 24 * 60 * 60 * 1000,     // 1 día
};

// Topes mensuales por usuario (admin sin límite), en dos bolsas:
// - general: próxima lectura + estadísticas en palabras + mapa emocional (compartida)
// - session: preparar sesión (la más cara, con Sonnet)
export type QuotaPool = "general" | "session";
export const MONTHLY_CAPS: Record<QuotaPool, number> = { general: 120, session: 30 };
export const FEATURE_POOL: Record<AssistantFeature, QuotaPool> = {
    next_read: "general",
    stats_narrative: "general",
    club_emotions: "general",
    club_session: "session",
};
export function poolFeatures(pool: QuotaPool): AssistantFeature[] {
    return (Object.keys(FEATURE_POOL) as AssistantFeature[]).filter((f) => FEATURE_POOL[f] === pool);
}

// Rate-limit por minuto (anti-abuso de "Actualizar"; admin sin límite).
export const RATE_LIMIT_PER_MIN = 10;

// Coste estimado de una llamada en micro-dólares (para ai_usage).
export function estimateCostMicros(feature: AssistantFeature, inputTokens: number, outputTokens: number): number {
    const price = MODEL_PRICES[FEATURE_MODEL[feature]];
    return Math.round(inputTokens * price.input + outputTokens * price.output);
}

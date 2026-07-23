// Configuración única de las funciones de IA (asistente literario, plan Bibliófilo).
// NO es un chatbot: son funciones-motor con tarea acotada. Ver memoria
// asistente-literario-ia. Proveedor: Mistral gestionado por Wordelia (server-side).

export const ASSISTANT_MODEL = "mistral-large-latest";
export const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
// Mistral admite temperatura 0.0–0.7.
export const ASSISTANT_TEMPERATURE = 0.5;

// Precio de mistral-large-latest (Large 3), en $ por millón de tokens.
export const PRICE_INPUT_PER_M = 0.5;
export const PRICE_OUTPUT_PER_M = 1.5;

export type AssistantFeature = "next_read" | "stats_narrative" | "club_emotions" | "club_session";

// Techo de tokens de salida por función (acota coste por acción).
export const FEATURE_MAX_TOKENS: Record<AssistantFeature, number> = {
    next_read: 600,
    stats_narrative: 450,
    club_emotions: 700,
    club_session: 1100,
};

// TTL de la caché de salidas por función (ms). Evita regenerar en cada vista.
export const FEATURE_CACHE_TTL_MS: Record<AssistantFeature, number> = {
    next_read: 24 * 60 * 60 * 1000,        // 1 día
    stats_narrative: 7 * 24 * 60 * 60 * 1000, // 1 semana
    club_emotions: 12 * 60 * 60 * 1000,    // 12 h
    club_session: 24 * 60 * 60 * 1000,     // 1 día
};

// Tope mensual de acciones de IA por usuario (anti-abuso; admin sin límite).
export const MONTHLY_ACTION_CAP = 200;

// Rate-limit por minuto (anti-abuso de "Actualizar"; admin sin límite).
export const RATE_LIMIT_PER_MIN = 10;

// Coste estimado de una llamada en micro-dólares (para ai_usage).
export function estimateCostMicros(inputTokens: number, outputTokens: number): number {
    return Math.round(inputTokens * PRICE_INPUT_PER_M + outputTokens * PRICE_OUTPUT_PER_M);
}

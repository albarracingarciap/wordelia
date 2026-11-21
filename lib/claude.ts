// Cliente de Claude para las funciones de IA, server-only. La API key
// (ANTHROPIC_API_KEY) NUNCA toca el navegador: el SDK la lee del entorno.
// Modelo, esfuerzo y techo de tokens salen de la función (lib/assistant-config).
import Anthropic from "@anthropic-ai/sdk";
import { FEATURE_EFFORT, FEATURE_MAX_TOKENS, FEATURE_MODEL, type AssistantFeature } from "./assistant-config";

export interface AiUsage {
    inputTokens: number;
    outputTokens: number;
}

export interface AiResult {
    content: string;
    usage: AiUsage;
}

export class AiError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = "AiError";
    }
}

interface CallOptions {
    feature: AssistantFeature;
    system: string;
    user: string;
    /** Si se da, la respuesta se restringe a este JSON Schema (structured outputs). */
    jsonSchema?: Record<string, unknown>;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) throw new AiError("ANTHROPIC_API_KEY no está configurada.");
    client ??= new Anthropic();
    return client;
}

type Block = { type: string; text?: string };
type Usage = {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
};

function toResult(content: Block[], stopReason: string | null, usage: Usage): AiResult {
    // Una negativa de los clasificadores de seguridad llega como 200 con stop_reason "refusal".
    if (stopReason === "refusal") throw new AiError("El modelo ha declinado la petición.");
    // Leer por tipo: la respuesta puede empezar con bloques de razonamiento (thinking).
    const text = content
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("");
    if (stopReason === "max_tokens" && !text) throw new AiError("La respuesta se ha cortado antes de empezar.");
    return {
        content: text,
        usage: {
            inputTokens: usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0),
            outputTokens: usage.output_tokens,
        },
    };
}

export async function callClaude({ feature, system, user, jsonSchema }: CallOptions): Promise<AiResult> {
    const anthropic = getClient();
    const model = FEATURE_MODEL[feature];
    const output_config = {
        effort: FEATURE_EFFORT[feature],
        ...(jsonSchema ? { format: { type: "json_schema" as const, schema: jsonSchema } } : {}),
    };
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];

    try {
        if (model === "claude-sonnet-5-5") {
            // Sonnet: si los clasificadores declinan, la API reintenta en el modelo de
            // respaldo dentro de la misma llamada (fallback del lado del servidor).
            const res = await anthropic.beta.messages.create({
                model,
                max_tokens: FEATURE_MAX_TOKENS[feature],
                system,
                messages,
                output_config,
                betas: ["server-side-fallback-2026-07-01"],
                fallbacks: "default",
            });
            return toResult(res.content as Block[], res.stop_reason, res.usage);
        }
        // Haiku: sin fallback del servidor; una negativa se trata como error.
        const res = await anthropic.messages.create({
            model,
            max_tokens: FEATURE_MAX_TOKENS[feature],
            system,
            messages,
            output_config,
        });
        return toResult(res.content as Block[], res.stop_reason, res.usage);
    } catch (e) {
        if (e instanceof AiError) throw e;
        if (e instanceof Anthropic.RateLimitError) throw new AiError("Claude: límite de peticiones alcanzado.", 429);
        if (e instanceof Anthropic.AuthenticationError) throw new AiError("Claude: API key no válida.", 401);
        if (e instanceof Anthropic.APIError) throw new AiError(`Claude respondió ${e.status}: ${e.message}`, e.status);
        throw new AiError(`No se pudo contactar con Claude: ${(e as Error).message}`);
    }
}

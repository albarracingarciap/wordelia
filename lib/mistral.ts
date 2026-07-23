// Cliente mínimo de Mistral (chat completions), server-only. La API key NUNCA
// toca el navegador. Contrato: POST /v1/chat/completions, Bearer auth,
// respuesta { choices:[{message:{content}}], usage:{prompt_tokens, completion_tokens} }.
import { ASSISTANT_MODEL, ASSISTANT_TEMPERATURE, MISTRAL_API_URL } from "./assistant-config";

export interface MistralUsage {
    inputTokens: number;
    outputTokens: number;
}

export interface MistralResult {
    content: string;
    usage: MistralUsage;
}

export class MistralError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = "MistralError";
    }
}

interface CallOptions {
    system: string;
    user: string;
    maxTokens: number;
    jsonMode?: boolean;
}

export async function callMistral({ system, user, maxTokens, jsonMode }: CallOptions): Promise<MistralResult> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new MistralError("MISTRAL_API_KEY no está configurada.");

    const body: Record<string, unknown> = {
        model: ASSISTANT_MODEL,
        temperature: ASSISTANT_TEMPERATURE,
        max_tokens: maxTokens,
        messages: [
            { role: "system", content: system },
            { role: "user", content: user },
        ],
    };
    if (jsonMode) body.response_format = { type: "json_object" };

    let res: Response;
    try {
        res = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        });
    } catch (e) {
        throw new MistralError(`No se pudo contactar con Mistral: ${(e as Error).message}`);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new MistralError(`Mistral respondió ${res.status}: ${text.slice(0, 300)}`, res.status);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const usage = data?.usage ?? {};
    return {
        content,
        usage: {
            inputTokens: usage.prompt_tokens || 0,
            outputTokens: usage.completion_tokens || 0,
        },
    };
}

// Acceso, cuota y caché de las funciones de IA. Server-only (usa el cliente
// de Supabase con sesión). El gate de funciones de lector es plan Bibliófilo
// (`ai`) o rol admin/editor. Las funciones de club añadirán librerías en F3.
import { createClient } from "@/utils/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription-access";
import {
    estimateCostMicros,
    FEATURE_CACHE_TTL_MS,
    FEATURE_POOL,
    MONTHLY_CAPS,
    RATE_LIMIT_PER_MIN,
    poolFeatures,
    type AssistantFeature,
    type QuotaPool,
} from "@/lib/assistant-config";
import type { AiUsage } from "@/lib/claude";

export interface AssistantAccess {
    userId: string | null;
    isAdmin: boolean;
    plan: string | null;
    allowed: boolean;
    reason?: "unauthenticated" | "requires_plan" | "coming_soon";
}

export async function getAssistantAccess(): Promise<AssistantAccess> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { userId: null, isAdmin: false, plan: null, allowed: false, reason: "unauthenticated" };

    const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("user_subscriptions").select("plan, status, current_period_end").eq("user_id", user.id).maybeSingle(),
    ]);

    const role = (profileRes.data as { role?: string } | null)?.role;
    const isAdmin = role === "admin" || role === "editor";
    const sub = subRes.data as { plan: string; status: string; current_period_end: string | null } | null;
    const plan = sub && isSubscriptionActive(sub.status, sub.current_period_end) ? sub.plan : null;
    // Temporal (hasta septiembre de 2026): las funciones de IA solo están activas
    // para admin/editor (para poder probarlas). El plan Bibliófilo aún no las
    // desbloquea; al resto se le muestra "próximamente". Restaurar a
    // `isAdmin || plan === "ai"` cuando se activen.
    const allowed = isAdmin;

    return { userId: user.id, isAdmin, plan, allowed, reason: allowed ? undefined : "coming_soon" };
}

// Nº de acciones de IA del usuario en el mes natural en curso, dentro de una bolsa.
export async function getMonthlyActionCount(userId: string, pool: QuotaPool): Promise<number> {
    const supabase = await createClient();
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("feature", poolFeatures(pool))
        .gte("created_at", start.toISOString());
    return count || 0;
}

// True si al usuario le queda cuota mensual para esa función (admin no tiene límite).
// Bolsas: 120/mes compartidas entre próxima lectura, estadísticas y mapa emocional;
// 30/mes para preparar sesión.
export async function hasMonthlyQuota(userId: string, isAdmin: boolean, feature: AssistantFeature): Promise<boolean> {
    if (isAdmin) return true;
    const pool = FEATURE_POOL[feature];
    const used = await getMonthlyActionCount(userId, pool);
    return used < MONTHLY_CAPS[pool];
}

// True si el usuario no ha superado el rate-limit por minuto (admin sin límite).
export async function withinRateLimit(userId: string, isAdmin: boolean): Promise<boolean> {
    if (isAdmin) return true;
    const supabase = await createClient();
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since);
    return (count || 0) < RATE_LIMIT_PER_MIN;
}

// Registra el consumo de una llamada (tokens + coste estimado).
export async function logAiUsage(userId: string, feature: AssistantFeature, usage: AiUsage): Promise<void> {
    const supabase = await createClient();
    await supabase.from("ai_usage").insert({
        user_id: userId,
        feature,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        cost_micros: estimateCostMicros(feature, usage.inputTokens, usage.outputTokens),
    });
}

// Devuelve la salida cacheada si existe y no ha caducado (TTL por función).
export async function getCachedGeneration<T>(userId: string, feature: AssistantFeature, entityKey = ""): Promise<T | null> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("ai_generations")
        .select("content, created_at")
        .eq("user_id", userId)
        .eq("feature", feature)
        .eq("entity_key", entityKey)
        .maybeSingle();

    if (!data) return null;
    const age = Date.now() - new Date(data.created_at as string).getTime();
    if (age > FEATURE_CACHE_TTL_MS[feature]) return null;
    return data.content as T;
}

// Guarda (o reemplaza) la salida cacheada de una función.
export async function saveGeneration(userId: string, feature: AssistantFeature, content: unknown, entityKey = ""): Promise<void> {
    const supabase = await createClient();
    await supabase
        .from("ai_generations")
        .upsert(
            { user_id: userId, feature, entity_key: entityKey, content: content as object, created_at: new Date().toISOString() },
            { onConflict: "user_id, feature, entity_key" },
        );
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { MONTHLY_ACTION_CAP } from "@/lib/assistant-config";

export interface AiUsageSummary {
    monthActions: number;
    monthCostUsd: number;
    monthInputTokens: number;
    monthOutputTokens: number;
    byFeature: { feature: string; actions: number; costUsd: number }[];
    byDay: { day: string; actions: number; costUsd: number }[];
    topUsers: { userId: string; name: string; actions: number; costUsd: number }[];
    cap: number;
}

const EMPTY: AiUsageSummary = {
    monthActions: 0,
    monthCostUsd: 0,
    monthInputTokens: 0,
    monthOutputTokens: 0,
    byFeature: [],
    byDay: [],
    topUsers: [],
    cap: MONTHLY_ACTION_CAP,
};

async function assertAdmin(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = (profile as { role?: string } | null)?.role;
    return role === "admin" || role === "editor";
}

type UsageRow = { user_id: string; feature: string; cost_micros: number | null; input_tokens: number | null; output_tokens: number | null; created_at: string };

export async function getAiUsageSummary(): Promise<AiUsageSummary> {
    if (!(await assertAdmin())) return EMPTY;

    // RLS de ai_usage solo deja ver lo propio → para agregar TODO usamos service role.
    const admin = createAdminClient() as unknown as {
        from: (t: string) => {
            select: (c: string) => {
                gte: (col: string, v: string) => { limit: (n: number) => Promise<{ data: UsageRow[] | null }> };
                in: (col: string, v: string[]) => Promise<{ data: { id: string; full_name: string | null; username: string | null }[] | null }>;
            };
        };
    };

    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 86400000);
    windowStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data } = await admin
        .from("ai_usage")
        .select("user_id, feature, cost_micros, input_tokens, output_tokens, created_at")
        .gte("created_at", windowStart.toISOString())
        .limit(20000);
    const rows = (data || []) as UsageRow[];

    const usd = (micros: number) => Math.round((micros / 1_000_000) * 10000) / 10000;

    // Mes en curso.
    const monthRows = rows.filter((r) => new Date(r.created_at) >= monthStart);
    const monthCostMicros = monthRows.reduce((s, r) => s + (r.cost_micros || 0), 0);
    const monthInputTokens = monthRows.reduce((s, r) => s + (r.input_tokens || 0), 0);
    const monthOutputTokens = monthRows.reduce((s, r) => s + (r.output_tokens || 0), 0);

    // Por función (mes).
    const featAgg: Record<string, { actions: number; micros: number }> = {};
    for (const r of monthRows) {
        const a = (featAgg[r.feature] ||= { actions: 0, micros: 0 });
        a.actions += 1;
        a.micros += r.cost_micros || 0;
    }
    const byFeature = Object.entries(featAgg)
        .map(([feature, a]) => ({ feature, actions: a.actions, costUsd: usd(a.micros) }))
        .sort((x, y) => y.costUsd - x.costUsd);

    // Por día (30 días).
    const dayAgg: Record<string, { actions: number; micros: number }> = {};
    for (const r of rows) {
        const day = r.created_at.slice(0, 10);
        const a = (dayAgg[day] ||= { actions: 0, micros: 0 });
        a.actions += 1;
        a.micros += r.cost_micros || 0;
    }
    const byDay = Object.entries(dayAgg)
        .map(([day, a]) => ({ day, actions: a.actions, costUsd: usd(a.micros) }))
        .sort((x, y) => x.day.localeCompare(y.day));

    // Top usuarios (mes).
    const userAgg: Record<string, { actions: number; micros: number }> = {};
    for (const r of monthRows) {
        const a = (userAgg[r.user_id] ||= { actions: 0, micros: 0 });
        a.actions += 1;
        a.micros += r.cost_micros || 0;
    }
    const topEntries = Object.entries(userAgg).sort((x, y) => y[1].micros - x[1].micros).slice(0, 10);
    const nameById = new Map<string, string>();
    if (topEntries.length) {
        const { data: profiles } = await admin.from("profiles").select("id, full_name, username").in("id", topEntries.map(([id]) => id));
        for (const p of (profiles || []) as { id: string; full_name: string | null; username: string | null }[]) {
            nameById.set(p.id, p.full_name || (p.username ? `@${p.username}` : p.id.slice(0, 8)));
        }
    }
    const topUsers = topEntries.map(([userId, a]) => ({
        userId,
        name: nameById.get(userId) || userId.slice(0, 8),
        actions: a.actions,
        costUsd: usd(a.micros),
    }));

    return {
        monthActions: monthRows.length,
        monthCostUsd: usd(monthCostMicros),
        monthInputTokens,
        monthOutputTokens,
        byFeature,
        byDay,
        topUsers,
        cap: MONTHLY_ACTION_CAP,
    };
}

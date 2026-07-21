"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface ReadingChallenge {
    year: number;
    target: number | null; // meta fijada (null = sin fijar)
    booksRead: number; // libros terminados en el año (en vivo)
    goalId: string | null;
}

function yearBounds(year: number) {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Reto del año: meta (reading_goals) + progreso contado en vivo desde user_books. */
export async function getReadingChallenge(year?: number): Promise<ReadingChallenge | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const y = year ?? new Date().getFullYear();
    const { start, end } = yearBounds(y);

    const [goalRes, countRes] = await Promise.all([
        // reading_goals no está en los tipos generados todavía.
        (supabase.from("reading_goals") as any)
            .select("id, target")
            .eq("user_id", user.id)
            .eq("year", y)
            .maybeSingle(),
        supabase
            .from("user_books")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "READ")
            .gte("finish_date", start)
            .lte("finish_date", end),
    ]);

    return {
        year: y,
        target: goalRes.data?.target ?? null,
        booksRead: countRes.count ?? 0,
        goalId: goalRes.data?.id ?? null,
    };
}

export async function setReadingGoalAction(
    year: number,
    target: number,
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (!Number.isFinite(target) || target < 1 || target > 9999) return { error: "Meta no válida." };

    const { error } = await (supabase.from("reading_goals") as any).upsert(
        { user_id: user.id, year, target: Math.round(target), updated_at: new Date().toISOString() },
        { onConflict: "user_id,year" },
    );
    if (error) return { error: error.message };

    revalidatePath("/app/mi-lectura");
    return { success: true };
}

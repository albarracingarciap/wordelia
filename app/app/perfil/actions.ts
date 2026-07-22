"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SECONDARY_GOAL_BY_KEY, normalizeSecondaryKeys, type SecondaryGoalStatus } from "@/lib/secondary-goals";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const updates: any = {
        updated_at: new Date().toISOString(),
    };

    const fields = [
        { key: 'fullName', db: 'full_name' },
        { key: 'location', db: 'location' },
        { key: 'bio', db: 'bio' },
        { key: 'pronouns', db: 'pronouns' },
        { key: 'birthDate', db: 'birth_date' },
        { key: 'avatarUrl', db: 'avatar_url' },
        { key: 'banner_color', db: 'banner_color' },
        { key: 'website', db: 'website' },
        { key: 'headerImageUrl', db: 'header_image_url' },
    ];

    fields.forEach(({ key, db }) => {
        if (formData.has(key)) {
            updates[db] = formData.get(key) as string;
        }
    });

    // Username: validación de formato + unicidad (aparte del resto).
    if (formData.has('username')) {
        const raw = String(formData.get('username') || '').trim().toLowerCase();
        if (raw) {
            if (!/^[a-z0-9_]{3,30}$/.test(raw)) {
                return { error: "El nombre de usuario debe tener 3-30 caracteres: solo letras, números o guion bajo." };
            }
            const { data: taken } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", raw)
                .neq("id", user.id)
                .maybeSingle();
            if (taken) return { error: "Ese nombre de usuario ya está en uso." };
            updates.username = raw;
        }
    }

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
        // Choque de unicidad (username) por si el pre-chequeo no lo vio (RLS).
        if ((error as { code?: string }).code === "23505") {
            return { error: "Ese nombre de usuario ya está en uso." };
        }
        console.error("Error updating profile:", error);
        return { error: "Error al actualizar perfil" };
    }

    revalidatePath("/app/perfil");
    revalidatePath("/app/perfil/editar");
    return { success: true };
}

export async function updatePreferences(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const format = formData.get("readingFormat") as string;
    const complexity = formData.get("storyComplexity") ? parseInt(formData.get("storyComplexity") as string) : null;
    const elements = formData.get("engagementElements") ? JSON.parse(formData.get("engagementElements") as string) : [];
    const favoriteGenres = formData.get("favoriteGenres") ? JSON.parse(formData.get("favoriteGenres") as string) : [];
    const spoilerPreference = formData.get("spoilerPreference") === "true"; // Parse boolean

    // Could also handle "preferred_time" if added to schema, but sticking to plan

    const updates = {
        reading_format_preference: format,
        story_complexity_preference: complexity,
        engagement_elements: elements,
        favorite_genres: favoriteGenres,
        spoiler_preference: spoilerPreference,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
        console.error("Error updating preferences:", error);
        return { error: "Error al actualizar preferencias" };
    }

    revalidatePath("/app/perfil");
    return { success: true };
}

export async function updateGoals(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const mainGoal = formData.get("mainGoal") ? parseInt(formData.get("mainGoal") as string) : 50;
    const pagesGoal = formData.get("pagesGoal") ? parseInt(formData.get("pagesGoal") as string) : null;
    const streakGoal = formData.get("streakGoal") ? parseInt(formData.get("streakGoal") as string) : null;
    const secondaryGoals = formData.get("secondaryGoals") ? JSON.parse(formData.get("secondaryGoals") as string) : [];

    // El objetivo anual de libros es ÚNICO: vive en reading_goals (misma fuente que
    // el widget de Mi lectura y el reto compartible). profiles.goals guarda solo el
    // resto (páginas, racha, secundarias).
    if (Number.isFinite(mainGoal) && mainGoal >= 1 && mainGoal <= 9999) {
        const year = new Date().getFullYear();
        await (supabase.from("reading_goals") as any).upsert(
            { user_id: user.id, year, target: Math.round(mainGoal), updated_at: new Date().toISOString() },
            { onConflict: "user_id,year" },
        );
    }

    // Las secundarias se guardan por KEY. Conservamos los completados manuales de
    // las metas que sigan seleccionadas (se descartan los de las deseleccionadas).
    const selectedKeys = normalizeSecondaryKeys(secondaryGoals);
    const { data: prev } = await supabase.from("profiles").select("goals").eq("id", user.id).maybeSingle();
    const prevGoals = (prev?.goals && !Array.isArray(prev.goals)) ? prev.goals as Record<string, unknown> : {};
    const prevDone = Array.isArray(prevGoals.secondary_done) ? (prevGoals.secondary_done as string[]) : [];
    const secondaryDone = prevDone.filter((k) => selectedKeys.includes(k));

    const goalsData = {
        pages_target: pagesGoal,
        streak_target: streakGoal,
        secondary: selectedKeys,
        secondary_done: secondaryDone,
    };

    const { error } = await supabase
        .from("profiles")
        .update({ goals: goalsData, updated_at: new Date().toISOString() })
        .eq("id", user.id);

    if (error) {
        console.error("Error updating goals:", error);
        return { error: "Error al actualizar metas" };
    }

    revalidatePath("/app/perfil");
    revalidatePath("/app/mi-lectura");
    return { success: true };
}

/** Estado de las metas secundarias seleccionadas (auto: se calcula; manual: marcado). */
export async function getSecondaryGoalsStatus(): Promise<SecondaryGoalStatus[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: prof } = await supabase.from("profiles").select("goals").eq("id", user.id).maybeSingle();
    const goals = (prof?.goals && !Array.isArray(prof.goals)) ? prof.goals as Record<string, unknown> : {};
    const selected = normalizeSecondaryKeys(goals.secondary);
    const done = Array.isArray(goals.secondary_done) ? (goals.secondary_done as string[]) : [];
    if (selected.length === 0) return [];

    const needAuto = selected.some((k) => SECONDARY_GOAL_BY_KEY[k]?.type === "auto");
    let genres = 0, hasBig = false, hasThisYear = false;
    if (needAuto) {
        const year = new Date().getFullYear();
        const { data: rows } = await supabase
            .from("user_books")
            .select("book:books(genre, first_publication_year, preferred_edition:editions!books_preferred_edition_fk(page_count))")
            .eq("user_id", user.id)
            .eq("status", "READ")
            .gte("finish_date", `${year}-01-01`)
            .lte("finish_date", `${year}-12-31`);
        const genreSet = new Set<string>();
        for (const r of (rows ?? []) as any[]) {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            if (!b) continue;
            if (b.genre && String(b.genre).trim()) genreSet.add(String(b.genre).trim().toLowerCase());
            const ed = Array.isArray(b.preferred_edition) ? b.preferred_edition[0] : b.preferred_edition;
            if (ed?.page_count && Number(ed.page_count) > 500) hasBig = true;
            if (b.first_publication_year && Number(b.first_publication_year) === year) hasThisYear = true;
        }
        genres = genreSet.size;
    }
    const autoDone: Record<string, boolean> = {
        genres3: genres >= 3,
        pages500: hasBig,
        published_this_year: hasThisYear,
    };

    return selected.map((key) => {
        const def = SECONDARY_GOAL_BY_KEY[key];
        return {
            key,
            label: def?.label ?? key,
            type: def?.type ?? "manual",
            done: def?.type === "auto" ? Boolean(autoDone[key]) : done.includes(key),
        };
    });
}

/** Marca/desmarca una meta secundaria MANUAL como completada. */
export async function toggleSecondaryGoalDone(key: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: prof } = await supabase.from("profiles").select("goals").eq("id", user.id).maybeSingle();
    const goals = (prof?.goals && !Array.isArray(prof.goals)) ? { ...(prof.goals as Record<string, unknown>) } : {};
    const done = Array.isArray(goals.secondary_done) ? (goals.secondary_done as string[]) : [];
    goals.secondary_done = done.includes(key) ? done.filter((k) => k !== key) : [...done, key];

    const { error } = await supabase.from("profiles").update({ goals, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/app/perfil");
    return { success: true };
}

export async function updateSettings(type: 'notifications' | 'privacy', settings: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const column = type === 'notifications' ? 'notification_settings' : 'privacy_settings';

    const { error } = await supabase
        .from("profiles")
        .update({
            [column]: settings,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        console.error(`Error updating ${type}:`, error);
        return { error: `Error al actualizar ${type}` };
    }

    revalidatePath("/app/perfil");
    return { success: true };
}

export async function exportMyProfileData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const [
        profile,
        userBooks,
        sessions,
        badges,
        wishlists,
        giftRecipients
    ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_books").select("*, book:books(title, preferred_edition:editions!books_preferred_edition_fk(isbn, isbn13, cover_url))").eq("user_id", user.id),
        supabase.from("reading_sessions").select("*").eq("user_id", user.id),
        supabase.from("user_badges").select("awarded_at, badge:badges(name, description, category)").eq("user_id", user.id),
        supabase.from("wishlists").select("*").eq("user_id", user.id),
        supabase.from("gift_recipients").select("*").eq("user_id", user.id),
    ]);

    return {
        success: true,
        exportedAt: new Date().toISOString(),
        user: {
            id: user.id,
            email: user.email,
        },
        data: {
            profile: profile.data,
            library: userBooks.data || [],
            readingSessions: sessions.data || [],
            badges: badges.data || [],
            wishlists: wishlists.data || [],
            giftRecipients: giftRecipients.data || [],
        }
    };
}

export async function requestPasswordReset() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) return { error: "No se ha encontrado el email de la cuenta" };

    const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${origin}/app/perfil/editar`
    });

    if (error) {
        console.error("Error sending password reset:", error);
        return { error: "No se pudo enviar el email de actualización" };
    }

    return { success: true };
}

export async function requestEmailChange(newEmail: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
        return { error: "Introduce un email válido" };
    }

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
        console.error("Error requesting email change:", error);
        return { error: "No se pudo solicitar el cambio de email" };
    }

    return { success: true };
}

export async function requestAccountDeactivation() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("profiles")
        .update({
            privacy_settings: {
                profile_visibility: "private",
                show_name_photo: false,
                show_location: false,
                show_recent_reads: false,
                show_stats: false,
                deactivation_requested_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Error requesting account deactivation:", error);
        return { error: "No se pudo registrar la solicitud" };
    }

    revalidatePath("/app/perfil");
    revalidatePath("/app/perfil/editar");
    return { success: true };
}

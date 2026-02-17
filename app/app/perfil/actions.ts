"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
        { key: 'banner_color', db: 'banner_color' }
    ];

    fields.forEach(({ key, db }) => {
        if (formData.has(key)) {
            updates[db] = formData.get(key) as string;
        }
    });

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
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
    const spoilerPreference = formData.get("spoilerPreference") === "true"; // Parse boolean

    // Could also handle "preferred_time" if added to schema, but sticking to plan

    const updates = {
        reading_format_preference: format,
        story_complexity_preference: complexity,
        engagement_elements: elements,
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

    // Here we are assuming goals are stored in profiles.goals JSONB column for now
    // as per onboarding migration.
    // If we want more structured goals, we might need a separate table, but onboarding uses profiles.goals
    const mainGoal = formData.get("mainGoal") ? parseInt(formData.get("mainGoal") as string) : 50;
    const pagesGoal = formData.get("pagesGoal") ? parseInt(formData.get("pagesGoal") as string) : null;
    const streakGoal = formData.get("streakGoal") ? parseInt(formData.get("streakGoal") as string) : null;
    const secondaryGoals = formData.get("secondaryGoals") ? JSON.parse(formData.get("secondaryGoals") as string) : [];

    // Construct the goal object to store in jsonb
    const goalsData = {
        yearly_target: mainGoal,
        pages_target: pagesGoal,
        streak_target: streakGoal,
        secondary: secondaryGoals
    };

    const updates = {
        goals: goalsData,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
        console.error("Error updating goals:", error);
        return { error: "Error al actualizar metas" };
    }

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

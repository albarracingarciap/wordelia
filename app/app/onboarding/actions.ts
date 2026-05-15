"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type OnboardingResult = {
    success?: true;
    error?: string;
};

const VALID_READER_TYPES = new Set(["occasional", "regular", "avid", "beginner", "educator", "organizer"]);

function parseStringArray(value: FormDataEntryValue | null) {
    if (typeof value !== "string") return [];

    try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
}

function getProfileErrorMessage(message: string) {
    const normalized = message.toLowerCase();

    if (normalized.includes("duplicate") || normalized.includes("unique")) {
        return "Ese nombre de usuario ya está en uso. Prueba con otro.";
    }

    if (normalized.includes("permission") || normalized.includes("policy")) {
        return "No tienes permisos para guardar este perfil. Vuelve a iniciar sesión.";
    }

    return message || "No se ha podido guardar tu perfil. Inténtalo de nuevo.";
}

export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
    let completed = false;

    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
        }

        const fullName = String(formData.get("fullName") || "").trim();
        const username = String(formData.get("username") || "").trim().toLowerCase();
        const birthDate = String(formData.get("birthDate") || "");
        const avatarUrl = String(formData.get("avatarUrl") || "");
        const readerType = String(formData.get("readerType") || "");
        const favoriteGenres = parseStringArray(formData.get("favoriteGenres"));
        const goals = parseStringArray(formData.get("goals"));

        if (!fullName) {
            return { error: "Introduce tu nombre completo." };
        }

        if (!/^[a-z0-9_]{3,24}$/.test(username)) {
            return { error: "El nombre de usuario debe tener entre 3 y 24 caracteres: letras, números o guiones bajos." };
        }

        if (!birthDate) {
            return { error: "Introduce tu fecha de nacimiento." };
        }

        if (!VALID_READER_TYPES.has(readerType)) {
            return { error: "Elige el tipo de lector que mejor te describe." };
        }

        if (favoriteGenres.length < 3) {
            return { error: "Selecciona al menos 3 géneros." };
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                onboarding_completed: true,
                full_name: fullName,
                username: username,
                avatar_url: avatarUrl,
                birth_date: birthDate,
                reader_type: readerType,
                favorite_genres: favoriteGenres,
                goals,
                email: user.email
            });

        if (updateError) {
            console.error("Update Profile Error:", updateError);
            return { error: getProfileErrorMessage(updateError.message) };
        }

        completed = true;
    } catch (error: unknown) {
        console.error("Server Action Exception:", error);
        return { error: "Ha ocurrido un error inesperado guardando tu perfil." };
    }

    if (completed) {
        revalidatePath("/", "layout");
        redirect("/app/mi-lectura");
    }

    return { success: true };
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSubscriptionActive } from "@/lib/subscription-access";

const PAID_PLANS = new Set(["voraz", "ai"]);

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
    // Destino tras finalizar. Se calcula dentro del try (con la sesión abierta)
    // pero el redirect() se hace fuera: lanzar redirect() dentro de un try/catch
    // lo capturaría como si fuese un error.
    let destination = "/app/mi-lectura";

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

        // Destino según el plan elegido en el paso 3.
        // Si ya hay una suscripción activa (p. ej. la pagó antes de terminar el
        // onboarding), nunca lo mandamos a pagar de nuevo: directo a la app.
        const selectedPlan = String(formData.get("selectedPlan") || "");
        const billingPeriod = String(formData.get("billingPeriod") || "") === "annual" ? "annual" : "monthly";

        const { data: sub } = await supabase
            .from("user_subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .maybeSingle();
        const hasActiveSub = sub ? isSubscriptionActive(sub.status, sub.current_period_end) : false;

        if (!hasActiveSub && PAID_PLANS.has(selectedPlan)) {
            destination = `/planes?plan=${selectedPlan}&billing=${billingPeriod}`;
        }

        completed = true;
    } catch (error: unknown) {
        console.error("Server Action Exception:", error);
        return { error: "Ha ocurrido un error inesperado guardando tu perfil." };
    }

    if (completed) {
        revalidatePath("/", "layout");
        redirect(destination);
    }

    return { success: true };
}

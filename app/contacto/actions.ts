"use server";

import { createClient } from "@/utils/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SUBJECTS = ["general", "clubs", "librerias", "educacion", "otro"] as const;
type Subject = (typeof VALID_SUBJECTS)[number];

export type ContactSubmitResult =
    | { success: true }
    | { success: false; error: string };

export async function submitContactMessage(formData: FormData): Promise<ContactSubmitResult> {
    // Honeypot anti-spam: campo oculto que un humano nunca rellena.
    const honeypot = String(formData.get("company") ?? "").trim();
    if (honeypot) {
        // Fingimos éxito para no dar pistas al bot.
        return { success: true };
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const message = String(formData.get("message") ?? "").trim();
    const rawSubject = String(formData.get("subject") ?? "general").trim();
    const rawSource = String(formData.get("source") ?? "").trim();

    const subject: Subject = (VALID_SUBJECTS as readonly string[]).includes(rawSubject)
        ? (rawSubject as Subject)
        : "general";
    const source = rawSource ? rawSource.slice(0, 120) : null;

    if (!name || name.length < 2) {
        return { success: false, error: "Indícanos tu nombre." };
    }
    if (!email || !EMAIL_REGEX.test(email)) {
        return { success: false, error: "Introduce un email válido." };
    }
    if (!message || message.length < 10) {
        return { success: false, error: "Cuéntanos un poco más (mínimo 10 caracteres)." };
    }
    if (message.length > 5000) {
        return { success: false, error: "El mensaje es demasiado largo (máximo 5000 caracteres)." };
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("contact_messages")
            .insert({
                name: name.slice(0, 120),
                email,
                subject,
                message,
                source,
            });

        if (error) {
            console.error("Error saving contact message:", error);
            return { success: false, error: "No hemos podido enviar tu mensaje. Inténtalo de nuevo." };
        }

        return { success: true };
    } catch (error) {
        console.error("Unexpected error saving contact message:", error);
        return { success: false, error: "No hemos podido enviar tu mensaje. Inténtalo de nuevo." };
    }
}

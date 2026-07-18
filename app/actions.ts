"use server";

import { createClient } from "@/utils/supabase/server";

type BookWithEdition = {
    title: string | null;
    author: { name: string | null } | { name: string | null }[] | null;
    preferred_edition:
        | { cover_url: string | null }
        | { cover_url: string | null }[]
        | null;
};

type OfficialClubBookRelation = {
    status: string | null;
    start_date: string | null;
    book: BookWithEdition | BookWithEdition[] | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterSubscribeResult =
    | { success: true }
    | { success: false; error: string };

export async function subscribeToNewsletter(
    rawEmail: string,
    source: string = "footer"
): Promise<NewsletterSubscribeResult> {
    const email = rawEmail.trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
        return { success: false, error: "Introduce un email válido." };
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("newsletter_subscribers")
            .insert({ email, source });

        if (error) {
            // 23505 = unique_violation: el email ya estaba suscrito.
            // Lo tratamos como éxito (no revelamos que existía).
            if (error.code === "23505") {
                return { success: true };
            }
            console.error("Error subscribing to newsletter:", error);
            return { success: false, error: "No hemos podido completar la suscripción. Inténtalo de nuevo." };
        }

        return { success: true };
    } catch (error) {
        console.error("Unexpected error subscribing to newsletter:", error);
        return { success: false, error: "No hemos podido completar la suscripción. Inténtalo de nuevo." };
    }
}

export async function getRegisteredUsersCount() {
    try {
        const supabase = await createClient();

        // Count all rows in the profiles table to get registered users
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error fetching user count:", error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error("Unexpected error fetching user count:", error);
        return 0;
    }
}


"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { error: "User not authenticated" };
        }

        // Extract profile data from formData
        const fullName = formData.get("fullName") as string;
        const username = formData.get("username") as string;
        const birthDate = formData.get("birthDate") as string;
        const avatarUrl = formData.get("avatarUrl") as string;
        const readerType = formData.get("readerType") as string;
        const favoriteGenres = JSON.parse(formData.get("favoriteGenres") as string || "[]");
        const goals = JSON.parse(formData.get("goals") as string || "[]");

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
                goals: goals,
                email: user.email // Ensure email is present
            });

        if (updateError) {
            console.error("Update Profile Error:", updateError);
            return { error: updateError.message };
        }

        // revalidatePath("/", "layout"); // Removing potential cause of crash. Client handles redirect.
        return { success: true };
    } catch (e: any) {
        console.error("Server Action Exception:", e);
        return { error: e.message || "Unknown error occurred" };
    }
}

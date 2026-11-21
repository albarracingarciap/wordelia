import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getReadingStats } from "@/app/app/mi-lectura/actions";
import { getReadingChallenge } from "@/app/app/mi-lectura/challenge-actions";
import { YoMobileView } from "@/components/mobile/YoMobileView";

export const dynamic = "force-dynamic";

type ProfileRow = { full_name: string | null; username: string | null; avatar_url: string | null };

// Pestaña "Yo" del shell móvil: resumen del año, accesos y ajustes del dispositivo.
export default async function MobileMePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: profileRow }, stats, challenge] = await Promise.all([
        supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle(),
        getReadingStats(),
        getReadingChallenge(),
    ]);
    const profile = profileRow as ProfileRow | null;

    return (
        <YoMobileView
            name={profile?.full_name || user.email?.split("@")[0] || "Lector"}
            username={profile?.username ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            streak={stats.streak}
            weeklyPages={stats.weeklyPages}
            challenge={challenge}
        />
    );
}

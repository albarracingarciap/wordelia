
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EditProfileContent from "./edit-profile-content";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return <div>Error cargando perfil.</div>;
    }

    // Objetivo anual desde reading_goals (fuente única) → se inyecta en goals para
    // que el editor de Metas muestre el valor correcto.
    const year = new Date().getFullYear();
    const { data: goal } = await (supabase.from("reading_goals") as any)
        .select("target")
        .eq("user_id", user.id)
        .eq("year", year)
        .maybeSingle();
    const goalsObj = (profile.goals && !Array.isArray(profile.goals)) ? profile.goals as Record<string, unknown> : {};
    profile.goals = { ...goalsObj, yearly_target: goal?.target ?? (goalsObj.yearly_target as number) ?? 50 };

    return <EditProfileContent profile={profile} />;
}

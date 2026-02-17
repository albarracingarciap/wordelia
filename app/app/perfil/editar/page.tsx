
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

    return <EditProfileContent profile={profile} />;
}

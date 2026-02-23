import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { EditChallengeClient } from "./EditChallengeClient";

export default async function EditChallengePage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    const { data: challenge, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !challenge) {
        notFound();
    }

    return <EditChallengeClient challenge={challenge} />;
}

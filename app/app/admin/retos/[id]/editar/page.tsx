import { notFound } from "next/navigation";
import { EditChallengeClient } from "./EditChallengeClient";
import { adminGetChallenge, getBadgesForSelect } from "@/app/app/admin/retos/nuevo/actions";

export const dynamic = "force-dynamic";

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [challenge, badges] = await Promise.all([adminGetChallenge(id), getBadgesForSelect()]);
    if (!challenge) notFound();
    return <EditChallengeClient challenge={challenge} badges={badges} />;
}

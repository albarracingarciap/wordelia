import { ClubDashboard } from "@/components/club/ClubDashboard";
import { getClubDetails, getActivePoll, getClosedPolls } from "./actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [club, activePoll, pollHistory] = await Promise.all([
        getClubDetails(id),
        getActivePoll(id),
        getClosedPolls(id)
    ]);

    if (!club) return notFound();

    return <ClubDashboard club={club} activePoll={activePoll} pollHistory={pollHistory} />;
}

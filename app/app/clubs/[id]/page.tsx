import { ClubDashboard } from "@/components/club/ClubDashboard";
import { getClubDetails, getActivePoll } from "./actions";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [club, activePoll] = await Promise.all([
        getClubDetails(id),
        getActivePoll(id)
    ]);

    if (!club) return notFound();

    return <ClubDashboard club={club} activePoll={activePoll} />;
}

import { getUserClubs, getExploreClubs } from "./actions";
import ClubsPageClient from "./ClubsPageClient";

export default async function ClubsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const resolvedSearchParams = await searchParams; // Await the promise
    const { active, archived } = await getUserClubs();
    const exploreClubs = await getExploreClubs(resolvedSearchParams.q);

    return (
        <ClubsPageClient
            activeClubs={active}
            archivedClubs={archived}
            exploreClubs={exploreClubs}
        />
    );
}

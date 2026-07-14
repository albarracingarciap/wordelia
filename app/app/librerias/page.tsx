import {
    getMyOrganizations,
    getOrganizationClubs,
    getOrganizationAnalytics,
    getOrganizationEvents,
    getOrganizationMembers,
    getOrganizationLocations,
} from "./actions";
import { LibreriasDashboardClient } from "./LibreriasDashboardClient";

export const dynamic = "force-dynamic";

export default async function LibreriasDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ org?: string }>;
}) {
    const { org } = await searchParams;
    const organizations = await getMyOrganizations();
    const active = organizations.find((o) => o.id === org) || organizations[0] || null;

    const [clubs, analytics, events, members, locations] = active
        ? await Promise.all([
            getOrganizationClubs(active.id),
            getOrganizationAnalytics(active.id),
            getOrganizationEvents(active.id),
            getOrganizationMembers(active.id),
            getOrganizationLocations(active.id),
        ])
        : [[], null, [], [], []];

    return (
        <LibreriasDashboardClient
            organizations={organizations}
            organization={active}
            clubs={clubs}
            analytics={analytics}
            events={events}
            members={members}
            locations={locations}
        />
    );
}

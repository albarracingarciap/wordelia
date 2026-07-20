import {
    getMyOrganizations,
    getOrganizationClubs,
    getOrganizationAnalytics,
    getOrganizationEvents,
    getOrganizationMembers,
    getOrganizationLocations,
} from "./actions";
import { LibreriasDashboardClient } from "./LibreriasDashboardClient";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function LibreriasDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ org?: string }>;
}) {
    const { org } = await searchParams;

    // Feature gate: el espacio de librerías puede apagarse desde Ajustes → General.
    const { flags } = await getAppSettings();
    if (!flags.librerias) {
        return (
            <div className="mx-auto max-w-md py-20 text-center">
                <h1 className="text-2xl font-serif text-teal">Espacio de librerías</h1>
                <p className="mt-2 text-grey/70">
                    Esta sección no está disponible por ahora. Vuelve pronto.
                </p>
            </div>
        );
    }

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

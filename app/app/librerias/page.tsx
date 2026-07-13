import { getMyOrganization, getOrganizationClubs } from "./actions";
import { LibreriasDashboardClient } from "./LibreriasDashboardClient";

export const dynamic = "force-dynamic";

export default async function LibreriasDashboardPage() {
    const organization = await getMyOrganization();
    const clubs = organization ? await getOrganizationClubs(organization.id) : [];

    return <LibreriasDashboardClient organization={organization} clubs={clubs} />;
}

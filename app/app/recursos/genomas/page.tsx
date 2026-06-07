import { getResourceList } from "../actions";
import { ResourceListView } from "../ResourceViews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PrivateGenomesListPage() {
    const { isAdmin, items } = await getResourceList("genome");

    return <ResourceListView kind="genome" items={items} isAdmin={isAdmin} />;
}


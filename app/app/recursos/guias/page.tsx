import { getResourceList } from "../actions";
import { ResourceListView } from "../ResourceViews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PrivateGuidesListPage() {
    const { isAdmin, items } = await getResourceList("guide");

    return <ResourceListView kind="guide" items={items} isAdmin={isAdmin} />;
}


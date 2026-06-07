import { notFound } from "next/navigation";
import { getResourceDetail } from "../../actions";
import { ResourceGenomeView, ResourceLockedView } from "../../ResourceViews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
    params: Promise<{ bookId: string }>;
};

export default async function PrivateGenomeDetailPage({ params }: PageProps) {
    const { bookId } = await params;
    const detail = await getResourceDetail("genome", bookId);

    if (!detail) notFound();

    return detail.canView ? <ResourceGenomeView detail={detail} /> : <ResourceLockedView detail={detail} />;
}

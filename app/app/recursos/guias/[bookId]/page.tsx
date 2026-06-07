import { notFound } from "next/navigation";
import { getResourceDetail } from "../../actions";
import { ResourceGuideView, ResourceLockedView } from "../../ResourceViews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
    params: Promise<{ bookId: string }>;
};

export default async function PrivateGuideDetailPage({ params }: PageProps) {
    const { bookId } = await params;
    const detail = await getResourceDetail("guide", bookId);

    if (!detail) notFound();

    return detail.canView ? <ResourceGuideView detail={detail} /> : <ResourceLockedView detail={detail} />;
}

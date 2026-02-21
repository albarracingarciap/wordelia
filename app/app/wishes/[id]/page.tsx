import { notFound } from "next/navigation";
import { getWishlistDetail } from "@/app/app/wishes/item-actions";
import { WishlistDetailView } from "@/components/wishes/WishlistDetailView";

export default async function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { wishlist, items, isOwner } = await getWishlistDetail(id);

    if (!wishlist) notFound();

    return <WishlistDetailView wishlist={wishlist} items={items} isOwner={isOwner} />;
}

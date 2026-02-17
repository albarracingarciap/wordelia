import { MOCK_WISHLISTS, MOCK_ITEMS } from "@/lib/mock-data";
import { WishlistDetailView } from "@/components/wishes/WishlistDetailView";

export async function generateStaticParams() {
    return MOCK_WISHLISTS.map((wishlist) => ({
        id: wishlist.id,
    }));
}

export default async function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Find list details
    const wishlist = MOCK_WISHLISTS.find(l => l.id === id) || MOCK_WISHLISTS[0];
    const items = MOCK_ITEMS.filter(i => i.wishlistId === id);

    return <WishlistDetailView initialWishlist={wishlist} initialItems={items} id={id} />;
}

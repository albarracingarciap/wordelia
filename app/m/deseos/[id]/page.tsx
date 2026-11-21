import { notFound, redirect } from "next/navigation";
import { getWishlistDetail } from "@/app/app/wishes/item-actions";
import { getWishlistCandidates } from "@/app/app/wishes/candidate-actions";
import { WishlistMobileView } from "@/components/mobile/WishlistMobileView";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

// Lista propia en el shell móvil. Las listas de otros (vista de invitado:
// reservar, bote, dedicatorias) se abren en la versión completa.
export default async function MobileWishlistPage({ params }: PageProps) {
    const { id } = await params;
    const { wishlist, items, isOwner } = await getWishlistDetail(id);
    if (!wishlist) notFound();
    if (!isOwner) redirect(`/app/wishes/${id}?view=guest`);

    const candidates = await getWishlistCandidates(id);
    return <WishlistMobileView wishlist={wishlist} items={items} candidates={candidates} />;
}

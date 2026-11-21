import { getMyWishlists } from "@/app/app/wishes/wishlist-actions";
import { getMyReservations } from "@/app/app/wishes/gift-actions";
import { WishesMobileView } from "@/components/mobile/WishesMobileView";

export const dynamic = "force-dynamic";

// Pestaña Deseos del shell móvil: mis listas + los regalos que he reservado.
// Personas/ideas de regalo se gestionan en la versión completa.
export default async function MobileWishesPage() {
    const [wishlists, reservations] = await Promise.all([getMyWishlists(), getMyReservations()]);
    return <WishesMobileView wishlists={wishlists} reservations={reservations} />;
}

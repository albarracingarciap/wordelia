import { getMyWishlists } from "@/app/app/wishes/wishlist-actions";
import { getGiftRecipients, getMyReservations } from "@/app/app/wishes/gift-actions";
import { WishesDashboardClient } from "@/components/wishes/WishesDashboardClient";

export default async function WishesDashboard() {
    const [wishlists, recipients, reservations] = await Promise.all([
        getMyWishlists(),
        getGiftRecipients(),
        getMyReservations(),
    ]);

    return (
        <WishesDashboardClient
            initialWishlists={wishlists}
            initialRecipients={recipients}
            initialReservations={reservations}
        />
    );
}

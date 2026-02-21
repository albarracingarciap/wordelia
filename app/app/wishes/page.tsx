import { getMyWishlists } from "@/app/app/wishes/wishlist-actions";
import { getGiftRecipients } from "@/app/app/wishes/gift-actions";
import { WishesDashboardClient } from "@/components/wishes/WishesDashboardClient";

export default async function WishesDashboard() {
    const [wishlists, recipients] = await Promise.all([
        getMyWishlists(),
        getGiftRecipients(),
    ]);

    return (
        <WishesDashboardClient
            initialWishlists={wishlists}
            initialRecipients={recipients}
        />
    );
}

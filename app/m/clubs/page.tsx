import { getMyClubsForMobile } from "./actions";
import { ClubsListView } from "@/components/mobile/ClubsListView";

export const dynamic = "force-dynamic";

// Pestaña "Clubs" del shell móvil: mis clubs con su lectura y sesiones en vivo.
export default async function MobileClubsPage() {
    const clubs = await getMyClubsForMobile();
    return <ClubsListView clubs={clubs} />;
}

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { WishlistHero } from "@/components/deseos/WishlistHero";
import { InteractiveWishlistDemo } from "@/components/deseos/InteractiveWishlistDemo";
import { GiftFeatures } from "@/components/deseos/GiftFeatures";
import { WishlistCTA } from "@/components/deseos/WishlistCTA";

export default function WishlistLandingPage() {
    return (
        <div className="min-h-screen bg-cream font-[family-name:var(--font-outfit)]">
            <Navbar />

            <main className="pt-[72px]">
                <WishlistHero />
                <InteractiveWishlistDemo />
                <GiftFeatures />
                <WishlistCTA />
            </main>

            <Footer />
        </div>
    );
}

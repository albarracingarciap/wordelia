import { getFeaturedClub, getRegularClubs } from "./actions";
import ClubesPageClient from "./ClubesPageClient";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
    title: "Clubes Wordelia Originals | Wordelia - Clubs de lectura curados",
    description: "Únete a nuestros clubs de lectura oficiales con guías de discusión profesionales, mapas emocionales y calendario estructurado. Comienza el 15 de marzo.",
    keywords: ["clubs de lectura", "lectura", "discusión", "comunidad", "libros"],
    openGraph: {
        title: "Clubes Wordelia Originals | Wordelia",
        description: "Clubs de lectura curados con guías profesionales, mapas emocionales y comunidad activa. Comienza el 15 de marzo.",
        type: "website",
    },
};

export default async function ClubesPage() {
    const [featuredClub, regularClubs] = await Promise.all([
        getFeaturedClub(),
        getRegularClubs(),
    ]);

    return (
        <div className="min-h-screen bg-cream flex flex-col">
            {/* Landing Navbar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-12 pt-12 pb-6">
                    <ClubesPageClient
                        featuredClub={featuredClub}
                        regularClubs={regularClubs}
                    />
                </div>
            </main>

            {/* Landing Footer */}
            <Footer />
        </div>
    );
}

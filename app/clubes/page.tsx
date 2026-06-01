import { getFeaturedClub, getRegularClubs } from "./actions";
import ClubesPageClient from "./ClubesPageClient";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
            <Navbar mode="public" />

            {/* Main Content */}
            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-12 pt-6 pb-6">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </Link>
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

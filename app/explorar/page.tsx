import { getAllCuratedCollectionsWithBooks } from "./actions";
import ExplorarPageClient from "./ExplorarPageClient";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
    title: "Explorar | Wordelia - Descubre libros por cómo te harán sentir",
    description: "Descubre tu próxima gran lectura. En Wordelia clasificamos libros por la experiencia de lectura que ofrecen: tensión narrativa, mundos complejos, prosa poética y más.",
    keywords: ["libros", "lectura", "recomendaciones", "literatura", "descubrir libros"],
    openGraph: {
        title: "Explorar | Wordelia - Descubre libros por experiencia",
        description: "Descubre libros clasificados por tensión narrativa, complejidad del mundo, nivel de prosa y más. La forma diferente de encontrar tu próxima lectura.",
        type: "website",
    },
};

export default async function ExplorarPage() {
    const collections = await getAllCuratedCollectionsWithBooks();

    return (
        <div className="min-h-screen bg-cream flex flex-col">
            {/* Landing Navbar */}
            <Navbar mode="public" />

            {/* Main Content */}
            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-12 pt-12 pb-6">
                    <ExplorarPageClient initialCollections={collections} />
                </div>
            </main>

            {/* Landing Footer */}
            <Footer />
        </div>
    );
}

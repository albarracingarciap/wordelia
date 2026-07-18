import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExploreHero } from "@/components/explorar/ExploreHero";
import { CatalogCollections } from "@/components/explorar/CatalogCollections";
import { CTASection } from "@/components/explorar/CTASection";
import { getPublicCollections } from "./actions";

export const metadata: Metadata = {
    title: "Explorar | Wordelia - Descubre libros por cómo te harán sentir",
    description:
        "Descubre tu próxima gran lectura. En Wordelia agrupamos los libros por la experiencia de lectura que ofrecen: tensión narrativa, mundos complejos, prosa poética y más.",
    keywords: ["libros", "lectura", "recomendaciones", "literatura", "descubrir libros"],
    openGraph: {
        title: "Explorar | Wordelia - Descubre libros por experiencia",
        description:
            "Libros agrupados por la experiencia de lectura que ofrecen: tensión narrativa, mundos complejos, prosa poética y más.",
        type: "website",
    },
};

// La selección rota a diario y las colecciones se editan en el panel.
export const revalidate = 0;

export default async function ExplorarPage() {
    const collections = await getPublicCollections(6);
    const withBooks = collections.filter((c) => c.books.length > 0);

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar mode="public" />

            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-6 pb-16 pt-6 md:px-10">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </Link>

                    <div className="animate-fade-in space-y-12">
                        <ExploreHero />

                        {withBooks.length === 0 ? (
                            <EmptyState
                                title="Estamos preparando las colecciones"
                                description="Muy pronto encontrarás aquí libros agrupados por la experiencia de lectura que ofrecen, cada uno con su guía de discusión y su genoma literario."
                                icon={<BookOpen className="h-10 w-10" aria-hidden="true" />}
                            />
                        ) : (
                            <CatalogCollections collections={withBooks} />
                        )}

                        <CTASection />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

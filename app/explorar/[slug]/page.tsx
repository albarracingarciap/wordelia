import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CatalogCollections } from "@/components/explorar/CatalogCollections";
import { CTASection } from "@/components/explorar/CTASection";
import { getPublicCollectionBySlug } from "../actions";

export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const collection = await getPublicCollectionBySlug(slug);

    if (!collection) return { title: "Colección no encontrada | Wordelia" };

    const description = `${collection.description} ${collection.totalBooks} libros con guía de discusión y genoma literario.`.slice(0, 300);

    return {
        title: `${collection.name} | Explorar en Wordelia`,
        description,
        openGraph: {
            title: `${collection.name} | Wordelia`,
            description,
            type: "website",
        },
    };
}

export default async function ColeccionPage({ params }: PageProps) {
    const { slug } = await params;
    const collection = await getPublicCollectionBySlug(slug);

    if (!collection) notFound();

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar mode="public" />

            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-6 pb-16 pt-6 md:px-10">
                    <Link
                        href="/explorar"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Todas las colecciones
                    </Link>

                    <div className="animate-fade-in space-y-12">
                        {collection.books.length === 0 ? (
                            <div className="rounded-3xl border border-teal/10 bg-white p-8 text-center">
                                <h1 className="text-2xl text-teal">{collection.name}</h1>
                                <p className="mt-2 text-grey/70">
                                    Todavía no hay libros publicados en esta colección.
                                </p>
                            </div>
                        ) : (
                            // showAllLink=false: ya estamos en la página completa.
                            <CatalogCollections collections={[collection]} showAllLink={false} />
                        )}

                        <CTASection />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

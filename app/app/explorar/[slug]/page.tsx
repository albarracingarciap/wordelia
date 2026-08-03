import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CatalogCollections } from "@/components/explorar/CatalogCollections";
import { getPublicCollectionBySlug } from "@/app/explorar/actions";

export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const collection = await getPublicCollectionBySlug(slug);
    if (!collection) return { title: "Colección no encontrada | Wordelia" };
    return { title: `${collection.name} | Explorar en Wordelia` };
}

export default async function AppColeccionPage({ params }: PageProps) {
    const { slug } = await params;
    const collection = await getPublicCollectionBySlug(slug);
    if (!collection) notFound();

    return (
        <div className="space-y-6 md:space-y-8">
            <Link
                href="/app/explorar"
                className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-grey/60 transition-colors hover:text-teal"
            >
                <ArrowLeft className="h-4 w-4" />
                Todas las colecciones
            </Link>

            <div className="pb-12">
                {collection.books.length === 0 ? (
                    <div className="rounded-3xl border border-teal/10 bg-white p-8 text-center">
                        <h1 className="text-2xl text-teal">{collection.name}</h1>
                        <p className="mt-2 text-grey/70">Todavía no hay libros publicados en esta colección.</p>
                    </div>
                ) : (
                    // showAllLink=false: ya estamos en la página completa; variant=app: rutas internas.
                    <CatalogCollections collections={[collection]} showAllLink={false} variant="app" />
                )}
            </div>
        </div>
    );
}

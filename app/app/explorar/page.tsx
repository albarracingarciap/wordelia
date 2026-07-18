import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogCollections } from "@/components/explorar/CatalogCollections";
import { getPublicCollections } from "@/app/explorar/actions";

export const metadata: Metadata = {
    title: "Explorar | Wordelia",
    description: "Descubre tu próxima gran lectura recomendada para ti en Wordelia.",
};

export const revalidate = 0;

export default async function ExplorarDashboardPage() {
    // Mismo origen que /explorar: catálogo con guía y genoma publicados.
    const collections = (await getPublicCollections(6)).filter((c) => c.books.length > 0);

    return (
        <div className="space-y-6 md:space-y-8">
            <Link
                href="/app/mi-lectura"
                className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-grey/60 transition-colors hover:text-teal"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </Link>

            <SectionHeader
                eyebrow="EXPLORAR"
                title="Descubre tu próxima lectura"
                subtitle="Libros agrupados por la experiencia que ofrecen, cada uno con su guía y su genoma."
                className="mb-0 md:mb-4 [&_h1]:text-[1.65rem] [&_h1]:leading-tight [&_p]:text-sm"
            />

            <div className="pb-12">
                {collections.length === 0 ? (
                    <EmptyState
                        title="Estamos preparando las colecciones"
                        description="Muy pronto encontrarás aquí libros agrupados por la experiencia de lectura que ofrecen."
                        icon={<BookOpen className="h-10 w-10" aria-hidden="true" />}
                    />
                ) : (
                    <CatalogCollections collections={collections} />
                )}
            </div>
        </div>
    );
}

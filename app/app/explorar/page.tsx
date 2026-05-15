import { getAllCuratedCollectionsWithBooks } from "@/app/explorar/actions";
import ExplorarClient from "./ExplorarClient";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Explorar | Wordelia",
    description: "Descubre tu próxima gran lectura recomendada para ti en Wordelia.",
};

export default async function ExplorarDashboardPage() {
    const collections = await getAllCuratedCollectionsWithBooks();

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
                subtitle="Nuevas historias clasificadas por la experiencia que ofrecen."
                className="mb-0 md:mb-4 [&_h1]:text-[1.65rem] [&_h1]:leading-tight [&_p]:text-sm"
            />

            <ExplorarClient initialCollections={collections} />
        </div>
    );
}

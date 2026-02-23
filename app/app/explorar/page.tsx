import { getAllCuratedCollectionsWithBooks } from "@/app/explorar/actions";
import ExplorarClient from "./ExplorarClient";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
    title: "Explorar | Wordelia",
    description: "Descubre tu próxima gran lectura recomendada para ti en Wordelia.",
};

export default async function ExplorarDashboardPage() {
    const collections = await getAllCuratedCollectionsWithBooks();

    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="EXPLORAR"
                title="Descubre tu próxima lectura"
                subtitle="Nuevas historias clasificadas por la experiencia que ofrecen."
            />

            <ExplorarClient initialCollections={collections} />
        </div>
    );
}

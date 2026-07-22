import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getRetosView } from "./actions";
import RetosClient from "./RetosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Retos | Wordelia",
    description: "Retos de lectura de la comunidad Wordelia: únete, sigue tu progreso y gana insignias.",
};

export default async function RetosPage() {
    const retos = await getRetosView();
    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="RETOS"
                title="Retos de la comunidad"
                subtitle="Únete a un reto, sigue tu progreso desde tus lecturas y desbloquea la insignia al completarlo."
            />
            <RetosClient retos={retos} />
        </div>
    );
}

import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getRetosView, getMyProposals } from "./actions";
import RetosClient from "./RetosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Retos | Wordelia",
    description: "Retos de lectura de la comunidad Wordelia: únete, sigue tu progreso y gana insignias.",
};

export default async function RetosPage() {
    const [retos, myProposals] = await Promise.all([getRetosView(), getMyProposals()]);
    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="RETOS"
                title="Retos de lectura"
                subtitle="Únete a un reto, sigue tu progreso desde tus lecturas y desbloquea la insignia al completarlo."
            />
            <RetosClient retos={retos} myProposals={myProposals} />
        </div>
    );
}

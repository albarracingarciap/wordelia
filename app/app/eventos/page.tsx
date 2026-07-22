import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getPublishedEvents } from "./actions";
import EventosClient from "./EventosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Eventos Wordelia | Wordelia",
    description: "Encuentros organizados por Wordelia. Consigue tu entrada con tus monedas.",
};

export default async function EventosPage() {
    const { events, balance } = await getPublishedEvents();
    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="EVENTOS WORDELIA"
                title="Encuentros para lectores"
                subtitle="Charlas, clubs en vivo y celebraciones que organizamos para la comunidad. Consigue tu entrada con las monedas que ganas invitando a tus amigos."
            />
            <EventosClient events={events} balance={balance} />
        </div>
    );
}

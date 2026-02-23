import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import GuardadosClient from "./GuardadosClient";

export const metadata: Metadata = {
    title: "Guardados | Wordelia",
    description: "Tus reseñas, citas y debates favoritos guardados de la comunidad de Wordelia.",
};

export default function GuardadosPage() {
    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="GUARDADOS"
                title="Tus descubrimientos en la comunidad"
                subtitle="El rincón donde coleccionas las piezas más memorables que comparten otros lectores."
            />

            <GuardadosClient />
        </div>
    );
}

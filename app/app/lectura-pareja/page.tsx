import { SectionHeader } from "@/components/ui/SectionHeader";
import { BuddyReadsClient } from "@/components/buddy/BuddyReadsClient";

export const dynamic = "force-dynamic";

export default function LecturaParejaPage() {
    return (
        <div className="space-y-6">
            <SectionHeader
                eyebrow="COMUNIDAD"
                title="Lecturas en pareja"
                subtitle="Lee un libro a la vez que un amigo: vuestro ritmo, vuestro progreso y una conversación solo para los dos."
            />
            <BuddyReadsClient />
        </div>
    );
}

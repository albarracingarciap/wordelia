import { getCurrentBooks, getReadingStats } from "@/app/app/mi-lectura/actions";
import { getReadingChallenge } from "@/app/app/mi-lectura/challenge-actions";
import { LeyendoView } from "@/components/mobile/LeyendoView";

// Pestaña "Leyendo" del shell móvil: libros en curso + registro rápido + cronómetro.
export default async function LeyendoPage() {
    const [books, stats, challenge] = await Promise.all([
        getCurrentBooks(),
        getReadingStats(),
        getReadingChallenge(),
    ]);

    return <LeyendoView books={books} streak={stats.streak} challenge={challenge} />;
}

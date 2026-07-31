import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download, Instagram } from "lucide-react";
import { fetchSharedCommunityChallenge } from "@/lib/shared-community-challenge";
import { challengeGoalLabel } from "@/lib/challenges";
import { CommunityChallengeCard } from "@/components/challenge/CommunityChallengeCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const ch = await fetchSharedCommunityChallenge(id);
    if (!ch) return { title: "Reto de lectura — Wordelia" };

    const title = `${ch.title} — Reto de lectura en Wordelia`;
    const description = `${challengeGoalLabel(ch.goalType, ch.goalTarget, ch.goalGenre)}. Únete al reto en Wordelia.`;
    return {
        title,
        description,
        openGraph: { title, description, type: "article" },
        twitter: { card: "summary_large_image", title, description },
    };
}

export default async function SharedCommunityChallengePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const ch = await fetchSharedCommunityChallenge(id);

    if (!ch) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
                <p className="font-serif text-2xl text-teal-dark">Este reto no está disponible</p>
                <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark">
                    Descubre Wordelia <ArrowRight className="h-4 w-4" />
                </Link>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-cream to-[#E7EFE9] px-4 py-12">
            <CommunityChallengeCard challenge={ch} />

            <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <a href={`/reto-comunidad/${id}/image`} download="reto-wordelia.png" className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5">
                        <Download className="h-4 w-4" /> Descargar imagen
                    </a>
                    <a href={`/reto-comunidad/${id}/image?format=square`} download="reto-wordelia-instagram.png" className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5">
                        <Instagram className="h-4 w-4" /> Para Instagram
                    </a>
                </div>

                <p className="text-sm text-grey/70">Únete al reto, sigue tu progreso desde tus lecturas y gana insignias.</p>
                <Link href={`/app/retos/${id}`} className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-dark">
                    Unirme al reto <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </main>
    );
}

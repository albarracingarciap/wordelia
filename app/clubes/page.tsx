import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClubsHero } from "@/components/clubes/ClubsHero";
import { FeaturedClub } from "@/components/clubes/FeaturedClub";
import { ClubCard } from "@/components/clubes/ClubCard";
import { ClubsCTA } from "@/components/clubes/ClubsCTA";
import { getPublicClubs } from "./actions";

export const metadata: Metadata = {
    title: "Clubs de lectura Wordelia Originals | Wordelia",
    description:
        "Clubs de lectura guiados con guías de discusión por checkpoints, conversaciones sin spoilers y registro de emociones. Wordelia se lanza el 2 de agosto.",
    keywords: ["clubs de lectura", "club de lectura online", "guías de discusión", "comunidad lectora"],
    openGraph: {
        title: "Clubs de lectura Wordelia Originals | Wordelia",
        description:
            "Clubs de lectura guiados con guías de discusión por checkpoints y conversaciones sin spoilers.",
        type: "website",
    },
};

// Los clubs se editan desde el panel de administración: sin caché estática.
export const revalidate = 0;

export default async function ClubesPage() {
    const clubs = await getPublicClubs();
    const featured = clubs.find((club) => club.destacado) ?? null;
    const rest = featured ? clubs.filter((club) => club.id !== featured.id) : clubs;

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar mode="public" />

            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-6 pb-16 pt-6 md:px-10">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </Link>

                    <div className="space-y-12 animate-fade-in">
                        <ClubsHero />

                        {clubs.length === 0 ? (
                            <EmptyState
                                title="Aún no hay clubs publicados"
                                description="Estamos preparando los primeros clubs Wordelia Originals. Regístrate y te avisamos en cuanto abran."
                                icon={<Users className="h-10 w-10" aria-hidden="true" />}
                            />
                        ) : (
                            <>
                                {featured && <FeaturedClub club={featured} />}

                                {rest.length > 0 && (
                                    <section>
                                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-coral">
                                            Wordelia Originals
                                        </p>
                                        <h2 className="mb-6 text-3xl text-teal">
                                            {featured ? "Más clubs oficiales" : "Clubs oficiales"}
                                        </h2>
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                            {rest.map((club) => (
                                                <ClubCard key={club.id} club={club} />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}

                        <ClubsCTA />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

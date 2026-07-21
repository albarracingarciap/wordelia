import type { SharedChallenge } from "@/lib/shared-challenge";

export function ChallengeCard({ challenge }: { challenge: SharedChallenge }) {
    const pct = challenge.target ? Math.min(100, Math.round((challenge.booksRead / challenge.target) * 100)) : 0;
    const achieved = challenge.booksRead >= challenge.target;
    const reader = challenge.reader.name || (challenge.reader.username ? `@${challenge.reader.username}` : null);

    return (
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal via-teal/60 to-coral" />

            <div className="px-8 py-10 md:px-12 md:py-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Reto de lectura {challenge.year}</p>

                <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-serif text-6xl font-bold text-teal-dark md:text-7xl">{challenge.booksRead}</span>
                    <span className="text-2xl text-grey/60">de {challenge.target} libros</span>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-teal/10">
                    <div className={`h-full rounded-full ${achieved ? "bg-coral" : "bg-teal"}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div>
                        <p className={`text-lg font-bold ${achieved ? "text-coral" : "text-teal"}`}>
                            {achieved ? "¡Reto conseguido!" : `${pct}%`}
                        </p>
                        {reader && <p className="text-sm text-grey/50">{reader}</p>}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/images/logo_wordelia.png" alt="Wordelia" className="h-5 w-auto" />
                </div>
            </div>
        </div>
    );
}

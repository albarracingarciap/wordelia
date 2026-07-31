import { Trophy, Users, Award } from "lucide-react";
import { challengeGoalLabel } from "@/lib/challenges";
import type { SharedCommunityChallenge } from "@/lib/shared-community-challenge";

export function CommunityChallengeCard({ challenge }: { challenge: SharedCommunityChallenge }) {
    const goal = challengeGoalLabel(challenge.goalType, challenge.goalTarget, challenge.goalGenre);
    const originLabel = challenge.origin === "community" ? "Reto de la comunidad" : "Reto de Wordelia";

    return (
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal via-teal/60 to-coral" />

            <div className="px-8 py-10 md:px-12 md:py-12">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">{originLabel}</p>
                </div>

                <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-teal-dark md:text-4xl">{challenge.title}</h1>
                <p className="mt-3 text-xl font-bold text-coral">{goal}</p>

                {challenge.description && <p className="mt-4 text-sm leading-relaxed text-grey/65 line-clamp-3">{challenge.description}</p>}

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-grey/60">
                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-teal" /> {challenge.participants} {challenge.participants === 1 ? "participante" : "participantes"}</span>
                    {challenge.authorName && <span>· por {challenge.authorName}</span>}
                    {challenge.rewardBadgeName && <span className="inline-flex items-center gap-1.5 font-semibold text-coral"><Award className="h-4 w-4" /> {challenge.rewardBadgeName}</span>}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-teal/5 pt-5">
                    <span className="text-sm text-grey/50">Únete en Wordelia</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/images/logo_wordelia.png" alt="Wordelia" className="h-5 w-auto" />
                </div>
            </div>
        </div>
    );
}

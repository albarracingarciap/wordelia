"use client";

import Image from "next/image";
import * as React from "react";
import { useParams } from "next/navigation";
import { BookOpen, Check, Sparkles, Wand2 } from "lucide-react";
import { getClubNextReadingRecommendations } from "@/app/app/clubs/[id]/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Recommendation {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    pageCount: number | null;
    score: number;
    reasons: string[];
    tags: string[];
}

interface ClubNextReadingRecommenderProps {
    canCreatePoll?: boolean;
    onCreatePoll?: (question: string, options: string[]) => Promise<void>;
}

function RecommendationCard({
    recommendation,
    selected,
    onToggle,
}: {
    recommendation: Recommendation;
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <article
            className={`rounded-2xl border bg-white p-3 shadow-sm transition ${
                selected ? "border-teal ring-2 ring-teal/10" : "border-black/5"
            }`}
        >
            <div className="flex gap-3">
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-grey/10">
                    {recommendation.coverUrl ? (
                        <Image
                            src={recommendation.coverUrl}
                            alt={recommendation.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-grey/35">
                            <BookOpen size={24} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <Badge variant="brand">{recommendation.score}% encaje</Badge>
                        <button
                            type="button"
                            onClick={onToggle}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                                selected
                                    ? "border-teal bg-teal text-white"
                                    : "border-grey/15 bg-white text-grey/45 hover:border-teal hover:text-teal"
                            }`}
                            aria-label={selected ? "Quitar de la votación" : "Añadir a la votación"}
                        >
                            <Check size={15} />
                        </button>
                    </div>

                    <h4 className="mt-2 text-lg font-bold leading-tight text-teal-dark">{recommendation.title}</h4>
                    <p className="mt-1 text-sm font-medium text-coral">{recommendation.author}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {recommendation.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-cream px-2 py-1 text-[11px] font-bold text-grey/60">
                                #{tag}
                            </span>
                        ))}
                        {recommendation.pageCount && (
                            <span className="rounded-full bg-cream px-2 py-1 text-[11px] font-bold text-grey/60">
                                {recommendation.pageCount} págs.
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <ul className="mt-3 space-y-1.5 border-t border-grey/10 pt-3">
                {recommendation.reasons.slice(0, 3).map((reason) => (
                    <li key={reason} className="flex gap-2 text-xs leading-5 text-grey/65">
                        <Sparkles size={13} className="mt-0.5 shrink-0 text-teal" />
                        <span>{reason}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}

export function ClubNextReadingRecommender({ canCreatePoll = false, onCreatePoll }: ClubNextReadingRecommenderProps) {
    const params = useParams();
    const clubId = params.id as string;
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreatingPoll, setIsCreatingPoll] = React.useState(false);
    const [message, setMessage] = React.useState("");

    React.useEffect(() => {
        let isMounted = true;
        if (!clubId) return;

        setIsLoading(true);
        getClubNextReadingRecommendations(clubId).then((items) => {
            if (!isMounted) return;
            const nextRecommendations = items as Recommendation[];
            setRecommendations(nextRecommendations);
            setSelectedIds(nextRecommendations.slice(0, 3).map((item) => item.id));
            setIsLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, [clubId]);

    const selectedTitles = recommendations
        .filter((recommendation) => selectedIds.includes(recommendation.id))
        .map((recommendation) => recommendation.title);

    const toggleSelection = (id: string) => {
        setMessage("");
        setSelectedIds((current) => (
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id].slice(0, 5)
        ));
    };

    const handleCreatePoll = async () => {
        if (!onCreatePoll || selectedTitles.length < 2) return;

        setIsCreatingPoll(true);
        setMessage("");

        try {
            await onCreatePoll("¿Cuál debería ser nuestra próxima lectura?", selectedTitles);
            setMessage("Votación creada con las recomendaciones seleccionadas.");
        } catch (error) {
            console.error(error);
            setMessage("No se pudo crear la votación.");
        } finally {
            setIsCreatingPoll(false);
        }
    };

    return (
        <Card className="rounded-3xl border-teal/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                        Recomendador del club
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-teal-dark">Próximas lecturas sugeridas</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-grey/65">
                        Sugerencias basadas en la memoria del club, las votaciones, sus etiquetas y el ritmo de lectura.
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/8 text-teal">
                    <Wand2 size={22} />
                </div>
            </div>

            {isLoading ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="h-44 animate-pulse rounded-2xl bg-grey/10" />
                    ))}
                </div>
            ) : recommendations.length > 0 ? (
                <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {recommendations.map((recommendation) => (
                            <RecommendationCard
                                key={recommendation.id}
                                recommendation={recommendation}
                                selected={selectedIds.includes(recommendation.id)}
                                onToggle={() => toggleSelection(recommendation.id)}
                            />
                        ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-teal/10 bg-cream/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-bold text-teal-dark">
                                    {selectedTitles.length} títulos seleccionados
                                </p>
                                <p className="mt-1 text-xs leading-5 text-grey/60">
                                    Elige entre 2 y 5 propuestas para convertirlas en votación.
                                </p>
                            </div>
                            {canCreatePoll && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleCreatePoll}
                                    disabled={selectedTitles.length < 2 || isCreatingPoll}
                                    className="w-full sm:w-auto"
                                >
                                    {isCreatingPoll ? "Creando..." : "Crear votación"}
                                </Button>
                            )}
                        </div>
                        {message && (
                            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-medium text-teal-dark">
                                {message}
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-grey/15 bg-white/60 p-5 text-sm leading-6 text-grey/55">
                    Aún no hay suficientes libros en el catálogo para generar sugerencias. Cuando el club tenga más lecturas o votaciones,
                    aparecerán recomendaciones más afinadas.
                </p>
            )}
        </Card>
    );
}

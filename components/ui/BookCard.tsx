import Image from "next/image";
import Link from "next/link";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { BookOpenText, BookText, Dna, Headphones, HeartPulse, Lock, ShieldCheck, Tablet, Trash2 } from "lucide-react";

export type BookResourceAccess = {
    kind: "guide" | "genome";
    label: string;
    href: string;
    access: "granted" | "admin" | "requires_purchase" | "requires_plan";
};

export interface BookCardProps {
    title: string;
    author: string;
    coverUrl: string;
    progress?: {
        current: number;
        total: number | null;
        label: string; // e.g., "pág 210/460", "45%" o "3h 20m / 11h"
        unit: "PAGES" | "PERCENT" | "CHAPTERS" | "TIME";
        percent?: number | null; // métrica canónica cross-formato (0-100)
    };
    lastSession?: string | null; // e.g. "Ayer"
    club?: {
        name: string;
        href: string;
    } | null;
    emotionSummary?: {
        lastEmotion: string | null;
        lastIntensity: number | null;
        lastNote: string | null;
        count: number;
        dominantEmotion: string | null;
        timeline: Array<{
            id: string;
            emotion: string;
            intensity: number;
            note: string | null;
            currentPage: number | null;
            createdAt: string;
        }>;
    };
    compact?: boolean; // For sidebar or recommendations
    onRegisterClick?: () => void;
    actionLabel?: string;
    onActionClick?: () => void;
    tag?: string; // Generic tag for recommendations (e.g. "98% Affinity", "Sci-Fi")
    onDelete?: () => void;
    onNotesClick?: () => void;
    onEmotionClick?: () => void;
    onCorrectLastClick?: () => void;
    onEmotionToNoteClick?: (emotionId: string) => void;
    onReviewClick?: () => void;
    reviewLabel?: string;
    status?: string;
    resources?: BookResourceAccess[];
    format?: "paper" | "ebook" | "audio" | null;
}

function getFormatMeta(format: "paper" | "ebook" | "audio") {
    switch (format) {
        case "audio":
            return { Icon: Headphones, label: "Audiolibro" };
        case "ebook":
            return { Icon: Tablet, label: "Ebook" };
        default:
            return { Icon: BookText, label: "Papel" };
    }
}

const emotionLabels: Record<string, string> = {
    asombro: "Asombro",
    tristeza: "Tristeza",
    enojo: "Enojo",
    miedo: "Miedo",
    alegria: "Alegría",
    disgusto: "Disgusto",
    empatia: "Empatía",
    confusion: "Confusión",
    esperanza: "Esperanza",
};

const emotionColors: Record<string, string> = {
    asombro: "bg-purple-400",
    tristeza: "bg-blue-400",
    enojo: "bg-red-400",
    miedo: "bg-slate-500",
    alegria: "bg-amber-400",
    disgusto: "bg-lime-500",
    empatia: "bg-pink-400",
    confusion: "bg-teal",
    esperanza: "bg-emerald-400",
};

function getResourceMeta(resource: BookResourceAccess) {
    const unlocked = resource.access === "granted" || resource.access === "admin";
    const Icon = resource.kind === "guide" ? BookOpenText : Dna;
    const statusLabel = resource.access === "admin"
        ? "Admin"
        : unlocked
            ? "Abrir"
            : resource.access === "requires_purchase"
                ? "Comprar"
                : "Plan";

    return { Icon, statusLabel, unlocked };
}

export function BookCard({ title, author, coverUrl, progress, lastSession, club, emotionSummary, compact, onRegisterClick, actionLabel, onActionClick, tag, onDelete, onNotesClick, onEmotionClick, onCorrectLastClick, onEmotionToNoteClick, onReviewClick, reviewLabel, status, resources, format }: BookCardProps) {
    const formatMeta = format ? getFormatMeta(format) : null;
    // Calculate percentage for progress bar. La métrica canónica (percent) manda;
    // caemos al cálculo legacy solo si no viene.
    const percentage = progress
        ? progress.percent != null
            ? progress.percent
            : progress.unit === "PERCENT"
                ? progress.current
                : (progress.total ? Math.min((progress.current / progress.total) * 100, 100) : 0)
        : 0;

    return (
        <div className={`bg-white rounded-xl border border-teal/5 shadow-sm hover:shadow-md transition-all group overflow-hidden flex ${compact ? "gap-4 p-4" : "flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6"}`}>

            {/* Cover */}
            <div className={`relative shrink-0 rounded-md overflow-hidden bg-grey/10 shadow-inner ${compact ? "w-20 h-28" : "w-28 h-40 md:w-32 md:h-48"}`}>
                {coverUrl ? (
                    <Image src={coverUrl} alt={title} fill className="object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-grey/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-1 min-w-0">
                    <h3 className={`font-serif text-teal leading-tight ${compact ? "line-clamp-2 text-base font-semibold" : "truncate text-xl font-bold"}`}>
                        {title}
                    </h3>
                    <p className="line-clamp-1 text-sm font-medium text-coral">{author}</p>
                    {formatMeta && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal/70">
                            <formatMeta.Icon className="h-3 w-3" />
                            {formatMeta.label}
                        </span>
                    )}
                </div>

                {/* Progress Section */}
                {progress && !compact && (
                    <div className="mt-auto mb-4">
                        <div className="flex justify-between items-end text-xs text-grey mb-1.5">
                            <span className="font-medium">{progress.label}</span>
                            <span className="opacity-60">{percentage.toFixed(0)}% {progress.unit === "TIME" ? "escuchado" : "completado"}</span>
                        </div>
                        <div className="w-full h-1.5 bg-grey/10 rounded-full overflow-hidden">
                            <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                        {lastSession && (
                            <p className="text-[10px] text-grey/40 mt-1.5 text-right">Última sesión: {lastSession}</p>
                        )}
                    </div>
                )}

                {emotionSummary && emotionSummary.count > 0 && !compact && (
                    <div className="mb-4 rounded-2xl border border-teal/10 bg-teal/5 px-3 py-2 text-xs text-grey/70">
                        <div className="flex items-start gap-2">
                        <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                        <div className="min-w-0">
                            <p className="font-bold text-teal-dark">
                                Última emoción: {emotionSummary.lastEmotion ? emotionLabels[emotionSummary.lastEmotion] || emotionSummary.lastEmotion : "Registrada"}
                                {emotionSummary.lastIntensity ? ` · ${emotionSummary.lastIntensity}/5` : ""}
                            </p>
                            {emotionSummary.lastNote && (
                                <p className="mt-0.5 truncate text-grey/55">{emotionSummary.lastNote}</p>
                            )}
                        </div>
                        </div>
                        {emotionSummary.timeline.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                                {emotionSummary.timeline.slice().reverse().map((item) => (
                                    <span
                                        key={item.id}
                                        title={`${emotionLabels[item.emotion] || item.emotion} · ${item.intensity}/5`}
                                        className={`h-2 rounded-full ${emotionColors[item.emotion] || "bg-grey/30"}`}
                                        style={{ width: `${Math.max(10, item.intensity * 7)}px` }}
                                    />
                                ))}
                            </div>
                        )}
                        {emotionSummary.timeline[0]?.note && onEmotionToNoteClick && (
                            <button
                                type="button"
                                onClick={() => onEmotionToNoteClick(emotionSummary.timeline[0].id)}
                                className="mt-2 text-xs font-bold text-teal hover:underline"
                            >
                                Convertir en nota
                            </button>
                        )}
                    </div>
                )}

                {resources && resources.length > 0 && !compact && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {resources.map((resource) => {
                            const { Icon, statusLabel, unlocked } = getResourceMeta(resource);
                            return (
                                <Link
                                    key={`${resource.kind}-${resource.href}`}
                                    href={resource.href}
                                    className={`inline-flex min-h-8 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                                        unlocked
                                            ? "border-teal/15 bg-teal/5 text-teal-dark hover:border-teal/30 hover:bg-teal/10"
                                            : "border-grey/15 bg-grey/5 text-grey hover:border-coral/25 hover:text-coral"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span>{resource.label}</span>
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-70">
                                        {resource.access === "admin" ? (
                                            <ShieldCheck className="h-3 w-3" />
                                        ) : unlocked ? null : (
                                            <Lock className="h-3 w-3" />
                                        )}
                                        {statusLabel}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Compact specific info */}
                {compact && (club || tag) && (
                    <div className="mt-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal/5 border border-teal/10 text-[10px] text-teal font-medium">
                            {club ? `👥 ${club.name}` : tag}
                        </span>
                    </div>
                )}


                {/* Compact Action */}
                {compact && onActionClick && (
                    <div className="mt-auto pt-2">
                        <button
                            className="text-xs text-teal font-medium hover:underline flex items-center gap-1 transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                onActionClick();
                            }}
                        >
                            {actionLabel || "Añadir"}
                        </button>
                    </div>
                )}

                {/* Actions (Desktop Main Card) */}
                {!compact && (
                    <div className={`flex flex-wrap items-center gap-3 mt-auto ${progress ? "" : "pt-4"}`}>

                        {/* Status-based Primary Action */}
                        {status === 'READING' && (
                            <>
                                <Button size="sm" className="h-9 px-4" onClick={onActionClick}>{actionLabel || "Nueva sesión"}</Button>
                                <Button variant="ghost" size="sm" className="h-9 px-3 text-grey hover:text-teal" onClick={onRegisterClick}>Registrar</Button>
                                <button onClick={onNotesClick} className="text-sm text-grey/60 hover:text-teal px-2 transition-colors">Notas</button>
                                <button onClick={onEmotionClick} className="text-sm text-grey/60 hover:text-teal px-2 transition-colors">Emoción</button>
                                {onCorrectLastClick && (
                                    <button onClick={onCorrectLastClick} className="text-sm text-grey/60 hover:text-teal px-2 transition-colors">Corregir</button>
                                )}
                                {onReviewClick && (
                                    <button onClick={onReviewClick} className="text-sm text-grey/60 hover:text-teal px-2 transition-colors">{reviewLabel || "Reseñar"}</button>
                                )}
                            </>
                        )}

                        {status === 'WANT_TO_READ' && (
                            <Button size="sm" className="h-9 px-4" onClick={onActionClick}>{actionLabel || "Empezar libro"}</Button>
                        )}

                        {status === 'PAUSED' && (
                            <Button size="sm" className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white" onClick={onActionClick}>{actionLabel || "Retomar"}</Button>
                        )}

                        {status === 'DNF' && (
                            <Button variant="outline" size="sm" className="h-9 px-4 border-grey/30 text-grey hover:border-teal hover:text-teal" onClick={onActionClick}>{actionLabel || "Dar otra oportunidad"}</Button>
                        )}

                        {status === 'READ' && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-9 px-4 border-grey/30 text-grey hover:border-teal hover:text-teal" onClick={onActionClick}>{actionLabel || "Ver detalles"}</Button>
                                {onCorrectLastClick && (
                                    <button onClick={onCorrectLastClick} className="text-sm text-grey/60 hover:text-teal px-2 transition-colors">Corregir última sesión</button>
                                )}
                            </div>
                        )}

                        {/* Fallback for no status or unexpected */}
                        {!status && (
                            <Button size="sm" className="h-9 px-4" onClick={onActionClick}>{actionLabel || "Ver libro"}</Button>
                        )}

                        {club && (
                            <div className="ml-auto pl-4 border-l border-black/5 hidden sm:block">
                                <Link href={club.href} className="text-xs text-teal hover:underline flex items-center gap-1">
                                    <Badge dot className="bg-coral mr-0.5" /> En club: <span className="font-bold">{club.name}</span>
                                </Link>
                            </div>
                        )}

                        {onDelete && (
                            <div className="ml-auto">
                                <button
                                    onClick={onDelete}
                                    className="p-2 text-grey/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar de mi lectura" // Accessibility
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

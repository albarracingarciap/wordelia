import Image from "next/image";
import Link from "next/link";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Trash2 } from "lucide-react";

export interface BookCardProps {
    title: string;
    author: string;
    coverUrl: string;
    progress?: {
        current: number;
        total: number | null;
        label: string; // e.g., "pág 210/460" or "45%"
        unit: "PAGES" | "PERCENT" | "CHAPTERS";
    };
    lastSession?: string | null; // e.g. "Ayer"
    club?: {
        name: string;
        href: string;
    } | null;
    compact?: boolean; // For sidebar or recommendations
    onRegisterClick?: () => void;
    actionLabel?: string;
    onActionClick?: () => void;
    tag?: string; // Generic tag for recommendations (e.g. "98% Affinity", "Sci-Fi")
    onDelete?: () => void;
    onNotesClick?: () => void;
    onReviewClick?: () => void;
    reviewLabel?: string;
    status?: string;
}

export function BookCard({ title, author, coverUrl, progress, lastSession, club, compact, onRegisterClick, actionLabel, onActionClick, tag, onDelete, onNotesClick, onReviewClick, reviewLabel, status }: BookCardProps) {
    // Calculate percentage for progress bar
    const percentage = progress
        ? progress.unit === "PERCENT"
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
                <div className="mb-1">
                    <h3 className={`font-serif text-teal leading-tight truncate ${compact ? "text-base font-semibold" : "text-xl font-bold"}`}>
                        {title}
                    </h3>
                    <p className="text-coral text-sm font-medium truncate">{author}</p>
                </div>

                {/* Progress Section */}
                {progress && !compact && (
                    <div className="mt-auto mb-4">
                        <div className="flex justify-between items-end text-xs text-grey mb-1.5">
                            <span className="font-medium">{progress.label}</span>
                            <span className="opacity-60">{percentage.toFixed(0)}% completado</span>
                        </div>
                        <div className="w-full h-1.5 bg-grey/10 rounded-full overflow-hidden">
                            <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                        {lastSession && (
                            <p className="text-[10px] text-grey/40 mt-1.5 text-right">Última sesión: {lastSession}</p>
                        )}
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

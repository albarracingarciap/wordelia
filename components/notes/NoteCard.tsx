import * as React from "react";
import { CheckCircle2, Lock, Pencil, Sparkles, Trash2 } from "lucide-react";
import { ShareQuoteButton } from "./ShareQuoteButton";

export interface Note {
    id: string;
    type: string;
    content: string;
    bookTitle: string;
    bookAuthor: string;
    location?: string;
    tags?: string[];
    isPrivate?: boolean;
    isHighlighted?: boolean;
    resolvedAt?: string | null;
    date: string;
    bookId?: string;
}

interface NoteCardProps {
    note: Note;
    onClick?: () => void;
    onEdit?: (note: Note) => void;
    onDelete?: (note: Note) => void;
    onToggleHighlight?: (note: Note) => void;
    onToggleResolved?: (note: Note) => void;
    onTagClick?: (tag: string) => void;
}

const TYPE_COLORS = {
    Cita: "bg-purple-100 text-purple-700 border-purple-200",
    Idea: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Pregunta: "bg-blue-100 text-blue-700 border-blue-200",
    Personaje: "bg-green-100 text-green-700 border-green-200",
    Subrayado: "bg-gray-100 text-gray-700 border-gray-200",
    Nota: "bg-teal/5 text-teal border-teal/10",
} as const;

export function NoteCard({
    note,
    onClick,
    onEdit,
    onDelete,
    onToggleHighlight,
    onToggleResolved,
    onTagClick,
}: NoteCardProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const isQuote = note.type === "Cita";
    const isQuestion = note.type === "Pregunta";
    const isEmotion = note.type.startsWith("Emoción");
    const isLong = note.content.length > 220;
    const visibleContent = isLong && !isExpanded ? `${note.content.slice(0, 220).trim()}...` : note.content;
    const typeColor = TYPE_COLORS[note.type as keyof typeof TYPE_COLORS] || "bg-grey/10 text-grey border-grey/15";

    return (
        <div
            onClick={onClick}
            className="group mb-4 break-inside-avoid rounded-2xl border border-teal/5 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${typeColor}`}>
                    {isEmotion ? "Emoción" : note.type}
                </span>
                <div className="flex items-center gap-1.5">
                    {note.isHighlighted && (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-coral/10 text-coral" title="Destacada">
                            <Sparkles className="h-3.5 w-3.5" />
                        </span>
                    )}
                    {note.resolvedAt && (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal/10 text-teal" title="Pregunta resuelta">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                    )}
                    {note.isPrivate && (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-grey/5 text-grey/45" title="Privado">
                            <Lock className="h-3.5 w-3.5" />
                        </span>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <p className={`text-sm leading-relaxed text-grey-dark ${isQuote ? "font-serif italic text-teal-dark/80" : ""}`}>
                    {isQuote ? `"${visibleContent}"` : visibleContent}
                </p>
                {isLong && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsExpanded((current) => !current);
                        }}
                        className="mt-2 text-xs font-bold text-teal transition-colors hover:text-coral"
                    >
                        {isExpanded ? "Ver menos" : "Ver completa"}
                    </button>
                )}
                {note.tags && note.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {note.tags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onTagClick?.(tag);
                                }}
                                className="rounded-full bg-teal/5 px-2.5 py-1 text-[11px] font-medium text-teal transition-colors hover:bg-teal/10"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between gap-3 border-t border-teal/5 pt-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-teal">{note.bookTitle}</p>
                    <p className="mt-0.5 text-[10px] text-grey/60">{note.location || note.bookAuthor}</p>
                    <p className="mt-1 text-[10px] text-grey/35">{note.date}</p>
                </div>
                <div className="flex shrink-0 gap-1.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    {isQuote && (
                        <div onClick={(event) => event.stopPropagation()}>
                            <ShareQuoteButton noteId={note.id} isPrivate={note.isPrivate} />
                        </div>
                    )}
                    {isQuote && onToggleHighlight && (
                        <button
                            type="button"
                            className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-colors ${note.isHighlighted ? "border-coral/25 text-coral" : "border-teal/10 text-grey/50 hover:text-coral"}`}
                            title={note.isHighlighted ? "Quitar destacado" : "Destacar cita"}
                            aria-label={note.isHighlighted ? "Quitar destacado" : "Destacar cita"}
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleHighlight(note);
                            }}
                        >
                            <Sparkles className="h-4 w-4" />
                        </button>
                    )}
                    {isQuestion && onToggleResolved && (
                        <button
                            type="button"
                            className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-colors ${note.resolvedAt ? "border-teal/25 text-teal" : "border-teal/10 text-grey/50 hover:text-teal"}`}
                            title={note.resolvedAt ? "Marcar como pendiente" : "Marcar como resuelta"}
                            aria-label={note.resolvedAt ? "Marcar como pendiente" : "Marcar como resuelta"}
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleResolved(note);
                            }}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/50 transition-colors hover:text-teal"
                            title="Editar"
                            aria-label="Editar nota"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(note);
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-coral/10 bg-white text-grey/50 transition-colors hover:text-coral"
                            title="Eliminar"
                            aria-label="Eliminar nota"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(note);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

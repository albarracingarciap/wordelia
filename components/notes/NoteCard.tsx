import * as React from "react";

export interface Note {
    id: string;
    type: "Cita" | "Idea" | "Pregunta" | "Personaje" | "Subrayado" | "Nota";
    content: string;
    bookTitle: string;
    bookAuthor: string;
    location?: string; // e.g. "p. 120"
    tags?: string[];
    isPrivate?: boolean;
    date: string;
}

interface NoteCardProps {
    note: Note;
    onClick?: () => void;
}

const TYPE_COLORS = {
    "Cita": "bg-purple-100 text-purple-700 border-purple-200",
    "Idea": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Pregunta": "bg-blue-100 text-blue-700 border-blue-200",
    "Personaje": "bg-green-100 text-green-700 border-green-200",
    "Subrayado": "bg-gray-100 text-gray-700 border-gray-200",
};

export function NoteCard({ note, onClick, onEdit }: NoteCardProps & { onEdit?: (note: Note) => void }) {
    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-xl border border-teal/5 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer break-inside-avoid mb-4"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border ${TYPE_COLORS[note.type as keyof typeof TYPE_COLORS] || "bg-grey/10 text-grey"}`}>
                    {note.type}
                </span>
                {note.isPrivate && (
                    <span className="text-gray-400" title="Privado">🔒</span>
                )}
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className={`text-sm text-grey-dark leading-relaxed ${note.type === "Cita" ? "italic font-serif text-teal-dark/80" : ""}`}>
                    &ldquo;{note.content}&rdquo;
                </p>
            </div>

            {/* Context */}
            <div className="pt-3 border-t border-teal/5 flex justify-between items-end">
                <div>
                    <p className="font-serif text-teal text-xs font-medium truncate max-w-[150px]">{note.bookTitle}</p>
                    <p className="text-[10px] text-grey/60 mt-0.5">{note.location || note.bookAuthor}</p>
                </div>
                {/* Actions (opacity 0 until hover) */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="text-grey/40 hover:text-teal transition-colors"
                        title="Editar"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) onEdit(note);
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    {/* Share removed as requested */}
                </div>
            </div>
        </div>
    );
}

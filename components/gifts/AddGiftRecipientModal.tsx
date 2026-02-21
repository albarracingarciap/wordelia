"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createGiftRecipient } from "@/app/app/wishes/gift-actions";

interface AddGiftRecipientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RELATION_SUGGESTIONS = ["Pareja 💖", "Sobrino/a", "Madre", "Padre", "Hermano/a", "Amigo/a", "Abuelo/a"];

export function AddGiftRecipientModal({ isOpen, onClose, onSuccess }: AddGiftRecipientModalProps) {
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("");
    const [notes, setNotes] = useState("");
    const [eventName, setEventName] = useState("Cumpleaños");
    const [eventDate, setEventDate] = useState("");
    const [addEvent, setAddEvent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    function reset() {
        setName(""); setRelation(""); setNotes("");
        setEventName("Cumpleaños"); setEventDate("");
        setAddEvent(false); setError(null);
    }

    function handleClose() {
        if (!isPending) { reset(); onClose(); }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await createGiftRecipient({
                name, relation, notes,
                eventName: addEvent ? eventName : undefined,
                eventDate: addEvent ? eventDate : undefined,
            });
            if (result.error) {
                setError(result.error);
            } else {
                reset();
                onSuccess();
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-grey/10">
                    <div>
                        <h2 className="font-serif text-xl text-teal">Añadir persona</h2>
                        <p className="text-xs text-grey/50 mt-0.5">Guarda ideas de regalo en secreto</p>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-full hover:bg-grey/10 flex items-center justify-center transition-colors text-grey/60">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-grey/70 uppercase tracking-wider mb-2 block">Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ej. Clara"
                            required
                            className="w-full h-12 px-4 rounded-xl border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm placeholder:text-grey/30 bg-cream/20 transition-colors"
                        />
                    </div>

                    {/* Relation */}
                    <div>
                        <label className="text-xs font-semibold text-grey/70 uppercase tracking-wider mb-2 block">
                            Relación <span className="font-normal text-grey/40">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={relation}
                            onChange={(e) => setRelation(e.target.value)}
                            placeholder="Pareja, sobrino, amigo..."
                            className="w-full h-12 px-4 rounded-xl border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm placeholder:text-grey/30 bg-cream/20 transition-colors"
                        />
                        {/* Quick suggestions */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {RELATION_SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setRelation(s)}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${relation === s ? "border-teal/40 bg-teal/10 text-teal" : "border-grey/15 text-grey/60 hover:border-grey/30"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-semibold text-grey/70 uppercase tracking-wider mb-2 block">
                            Gustos literarios <span className="font-normal text-grey/40">(opcional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Le gusta el realismo mágico, le encantan los clásicos..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm placeholder:text-grey/30 bg-cream/20 transition-colors resize-none"
                        />
                    </div>

                    {/* Event Toggle */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setAddEvent(!addEvent)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${addEvent ? "border-teal/40 bg-teal/5" : "border-grey/10 hover:border-grey/20"
                                }`}
                        >
                            <span className="text-xl">🎉</span>
                            <div className="flex-1">
                                <p className={`text-sm font-semibold ${addEvent ? "text-teal" : "text-grey"}`}>
                                    Añadir fecha especial
                                </p>
                                <p className="text-xs text-grey/50">Cumpleaños, aniversario, Navidad...</p>
                            </div>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${addEvent ? "border-teal bg-teal" : "border-grey/30"}`}>
                                {addEvent && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                        </button>

                        {addEvent && (
                            <div className="mt-3 grid grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-150">
                                <div>
                                    <label className="text-xs text-grey/60 mb-1.5 block">Tipo de evento</label>
                                    <select
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm transition-colors bg-white"
                                    >
                                        {["Cumpleaños", "Aniversario", "Navidad", "Reyes", "Día de la Madre", "Día del Padre", "Otro"].map((o) => (
                                            <option key={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-grey/60 mb-1.5 block">Fecha</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending || !name.trim()}
                        className="w-full h-12 bg-teal text-white rounded-full font-medium hover:bg-opacity-90 transition-all shadow-md shadow-teal/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Añadiendo...</>
                        ) : (
                            "Añadir persona"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

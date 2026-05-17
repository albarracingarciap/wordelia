"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { saveUserBookEmotion } from "@/app/app/mi-lectura/actions";
import { X } from "lucide-react";

const EMOTIONS = [
    { id: "asombro", label: "Asombro", icon: "😮" },
    { id: "tristeza", label: "Tristeza", icon: "😢" },
    { id: "enojo", label: "Enojo", icon: "😠" },
    { id: "miedo", label: "Miedo", icon: "😨" },
    { id: "alegria", label: "Alegría", icon: "😄" },
    { id: "disgusto", label: "Disgusto", icon: "😖" },
    { id: "empatia", label: "Empatía", icon: "🤝" },
    { id: "confusion", label: "Confusión", icon: "🤔" },
    { id: "esperanza", label: "Esperanza", icon: "✨" },
];

interface ReadingEmotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    book?: {
        id: string;
        title: string;
        author: string;
    } | null;
}

export function ReadingEmotionModal({ isOpen, onClose, onSaved, book }: ReadingEmotionModalProps) {
    const [emotion, setEmotion] = React.useState("asombro");
    const [intensity, setIntensity] = React.useState(3);
    const [note, setNote] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) return;
        setEmotion("asombro");
        setIntensity(3);
        setNote("");
        setError("");
    }, [isOpen]);

    if (!isOpen || !book) return null;

    const handleSave = async () => {
        setLoading(true);
        setError("");

        const result = await saveUserBookEmotion(book.id, emotion, intensity, note);
        setLoading(false);

        if (result?.error) {
            setError(result.error);
            return;
        }

        onSaved?.();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 p-0 pb-20 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[calc(100dvh-9.5rem)] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:rounded-2xl">
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-grey/45">Pulso emocional</p>
                        <h3 className="mt-1 text-2xl font-bold text-teal-dark">¿Qué te está haciendo sentir?</h3>
                        <p className="mt-2 text-sm text-grey/60">
                            {book.title} · {book.author}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-grey/40 transition-colors hover:bg-grey/5 hover:text-coral"
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {EMOTIONS.map((item) => {
                            const selected = emotion === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setEmotion(item.id)}
                                    className={`rounded-2xl border p-3 text-center transition ${selected
                                        ? "border-teal bg-teal/5 text-teal-dark shadow-sm"
                                        : "border-grey/10 bg-white text-grey-dark hover:border-teal/20"
                                        }`}
                                >
                                    <span className="block text-2xl">{item.icon}</span>
                                    <span className="mt-1 block text-xs font-bold sm:text-sm">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-sm font-bold text-teal-dark">Intensidad</label>
                            <span className="rounded-full bg-teal/8 px-3 py-1 text-xs font-bold text-teal">
                                {intensity}/5
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            value={intensity}
                            onChange={(event) => setIntensity(Number(event.target.value))}
                            className="mt-3 w-full accent-teal"
                        />
                        <div className="mt-1 flex justify-between text-xs text-grey/45">
                            <span>Leve</span>
                            <span>Moderada</span>
                            <span>Intensa</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="text-sm font-bold text-teal-dark">Nota opcional</label>
                        <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="¿Qué escena, frase o idea provocó esta emoción?"
                            className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-grey/15 bg-white px-4 py-3 text-sm text-grey-dark outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/10"
                        />
                    </div>

                    {error && (
                        <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
                            {error}
                        </p>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-3 border-t border-grey/10 bg-white px-6 pb-4 pt-4 sm:grid-cols-[1fr_1.4fr] sm:pb-6">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} isLoading={loading}>
                        Guardar emoción
                    </Button>
                </div>
            </div>
        </div>
    );
}

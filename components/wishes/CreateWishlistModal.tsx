"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createWishlist } from "@/app/app/wishes/wishlist-actions";

interface CreateWishlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EMOJIS = ["📚", "🎂", "🎁", "☀️", "❄️", "🌸", "💭", "✨", "🎶", "🏖️", "🍂", "💖"];
const PRIVACY_OPTIONS = [
    { value: "public", label: "Pública", icon: "🌍", desc: "Cualquiera con el enlace puede verla" },
    { value: "shared", label: "Compartida", icon: "👥", desc: "Visible para tus amigos — los regalados aparecen bloqueados" },
    { value: "private", label: "Privada", icon: "🔒", desc: "Solo tú puedes verla" },
] as const;

export function CreateWishlistModal({ isOpen, onClose, onSuccess }: CreateWishlistModalProps) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("📚");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState<"public" | "private" | "shared">("public");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    function reset() {
        setName("");
        setEmoji("📚");
        setDescription("");
        setPrivacy("public");
        setError(null);
    }

    function handleClose() {
        if (!isPending) {
            reset();
            onClose();
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await createWishlist({ name, emoji, description, privacy });
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
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-grey/10">
                    <div>
                        <h2 className="font-serif text-xl text-teal">Nueva lista de deseos</h2>
                        <p className="text-xs text-grey/50 mt-0.5">Organiza tus sueños lectores</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full hover:bg-grey/10 flex items-center justify-center transition-colors text-grey/60"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Emoji + Name */}
                    <div>
                        <label className="text-xs font-semibold text-grey/70 uppercase tracking-wider mb-2 block">
                            Nombre de la lista
                        </label>
                        <div className="flex gap-3 items-center">
                            {/* Emoji selector */}
                            <div className="relative group">
                                <button
                                    type="button"
                                    className="w-12 h-12 text-2xl rounded-xl border-2 border-grey/10 hover:border-teal/30 flex items-center justify-center transition-colors bg-cream/30"
                                >
                                    {emoji}
                                </button>
                                {/* Emoji picker dropdown */}
                                <div className="absolute top-full left-0 mt-2 bg-white border border-grey/10 rounded-xl shadow-lg p-2 grid grid-cols-6 gap-1 z-20 hidden group-focus-within:grid">
                                    {EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setEmoji(e)}
                                            className={`w-8 h-8 text-lg rounded-lg hover:bg-cream/60 flex items-center justify-center transition-colors ${emoji === e ? "bg-teal/10 ring-1 ring-teal/20" : ""}`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej. Cumpleaños de Carlos 🎂"
                                maxLength={60}
                                required
                                className="flex-1 h-12 px-4 rounded-xl border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm placeholder:text-grey/30 bg-cream/20 transition-colors"
                            />
                        </div>
                        {/* Emoji quick select */}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            {EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => setEmoji(e)}
                                    className={`w-8 h-8 text-base rounded-lg hover:bg-cream/60 flex items-center justify-center transition-all text-sm ${emoji === e ? "bg-teal/10 ring-1 ring-teal/20 scale-110" : ""}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-grey/70 uppercase tracking-wider mb-2 block">
                            Descripción <span className="font-normal text-grey/40">(opcional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Para qué es esta lista..."
                            rows={2}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-xl border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm placeholder:text-grey/30 bg-cream/20 transition-colors resize-none"
                        />
                    </div>

                    {/* Privacy */}
                    <div>
                        <label className="text-xs font-semibold text-grey/70 uppercase tracking-wider mb-2 block">
                            Privacidad
                        </label>
                        <div className="space-y-2">
                            {PRIVACY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPrivacy(opt.value)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-start gap-3 ${privacy === opt.value
                                            ? "border-teal/40 bg-teal/5"
                                            : "border-grey/10 hover:border-grey/20 bg-transparent"
                                        }`}
                                >
                                    <span className="text-xl leading-none mt-0.5">{opt.icon}</span>
                                    <div>
                                        <p className={`text-sm font-semibold ${privacy === opt.value ? "text-teal" : "text-grey"}`}>
                                            {opt.label}
                                        </p>
                                        <p className="text-xs text-grey/50">{opt.desc}</p>
                                    </div>
                                    {privacy === opt.value && (
                                        <div className="ml-auto w-4 h-4 rounded-full bg-teal flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-white text-[10px]">✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending || !name.trim()}
                        className="w-full h-12 bg-coral text-white rounded-full font-medium hover:bg-opacity-90 transition-all shadow-md shadow-coral/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "Crear lista"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

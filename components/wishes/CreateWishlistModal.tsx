"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { createWishlist, updateWishlist } from "@/app/app/wishes/wishlist-actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CreateWishlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        id: string;
        name: string;
        emoji: string;
        description: string | null;
        privacy: "public" | "private" | "shared";
        targetDate: string | null;
    };
}

const EMOJIS = ["📚", "🎂", "🎁", "☀️", "❄️", "🌸", "💭", "✨", "🎶", "🏖️", "🍂", "💖"];

const PRIVACY_OPTIONS = [
    { value: "public", label: "Pública", icon: "🌍", desc: "Cualquiera con el enlace puede verla" },
    { value: "shared", label: "Compartida", icon: "👥", desc: "Visible para tus amigos; los regalados aparecen bloqueados" },
    { value: "private", label: "Privada", icon: "🔒", desc: "Solo tú puedes verla" },
] as const;

export function CreateWishlistModal({ isOpen, onClose, onSuccess, initialData }: CreateWishlistModalProps) {
    const isEdit = !!initialData;
    const [name, setName] = useState(initialData?.name || "");
    const [emoji, setEmoji] = useState(initialData?.emoji || "📚");
    const [description, setDescription] = useState(initialData?.description || "");
    const [privacy, setPrivacy] = useState<"public" | "private" | "shared">(initialData?.privacy || "public");
    const [targetDate, setTargetDate] = useState(initialData?.targetDate || "");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!isOpen) return;

        setName(initialData?.name || "");
        setEmoji(initialData?.emoji || "📚");
        setDescription(initialData?.description || "");
        setPrivacy(initialData?.privacy || "public");
        setTargetDate(initialData?.targetDate || "");
        setError(null);
    }, [initialData, isOpen]);

    function handleClose() {
        if (!isPending) {
            setError(null);
            onClose();
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = isEdit && initialData
                ? await updateWishlist(initialData.id, {
                    name,
                    emoji,
                    description,
                    privacy,
                    targetDate: targetDate || null,
                })
                : await createWishlist({
                    name,
                    emoji,
                    description,
                    privacy,
                    targetDate: targetDate || undefined,
                });

            if (result.error) {
                setError(result.error);
                return;
            }

            onSuccess();
        });
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? "Editar lista de deseos" : "Nueva lista de deseos"}
            size="md"
            preserveMobileNav
            className="max-h-[calc(100dvh-4.75rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-b-none sm:max-h-[min(760px,calc(100dvh-2rem))] sm:rounded-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5 pt-1">
                <p className="text-sm leading-relaxed text-grey/70">
                    {isEdit ? "Ajusta el nombre, la fecha o la privacidad de esta lista." : "Organiza los libros que te gustaría recibir y decide cómo compartir la lista."}
                </p>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">
                        Nombre de la lista
                    </label>
                    <div className="flex items-start gap-3">
                        <div className="shrink-0">
                            <button
                                type="button"
                                className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal/10 bg-cream/30 text-2xl transition-colors hover:border-teal/30"
                                aria-label="Emoji seleccionado"
                            >
                                {emoji}
                            </button>
                        </div>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Cumpleaños de Carlos"
                            maxLength={60}
                            required
                            autoFocus
                            className="h-12"
                        />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {EMOJIS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setEmoji(item)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all hover:bg-cream/60 ${emoji === item ? "bg-teal/10 ring-1 ring-teal/20" : ""}`}
                                aria-label={`Usar ${item}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">
                        Descripción <span className="font-medium text-grey/40">(opcional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Para qué es esta lista..."
                        rows={3}
                        maxLength={200}
                        className="w-full resize-none rounded-xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark placeholder:text-grey/30 transition-all focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5"
                    />
                </div>

                <Input
                    label="Fecha del evento"
                    helperText="Añade la fecha si es para tu cumpleaños, Navidad o una ocasión concreta."
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                />

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">
                        Privacidad
                    </label>
                    <div className="space-y-2">
                        {PRIVACY_OPTIONS.map((option) => {
                            const isSelected = privacy === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setPrivacy(option.value)}
                                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${isSelected
                                        ? "border-teal/35 bg-teal/5"
                                        : "border-teal/10 bg-white hover:border-teal/20 hover:bg-cream/30"
                                        }`}
                                >
                                    <span className="mt-0.5 text-xl leading-none">{option.icon}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-sm font-bold ${isSelected ? "text-teal" : "text-grey-dark"}`}>
                                            {option.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-grey/55">
                                            {option.desc}
                                        </span>
                                    </span>
                                    {isSelected && (
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {error && (
                    <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
                        {error}
                    </p>
                )}

                <div className="grid grid-cols-1 gap-3 border-t border-teal/5 pt-4 sm:flex sm:justify-end">
                    <Button type="button" variant="ghost" onClick={handleClose} className="h-12 w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending || !name.trim()}
                        className="h-12 w-full disabled:shadow-none disabled:opacity-45 sm:w-auto"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            isEdit ? "Guardar cambios" : "Crear lista"
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

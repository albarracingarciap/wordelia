"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { CalendarDays, Camera, Check, Gift, Loader2, UserRound, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createGiftRecipient, updateGiftRecipient } from "@/app/app/wishes/gift-actions";
import { createClient } from "@/utils/supabase/client";

interface AddGiftRecipientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    recipient?: {
        id: string;
        name: string;
        relation: string | null;
        avatarUrl: string | null;
        notes: string | null;
        upcomingEvent: {
            id: string;
            name: string;
            eventDate: string;
        } | null;
    };
}

const RELATION_SUGGESTIONS = ["Pareja", "Sobrino/a", "Madre", "Padre", "Hermano/a", "Amigo/a", "Abuelo/a"];
const EVENT_OPTIONS = ["Cumpleaños", "Aniversario", "Navidad", "Reyes", "Día de la Madre", "Día del Padre", "Otro"];

export function AddGiftRecipientModal({ isOpen, onClose, onSuccess, recipient }: AddGiftRecipientModalProps) {
    const isEditing = Boolean(recipient);
    const [name, setName] = useState(recipient?.name || "");
    const [relation, setRelation] = useState(recipient?.relation || "");
    const [avatarUrl, setAvatarUrl] = useState(recipient?.avatarUrl || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(recipient?.avatarUrl || "");
    const [notes, setNotes] = useState(recipient?.notes || "");
    const [eventName, setEventName] = useState(recipient?.upcomingEvent?.name || "Cumpleaños");
    const [eventDate, setEventDate] = useState(recipient?.upcomingEvent?.eventDate || "");
    const [addEvent, setAddEvent] = useState(Boolean(recipient?.upcomingEvent));
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, recipient?.id]);

    function reset() {
        setName(recipient?.name || "");
        setRelation(recipient?.relation || "");
        setAvatarUrl(recipient?.avatarUrl || "");
        setAvatarFile(null);
        setAvatarPreview(recipient?.avatarUrl || "");
        setNotes(recipient?.notes || "");
        setEventName(recipient?.upcomingEvent?.name || "Cumpleaños");
        setEventDate(recipient?.upcomingEvent?.eventDate || "");
        setAddEvent(Boolean(recipient?.upcomingEvent));
        setError(null);
    }

    function handleClose() {
        if (isPending) return;
        reset();
        onClose();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
            let finalAvatarUrl = avatarUrl || null;

            if (avatarFile) {
                const uploaded = await uploadGiftRecipientAvatar(avatarFile);
                if (uploaded.error) {
                    setError(uploaded.error);
                    return;
                }
                finalAvatarUrl = uploaded.url || null;
            }

            const result = recipient
                ? await updateGiftRecipient(recipient.id, {
                    name,
                    relation,
                    notes,
                    avatarUrl: finalAvatarUrl,
                    eventId: recipient.upcomingEvent?.id || null,
                    eventName: addEvent ? eventName : undefined,
                    eventDate: addEvent ? eventDate : undefined,
                })
                : await createGiftRecipient({
                    name,
                    relation,
                    notes,
                    avatarUrl: finalAvatarUrl,
                    eventName: addEvent ? eventName : undefined,
                    eventDate: addEvent ? eventDate : undefined,
                });

            if (result.error) {
                setError(result.error);
                return;
            }

            reset();
            onSuccess();
        });
    }

    function handleAvatarChange(file: File | undefined) {
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            preserveMobileNav
            size="md"
            className="max-h-[calc(100dvh-5rem)] sm:max-h-[calc(100dvh-2rem)]"
        >
            <div className="-m-5 sm:-m-6">
                <header className="flex items-start justify-between gap-4 border-b border-grey/10 px-5 py-5 sm:px-6">
                    <div className="min-w-0">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal sm:hidden">
                            <UserRound className="h-5 w-5" />
                        </div>
                        <h2 className="font-serif text-2xl font-bold leading-tight text-teal">
                            {isEditing ? "Editar persona" : "Añadir persona"}
                        </h2>
                        <p className="mt-1 text-sm text-grey/55">
                            {isEditing ? "Actualiza sus datos y próximas fechas." : "Guarda ideas de regalo en secreto."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-grey/50 transition-colors hover:bg-grey/10 hover:text-coral"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
                    <section className="flex items-center gap-4 rounded-2xl border border-teal/10 bg-cream/35 p-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-teal/10 bg-teal/10 text-teal shadow-sm">
                            {avatarPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarPreview} alt={name || "Foto de perfil"} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold">{name.trim().charAt(0).toUpperCase() || <UserRound className="h-7 w-7" />}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-teal">Foto de la persona</p>
                            <p className="mt-1 text-xs leading-relaxed text-grey/55">Opcional, solo para reconocer mejor el perfil.</p>
                            <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-teal/10 bg-white px-4 text-xs font-bold text-teal shadow-sm transition-colors hover:border-teal/25">
                                <Camera className="h-4 w-4" />
                                {avatarPreview ? "Cambiar foto" : "Añadir foto"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                                />
                            </label>
                        </div>
                    </section>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/55">Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="ej. Clara"
                            required
                            className="h-14 w-full rounded-2xl border-2 border-grey/10 bg-white px-4 text-base text-grey outline-none transition-colors placeholder:text-grey/30 focus:border-teal/35"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/55">
                            Relación <span className="font-medium text-grey/35">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={relation}
                            onChange={(event) => setRelation(event.target.value)}
                            placeholder="Pareja, sobrino, amigo..."
                            className="h-14 w-full rounded-2xl border-2 border-grey/10 bg-white px-4 text-base text-grey outline-none transition-colors placeholder:text-grey/30 focus:border-teal/35"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                            {RELATION_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setRelation(suggestion)}
                                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${relation === suggestion
                                        ? "border-teal/35 bg-teal/10 text-teal"
                                        : "border-grey/15 bg-white text-grey/60 hover:border-teal/25 hover:text-teal"
                                        }`}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/55">
                            Gustos literarios <span className="font-medium text-grey/35">(opcional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Le gusta el realismo mágico, los clásicos, las novelas breves..."
                            rows={3}
                            className="w-full resize-none rounded-2xl border-2 border-grey/10 bg-white px-4 py-3 text-base text-grey outline-none transition-colors placeholder:text-grey/30 focus:border-teal/35"
                        />
                    </div>

                    <section className="rounded-2xl border border-teal/10 bg-cream/35 p-3">
                        <button
                            type="button"
                            onClick={() => setAddEvent(!addEvent)}
                            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/60"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-teal">Añadir fecha especial</p>
                                <p className="truncate text-sm text-grey/55">Cumpleaños, aniversario, Navidad...</p>
                            </div>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${addEvent ? "border-teal bg-teal text-white" : "border-grey/20 bg-white text-transparent"}`}>
                                <Check className="h-4 w-4" />
                            </span>
                        </button>

                        {addEvent && (
                            <div className="mt-3 grid gap-3 rounded-2xl bg-white p-3 sm:grid-cols-2">
                                <label>
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-grey/45">Tipo</span>
                                    <select
                                        value={eventName}
                                        onChange={(event) => setEventName(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-grey/10 bg-white px-3 text-sm font-bold text-teal outline-none focus:border-teal/35"
                                    >
                                        {EVENT_OPTIONS.map((option) => (
                                            <option key={option}>{option}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-grey/45">Fecha</span>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(event) => setEventDate(event.target.value)}
                                        required={addEvent}
                                        className="h-11 w-full rounded-xl border border-grey/10 bg-white px-3 text-sm text-grey outline-none focus:border-teal/35"
                                    />
                                </label>
                            </div>
                        )}
                    </section>

                    {error && (
                        <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending || !name.trim() || (addEvent && !eventDate)}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-coral px-6 font-bold text-white shadow-md shadow-coral/20 transition-all hover:bg-[#C25852] disabled:cursor-not-allowed disabled:bg-grey/30 disabled:shadow-none"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isEditing ? "Guardando..." : "Añadiendo..."}
                            </>
                        ) : (
                            <>
                                <Gift className="h-4 w-4" />
                                {isEditing ? "Guardar cambios" : "Añadir persona"}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </Modal>
    );
}

async function uploadGiftRecipientAvatar(file: File): Promise<{ url?: string; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para subir una foto." };

    const extension = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "jpg";
    const filePath = `${user.id}/gift-recipients/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
        .from("gift-recipient-avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
        return { error: "No hemos podido subir la foto. Revisa que la migración del bucket esté aplicada." };
    }

    const { data } = supabase.storage.from("gift-recipient-avatars").getPublicUrl(filePath);
    return { url: data.publicUrl };
}

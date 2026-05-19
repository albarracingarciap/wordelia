"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Gift, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { BookSearchModal, WishlistBook } from "@/components/gifts/BookSearchModal";
import { AddGiftRecipientModal } from "@/components/gifts/AddGiftRecipientModal";
import { GiftRecipientDetailData, GiftIdeaData, GiftIdeaStatus, addGiftIdea, markGiftIdeaAsPurchased, deleteGiftIdea, updateGiftIdea, updateGiftIdeaStatus } from "@/app/app/wishes/gift-idea-actions";

const STATUS_LABELS: Record<GiftIdeaStatus, string> = {
    IDEA: "Idea",
    RESERVED: "Reservado",
    PURCHASED: "Comprado",
    WRAPPED: "Envuelto",
    DELIVERED: "Entregado",
};

const STATUS_FLOW: GiftIdeaStatus[] = ["IDEA", "RESERVED", "PURCHASED", "WRAPPED", "DELIVERED"];

interface GiftRecipientViewProps {
    recipient: GiftRecipientDetailData;
    ideas: GiftIdeaData[];
}

export function GiftRecipientView({ recipient, ideas: initialIdeas }: GiftRecipientViewProps) {
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<GiftIdeaData | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleAddBook(book: WishlistBook) {
        startTransition(async () => {
            const result = await addGiftIdea(recipient.id, {
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl ?? undefined,
                price: book.price ?? undefined,
                bookId: book.isbn ?? book.id,
            });
            if (result?.error) alert(result.error);
            setIsSearchOpen(false);
            router.refresh();
        });
    }

    function handleMarkPurchased(ideaId: string) {
        startTransition(async () => {
            const result = await markGiftIdeaAsPurchased(ideaId, recipient.id);
            if (result?.error) alert(result.error);
            router.refresh();
        });
    }

    function handleUpdateStatus(ideaId: string, status: GiftIdeaStatus) {
        startTransition(async () => {
            const result = await updateGiftIdeaStatus(ideaId, recipient.id, status);
            if (result?.error) alert(result.error);
            router.refresh();
        });
    }

    function handleSaveIdea(idea: GiftIdeaData, data: { title: string; author: string; price: number | null; privateNote: string }) {
        startTransition(async () => {
            const result = await updateGiftIdea(idea.id, recipient.id, data);
            if (result?.error) {
                alert(result.error);
                return;
            }
            setEditingIdea(null);
            router.refresh();
        });
    }

    function handleDelete(ideaId: string) {
        if (!confirm("¿Eliminar esta idea de regalo?")) return;

        startTransition(async () => {
            const result = await deleteGiftIdea(ideaId, recipient.id);
            if (result?.error) alert(result.error);
            router.refresh();
        });
    }

    const pendingIdeas = initialIdeas.filter((idea) => !["PURCHASED", "WRAPPED", "DELIVERED"].includes(idea.giftStatus));
    const purchasedIdeas = initialIdeas.filter((idea) => ["PURCHASED", "WRAPPED", "DELIVERED"].includes(idea.giftStatus));
    const needsReview = initialIdeas.filter((idea) => idea.title.toLowerCase().includes("portada pendiente"));

    return (
        <>
            <BookSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAdd={handleAddBook}
                title={`Libro para ${recipient.name}`}
                addLabel="Guardar regalo"
            />
            <AddGiftRecipientModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSuccess={() => {
                    setIsEditOpen(false);
                    router.refresh();
                }}
                recipient={recipient}
            />
            <EditGiftIdeaModal
                idea={editingIdea}
                isPending={isPending}
                onClose={() => setEditingIdea(null)}
                onSave={handleSaveIdea}
            />

            <div className="pb-24">
                <Link
                    href="/app/wishes?tab=gifts"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-grey/50 transition-colors hover:text-teal"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a mis regalos
                </Link>

                <section className="mb-8">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-grey/35">Regalos</p>
                    <div className="flex flex-col gap-5 rounded-2xl border border-teal/10 bg-white p-5 shadow-sm sm:p-6 md:flex-row md:items-start">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-teal/10 bg-teal/10 text-teal shadow-sm">
                            {recipient.avatarUrl ? (
                                <Image
                                    src={recipient.avatarUrl}
                                    alt={recipient.name}
                                    width={80}
                                    height={80}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold">{recipient.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h1 className="font-serif text-3xl font-bold leading-tight text-teal sm:text-4xl">
                                        {recipient.name}
                                    </h1>
                                    <p className="mt-2 text-base text-grey/65">
                                        {recipient.relation || "Perfil de regalo"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(true)}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-teal/10 bg-white px-5 text-sm font-bold text-teal shadow-sm transition-colors hover:border-teal/25"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </button>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <InfoPill
                                    icon={Gift}
                                    label="Ideas pendientes"
                                    value={pendingIdeas.length === 1 ? "1 idea" : `${pendingIdeas.length} ideas`}
                                />
                                <InfoPill
                                    icon={CheckCircle2}
                                    label="Comprados"
                                    value={purchasedIdeas.length === 1 ? "1 regalo" : `${purchasedIdeas.length} regalos`}
                                />
                            </div>

                            {needsReview.length > 0 && (
                                <div className="mt-4 rounded-2xl border border-coral/10 bg-coral/5 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-coral/70">Revisión pendiente</p>
                                    <p className="mt-1 text-sm text-grey/65">
                                        Hay {needsReview.length} {needsReview.length === 1 ? "foto de portada pendiente" : "fotos de portada pendientes"} de completar.
                                    </p>
                                </div>
                            )}

                            {recipient.upcomingEvent && (
                                <div className="mt-4 rounded-2xl border border-coral/10 bg-coral/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold uppercase tracking-wide text-coral/70">Próxima fecha</p>
                                            <p className="truncate font-bold text-teal">
                                                {recipient.upcomingEvent.name}
                                                <span className="ml-2 font-medium text-grey/55">
                                                    {recipient.upcomingEvent.daysLeft <= 0 ? "hoy" : `en ${recipient.upcomingEvent.daysLeft} días`}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {recipient.notes && (
                                <div className="mt-4 rounded-2xl border border-teal/10 bg-cream/50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-grey/40">Gustos literarios</p>
                                    <p className="mt-1 text-sm leading-relaxed text-grey/70">{recipient.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mb-6 flex flex-col gap-4 border-b border-grey/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-grey/35">Ideas</p>
                        <h2 className="mt-2 font-serif text-2xl text-teal">Regalos preparados</h2>
                        <p className="mt-1 text-sm text-grey/55">
                            Libros guardados en secreto para {recipient.name}.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        disabled={isPending}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-coral px-6 text-sm font-bold text-white shadow-md shadow-coral/20 transition-colors hover:bg-[#C25852] disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Añadir idea
                    </button>
                </section>

                {initialIdeas.length === 0 ? (
                    <EmptyGiftIdeas recipientName={recipient.name} onAdd={() => setIsSearchOpen(true)} />
                ) : (
                    <div className="space-y-8">
                        {pendingIdeas.length > 0 && (
                            <section>
                                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-grey/40">Pendientes</h3>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {pendingIdeas.map((idea) => (
                                        <GiftIdeaCard
                                            key={idea.id}
                                            idea={idea}
                                            isPending={isPending}
                                            onMarkPurchased={() => handleMarkPurchased(idea.id)}
                                            onUpdateStatus={(status) => handleUpdateStatus(idea.id, status)}
                                            onEdit={() => setEditingIdea(idea)}
                                            onDelete={() => handleDelete(idea.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {purchasedIdeas.length > 0 && (
                            <section className="border-t border-grey/10 pt-6">
                                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-grey/40">Comprados</h3>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {purchasedIdeas.map((idea) => (
                                        <GiftIdeaCard
                                            key={idea.id}
                                            idea={idea}
                                            isPending={isPending}
                                            onMarkPurchased={() => undefined}
                                            onUpdateStatus={(status) => handleUpdateStatus(idea.id, status)}
                                            onEdit={() => setEditingIdea(idea)}
                                            onDelete={() => handleDelete(idea.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function InfoPill({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm font-bold text-teal">{value}</p>
                <p className="text-xs text-grey/50">{label}</p>
            </div>
        </div>
    );
}

function EmptyGiftIdeas({ recipientName, onAdd }: { recipientName: string; onAdd: () => void }) {
    return (
        <div className="rounded-2xl border-2 border-dashed border-teal/10 px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/5 text-teal/35">
                <BookOpen className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-2xl text-teal">Todavía no hay ideas</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grey/60">
                Busca libros que encajen con {recipientName} y guárdalos aquí hasta que llegue el momento de comprarlos.
            </p>
            <button
                type="button"
                onClick={onAdd}
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-coral px-6 text-sm font-bold text-white shadow-md shadow-coral/20"
            >
                <Plus className="h-4 w-4" />
                Buscar libros
            </button>
        </div>
    );
}

interface GiftIdeaCardProps {
    idea: GiftIdeaData;
    isPending: boolean;
    onMarkPurchased: () => void;
    onUpdateStatus: (status: GiftIdeaStatus) => void;
    onEdit: () => void;
    onDelete: () => void;
}

function GiftIdeaCard({ idea, isPending, onMarkPurchased, onUpdateStatus, onEdit, onDelete }: GiftIdeaCardProps) {
    const currentIndex = STATUS_FLOW.indexOf(idea.giftStatus);
    const nextStatus = STATUS_FLOW[Math.min(currentIndex + 1, STATUS_FLOW.length - 1)];
    const isReviewPending = idea.title.toLowerCase().includes("portada pendiente");

    return (
        <article className={`flex gap-4 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm transition-all hover:shadow-md ${idea.isPurchased ? "opacity-70" : ""} ${isPending ? "pointer-events-none opacity-50" : ""}`}>
            <div className="relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grey/10 text-grey/30 shadow-sm">
                {idea.coverUrl ? (
                    <Image
                        src={idea.coverUrl}
                        alt={idea.title}
                        fill
                        sizes="80px"
                        className={`object-cover ${idea.isPurchased ? "grayscale" : ""}`}
                    />
                ) : (
                    <BookOpen className="h-8 w-8" />
                )}
                {idea.isPurchased && (
                    <div className="absolute inset-0 flex items-center justify-center bg-teal/20">
                        <CheckCircle2 className="h-7 w-7 text-white" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h4 className={`line-clamp-2 font-serif text-xl font-bold leading-tight ${idea.isPurchased ? "text-grey line-through" : "text-teal"}`}>
                            {idea.title}
                        </h4>
                        {idea.author && <p className="mt-1 truncate text-sm text-grey/65">{idea.author}</p>}
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal">
                                {STATUS_LABELS[idea.giftStatus]}
                            </span>
                            {isReviewPending && (
                                <span className="rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral">
                                    Revisar foto
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                        <button
                            type="button"
                            onClick={onEdit}
                            disabled={isPending}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-grey/45 transition-colors hover:bg-teal/10 hover:text-teal"
                            title="Editar idea"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={isPending}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-grey/35 transition-colors hover:bg-coral/10 hover:text-coral"
                            title="Eliminar idea"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {idea.privateNote && (
                    <p className="mt-3 line-clamp-2 rounded-xl bg-cream/70 px-3 py-2 text-xs italic text-grey/55">
                        {idea.privateNote}
                    </p>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-bold text-teal/80">
                        {idea.price == null ? "Sin precio" : idea.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </span>
                    {idea.giftStatus === "DELIVERED" ? (
                        <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-teal/10 px-3 text-xs font-bold text-teal">
                            <CheckCircle2 className="h-4 w-4" />
                            Entregado
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => idea.giftStatus === "IDEA" ? onMarkPurchased() : onUpdateStatus(nextStatus)}
                            disabled={isPending}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-coral px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#C25852]"
                        >
                            <Gift className="h-4 w-4" />
                            {idea.giftStatus === "IDEA" ? "Marcar comprado" : `Pasar a ${STATUS_LABELS[nextStatus].toLowerCase()}`}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

function EditGiftIdeaModal({
    idea,
    isPending,
    onClose,
    onSave,
}: {
    idea: GiftIdeaData | null;
    isPending: boolean;
    onClose: () => void;
    onSave: (idea: GiftIdeaData, data: { title: string; author: string; price: number | null; privateNote: string }) => void;
}) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [price, setPrice] = useState("");
    const [privateNote, setPrivateNote] = useState("");

    useEffect(() => {
        if (!idea) return;
        setTitle(idea.title);
        setAuthor(idea.author || "");
        setPrice(idea.price == null ? "" : String(idea.price));
        setPrivateNote(idea.privateNote || "");
    }, [idea]);

    if (!idea) return null;

    return (
        <Modal
            isOpen={Boolean(idea)}
            onClose={onClose}
            preserveMobileNav
            size="md"
            className="max-h-[calc(100dvh-5rem)] sm:max-h-[calc(100dvh-2rem)]"
        >
            <form
                className="space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    const parsedPrice = price.trim() ? Number(price.replace(",", ".")) : null;
                    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
                        alert("El precio no tiene un formato válido.");
                        return;
                    }
                    onSave(idea, { title, author, price: parsedPrice, privateNote });
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-teal">Revisar idea</h2>
                        <p className="mt-1 text-sm text-grey/55">Completa o corrige los datos del regalo.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-grey/45 hover:text-coral">Cerrar</button>
                </div>

                {idea.coverUrl && (
                    <div className="flex justify-center">
                        <div className="relative h-36 w-24 overflow-hidden rounded-xl bg-grey/10 shadow-sm">
                            <Image src={idea.coverUrl} alt={idea.title} fill sizes="96px" className="object-cover" />
                        </div>
                    </div>
                )}

                <EditIdeaInput label="Título" value={title} onChange={setTitle} required />
                <EditIdeaInput label="Autor" value={author} onChange={setAuthor} />
                <EditIdeaInput label="Precio" value={price} onChange={setPrice} inputMode="decimal" />
                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-grey/45">Nota privada</span>
                    <textarea
                        value={privateNote}
                        onChange={(event) => setPrivateNote(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-grey/15 bg-white px-4 py-3 text-sm text-grey outline-none focus:border-teal/35"
                    />
                </label>

                <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-coral px-6 text-sm font-bold text-white shadow-md shadow-coral/20 disabled:opacity-50"
                >
                    Guardar cambios
                </button>
            </form>
        </Modal>
    );
}

function EditIdeaInput({
    label,
    value,
    onChange,
    required,
    inputMode,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    inputMode?: "decimal";
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-grey/45">{label}</span>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                inputMode={inputMode}
                className="h-12 w-full rounded-2xl border border-grey/15 bg-white px-4 text-sm text-grey outline-none focus:border-teal/35"
            />
        </label>
    );
}

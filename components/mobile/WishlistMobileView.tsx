"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Lock, Monitor, Plus, Settings, Share2, Star, Store, Trash2, X } from "lucide-react";
import type { WishlistDetailData, WishlistItemData } from "@/app/app/wishes/item-actions";
import { addItemToWishlist, removeItemFromWishlist, updateItemPriority } from "@/app/app/wishes/item-actions";
import type { WishlistCandidateData } from "@/app/app/wishes/candidate-actions";
import { BookSearchModal, type WishlistBook } from "@/components/gifts/BookSearchModal";
import { CreateWishlistModal } from "@/components/wishes/CreateWishlistModal";
import { StoreModeView } from "@/components/wishes/StoreModeView";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { formatWhen } from "./format";

const PRIVACY_LABEL: Record<WishlistDetailData["privacy"], string> = {
    public: "Pública",
    shared: "Compartida",
    private: "Privada",
};

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

interface WishlistMobileViewProps {
    wishlist: WishlistDetailData;
    items: WishlistItemData[];
    candidates: WishlistCandidateData[];
}

// Lista propia en el shell /m: añadir (buscar), modo tienda (escáner + candidatos),
// compartir el enlace y prioridad/quitar por libro. Bote y dedicatorias → /app.
export function WishlistMobileView({ wishlist, items, candidates }: WishlistMobileViewProps) {
    const router = useRouter();
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [storeOpen, setStoreOpen] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [adding, startAdding] = React.useTransition();
    const selected = items.find((i) => i.id === selectedId) ?? null;
    const isPrivate = wishlist.privacy === "private";

    function handleAdd(book: WishlistBook) {
        startAdding(async () => {
            const res = await addItemToWishlist(wishlist.id, {
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl ?? undefined,
                price: book.price ?? undefined,
                bookId: book.isbn ?? book.id,
            });
            if (res && "error" in res && res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Añadido a la lista");
            setSearchOpen(false);
            router.refresh();
        });
    }

    async function handleShare() {
        if (isPrivate) {
            const ok = await confirmDialog({
                title: "Esta lista es privada",
                message: "Solo tú puedes verla. Cámbiala a pública o compartida para poder enviar el enlace.",
                confirmLabel: "Cambiar privacidad",
            });
            if (ok) setSettingsOpen(true);
            return;
        }
        // El enlace de invitado vive en la web: quien regala no necesita la app.
        const url = `${window.location.origin}/app/wishes/${wishlist.id}?view=guest`;
        const text = `${wishlist.emoji} ${wishlist.name} — mi lista de deseos en Wordelia`;
        if (navigator.share) {
            try {
                await navigator.share({ title: wishlist.name, text, url });
            } catch {
                // Cancelado por el usuario: nada que hacer.
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Enlace copiado");
        } catch {
            toast.error("No se ha podido copiar el enlace");
        }
    }

    return (
        <div className="space-y-6">
            <BookSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onAdd={handleAdd} />
            <CreateWishlistModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onSuccess={() => {
                    setSettingsOpen(false);
                    router.refresh();
                }}
                initialData={wishlist}
            />
            {storeOpen && (
                <StoreModeView
                    wishlist={wishlist}
                    items={items}
                    candidates={candidates}
                    isGuestView={false}
                    isOwner
                    variant="mobile"
                    onExit={() => setStoreOpen(false)}
                />
            )}
            {selected && (
                <ItemSheet
                    item={selected}
                    wishlistId={wishlist.id}
                    onClose={() => setSelectedId(null)}
                    onChanged={() => router.refresh()}
                />
            )}

            <div className="flex items-center justify-between">
                <Link href="/m/deseos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-grey/60">
                    <ArrowLeft className="h-4 w-4" /> Deseos
                </Link>
                <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-grey/55 shadow-sm ring-1 ring-teal/10"
                    aria-label="Ajustes de la lista"
                >
                    <Settings className="h-5 w-5" />
                </button>
            </div>

            <header>
                <h1 className="text-2xl font-bold leading-tight text-teal">
                    <span className="mr-1.5">{wishlist.emoji}</span>
                    {wishlist.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <span className="rounded-full bg-white px-2.5 py-1 text-grey/65 shadow-sm">
                        {wishlist.bookCount} {wishlist.bookCount === 1 ? "libro" : "libros"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-grey/65 shadow-sm">
                        {isPrivate && <Lock className="h-3 w-3" />}
                        {PRIVACY_LABEL[wishlist.privacy]}
                    </span>
                    {wishlist.targetDate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-coral">
                            <CalendarDays className="h-3 w-3" /> Para el {formatWhen(wishlist.targetDate, false)}
                        </span>
                    )}
                </div>
                {wishlist.description && <p className="mt-3 text-sm leading-relaxed text-grey/65">{wishlist.description}</p>}
            </header>

            <div className="grid grid-cols-3 gap-2">
                <ActionButton icon={Plus} label="Añadir" onClick={() => setSearchOpen(true)} disabled={adding} primary />
                <ActionButton icon={Store} label="Modo tienda" onClick={() => setStoreOpen(true)} badge={candidates.length} />
                <ActionButton icon={Share2} label="Compartir" onClick={handleShare} />
            </div>

            {items.length === 0 ? (
                <section className="rounded-3xl border-2 border-dashed border-teal/10 px-6 py-10 text-center">
                    <BookOpen className="mx-auto mb-3 h-9 w-9 text-teal/30" strokeWidth={1.5} />
                    <p className="font-bold text-teal-dark">Esta lista está vacía</p>
                    <p className="mt-1 text-sm text-grey/55">
                        Busca un libro o, si estás en una librería, abre el modo tienda y escanea el código de barras.
                    </p>
                </section>
            ) : (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={item.id}>
                            <ItemRow item={item} onOpen={() => setSelectedId(item.id)} />
                        </li>
                    ))}
                </ul>
            )}

            <footer className="flex justify-center pt-2 text-sm font-medium text-grey/55">
                <Link href={`/app/wishes/${wishlist.id}`} className="inline-flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" /> Bote, dedicatorias y vista amigo (versión completa)
                </Link>
            </footer>
        </div>
    );
}

function ActionButton({
    icon: Icon,
    label,
    onClick,
    disabled,
    primary,
    badge,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    primary?: boolean;
    badge?: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`relative flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold shadow-sm disabled:opacity-50 ${primary ? "bg-teal text-white" : "bg-white text-teal ring-1 ring-teal/10"}`}
        >
            <Icon className="h-5 w-5" />
            {label}
            {!!badge && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] text-white">
                    {badge}
                </span>
            )}
        </button>
    );
}

function ItemRow({ item, onOpen }: { item: WishlistItemData; onOpen: () => void }) {
    const bote = item.crowdfunding;
    const pct = bote ? Math.min(100, Math.round((bote.collected / bote.target) * 100)) : 0;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-teal/10 active:bg-teal/5"
        >
            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-teal/5">
                {item.coverUrl ? (
                    <Image src={item.coverUrl} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                    <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-teal/30" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-teal-dark">{item.title}</p>
                {item.author && <p className="truncate text-xs text-grey/55">{item.author}</p>}
                {(item.priority === "HIGH" || item.price != null) && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-grey/55">
                        {item.priority === "HIGH" && (
                            <span className="inline-flex items-center gap-1 text-coral">
                                <Star className="h-3 w-3" fill="currentColor" /> Prioritario
                            </span>
                        )}
                        {item.price != null && <span>{euro.format(item.price)}</span>}
                    </div>
                )}
                {bote && (
                    <div className="mt-1.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-teal/10">
                            <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-0.5 text-[10px] font-semibold text-grey/50">
                            Bote: {euro.format(bote.collected)} de {euro.format(bote.target)}
                        </p>
                    </div>
                )}
            </div>
        </button>
    );
}

function ItemSheet({
    item,
    wishlistId,
    onClose,
    onChanged,
}: {
    item: WishlistItemData;
    wishlistId: string;
    onClose: () => void;
    onChanged: () => void;
}) {
    const [pending, startTransition] = React.useTransition();
    const hasBoteMoney = !!item.crowdfunding && item.crowdfunding.collected > 0;

    const isHigh = item.priority === "HIGH";

    // Igual que en la web: prioritario (HIGH) o normal (MEDIUM).
    function togglePriority() {
        startTransition(async () => {
            const res = await updateItemPriority(item.id, isHigh ? "MEDIUM" : "HIGH", wishlistId);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            onChanged();
        });
    }

    async function remove() {
        const ok = await confirmDialog({
            title: "¿Quitar de la lista?",
            message: `«${item.title}» dejará de aparecer en tu lista de deseos.`,
            confirmLabel: "Quitar",
            tone: "danger",
        });
        if (!ok) return;
        startTransition(async () => {
            const res = await removeItemFromWishlist(item.id, wishlistId);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Quitado de la lista");
            onClose();
            onChanged();
        });
    }

    return (
        <div className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[45] flex items-end bg-black/25 backdrop-blur-[2px]">
            <button type="button" aria-label="Cerrar" className="absolute inset-0" onClick={onClose} />
            <section className="relative mx-auto w-full max-w-xl rounded-t-3xl bg-cream p-5 pb-6 shadow-2xl">
                <div className="flex items-start gap-3">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-teal/5">
                        {item.coverUrl && <Image src={item.coverUrl} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold leading-snug text-teal-dark">{item.title}</p>
                        {item.author && <p className="text-sm text-grey/55">{item.author}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="-mr-1 -mt-1 p-1 text-grey/45" aria-label="Cerrar">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-5 space-y-2">
                    <button
                        type="button"
                        onClick={togglePriority}
                        disabled={pending}
                        className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:opacity-50 ${isHigh ? "bg-coral/10 text-coral" : "bg-white text-grey/70 ring-1 ring-teal/10"}`}
                    >
                        <Star className="h-4 w-4" fill={isHigh ? "currentColor" : "none"} />
                        {isHigh ? "Prioritario (quitar)" : "Marcar como prioritario"}
                    </button>
                    <Link
                        href={`/app/wishes/${wishlistId}`}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-teal ring-1 ring-teal/10"
                    >
                        <Monitor className="h-4 w-4" /> Bote y dedicatoria (versión completa)
                    </Link>
                    <button
                        type="button"
                        onClick={remove}
                        disabled={pending || hasBoteMoney}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-coral disabled:opacity-40"
                    >
                        <Trash2 className="h-4 w-4" /> Quitar de la lista
                    </button>
                    {hasBoteMoney && (
                        <p className="text-center text-xs text-grey/50">
                            Tiene contribuciones en el bote: desactívalo antes en la versión completa.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

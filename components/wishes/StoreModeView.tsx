import { useState, useEffect, useRef, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { confirmDialog } from "@/components/ui/confirm";
import { createPortal } from "react-dom";
import { WishlistItemData, WishlistDetailData } from "@/app/app/wishes/item-actions";
import { WishlistCandidateData, addCandidateToWishlist, createWishlistCandidate, discardWishlistCandidate, updateWishlistCandidate } from "@/app/app/wishes/candidate-actions";
import { getBookDetailsAction, searchBooksAction } from "@/app/app/search/actions";
import type { BookSearchResult } from "@/lib/isbndb";
import { createClient } from "@/utils/supabase/client";
import { StoreModeCard } from "./StoreModeCard";
import { useBarcodeScanner } from "@/components/pwa/useBarcodeScanner";
import { resizeImageToBlob } from "@/lib/resize-image";
import { BookOpen, Camera, CheckCircle2, Gift, Plus, ScanBarcode, Search, Store, X } from "lucide-react";

interface StoreModeViewProps {
    wishlist: WishlistDetailData;
    items: WishlistItemData[];
    candidates: WishlistCandidateData[];
    isGuestView: boolean;
    isOwner: boolean;
    onAddBooks?: () => void;
    onExit: () => void;
}

export function StoreModeView({ wishlist, items, candidates, isGuestView, isOwner, onExit }: StoreModeViewProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [myItems, setMyItems] = useState<string[]>([]);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualSearchOpen, setManualSearchOpen] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);

    const availableCount = items.filter(item => item.status === "AVAILABLE").length;
    const reservedCount = items.filter(item => item.status === "RESERVED").length;
    const purchasedCount = items.filter(item => item.status === "PURCHASED").length;

    useEffect(() => {
        setMounted(true);
        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("wordelia_my_items");
        if (stored) {
            try {
                setMyItems(JSON.parse(stored));
            } catch {
                setMyItems([]);
            }
        }
    }, []);

    function handleReservationChange(newMyItems: string[]) {
        setMyItems(newMyItems);
        localStorage.setItem("wordelia_my_items", JSON.stringify(newMyItems));
    }

    function handleManualSearch() {
        // Antes salía del modo tienda; ahora la búsqueda ocurre DENTRO del modal.
        setManualSearchOpen(true);
    }

    async function requestExit() {
        if (isOwner && candidates.length > 0) {
            const shouldExit = await confirmDialog({
                title: "Salir del modo tienda",
                message: `Tienes ${candidates.length} ${candidates.length === 1 ? "libro capturado" : "libros capturados"} pendientes. ¿Quieres salir sin revisarlos?`,
                confirmLabel: "Salir sin revisar",
                cancelLabel: "Seguir aquí",
                tone: "danger",
            });
            if (!shouldExit) return;
        }

        onExit();
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-14 z-30 flex justify-center overflow-hidden bg-black/20 p-3 backdrop-blur-sm animate-in fade-in md:bottom-0 md:top-[72px] md:p-6">
            <div className="absolute inset-0" onClick={requestExit} />

            <section className="relative flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-teal/10 bg-cream shadow-2xl">
                <header className="shrink-0 border-b border-teal/10 bg-white/85 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal sm:h-11 sm:w-11">
                                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-widest text-grey/40">Modo tienda</p>
                                <h2 className="truncate font-serif text-xl font-bold leading-tight text-teal sm:text-2xl">
                                    {wishlist.name}
                                </h2>
                            </div>
                        </div>

                        <button
                            onClick={requestExit}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/60 shadow-sm transition-colors hover:text-coral sm:w-auto sm:gap-2 sm:px-4"
                            title="Cerrar modo tienda"
                        >
                            <X className="h-5 w-5" />
                            <span className="hidden text-sm font-bold sm:inline">Cerrar</span>
                        </button>
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                    {isOwner ? (
                        <OwnerStoreMode
                            items={items}
                            availableCount={availableCount}
                            reservedCount={reservedCount}
                            purchasedCount={purchasedCount}
                            candidates={candidates}
                            onManualSearch={handleManualSearch}
                            onOpenScanner={() => setScannerOpen(true)}
                            onCapturePhoto={async (file) => {
                                setPhotoBusy(true);
                                await captureCoverPhoto(wishlist.id, file);
                                setPhotoBusy(false);
                                router.refresh();
                            }}
                            photoBusy={photoBusy}
                        />
                    ) : (
                        <GuestStoreMode
                            items={items}
                            isGuestView={isGuestView}
                            myItems={myItems}
                            onReservationChange={handleReservationChange}
                        />
                    )}
                </main>

                {scannerOpen && (
                    <IsbnScannerPanel
                        wishlistId={wishlist.id}
                        onClose={() => setScannerOpen(false)}
                        onSaved={() => {
                            setScannerOpen(false);
                            router.refresh();
                        }}
                    />
                )}

                {manualSearchOpen && (
                    <ManualSearchPanel
                        wishlistId={wishlist.id}
                        onClose={() => setManualSearchOpen(false)}
                        onSaved={() => router.refresh()}
                    />
                )}
            </section>
        </div>,
        document.body
    );

}

function OwnerStoreMode({
    items,
    availableCount,
    reservedCount,
    purchasedCount,
    candidates,
    onManualSearch,
    onOpenScanner,
    onCapturePhoto,
    photoBusy,
}: {
    items: WishlistItemData[];
    availableCount: number;
    reservedCount: number;
    purchasedCount: number;
    candidates: WishlistCandidateData[];
    onManualSearch: () => void;
    onOpenScanner: () => void;
    onCapturePhoto: (file: File) => void;
    photoBusy: boolean;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-serif text-2xl text-teal">Añadir libros desde la librería</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-grey/65">
                    Usa este modo cuando estés delante de una estantería: busca el libro, escanea su ISBN o guarda una portada para revisarla después.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StoreActionCard
                    icon={Search}
                    title="Buscar manualmente"
                    description="Título, autor o ISBN."
                    action="Buscar libro"
                    onClick={onManualSearch}
                    active
                    featured
                />
                <StoreActionCard
                    icon={ScanBarcode}
                    title="Escanear ISBN"
                    description="Añadir desde el código de barras."
                    action="Escanear"
                    onClick={onOpenScanner}
                    active
                />
                <label className="rounded-xl border border-teal/15 bg-white p-3 text-left shadow-sm transition-all hover:border-teal/35 hover:shadow-md">
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        disabled={photoBusy}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onCapturePhoto(file);
                            event.target.value = "";
                        }}
                    />
                    <div className="flex items-start gap-3 md:block">
                        <div className="mb-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal md:mb-2">
                            <Camera className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-teal leading-tight">Foto de portada</h4>
                            <p className="mt-0.5 text-xs leading-snug text-grey/60">Guardar una portada para identificarla.</p>
                        </div>
                    </div>
                    <span className="mt-2 inline-flex rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">
                        {photoBusy ? "Subiendo..." : "Hacer foto"}
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StoreStat label="Disponibles" value={availableCount} />
                <StoreStat label="Reservados" value={reservedCount} />
                <StoreStat label="Comprados" value={purchasedCount} />
            </div>

            <CandidateShelf candidates={candidates} />

            {items.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-teal/10 px-6 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/35">
                        <BookOpen className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                    <h4 className="font-serif text-xl text-teal">Todavía no hay libros</h4>
                    <p className="mx-auto mt-2 max-w-md text-sm text-grey/60">
                        Empieza con la búsqueda manual. Más adelante podrás añadirlos escaneando el ISBN o fotografiando la portada.
                    </p>
                </div>
            ) : (
                <section>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-grey/40">Libros en esta lista</h4>
                    <div className="space-y-3">
                        {items.map(item => (
                            <StoreModeCard
                                key={item.id}
                                item={item}
                                isGuestView={false}
                                myItems={[]}
                                onReservationChange={() => undefined}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function GuestStoreMode({
    items,
    isGuestView,
    myItems,
    onReservationChange,
}: {
    items: WishlistItemData[];
    isGuestView: boolean;
    myItems: string[];
    onReservationChange: (newMyItems: string[]) => void;
}) {
    if (items.length === 0) {
        return (
            <div className="flex min-h-[45dvh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal/10 px-6 py-14 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/5 text-teal/35">
                    <Gift className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl text-teal">Esta lista aún no tiene libros</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-grey/60">
                    Cuando la lista tenga títulos, podrás reservarlos desde aquí mientras estás en la tienda.
                </p>
                <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold text-grey/55 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Vuelve a consultarla más tarde
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-serif text-2xl text-teal">Comprar desde la lista</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-grey/65">
                    Reserva el libro cuando lo tengas localizado en la tienda y márcalo como comprado al terminar. Los títulos bloqueados ya los ha elegido otra persona.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StoreStat label="Disponibles" value={items.filter(item => item.status === "AVAILABLE").length} />
                <StoreStat label="Reservados" value={items.filter(item => item.status === "RESERVED").length} />
                <StoreStat label="Comprados" value={items.filter(item => item.status === "PURCHASED").length} />
            </div>

            <div className="space-y-3">
                {items.map(item => (
                    <StoreModeCard
                        key={item.id}
                        item={item}
                        isGuestView={isGuestView}
                        myItems={myItems}
                        onReservationChange={onReservationChange}
                    />
                ))}
            </div>
        </div>
    );
}

function StoreActionCard({
    icon: Icon,
    title,
    description,
    action,
    active = false,
    featured = false,
    onClick,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action: string;
    active?: boolean;
    featured?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!active}
            className={`rounded-xl border p-3 text-left shadow-sm transition-all ${featured ? "col-span-2 md:col-span-1" : ""} ${active
                ? "border-teal/15 bg-white hover:border-teal/35 hover:shadow-md"
                : "cursor-not-allowed border-grey/10 bg-white/55 opacity-70"
                }`}
        >
            <div className="flex items-start gap-3 md:block">
                <div className="mb-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal md:mb-2">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-bold text-teal leading-tight">{title}</h4>
                    <p className="mt-0.5 text-xs leading-snug text-grey/60">{description}</p>
                </div>
            </div>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-coral text-white" : "bg-grey/10 text-grey/55"}`}>
                {action}
            </span>
        </button>
    );
}

function CandidateShelf({ candidates }: { candidates: WishlistCandidateData[] }) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);

    if (candidates.length === 0) return null;

    async function handleAdd(candidate: WishlistCandidateData) {
        const result = await addCandidateToWishlist(candidate.id, candidate.wishlistId);
        if (result?.error) {
            toast.error(result.error);
            return;
        }
        router.refresh();
    }

    async function handleDiscard(candidate: WishlistCandidateData) {
        const result = await discardWishlistCandidate(candidate.id, candidate.wishlistId);
        if (result?.error) {
            toast.error(result.error);
            return;
        }
        router.refresh();
    }

    async function handleSave(candidate: WishlistCandidateData, formData: FormData) {
        const priceText = String(formData.get("price") || "").trim();
        const parsedPrice = priceText ? Number(priceText.replace(",", ".")) : null;

        if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
            toast.error("El precio no tiene un formato valido.");
            return;
        }

        const result = await updateWishlistCandidate(candidate.id, candidate.wishlistId, {
            title: String(formData.get("title") || ""),
            author: String(formData.get("author") || "").trim() || null,
            isbn: String(formData.get("isbn") || "").trim() || null,
            price: parsedPrice,
            priority: String(formData.get("priority") || "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
            notes: String(formData.get("notes") || "").trim() || null,
        });

        if (result?.error) {
            toast.error(result.error);
            return;
        }

        setEditingId(null);
        router.refresh();
    }

    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h4 className="font-serif text-xl text-teal">Capturados en tienda</h4>
                    <p className="text-xs text-grey/55">Revisa estos libros antes de incorporarlos definitivamente.</p>
                </div>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                    {candidates.length}
                </span>
            </div>

            <div className="space-y-3">
                {candidates.map(candidate => (
                    <div key={candidate.id} className="rounded-2xl border border-teal/10 bg-white p-3 shadow-sm">
                        {editingId === candidate.id ? (
                            <form action={(formData) => handleSave(candidate, formData)} className="space-y-3">
                                <CandidatePreview candidate={candidate} compact />
                                <CandidateInput label="Titulo" name="title" defaultValue={candidate.title} required />
                                <CandidateInput label="Autor" name="author" defaultValue={candidate.author || ""} />
                                <div className="grid grid-cols-2 gap-2">
                                    <CandidateInput label="ISBN" name="isbn" defaultValue={candidate.isbn || ""} inputMode="numeric" />
                                    <CandidateInput label="Precio" name="price" defaultValue={candidate.price == null ? "" : String(candidate.price)} inputMode="decimal" />
                                </div>
                                <label className="block">
                                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-grey/50">Prioridad</span>
                                    <select
                                        name="priority"
                                        defaultValue={candidate.priority || "MEDIUM"}
                                        className="h-11 w-full rounded-2xl border border-grey/15 bg-white px-3 text-sm font-bold text-teal outline-none focus:border-teal/40"
                                    >
                                        <option value="HIGH">Alta</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="LOW">Baja</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-grey/50">Nota</span>
                                    <textarea
                                        name="notes"
                                        defaultValue={candidate.notes || ""}
                                        rows={2}
                                        className="w-full resize-none rounded-2xl border border-grey/15 bg-white px-3 py-2 text-sm text-grey outline-none focus:border-teal/40"
                                        placeholder="Ej. visto en la mesa de novedades"
                                    />
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="h-10 rounded-full border border-grey/15 bg-white text-sm font-bold text-grey/60"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="h-10 rounded-full bg-teal text-sm font-bold text-white shadow-sm">
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <CandidatePreview candidate={candidate} />
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(candidate.id)}
                                        className="h-10 rounded-full border border-grey/15 bg-white text-sm font-bold text-teal transition-colors hover:border-teal/30"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDiscard(candidate)}
                                        className="h-10 rounded-full border border-grey/15 bg-white text-sm font-bold text-grey/60 transition-colors hover:border-coral/30 hover:text-coral"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAdd(candidate)}
                                        className="h-10 rounded-full bg-coral text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#C25852]"
                                    >
                                        Añadir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function CandidatePreview({ candidate, compact = false }: { candidate: WishlistCandidateData; compact?: boolean }) {
    const priorityLabel = candidate.priority === "HIGH" ? "Alta" : candidate.priority === "LOW" ? "Baja" : "Media";

    return (
        <div className="flex gap-3">
            <div className={`${compact ? "h-16 w-12" : "h-20 w-14"} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grey/10`}>
                {candidate.coverUrl || candidate.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.coverUrl || candidate.photoUrl || ""} alt={candidate.title} className="h-full w-full object-cover" />
                ) : (
                    <BookOpen className="h-6 w-6 text-grey/30" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-grey/55">
                        {candidate.source === "manual" ? "Busqueda" : candidate.source === "isbn_scan" ? "ISBN" : "Foto"}
                    </span>
                    <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">
                        {priorityLabel}
                    </span>
                    {candidate.price !== null && (
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                            {candidate.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                    )}
                    {candidate.status === "needs_review" && (
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                            Revisar
                        </span>
                    )}
                </div>
                <h5 className="truncate font-bold text-teal">{candidate.title}</h5>
                {candidate.author && <p className="truncate text-sm text-grey/65">{candidate.author}</p>}
                {candidate.isbn && <p className="mt-1 text-xs text-grey/40">ISBN: {candidate.isbn}</p>}
                {candidate.notes && <p className="mt-1 line-clamp-2 text-xs text-grey/50">{candidate.notes}</p>}
            </div>
        </div>
    );
}

function CandidateInput({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-grey/50">{label}</span>
            <input
                {...props}
                className={`h-11 w-full rounded-2xl border border-grey/15 bg-white px-3 text-sm text-grey outline-none focus:border-teal/40 ${className}`}
            />
        </label>
    );
}

function LegacyCandidateShelf({ candidates }: { candidates: WishlistCandidateData[] }) {
    const router = useRouter();

    if (candidates.length === 0) return null;

    async function handleAdd(candidate: WishlistCandidateData) {
        await addCandidateToWishlist(candidate.id, candidate.wishlistId);
        router.refresh();
    }

    async function handleDiscard(candidate: WishlistCandidateData) {
        await discardWishlistCandidate(candidate.id, candidate.wishlistId);
        router.refresh();
    }

    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h4 className="font-serif text-xl text-teal">Capturados en tienda</h4>
                    <p className="text-xs text-grey/55">Revisa estos libros antes de incorporarlos definitivamente.</p>
                </div>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                    {candidates.length}
                </span>
            </div>

            <div className="space-y-3">
                {candidates.map(candidate => (
                    <div key={candidate.id} className="rounded-2xl border border-teal/10 bg-white p-3 shadow-sm">
                        <div className="flex gap-3">
                            <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grey/10">
                                {candidate.coverUrl || candidate.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={candidate.coverUrl || candidate.photoUrl || ""} alt={candidate.title} className="h-full w-full object-cover" />
                                ) : (
                                    <BookOpen className="h-6 w-6 text-grey/30" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-grey/55">
                                        {candidate.source === "manual" ? "Búsqueda" : candidate.source === "isbn_scan" ? "ISBN" : "Foto"}
                                    </span>
                                    {candidate.status === "needs_review" && (
                                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                                            Revisar
                                        </span>
                                    )}
                                </div>
                                <h5 className="truncate font-bold text-teal">{candidate.title}</h5>
                                {candidate.author && <p className="truncate text-sm text-grey/65">{candidate.author}</p>}
                                {candidate.isbn && <p className="mt-1 text-xs text-grey/40">ISBN: {candidate.isbn}</p>}
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleDiscard(candidate)}
                                className="h-10 rounded-full border border-grey/15 bg-white text-sm font-bold text-grey/60 transition-colors hover:border-coral/30 hover:text-coral"
                            >
                                Descartar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAdd(candidate)}
                                className="h-10 rounded-full bg-coral text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#C25852]"
                            >
                                Añadir a lista
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function StoreStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl bg-white/70 px-3 py-3 text-center shadow-sm">
            <p className="text-lg font-bold leading-none text-teal">{value}</p>
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-grey/45">{label}</p>
        </div>
    );
}

function IsbnScannerPanel({ wishlistId, onClose, onSaved }: { wishlistId: string; onClose: () => void; onSaved: () => void }) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [manualIsbn, setManualIsbn] = useState("");
    const [message, setMessage] = useState("Apunta al código de barras del libro.");
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    async function saveIsbnCandidate(rawIsbn: string) {
        const isbn = normalizeIsbn(rawIsbn);
        if (isbn.length < 10 || savingRef.current) return;

        savingRef.current = true;
        setSaving(true);
        setMessage("Buscando datos del libro...");

        const book = await getBookDetailsAction(isbn);
        if (book) {
            const result = await createWishlistCandidate(wishlistId, {
                source: "isbn_scan",
                status: "matched",
                title: book.title,
                author: book.authors?.[0] || null,
                isbn: book.isbn || isbn,
                coverUrl: book.cover_url,
                price: book.price,
                confidence: 1,
            });
            if (result.error) toast.error(result.error);
        } else {
            const result = await createWishlistCandidate(wishlistId, {
                source: "isbn_scan",
                status: "needs_review",
                title: `ISBN ${isbn}`,
                isbn,
                notes: "No se encontraron datos automáticos para este ISBN.",
                confidence: 0.35,
            });
            if (result.error) toast.error(result.error);
        }

        onSaved();
    }

    // Motor compartido: BarcodeDetector nativo con fallback ZXing (iOS/Safari).
    const { error: camError } = useBarcodeScanner(videoRef, (raw) => {
        const isbn = normalizeIsbn(raw);
        if (isbn.length >= 10 && !savingRef.current) void saveIsbnCandidate(isbn);
    });

    return (
        <div className="absolute inset-0 z-20 flex flex-col bg-cream">
            <div className="flex items-center justify-between border-b border-teal/10 bg-white px-4 py-3">
                <div>
                    <h3 className="font-serif text-xl font-bold text-teal">Escanear ISBN</h3>
                    <p className="text-xs text-grey/55">{camError || message}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/60 shadow-sm hover:text-coral"
                    aria-label="Cerrar escáner"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
                    <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
                </div>

                <div className="mt-4 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                    <label className="block text-xs font-bold uppercase tracking-widest text-grey/50">
                        ISBN manual
                    </label>
                    <div className="mt-2 flex gap-2">
                        <input
                            value={manualIsbn}
                            onChange={(event) => setManualIsbn(event.target.value)}
                            inputMode="numeric"
                            placeholder="978..."
                            className="min-w-0 flex-1 rounded-xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark outline-none focus:border-teal/30"
                        />
                        <button
                            type="button"
                            disabled={saving || normalizeIsbn(manualIsbn).length < 10}
                            onClick={() => saveIsbnCandidate(manualIsbn)}
                            className="rounded-xl bg-coral px-4 text-sm font-bold text-white disabled:opacity-45"
                        >
                            {saving ? "..." : "Guardar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function captureCoverPhoto(wishlistId: string, file: File) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Debes iniciar sesión para subir fotos.");
        return;
    }

    // Redimensionar antes de subir (las fotos de móvil pueden pesar varios MB).
    // Si el redimensionado falla por lo que sea, subimos el archivo original.
    let upload: Blob = file;
    let extension = "jpg";
    let contentType = "image/jpeg";
    try {
        upload = await resizeImageToBlob(file);
    } catch {
        upload = file;
        extension = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "jpg";
        contentType = file.type || "image/jpeg";
    }

    const filePath = `${user.id}/${wishlistId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
        .from("wishlist-candidate-photos")
        .upload(filePath, upload, { cacheControl: "3600", upsert: false, contentType });

    if (uploadError) {
        toast.error("No hemos podido subir la foto. Revisa que la migración del bucket esté aplicada.");
        return;
    }

    const { data } = supabase.storage.from("wishlist-candidate-photos").getPublicUrl(filePath);

    const result = await createWishlistCandidate(wishlistId, {
        source: "cover_photo",
        status: "needs_review",
        title: "Portada pendiente de revisar",
        photoUrl: data.publicUrl,
        notes: "Foto capturada en modo tienda. Revisa los datos antes de añadirla a la lista.",
        confidence: 0.2,
    });
    if (result.error) toast.error(result.error);
}

function ManualSearchPanel({ wishlistId, onClose, onSaved }: { wishlistId: string; onClose: () => void; onSaved: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const runSearch = async () => {
        const q = query.trim();
        if (q.length < 2) return;
        setSearching(true);
        setMessage("");
        try {
            const data = await searchBooksAction(q);
            setResults(data);
            if (data.length === 0) setMessage("Sin resultados. Prueba con otro texto.");
        } catch {
            setResults([]);
            setMessage("No hemos podido buscar ahora mismo.");
        } finally {
            setSearching(false);
        }
    };

    const addBook = async (book: BookSearchResult) => {
        const key = book.id || book.isbn13 || book.isbn || book.title;
        setSavingKey(key);
        setMessage("");
        const res = await createWishlistCandidate(wishlistId, {
            source: "manual",
            status: "matched",
            title: book.title,
            author: book.authors?.[0] || null,
            isbn: book.isbn13 || book.isbn || null,
            coverUrl: book.cover_url,
            price: book.price,
            confidence: 1,
        });
        setSavingKey(null);
        if (res.error) { setMessage(res.error); return; }
        setMessage(`"${book.title}" añadido a capturados.`);
        onSaved();
    };

    return (
        <div className="absolute inset-0 z-20 flex flex-col bg-cream">
            <div className="flex items-center justify-between border-b border-teal/10 bg-white px-4 py-3">
                <div className="min-w-0">
                    <h3 className="font-serif text-xl font-bold text-teal">Buscar libro</h3>
                    <p className="truncate text-xs text-grey/55">{message || "Título, autor o ISBN."}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/60 shadow-sm hover:text-coral"
                    aria-label="Cerrar búsqueda"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                <div className="mb-4 flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && runSearch()}
                        autoFocus
                        placeholder="Escribe título, autor o ISBN…"
                        className="min-w-0 flex-1 rounded-xl border border-teal/10 bg-white px-4 py-3 text-sm text-teal-dark outline-none focus:border-teal/30"
                    />
                    <button
                        type="button"
                        onClick={runSearch}
                        disabled={searching}
                        className="rounded-xl bg-teal px-4 text-sm font-bold text-white hover:bg-teal-dark disabled:opacity-50"
                    >
                        {searching ? "…" : "Buscar"}
                    </button>
                </div>

                <div className="space-y-2">
                    {results.map((book, i) => {
                        const key = book.id || book.isbn13 || book.isbn || `${book.title}-${i}`;
                        return (
                            <div key={key} className="flex items-center gap-3 rounded-xl border border-teal/10 bg-white p-2 shadow-sm">
                                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-grey/10">
                                    {book.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-grey/30">
                                            <BookOpen className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold text-teal">{book.title}</p>
                                    <p className="truncate text-xs text-grey/60">{book.authors?.join(", ") || "Autor desconocido"}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addBook(book)}
                                    disabled={savingKey === key}
                                    className="shrink-0 rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                >
                                    {savingKey === key ? "…" : "Añadir"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function normalizeIsbn(value: string) {
    return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

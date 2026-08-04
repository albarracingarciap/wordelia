"use client";

import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useRef, useState, useTransition, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { CalendarDays, Camera, CheckCircle2, Gift, Plus, ScanBarcode, Search, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { GiftIdeaSummaryData, GiftRecipientData, ReservedItemData } from "@/app/app/wishes/gift-actions";
import { addGiftIdea, markGiftIdeaAsPurchased } from "@/app/app/wishes/gift-idea-actions";
import { markWishlistItemPurchased } from "@/app/app/wishes/item-actions";
import { getBookDetailsAction } from "@/app/app/search/actions";
import { createClient } from "@/utils/supabase/client";
import { BookSearchModal, WishlistBook } from "@/components/gifts/BookSearchModal";

interface GiftStoreModeViewProps {
    recipients: GiftRecipientData[];
    reservations: ReservedItemData[];
    onExit: () => void;
    onAddPerson: () => void;
}

export function GiftStoreModeView({ recipients, reservations, onExit, onAddPerson }: GiftStoreModeViewProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedRecipientId, setSelectedRecipientId] = useState(recipients[0]?.id || "");
    const [searchOpen, setSearchOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
        };
    }, []);

    const pendingIdeas = useMemo(() => recipients.flatMap((recipient) =>
        recipient.giftIdeas
            .filter((idea) => !idea.isPurchased)
            .map((idea) => ({ ...idea, recipientName: recipient.name, recipientId: recipient.id }))
    ), [recipients]);

    const nextEvents = useMemo(() => recipients
        .filter((recipient) => recipient.upcomingEvent?.daysLeft !== null && recipient.upcomingEvent?.daysLeft !== undefined)
        .sort((a, b) => (a.upcomingEvent!.daysLeft || 0) - (b.upcomingEvent!.daysLeft || 0))
        .slice(0, 3), [recipients]);

    const pendingReservations = reservations.filter((item) => item.status !== "PURCHASED");
    const selectedRecipient = recipients.find((recipient) => recipient.id === selectedRecipientId) || recipients[0] || null;

    function handleAddPerson() {
        onExit();
        onAddPerson();
    }

    function handleManualBook(book: WishlistBook) {
        if (!selectedRecipient) return;

        startTransition(async () => {
            const result = await addGiftIdea(selectedRecipient.id, {
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl ?? undefined,
                price: book.price ?? undefined,
                bookId: book.isbn ?? book.id,
                privateNote: "Capturado en modo tienda.",
            });
            if (result?.error) toast.error(result.error);
            setSearchOpen(false);
            router.refresh();
        });
    }

    async function handleCoverPhoto(file: File) {
        if (!selectedRecipient) return;

        setPhotoBusy(true);
        await captureGiftCoverPhoto(selectedRecipient.id, file);
        setPhotoBusy(false);
        router.refresh();
    }

    function handleIdeaPurchased(idea: GiftIdeaSummaryData) {
        startTransition(async () => {
            const result = await markGiftIdeaAsPurchased(idea.id, idea.recipientId);
            if (result?.error) toast.error(result.error);
            router.refresh();
        });
    }

    function handleReservationPurchased(item: ReservedItemData) {
        startTransition(async () => {
            const result = await markWishlistItemPurchased(item.id, item.wishlistId);
            if (result?.error) toast.error(result.error);
            router.refresh();
        });
    }

    if (!mounted) return null;

    return createPortal(
        <>
            <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-14 z-30 flex justify-center overflow-hidden bg-black/20 p-3 backdrop-blur-sm animate-in fade-in md:bottom-0 md:top-[72px] md:p-6">
                <div className="absolute inset-0" onClick={onExit} />

                <section className="relative flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-teal/10 bg-cream shadow-2xl">
                <header className="shrink-0 border-b border-teal/10 bg-white/85 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal sm:h-11 sm:w-11">
                                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-widest text-grey/40">Modo tienda</p>
                                <h2 className="truncate font-serif text-xl font-bold leading-tight text-teal sm:text-2xl">
                                    Comprar regalos
                                </h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onExit}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/60 shadow-sm transition-colors hover:text-coral sm:w-auto sm:gap-2 sm:px-4"
                            title="Cerrar modo tienda"
                        >
                            <X className="h-5 w-5" />
                            <span className="hidden text-sm font-bold sm:inline">Cerrar</span>
                        </button>
                    </div>
                </header>

                    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-serif text-2xl text-teal">Lista rápida para la librería</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-grey/65">
                                Revisa próximas fechas, ideas pendientes y reservas. Marca como comprado cuando tengas el libro en la mano.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <StoreStat label="Personas" value={recipients.length} />
                            <StoreStat label="Ideas pendientes" value={pendingIdeas.length} />
                            <StoreStat label="Reservas" value={pendingReservations.length} />
                        </div>

                        {selectedRecipient && (
                            <CaptureGiftBookPanel
                                recipients={recipients}
                                selectedRecipientId={selectedRecipient.id}
                                onRecipientChange={setSelectedRecipientId}
                                onManualSearch={() => setSearchOpen(true)}
                                onOpenScanner={() => setScannerOpen(true)}
                                onCapturePhoto={handleCoverPhoto}
                                photoBusy={photoBusy}
                            />
                        )}

                        <section className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
                            <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="font-serif text-xl text-teal">Próximas fechas</h4>
                                        <p className="text-xs text-grey/50">Prioriza compras por ocasión.</p>
                                    </div>
                                    <CalendarDays className="h-5 w-5 text-coral" />
                                </div>

                                {nextEvents.length === 0 ? (
                                    <EmptyMini icon={CalendarDays} text="No tienes fechas próximas guardadas." />
                                ) : (
                                    <div className="space-y-2">
                                        {nextEvents.map((recipient) => (
                                            <Link
                                                key={recipient.id}
                                                href={`/app/wishes/person/${recipient.id}`}
                                                className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 px-3 py-3 transition-colors hover:bg-teal/5"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-teal">{recipient.name}</p>
                                                    <p className="truncate text-xs text-grey/55">{recipient.upcomingEvent!.name}</p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral">
                                                    {recipient.upcomingEvent!.daysLeft === 0 ? "Hoy" : `${recipient.upcomingEvent!.daysLeft} días`}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="font-serif text-xl text-teal">Personas</h4>
                                        <p className="text-xs text-grey/50">Entra para añadir o revisar ideas.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddPerson}
                                        className="inline-flex h-9 items-center gap-2 rounded-full bg-coral px-3 text-xs font-bold text-white shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Añadir
                                    </button>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {recipients.map((recipient) => (
                                        <Link
                                            key={recipient.id}
                                            href={`/app/wishes/person/${recipient.id}`}
                                            className="flex min-w-0 items-center gap-3 rounded-2xl bg-cream/60 p-3 transition-colors hover:bg-teal/5"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-teal/10 text-teal">
                                                {recipient.avatarUrl ? (
                                                    <Image src={recipient.avatarUrl} alt={recipient.name} width={44} height={44} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="font-bold">{recipient.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-teal">{recipient.name}</p>
                                                <p className="truncate text-xs text-grey/55">
                                                    {recipient.giftIdeas.filter((idea) => !idea.isPurchased).length} pendientes
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h4 className="font-serif text-xl text-teal">Ideas pendientes</h4>
                                    <p className="text-xs text-grey/50">Regalos propios que aún no has comprado.</p>
                                </div>
                                <Gift className="h-5 w-5 text-coral" />
                            </div>

                            {pendingIdeas.length === 0 ? (
                                <EmptyLarge
                                    title="No hay ideas pendientes"
                                    text="Añade libros desde el perfil de una persona para tenerlos listos cuando entres en una librería."
                                />
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {pendingIdeas.map((idea) => (
                                        <GiftStoreIdeaCard
                                            key={idea.id}
                                            idea={idea}
                                            recipientName={idea.recipientName}
                                            isPending={isPending}
                                            onPurchased={() => handleIdeaPurchased(idea)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {pendingReservations.length > 0 && (
                            <section>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="font-serif text-xl text-teal">Reservas de listas ajenas</h4>
                                        <p className="text-xs text-grey/50">Libros que reservaste para regalar a otras personas.</p>
                                    </div>
                                    <ShoppingBag className="h-5 w-5 text-teal" />
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    {pendingReservations.map((item) => (
                                        <ReservationQuickCard
                                            key={item.id}
                                            item={item}
                                            isPending={isPending}
                                            onPurchased={() => handleReservationPurchased(item)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                    </main>

                    {scannerOpen && selectedRecipient && (
                        <GiftIsbnScannerPanel
                            recipientId={selectedRecipient.id}
                            recipientName={selectedRecipient.name}
                            onClose={() => setScannerOpen(false)}
                            onSaved={() => {
                                setScannerOpen(false);
                                router.refresh();
                            }}
                        />
                    )}
                </section>
            </div>

            <BookSearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                onAdd={handleManualBook}
                title={selectedRecipient ? `Libro para ${selectedRecipient.name}` : "Añadir libro"}
                addLabel="Guardar regalo"
            />
        </>,
        document.body
    );
}

function CaptureGiftBookPanel({
    recipients,
    selectedRecipientId,
    onRecipientChange,
    onManualSearch,
    onOpenScanner,
    onCapturePhoto,
    photoBusy,
}: {
    recipients: GiftRecipientData[];
    selectedRecipientId: string;
    onRecipientChange: (id: string) => void;
    onManualSearch: () => void;
    onOpenScanner: () => void;
    onCapturePhoto: (file: File) => void;
    photoBusy: boolean;
}) {
    const selectedRecipient = recipients.find((recipient) => recipient.id === selectedRecipientId);

    return (
        <section className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h4 className="font-serif text-xl text-teal">Capturar libro para regalar</h4>
                    <p className="text-xs text-grey/50">Busca, escanea o guarda una portada y asígnala a una persona.</p>
                </div>
                <label className="min-w-0 sm:w-64">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-grey/45">Persona</span>
                    <select
                        value={selectedRecipientId}
                        onChange={(event) => onRecipientChange(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-teal/10 bg-cream/30 px-3 text-sm font-bold text-teal outline-none focus:border-teal/35"
                    >
                        {recipients.map((recipient) => (
                            <option key={recipient.id} value={recipient.id}>{recipient.name}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <GiftCaptureAction
                    icon={Search}
                    title="Buscar manualmente"
                    description={selectedRecipient ? `Añadir una idea para ${selectedRecipient.name}.` : "Añadir una idea de regalo."}
                    action="Buscar libro"
                    onClick={onManualSearch}
                />
                <GiftCaptureAction
                    icon={ScanBarcode}
                    title="Escanear ISBN"
                    description="Usar la cámara o introducir el ISBN."
                    action="Escanear"
                    onClick={onOpenScanner}
                />
                <label className="rounded-2xl border border-teal/10 bg-cream/35 p-4 text-left shadow-sm transition-all hover:border-teal/25 hover:bg-teal/5">
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
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                        <Camera className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-teal">Foto de portada</h5>
                    <p className="mt-1 text-sm leading-relaxed text-grey/60">Guardar para revisar después.</p>
                    <span className="mt-4 inline-flex rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">
                        {photoBusy ? "Subiendo..." : "Hacer foto"}
                    </span>
                </label>
            </div>
        </section>
    );
}

function GiftCaptureAction({
    icon: Icon,
    title,
    description,
    action,
    onClick,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-2xl border border-teal/10 bg-cream/35 p-4 text-left shadow-sm transition-all hover:border-teal/25 hover:bg-teal/5"
        >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                <Icon className="h-5 w-5" />
            </div>
            <h5 className="font-bold text-teal">{title}</h5>
            <p className="mt-1 text-sm leading-relaxed text-grey/60">{description}</p>
            <span className="mt-4 inline-flex rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">
                {action}
            </span>
        </button>
    );
}

function StoreStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl bg-white/75 px-3 py-3 text-center shadow-sm">
            <p className="text-lg font-bold leading-none text-teal">{value}</p>
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-grey/45">{label}</p>
        </div>
    );
}

function GiftStoreIdeaCard({
    idea,
    recipientName,
    isPending,
    onPurchased,
}: {
    idea: GiftIdeaSummaryData;
    recipientName: string;
    isPending: boolean;
    onPurchased: () => void;
}) {
    return (
        <article className={`flex gap-3 rounded-2xl border border-teal/10 bg-white p-3 shadow-sm ${isPending ? "opacity-60" : ""}`}>
            <BookCover title={idea.title} coverUrl={idea.coverUrl} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-coral">Para {recipientName}</p>
                <h5 className="mt-1 line-clamp-2 font-bold leading-tight text-teal">{idea.title}</h5>
                {idea.author && <p className="mt-1 truncate text-sm text-grey/60">{idea.author}</p>}
                {idea.privateNote && <p className="mt-2 line-clamp-2 rounded-xl bg-cream/70 px-2 py-1 text-xs text-grey/55">{idea.privateNote}</p>}
                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-teal/80">
                        {idea.price == null ? "Sin precio" : idea.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </span>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={onPurchased}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-coral px-3 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Comprado
                    </button>
                </div>
            </div>
        </article>
    );
}

function ReservationQuickCard({
    item,
    isPending,
    onPurchased,
}: {
    item: ReservedItemData;
    isPending: boolean;
    onPurchased: () => void;
}) {
    return (
        <article className={`flex gap-3 rounded-2xl border border-coral/10 bg-white p-3 shadow-sm ${isPending ? "opacity-60" : ""}`}>
            <BookCover title={item.title} coverUrl={item.coverUrl} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold uppercase tracking-wide text-coral">Lista: {item.wishlistName}</p>
                <h5 className="mt-1 line-clamp-2 font-bold leading-tight text-teal">{item.title}</h5>
                {item.author && <p className="mt-1 truncate text-sm text-grey/60">{item.author}</p>}
                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-teal/80">
                        {item.price == null ? "Sin precio" : item.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </span>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={onPurchased}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-coral px-3 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Comprado
                    </button>
                </div>
            </div>
        </article>
    );
}

function BookCover({ title, coverUrl }: { title: string; coverUrl: string | null }) {
    return (
        <div className="relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grey/10 text-grey/30 shadow-sm">
            {coverUrl ? (
                <Image src={coverUrl} alt={title} fill sizes="64px" className="object-cover" />
            ) : (
                <Gift className="h-7 w-7" />
            )}
        </div>
    );
}

function EmptyMini({ icon: Icon, text }: { icon: typeof CalendarDays; text: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-teal/10 px-3 py-4 text-sm text-grey/55">
            <Icon className="h-5 w-5 text-teal/40" />
            {text}
        </div>
    );
}

function EmptyLarge({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-2xl border-2 border-dashed border-teal/10 px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/35">
                <UserRound className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h4 className="font-serif text-xl text-teal">{title}</h4>
            <p className="mx-auto mt-2 max-w-md text-sm text-grey/60">{text}</p>
        </div>
    );
}

function GiftIsbnScannerPanel({
    recipientId,
    recipientName,
    onClose,
    onSaved,
}: {
    recipientId: string;
    recipientName: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [manualIsbn, setManualIsbn] = useState("");
    const [message, setMessage] = useState("Apunta al código de barras del libro.");
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let frameId = 0;
        let stopped = false;

        async function startScanner() {
            const Detector = (window as any).BarcodeDetector;
            if (!navigator.mediaDevices?.getUserMedia) {
                setMessage("Tu navegador no permite abrir la cámara aquí. Puedes introducir el ISBN manualmente.");
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });

                if (!videoRef.current) return;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                if (!Detector) {
                    setMessage("Escáner automático no disponible en este navegador. Introduce el ISBN manualmente.");
                    return;
                }

                const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });

                const scan = async () => {
                    if (stopped || !videoRef.current || savingRef.current) return;

                    try {
                        const codes = await detector.detect(videoRef.current);
                        const isbn = normalizeIsbn(codes?.[0]?.rawValue || "");
                        if (isbn.length >= 10) {
                            await saveIsbnGiftIdea(isbn);
                            return;
                        }
                    } catch {
                        // Some frames fail transiently; keep scanning.
                    }

                    frameId = requestAnimationFrame(scan);
                };

                frameId = requestAnimationFrame(scan);
            } catch {
                setMessage("No hemos podido abrir la cámara. Puedes introducir el ISBN manualmente.");
            }
        }

        startScanner();

        return () => {
            stopped = true;
            if (frameId) cancelAnimationFrame(frameId);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    async function saveIsbnGiftIdea(rawIsbn: string) {
        const isbn = normalizeIsbn(rawIsbn);
        if (isbn.length < 10 || savingRef.current) return;

        savingRef.current = true;
        setSaving(true);
        setMessage("Buscando datos del libro...");

        const book = await getBookDetailsAction(isbn);
        const result = book
            ? await addGiftIdea(recipientId, {
                title: book.title,
                author: book.authors?.[0] || undefined,
                coverUrl: book.cover_url || undefined,
                price: book.price || undefined,
                bookId: book.isbn || isbn,
                privateNote: "Capturado por ISBN en modo tienda.",
            })
            : await addGiftIdea(recipientId, {
                title: `ISBN ${isbn}`,
                bookId: isbn,
                privateNote: "ISBN capturado en modo tienda. Revisa los datos del libro.",
            });

        if (result?.error) toast.error(result.error);
        onSaved();
    }

    return (
        <div className="absolute inset-0 z-20 flex flex-col bg-cream">
            <div className="flex items-center justify-between border-b border-teal/10 bg-white px-4 py-3">
                <div className="min-w-0">
                    <h3 className="truncate font-serif text-xl font-bold text-teal">Escanear para {recipientName}</h3>
                    <p className="truncate text-xs text-grey/55">{message}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/60 shadow-sm hover:text-coral"
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
                            onClick={() => saveIsbnGiftIdea(manualIsbn)}
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

async function captureGiftCoverPhoto(recipientId: string, file: File) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Debes iniciar sesión para subir fotos.");
        return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "jpg";
    const filePath = `${user.id}/${recipientId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
        .from("gift-idea-photos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
        toast.error("No hemos podido subir la foto. Revisa que la migración del bucket de regalos esté aplicada.");
        return;
    }

    const { data } = supabase.storage.from("gift-idea-photos").getPublicUrl(filePath);
    const result = await addGiftIdea(recipientId, {
        title: "Portada pendiente de revisar",
        coverUrl: data.publicUrl,
        privateNote: "Foto capturada en modo tienda. Revisa el título y autor cuando puedas.",
    });

    if (result?.error) toast.error(result.error);
}

function normalizeIsbn(value: string) {
    return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

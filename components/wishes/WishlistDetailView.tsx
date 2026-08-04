"use client";

import { toast } from "@/components/ui/toast";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { WishlistItemCard } from "@/components/wishes/WishlistItemCard";
import { WishlistDetailData, WishlistItemData } from "@/app/app/wishes/item-actions";
import { BookSearchModal, WishlistBook } from "@/components/gifts/BookSearchModal";
import { CreateWishlistModal } from "@/components/wishes/CreateWishlistModal";
import { StoreModeView } from "@/components/wishes/StoreModeView";
import { addItemToWishlist } from "@/app/app/wishes/item-actions";
import { createWishlistCandidate, WishlistCandidateData } from "@/app/app/wishes/candidate-actions";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BookOpen, Calendar, Link2, Plus, Settings, Store } from "lucide-react";

interface WishlistDetailViewProps {
    wishlist: WishlistDetailData;
    items: WishlistItemData[];
    isOwner: boolean;
    candidates: WishlistCandidateData[];
}

export function WishlistDetailView({ wishlist, items, isOwner, candidates }: WishlistDetailViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isGuestView, setIsGuestView] = useState(!isOwner);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<"wishlist" | "candidate">("wishlist");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStoreModeOpen, setIsStoreModeOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);
    const hasItems = items.length > 0;
    const availableItems = items.filter((item) => item.status === "AVAILABLE").length;

    const privacyLabel = { public: "Pública", private: "Privada", shared: "Compartida" };

    useEffect(() => {
        if (!isOwner || searchParams.get("view") === "guest") {
            setIsGuestView(true);
        }
    }, [isOwner, searchParams]);

    function handleCopyLink() {
        const url = new URL(window.location.href);
        url.searchParams.set("view", "guest");
        navigator.clipboard.writeText(url.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleOpenStoreMode() {
        if (!isOwner && !hasItems) return;
        setIsStoreModeOpen(true);
    }

    function handleAddBook(book: WishlistBook) {
        startTransition(async () => {
            if (searchMode === "candidate") {
                const result = await createWishlistCandidate(wishlist.id, {
                    source: "manual",
                    title: book.title,
                    author: book.author,
                    isbn: book.isbn,
                    coverUrl: book.coverUrl,
                    price: book.price,
                    confidence: 1,
                });
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
            } else {
                await addItemToWishlist(wishlist.id, {
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl ?? undefined,
                    price: book.price ?? undefined,
                    bookId: book.isbn ?? book.id,
                });
            }
            setIsSearchOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <BookSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAdd={handleAddBook}
                title={searchMode === "candidate" ? "Capturar libro" : undefined}
                addLabel={searchMode === "candidate" ? "Guardar candidato" : undefined}
            />

            {isStoreModeOpen && (
                <StoreModeView
                    wishlist={wishlist}
                    items={items}
                    isGuestView={isGuestView}
                    isOwner={isOwner}
                    candidates={candidates}
                    onAddBooks={() => {
                        setSearchMode("candidate");
                        setIsSearchOpen(true);
                    }}
                    onExit={() => setIsStoreModeOpen(false)}
                />
            )}

            {isOwner && (
                <CreateWishlistModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        router.refresh();
                    }}
                    initialData={wishlist}
                />
            )}

            <div className="mx-auto max-w-5xl pb-24">
                <Link
                    href={isOwner ? "/app/wishes" : "/app/wishes?tab=gifts"}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-grey/55 transition-colors hover:text-teal"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {isOwner ? "Volver a mis listas" : "Volver"}
                </Link>

                <header className="mb-7">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Lista</div>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="font-serif text-[2rem] font-medium leading-tight text-teal sm:text-4xl">
                                <span className="mr-2 align-middle">{wishlist.emoji}</span>
                                {wishlist.name}
                            </h1>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-grey/70 shadow-sm">
                                    {wishlist.bookCount} {wishlist.bookCount === 1 ? "libro" : "libros"}
                                </span>
                                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-grey/70 shadow-sm">
                                    {privacyLabel[wishlist.privacy]}
                                </span>
                                {wishlist.targetDate && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Para el {new Date(wishlist.targetDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {wishlist.description && (
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-grey/70">
                                    {wishlist.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end">
                            {isOwner && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="col-span-2 flex h-12 items-center justify-center rounded-full border border-teal/10 bg-white/70 text-grey/50 shadow-sm transition-colors hover:text-teal sm:col-span-1 sm:w-12 sm:shrink-0"
                                    title="Ajustes de la lista"
                                >
                                    <Settings className="h-5 w-5" />
                                </button>
                            )}
                            {isOwner && (
                                <Button
                                    onClick={() => {
                                        setSearchMode("wishlist");
                                        setIsSearchOpen(true);
                                    }}
                                    disabled={isPending}
                                    className="h-12 w-full rounded-full text-sm font-bold sm:w-auto sm:shrink-0 sm:rounded-2xl sm:px-6"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Añadir libro
                                </Button>
                            )}
                            <Button
                                onClick={handleOpenStoreMode}
                                disabled={!isOwner && !hasItems}
                                className={`h-12 w-full rounded-full bg-teal text-sm font-bold hover:bg-teal-dark sm:w-auto sm:shrink-0 sm:rounded-2xl sm:px-6 ${!isOwner && !hasItems ? "opacity-45" : ""}`}
                                title={!isOwner && !hasItems ? "La lista aún no tiene libros" : "Abrir modo tienda"}
                            >
                                <Store className="mr-2 h-4 w-4" />
                                Modo tienda
                            </Button>
                            {wishlist.privacy !== "private" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="col-span-2 h-11 w-full rounded-full border-teal/15 bg-white/70 text-sm font-bold text-teal shadow-sm sm:col-span-1 sm:h-12 sm:w-auto sm:shrink-0 sm:rounded-2xl sm:px-6"
                                >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    {copied ? "Enlace copiado" : "Compartir"}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-teal/5 bg-white/55 p-3 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
                        <p className="min-w-0 text-sm leading-relaxed text-grey/60">
                            {isGuestView
                                ? (isOwner
                                    ? "Vista previa de cómo ven tu lista tus amigos. No te mostramos las reservas ni las compras para no estropear la sorpresa."
                                    : "Puedes reservar un libro para que otros invitados no lo compren también. La persona que creó la lista no verá quién reservó cada regalo.")
                                : "Vista de propietario: ves todos los libros y puedes gestionar la lista."}
                        </p>

                        {isOwner && (
                            <div className="mt-3 grid w-full grid-cols-2 rounded-2xl bg-grey/5 p-1 md:mt-0 md:w-[300px] md:shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsGuestView(false)}
                                    className={`h-10 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition-all ${!isGuestView ? "bg-white text-teal shadow-sm" : "text-grey/55 hover:text-teal"}`}
                                >
                                    Mi vista
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsGuestView(true)}
                                    className={`h-10 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition-all ${isGuestView ? "bg-teal text-white shadow-sm" : "text-grey/55 hover:text-teal"}`}
                                >
                                    Vista amigo
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {items.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal/10 px-6 py-14 text-center sm:min-h-[360px]">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/5 text-teal/30">
                            <BookOpen className="h-9 w-9" strokeWidth={1.5} />
                        </div>
                        <h2 className="font-serif text-2xl text-teal">
                            {isGuestView ? "Todavía no hay libros para regalar" : "Esta lista está vacía"}
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-grey/55">
                            {isGuestView
                                ? `${wishlist.name} aún no tiene títulos. Vuelve más adelante o pide que añadan algunos libros.`
                                : "Añade libros que quieres leer o que te gustaría recibir."}
                        </p>
                        {isGuestView && (
                            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold text-grey/55 shadow-sm">
                                <BookOpen className="h-4 w-4" />
                                Modo tienda disponible cuando haya libros
                            </div>
                        )}
                        {isOwner && (
                            <Button
                                onClick={() => {
                                    setSearchMode("wishlist");
                                    setIsSearchOpen(true);
                                }}
                                className="mt-7 h-12 rounded-full bg-teal px-7 text-sm font-bold hover:bg-teal-dark sm:rounded-2xl"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Buscar libros para añadir
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {isGuestView && (
                            <div className="mb-4 rounded-2xl border border-teal/10 bg-white/60 p-4 text-sm leading-relaxed text-grey/60 shadow-sm">
                                Hay {availableItems} {availableItems === 1 ? "libro disponible" : "libros disponibles"} para reservar. Reservar no compra el libro; solo evita duplicados entre invitados.
                            </div>
                        )}
                        <div className="grid gap-4">
                            {items.map((item) => (
                                <WishlistItemCard
                                    key={item.id}
                                    item={item}
                                    isGuestView={isGuestView}
                                    isOwner={isOwner}
                                    wishlistTargetDate={wishlist.targetDate}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

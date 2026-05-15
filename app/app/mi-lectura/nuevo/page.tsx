"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Bookmark, Camera, Check, Eye, Loader2, Search, ScanLine, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { searchBooksAction, addBookToLibrary } from "@/app/app/search/actions";
import { BookSearchResult } from "@/lib/isbndb";

const statusOptions = [
    { status: "READING" as const, label: "Estoy leyendo", icon: BookOpen },
    { status: "WANT_TO_READ" as const, label: "Quiero leer", icon: Bookmark },
    { status: "READ" as const, label: "Ya leído", icon: Check },
];

async function resizeCoverImage(file: File): Promise<string> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Selecciona una imagen válida para la portada.");
    }

    const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("No hemos podido leer la imagen."));
        reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("No hemos podido procesar la imagen."));
        img.src = imageData;
    });

    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("No hemos podido preparar la portada.");
    }

    context.drawImage(image, 0, 0, width, height);
    const resized = canvas.toDataURL("image/jpeg", 0.82);

    if (resized.length > 1_200_000) {
        throw new Error("La imagen es demasiado grande. Prueba con una portada más ligera.");
    }

    return resized;
}

export default function AddBookPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-teal" /></div>}>
            <AddBookContent />
        </React.Suspense>
    );
}

function AddBookContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const initialQuery = searchParams.get("q")?.toString() || "";
    const requestedFrom = searchParams.get("from")?.toString();
    const returnHref = requestedFrom?.startsWith("/app/") ? requestedFrom : "/app/mi-lectura";

    const [searchQuery, setSearchQuery] = React.useState(initialQuery);
    const [results, setResults] = React.useState<BookSearchResult[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [isAdding, setIsAdding] = React.useState<string | null>(null);
    const [showManualForm, setShowManualForm] = React.useState(false);
    const [actionError, setActionError] = React.useState("");
    const [statusMessage, setStatusMessage] = React.useState("");
    const [manualData, setManualData] = React.useState({
        title: "",
        author: "",
        isbn: "",
        pages: "",
        coverUrl: "",
    });

    const handleSearch = React.useCallback(async () => {
        setIsSearching(true);
        setShowManualForm(false);
        setActionError("");
        setStatusMessage("");

        try {
            const data = await searchBooksAction(searchQuery);
            setResults(data);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
            setActionError("No hemos podido buscar libros ahora mismo. Inténtalo de nuevo.");
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (searchQuery.length > 2) {
                params.set("q", searchQuery);
                router.replace(`${pathname}?${params.toString()}`);
                void handleSearch();
                return;
            }

            if (searchQuery.length === 0) {
                params.delete("q");
                router.replace(`${pathname}?${params.toString()}`);
            }

            setResults([]);
        }, 600);

        return () => window.clearTimeout(timeoutId);
    }, [handleSearch, pathname, router, searchParams, searchQuery]);

    const handleAddBook = async (book: BookSearchResult, status: "READING" | "READ" | "WANT_TO_READ") => {
        if (isAdding) return;

        setIsAdding(book.id || book.isbn || "unknown");
        setActionError("");
        setStatusMessage("");

        try {
            const result = await addBookToLibrary(book, status);

            if (result.success) {
                router.push(returnHref);
                return;
            }

            setActionError(result.error || "No hemos podido añadir el libro. Inténtalo de nuevo.");
        } catch (error) {
            console.error(error);
            setActionError("Ocurrió un error inesperado al añadir el libro.");
        } finally {
            setIsAdding(null);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!manualData.title || !manualData.author) {
            setActionError("Indica al menos el título y el autor.");
            return;
        }

        const manualBook: BookSearchResult = {
            id: `manual-${Date.now()}`,
            title: manualData.title,
            authors: [manualData.author],
            cover_url: manualData.coverUrl || null,
            description: null,
            isbn: manualData.isbn || null,
            page_count: manualData.pages ? parseInt(manualData.pages, 10) : null,
            published_date: null,
            publisher: null,
            categories: [],
            average_rating: null,
            ratings_count: null,
            language: "es",
            price: null,
            source: "db",
        };

        await handleAddBook(manualBook, "WANT_TO_READ");
    };

    const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setActionError("");
        setStatusMessage("");

        try {
            const coverUrl = await resizeCoverImage(file);
            setManualData((current) => ({ ...current, coverUrl }));
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "No hemos podido añadir la portada.");
        } finally {
            event.target.value = "";
        }
    };

    const handleScanClick = () => {
        setActionError("");
        setStatusMessage("ISBN de ejemplo cargado. Puedes buscarlo o sustituirlo.");
        setSearchQuery("9788418055663");
    };

    const hasQuery = searchQuery.length > 2;

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <div className="space-y-6">
                <Link
                    href={returnHref}
                    className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-grey/60 transition-colors hover:text-teal"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Link>

                <div>
                    <h1 className="font-serif text-2xl text-teal">Añadir nuevo libro</h1>
                    <p className="text-xs text-coral">Busca por título, autor o ISBN</p>
                </div>

                {!showManualForm && (
                    <div className="group relative">
                        <input
                            type="text"
                            placeholder="Escribe el título, autor o ISBN..."
                            className="h-14 w-full rounded-2xl border border-teal/10 bg-white pl-12 pr-12 text-base shadow-sm transition-all placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-grey/40 transition-colors group-focus-within:text-teal">
                            {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </div>
                        <button
                            onClick={handleScanClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-grey/40 transition-all hover:bg-teal/5 hover:text-teal"
                            title="Escanear código de barras"
                            type="button"
                        >
                            <ScanLine size={20} />
                        </button>
                    </div>
                )}

                {actionError && (
                    <div className="rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                        {actionError}
                    </div>
                )}

                {statusMessage && !actionError && (
                    <div className="rounded-2xl border border-teal/15 bg-teal/5 px-4 py-3 text-sm font-medium text-teal">
                        {statusMessage}
                    </div>
                )}
            </div>

            {showManualForm ? (
                <div className="animate-fade-in-up rounded-2xl border border-teal/10 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-grey/40">Libro manual</p>
                        <h2 className="mt-1 text-xl font-bold text-teal">Añadir manualmente</h2>
                    </div>

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="rounded-2xl border border-teal/10 bg-cream/30 p-4">
                            <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-grey/60">Portada</label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-teal/20 bg-white text-teal/40 shadow-sm">
                                    {manualData.coverUrl ? (
                                        <>
                                            <Image
                                                src={manualData.coverUrl}
                                                alt="Portada seleccionada"
                                                fill
                                                className="object-cover"
                                                sizes="96px"
                                                unoptimized={manualData.coverUrl.startsWith("data:")}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setManualData({ ...manualData, coverUrl: "" })}
                                                className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1 text-grey shadow-sm transition-colors hover:text-coral"
                                                title="Quitar portada"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <Camera size={28} />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-3">
                                    <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-teal/20 px-4 text-sm font-medium text-teal transition-colors hover:bg-teal/5">
                                        <Upload size={16} />
                                        Subir foto
                                        <input type="file" accept="image/*" className="sr-only" onChange={handleCoverFileChange} />
                                    </label>
                                    <input
                                        type="url"
                                        className="h-11 w-full rounded-xl border border-grey/20 bg-white px-4 text-sm outline-none transition-all placeholder:text-grey/40 focus:border-teal/50 focus:ring-2 focus:ring-teal/10"
                                        placeholder="O pega una URL de portada"
                                        value={manualData.coverUrl.startsWith("data:") ? "" : manualData.coverUrl}
                                        onChange={(e) => setManualData({ ...manualData, coverUrl: e.target.value })}
                                    />
                                    <p className="text-xs leading-relaxed text-grey/50">Opcional. Usa una imagen vertical y ligera para que se vea bien en tus estanterías.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">Título *</label>
                            <input
                                required
                                type="text"
                                className="h-12 w-full rounded-xl border border-grey/20 bg-grey/5 px-4 outline-none transition-all focus:border-teal/50 focus:bg-white focus:ring-2 focus:ring-teal/10"
                                placeholder="Ej. El Quijote"
                                value={manualData.title}
                                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">Autor *</label>
                            <input
                                required
                                type="text"
                                className="h-12 w-full rounded-xl border border-grey/20 bg-grey/5 px-4 outline-none transition-all focus:border-teal/50 focus:bg-white focus:ring-2 focus:ring-teal/10"
                                placeholder="Ej. Miguel de Cervantes"
                                value={manualData.author}
                                onChange={(e) => setManualData({ ...manualData, author: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">ISBN</label>
                                <input
                                    type="text"
                                    className="h-12 w-full rounded-xl border border-grey/20 bg-grey/5 px-4 outline-none transition-all focus:border-teal/50 focus:bg-white focus:ring-2 focus:ring-teal/10"
                                    placeholder="Opcional"
                                    value={manualData.isbn}
                                    onChange={(e) => setManualData({ ...manualData, isbn: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">Páginas</label>
                                <input
                                    type="number"
                                    className="h-12 w-full rounded-xl border border-grey/20 bg-grey/5 px-4 outline-none transition-all focus:border-teal/50 focus:bg-white focus:ring-2 focus:ring-teal/10"
                                    placeholder="Opcional"
                                    value={manualData.pages}
                                    onChange={(e) => setManualData({ ...manualData, pages: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-12 px-8 text-base"
                                onClick={() => setShowManualForm(false)}
                                disabled={!!isAdding}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="h-12 px-8 text-base sm:min-w-48" disabled={!!isAdding}>
                                {isAdding ? <Loader2 className="animate-spin" /> : "Guardar libro"}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <section>
                    {hasQuery && (
                        <div className="mb-4 flex items-center justify-between px-1">
                            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40">
                                <span>Resultados</span>
                                <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[10px] text-teal">{results.length}</span>
                            </h2>
                        </div>
                    )}

                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {results.map((book, idx) => {
                                const bookKey = book.id || book.isbn || `${book.title}-${idx}`;
                                const isThisBookAdding = isAdding === (book.id || book.isbn);

                                return (
                                    <div key={bookKey} className="group relative flex items-center gap-4 overflow-visible rounded-xl border border-teal/5 bg-white p-3 shadow-sm transition-all hover:border-teal/20 hover:shadow-md">
                                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-grey/10 shadow-inner">
                                            {book.cover_url ? (
                                                <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-grey/20">
                                                    <BookOpen size={20} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 pr-2">
                                            <h3 className="truncate font-serif text-base font-bold leading-tight text-teal">{book.title}</h3>
                                            <p className="mt-0.5 truncate text-xs font-medium text-coral">
                                                {book.authors?.join(", ") || "Autor desconocido"}
                                            </p>
                                            {book.published_date && (
                                                <p className="mt-1 text-[10px] text-grey/40">Publicado en {book.published_date.substring(0, 4)}</p>
                                            )}
                                        </div>

                                        <div className="group/actions relative flex shrink-0 items-center gap-2">
                                            <Link
                                                href={`/app/libros/${book.id || book.isbn}`}
                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-grey/40 transition-all hover:bg-teal/5 hover:text-teal"
                                                title="Ver detalle"
                                            >
                                                <Eye size={20} />
                                            </Link>

                                            <div className="relative">
                                                <button
                                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-teal/5 px-4 text-xs font-bold text-teal transition-all hover:bg-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={!!isAdding}
                                                    type="button"
                                                >
                                                    {isThisBookAdding ? (
                                                        <Loader2 className="animate-spin" size={14} />
                                                    ) : (
                                                        <>
                                                            Añadir
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                                                        </>
                                                    )}
                                                </button>

                                                {!isAdding && (
                                                    <div className="absolute right-0 top-full z-20 mt-1 hidden w-48 origin-top-right animate-fade-in-up overflow-hidden rounded-xl border border-teal/10 bg-white shadow-xl group-hover/actions:block">
                                                        {statusOptions.map((option) => {
                                                            const Icon = option.icon;

                                                            return (
                                                                <button
                                                                    key={option.status}
                                                                    onClick={() => handleAddBook(book, option.status)}
                                                                    className="flex w-full items-center gap-2 border-b border-teal/5 px-4 py-3 text-left text-xs font-medium text-grey transition-colors last:border-b-0 hover:bg-teal/5 hover:text-teal"
                                                                    type="button"
                                                                >
                                                                    <Icon size={14} />
                                                                    {option.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-teal/10 bg-white py-12 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/5 text-teal">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            </div>

                            {hasQuery ? (
                                <p className="mb-1 font-medium text-grey/60">No encontramos &quot;{searchQuery}&quot;</p>
                            ) : (
                                <p className="mb-1 text-lg font-bold text-grey/60">¿No encuentras tu libro?</p>
                            )}

                            <p className="mx-auto mb-6 max-w-xs text-xs text-grey/40">
                                {hasQuery ? "Prueba a añadirlo manualmente a tu biblioteca." : "Añádelo manualmente rellenando un sencillo formulario."}
                            </p>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowManualForm(true)}
                                className="border-teal/20 text-teal hover:bg-teal/5"
                            >
                                Añadir libro manualmente
                            </Button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

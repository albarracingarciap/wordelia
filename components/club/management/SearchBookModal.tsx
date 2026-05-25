import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { searchBooks } from "@/app/app/clubs/crear/actions";
import { BookSearchResult } from "@/lib/isbndb";
import { createClient } from "@/utils/supabase/client";
import { ImagePlus, X } from "lucide-react";

const MAX_COVER_FILE_SIZE = 5 * 1024 * 1024;

interface SearchBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBook: (book: BookSearchResult) => void;
    initialQuery?: string;
}

function splitTitleAndAuthor(value: string) {
    const cleaned = value.trim();
    const match = cleaned.match(/^(.+?)\s+de\s+(.+)$/i);

    return {
        title: match?.[1]?.trim() || cleaned,
        author: match?.[2]?.trim() || "",
    };
}

function buildCoverFileName(title: string, fileName: string) {
    const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeTitle = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "portada";

    return `${Date.now()}-${safeTitle}.${extension}`;
}

export function SearchBookModal({ isOpen, onClose, onSelectBook, initialQuery = "" }: SearchBookModalProps) {
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<BookSearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasSearched, setHasSearched] = React.useState(false);
    const [isManualMode, setIsManualMode] = React.useState(false);
    const [manualTitle, setManualTitle] = React.useState("");
    const [manualAuthor, setManualAuthor] = React.useState("");
    const [manualIsbn, setManualIsbn] = React.useState("");
    const [manualPages, setManualPages] = React.useState("");
    const [manualCoverUrl, setManualCoverUrl] = React.useState("");
    const [manualDescription, setManualDescription] = React.useState("");
    const [manualCoverFile, setManualCoverFile] = React.useState<File | null>(null);
    const [manualCoverPreview, setManualCoverPreview] = React.useState("");
    const [manualCoverError, setManualCoverError] = React.useState("");
    const [isSavingManual, setIsSavingManual] = React.useState(false);
    const coverInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        return () => {
            if (manualCoverPreview) URL.revokeObjectURL(manualCoverPreview);
        };
    }, [manualCoverPreview]);

    const resetManualCoverFile = React.useCallback(() => {
        setManualCoverFile(null);
        setManualCoverPreview("");
        setManualCoverError("");
        if (coverInputRef.current) coverInputRef.current.value = "";
    }, []);

    const hydrateManualFields = React.useCallback((value: string) => {
        const parsed = splitTitleAndAuthor(value);

        setManualTitle(parsed.title);
        setManualAuthor(parsed.author);
        setManualIsbn("");
        setManualPages("");
        setManualCoverUrl("");
        setManualDescription("");
        resetManualCoverFile();
    }, [resetManualCoverFile]);

    const handleSearch = React.useCallback(async (searchQuery = query) => {
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery.length < 3) return;

        setIsLoading(true);
        setHasSearched(true);
        try {
            const data = await searchBooks(trimmedQuery);
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    React.useEffect(() => {
        if (!isOpen) return;

        setQuery(initialQuery);
        setResults([]);
        setHasSearched(false);
        setIsManualMode(false);
        hydrateManualFields(initialQuery);

        if (initialQuery.trim().length >= 3) {
            void handleSearch(initialQuery);
        }
    }, [handleSearch, hydrateManualFields, isOpen, initialQuery]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") void handleSearch();
    };

    const openManualMode = () => {
        hydrateManualFields(query || initialQuery);
        setIsManualMode(true);
    };

    const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setManualCoverError("Selecciona una imagen valida para la portada.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_COVER_FILE_SIZE) {
            setManualCoverError("La imagen no puede superar los 5 MB.");
            event.target.value = "";
            return;
        }

        setManualCoverError("");
        setManualCoverFile(file);
        setManualCoverPreview(URL.createObjectURL(file));
    };

    const uploadCoverFile = async (file: File, title: string) => {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            throw new Error("Inicia sesion para subir una portada.");
        }

        const filePath = `${userData.user.id}/${buildCoverFileName(title, file.name)}`;
        const { error: uploadError } = await supabase.storage
            .from("book-covers")
            .upload(filePath, file, {
                cacheControl: "3600",
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            throw new Error(uploadError.message || "No hemos podido subir la portada.");
        }

        const { data } = supabase.storage.from("book-covers").getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleManualSubmit = async () => {
        const title = manualTitle.trim();
        if (!title) return;

        setIsSavingManual(true);
        setManualCoverError("");

        try {
            const uploadedCoverUrl = manualCoverFile ? await uploadCoverFile(manualCoverFile, title) : "";
            const pages = Number.parseInt(manualPages, 10);
            const book: BookSearchResult = {
                id: "",
                title,
                authors: manualAuthor.trim() ? [manualAuthor.trim()] : [],
                cover_url: uploadedCoverUrl || manualCoverUrl.trim() || null,
                description: manualDescription.trim() || null,
                isbn: manualIsbn.trim() || null,
                isbn13: manualIsbn.trim().replace(/[^0-9Xx]/g, "").length === 13 ? manualIsbn.trim() : null,
                page_count: Number.isFinite(pages) && pages > 0 ? pages : null,
                published_date: null,
                publisher: null,
                categories: [],
                average_rating: null,
                ratings_count: null,
                language: "es",
                price: null,
                source: "db",
            };

            onSelectBook(book);
        } catch (error) {
            setManualCoverError(error instanceof Error ? error.message : "No hemos podido preparar la portada.");
        } finally {
            setIsSavingManual(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Elige la próxima lectura">
            <div className="flex max-h-[80vh] flex-col gap-4">
                {initialQuery && (
                    <div className="rounded-2xl bg-teal/5 px-4 py-3 text-sm text-teal-dark">
                        Buscando el libro ganador: <span className="font-bold">{initialQuery}</span>
                    </div>
                )}

                {!isManualMode && (
                    <div className="space-y-3">
                        <div className="flex gap-2 p-1">
                            <Input
                                placeholder="Buscar por título, autor o ISBN..."
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <Button onClick={() => handleSearch()} disabled={isLoading || query.trim().length < 3} variant="primary">
                                {isLoading ? "..." : "Buscar"}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="min-h-[300px] flex-1 overflow-y-auto p-6">
                    {isManualMode ? (
                        <div className="space-y-5">
                            <div className="rounded-2xl bg-cream/70 px-4 py-3">
                                <p className="text-sm font-bold text-teal-dark">Crear ficha manualmente</p>
                                <p className="mt-1 text-xs leading-5 text-grey/60">
                                    Usalo si el buscador no encuentra el libro ganador. Luego podras iniciar la lectura con esta ficha.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-teal/10 bg-white p-4">
                                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Portada</span>
                                <div className="flex gap-4">
                                    <div className="relative flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-teal/20 bg-cream/40 text-teal/45 shadow-sm">
                                        {manualCoverPreview || manualCoverUrl ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={manualCoverPreview || manualCoverUrl} alt="Portada seleccionada" className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        resetManualCoverFile();
                                                        setManualCoverUrl("");
                                                    }}
                                                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-grey shadow-sm transition-colors hover:text-coral"
                                                    aria-label="Quitar portada"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <ImagePlus className="h-7 w-7" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-3">
                                        <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-teal px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-dark">
                                            Subir imagen
                                            <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" onChange={handleCoverFileChange} />
                                        </label>

                                        <div>
                                            <Input
                                                value={manualCoverUrl}
                                                onChange={(event) => {
                                                    setManualCoverUrl(event.target.value);
                                                    if (event.target.value.trim()) resetManualCoverFile();
                                                }}
                                                placeholder="O pega una URL de portada"
                                            />
                                            <p className="mt-2 text-xs leading-5 text-grey/50">Si subes una imagen, tendra prioridad sobre la URL.</p>
                                        </div>

                                        {manualCoverError && (
                                            <p className="rounded-xl border border-coral/20 bg-coral/10 px-3 py-2 text-xs font-medium text-coral">
                                                {manualCoverError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Título *</span>
                                    <Input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} placeholder="Ej. La montaña mágica" autoFocus />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Autor</span>
                                    <Input value={manualAuthor} onChange={(event) => setManualAuthor(event.target.value)} placeholder="Ej. Thomas Mann" />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">ISBN</span>
                                    <Input value={manualIsbn} onChange={(event) => setManualIsbn(event.target.value)} placeholder="Opcional" />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Páginas</span>
                                    <Input value={manualPages} onChange={(event) => setManualPages(event.target.value)} placeholder="Opcional" inputMode="numeric" />
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Descripción</span>
                                    <textarea
                                        value={manualDescription}
                                        onChange={(event) => setManualDescription(event.target.value)}
                                        rows={3}
                                        placeholder="Sinopsis o nota breve opcional..."
                                        className="w-full resize-none rounded-2xl border border-grey/10 bg-white px-4 py-3 text-sm leading-6 text-grey-dark outline-none transition placeholder:text-grey/30 focus:border-teal focus:ring-2 focus:ring-teal/10"
                                    />
                                </label>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                                <Button type="button" variant="ghost" onClick={() => setIsManualMode(false)} disabled={isSavingManual}>
                                    Volver al buscador
                                </Button>
                                <Button type="button" onClick={handleManualSubmit} disabled={!manualTitle.trim() || isSavingManual}>
                                    {isSavingManual ? "Guardando..." : "Usar este libro"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isLoading && (
                                <div className="flex h-40 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal" />
                                </div>
                            )}

                            {!isLoading && hasSearched && results.length === 0 && (
                                <div className="mx-auto max-w-sm py-10 text-center text-grey/60">
                                    <p>No se encontraron libros con ese término.</p>
                                    <Button type="button" onClick={openManualMode} className="mt-5 w-full">
                                        Crear ficha manualmente
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {results.map((book) => (
                                    <button
                                        key={book.isbn || book.id}
                                        onClick={() => onSelectBook(book)}
                                        className="group flex gap-4 rounded-lg border border-transparent p-3 text-left transition-all hover:border-teal/20 hover:bg-teal/5"
                                    >
                                        <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-grey/10 shadow-sm">
                                            {book.cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-grey/40">Sin portada</div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-bold text-grey-dark transition-colors group-hover:text-teal">{book.title}</h4>
                                            <p className="truncate text-xs text-grey/60">{book.authors?.join(", ") || "Autor desconocido"}</p>
                                            <p className="mt-2 text-[10px] text-grey/40">
                                                {book.published_date?.substring(0, 4) || "N/A"} · {book.page_count ? `${book.page_count} págs` : "N/A"}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}

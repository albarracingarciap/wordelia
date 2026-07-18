"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Check, ImageOff, Loader2, Search, X } from "lucide-react";
import type { BookSearchResult } from "@/lib/isbndb";
import {
    attachEdition,
    searchEditions,
    setBookCollection,
    setPublished,
    type Collection,
    type QueueBook,
} from "@/app/app/admin/colecciones/actions";

type Filter = "todos" | "sin-portada" | "sin-coleccion" | "sin-publicar" | "listos";

const FILTERS: { value: Filter; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "sin-portada", label: "Sin portada" },
    { value: "sin-coleccion", label: "Sin colección" },
    { value: "sin-publicar", label: "Sin publicar" },
    { value: "listos", label: "Listos" },
];

// Un libro está listo cuando puede lucir en /explorar: portada, colección y publicado.
const isReady = (b: QueueBook) => Boolean(b.coverUrl && b.collectionId && b.published);

function matches(book: QueueBook, filter: Filter): boolean {
    switch (filter) {
        case "sin-portada": return !book.coverUrl;
        case "sin-coleccion": return !book.collectionId;
        case "sin-publicar": return !book.published;
        case "listos": return isReady(book);
        default: return true;
    }
}

export function CurationClient({
    initialBooks,
    collections,
}: {
    initialBooks: QueueBook[];
    collections: Collection[];
}) {
    const [books, setBooks] = useState(initialBooks);
    const [filter, setFilter] = useState<Filter>("sin-portada");
    const [query, setQuery] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return books.filter((b) =>
            matches(b, filter) &&
            (!q || b.title.toLowerCase().includes(q) || (b.author ?? "").toLowerCase().includes(q)),
        );
    }, [books, filter, query]);

    const readyCount = books.filter(isReady).length;

    const patchBook = (id: string, patch: Partial<QueueBook>) =>
        setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <nav className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => {
                        const count = books.filter((b) => matches(b, f.value)).length;
                        return (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === f.value
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent/50"
                                    }`}
                            >
                                {f.label} <span className="opacity-60">({count})</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {readyCount} de {books.length} listos
                    </span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filtrar por título o autor…"
                        className="w-56 rounded-lg border border-teal/10 bg-white px-3 py-1.5 text-sm focus:border-teal/30 focus:outline-none"
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                <p className="rounded-xl border border-teal/10 bg-white p-8 text-center text-muted-foreground">
                    No hay libros con este filtro.
                </p>
            ) : (
                <ul className="space-y-2">
                    {visible.map((book) => (
                        <BookRow
                            key={book.id}
                            book={book}
                            collections={collections}
                            isOpen={openId === book.id}
                            onToggle={() => setOpenId(openId === book.id ? null : book.id)}
                            onPatch={(patch) => patchBook(book.id, patch)}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function BookRow({
    book,
    collections,
    isOpen,
    onToggle,
    onPatch,
}: {
    book: QueueBook;
    collections: Collection[];
    isOpen: boolean;
    onToggle: () => void;
    onPatch: (patch: Partial<QueueBook>) => void;
}) {
    const [pending, startTransition] = useTransition();
    const [results, setResults] = useState<BookSearchResult[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState(`${book.title} ${book.author ?? ""}`.trim());
    const [error, setError] = useState("");

    const runSearch = async (q: string) => {
        setSearching(true);
        setError("");
        const res = await searchEditions(q);
        setSearching(false);
        if (res.success) setResults(res.data ?? []);
        else setError(res.error);
    };

    const handleOpen = () => {
        onToggle();
        // Al abrir, la búsqueda se lanza sola con título y autor del libro.
        if (!isOpen && results === null) runSearch(searchQuery);
    };

    const handlePick = (edition: BookSearchResult) => {
        startTransition(async () => {
            setError("");
            const res = await attachEdition(book.id, edition);
            if (res.success) onPatch({ coverUrl: edition.cover_url ?? null });
            else setError(res.error);
        });
    };

    const handleCollection = (collectionId: string) => {
        startTransition(async () => {
            const res = await setBookCollection(book.id, collectionId || null);
            if (res.success) {
                onPatch({
                    collectionId: collectionId || null,
                    collectionName: collections.find((c) => c.id === collectionId)?.name ?? null,
                });
            } else setError(res.error);
        });
    };

    const handlePublish = () => {
        startTransition(async () => {
            const res = await setPublished(book.id, !book.published);
            if (res.success) onPatch({ published: !book.published });
            else setError(res.error);
        });
    };

    return (
        <li className="overflow-hidden rounded-xl border border-teal/10 bg-white">
            <button
                onClick={handleOpen}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent/40"
            >
                <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-grey/10">
                    {book.coverUrl ? (
                        <Image src={book.coverUrl} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-grey/30">
                            <ImageOff className="h-4 w-4" aria-hidden="true" />
                        </span>
                    )}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{book.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                        {book.author ?? "Sin autor"}{book.genre && ` · ${book.genre}`}
                    </span>
                </span>

                <span className="hidden shrink-0 items-center gap-2 text-xs sm:flex">
                    <Chip ok={Boolean(book.coverUrl)} label="Portada" />
                    <Chip ok={Boolean(book.collectionId)} label={book.collectionName ?? "Colección"} />
                    <Chip ok={book.published} label="Publicado" />
                </span>
            </button>

            {isOpen && (
                <div className="space-y-5 border-t border-teal/10 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm font-medium">Colección</label>
                        <select
                            value={book.collectionId ?? ""}
                            disabled={pending}
                            onChange={(e) => handleCollection(e.target.value)}
                            className="rounded-lg border border-teal/10 bg-white px-3 py-1.5 text-sm focus:border-teal/30 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">— Sin asignar —</option>
                            {collections.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={handlePublish}
                            disabled={pending || !book.coverUrl || !book.collectionId}
                            title={!book.coverUrl || !book.collectionId
                                ? "Necesita portada y colección antes de publicar"
                                : undefined}
                            className={`ml-auto rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${book.published
                                ? "border border-teal/20 text-teal hover:bg-teal/5"
                                : "bg-teal text-white hover:bg-teal-dark"
                                }`}
                        >
                            {book.published ? "Retirar de Explorar" : "Publicar guía y genoma"}
                        </button>
                    </div>

                    <div>
                        <div className="mb-3 flex gap-2">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && runSearch(searchQuery)}
                                placeholder="Buscar edición en ISBNdb…"
                                className="flex-1 rounded-lg border border-teal/10 bg-white px-3 py-1.5 text-sm focus:border-teal/30 focus:outline-none"
                            />
                            <button
                                onClick={() => runSearch(searchQuery)}
                                disabled={searching}
                                className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-50"
                            >
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Buscar
                            </button>
                        </div>

                        {error && <p className="mb-3 text-sm font-medium text-coral">{error}</p>}

                        {results !== null && results.length === 0 && !searching && (
                            <p className="text-sm text-muted-foreground">
                                ISBNdb no ha devuelto ediciones. Prueba con otro texto de búsqueda.
                            </p>
                        )}

                        {results && results.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {results.map((edition, i) => (
                                    <button
                                        key={`${edition.isbn13 || edition.isbn || edition.id}-${i}`}
                                        onClick={() => handlePick(edition)}
                                        disabled={pending}
                                        className="flex gap-3 rounded-lg border border-teal/10 p-2 text-left transition-colors hover:border-teal/30 hover:bg-teal/5 disabled:opacity-50"
                                    >
                                        <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-grey/10">
                                            {edition.cover_url ? (
                                                <Image src={edition.cover_url} alt="" fill sizes="56px" className="object-cover" />
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center text-grey/30">
                                                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                            )}
                                        </span>
                                        <span className="min-w-0 text-xs">
                                            <span className="block truncate font-medium">{edition.title}</span>
                                            <span className="block truncate text-muted-foreground">
                                                {edition.publisher ?? "Editorial desconocida"}
                                            </span>
                                            <span className="block text-muted-foreground">
                                                {edition.published_date?.slice(0, 4) ?? "—"}
                                                {edition.page_count ? ` · ${edition.page_count} pág.` : ""}
                                                {edition.language ? ` · ${edition.language}` : ""}
                                            </span>
                                            <span className="block truncate text-muted-foreground">
                                                {edition.isbn13 || edition.isbn || "sin ISBN"}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </li>
    );
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${ok
                ? "border-teal/20 bg-teal/10 text-teal"
                : "border-transparent bg-muted text-muted-foreground"
                }`}
        >
            {ok ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
            {label}
        </span>
    );
}

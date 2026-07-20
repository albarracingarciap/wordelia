"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Star,
    Trash2,
    Pencil,
    Plus,
    Search,
    Loader2,
    Check,
    X,
    BookOpen,
    AlertTriangle,
} from "lucide-react";
import type { BookEdition } from "../data";
import type { BookSearchResult } from "@/lib/isbndb";
import {
    searchEditionsAction,
    addEditionAction,
    setPreferredEditionAction,
    deleteEditionAction,
    updateEditionAction,
} from "../actions";

const inputCls =
    "w-full bg-background border border-input rounded-md text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal";

function AddEditionPanel({ bookId, onDone }: { bookId: string; onDone: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [adding, setAdding] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const search = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setError(null);
        try {
            const { results: res, error } = await searchEditionsAction(query);
            if (error) setError(error);
            else setResults(res ?? []);
        } finally {
            setSearching(false);
        }
    };

    const add = async (edition: BookSearchResult) => {
        setAdding(edition.id ?? edition.isbn ?? edition.title);
        setError(null);
        const res = await addEditionAction(bookId, edition);
        setAdding(null);
        if ("error" in res) setError(res.error);
        else onDone();
    };

    return (
        <div className="rounded-lg border border-teal/15 bg-muted/30 p-4 space-y-3">
            <form onSubmit={search} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal"
                        placeholder="Buscar en ISBNdb por título, autor o ISBN..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={searching || !query.trim()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                </button>
            </form>

            {error && (
                <p className="text-sm text-coral flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </p>
            )}

            {results.length > 0 && (
                <div className="grid gap-2 md:grid-cols-2 max-h-80 overflow-y-auto">
                    {results.map((r) => {
                        const key = r.id ?? r.isbn ?? r.title;
                        return (
                            <div key={key} className="flex gap-3 p-2 rounded-md border border-teal/10 bg-background">
                                {r.cover_url ? (
                                    <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden">
                                        <Image src={r.cover_url} alt={r.title} fill className="object-cover" sizes="40px" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-14 shrink-0 rounded bg-grey/10 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-grey/40" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium line-clamp-2">{r.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.isbn13 || r.isbn || "sin ISBN"}</p>
                                    <button
                                        onClick={() => add(r)}
                                        disabled={adding === key}
                                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-teal-dark hover:underline disabled:opacity-50"
                                    >
                                        {adding === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Añadir
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function EditionCard({ bookId, edition }: { bookId: string; edition: BookEdition }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState(edition.title ?? "");
    const [publisher, setPublisher] = useState(edition.publisher ?? "");
    const [language, setLanguage] = useState(edition.language ?? "");
    const [pages, setPages] = useState(edition.page_count?.toString() ?? "");
    const [year, setYear] = useState(edition.publication_year?.toString() ?? "");
    const [format, setFormat] = useState(edition.format ?? "");
    const [coverUrl, setCoverUrl] = useState(edition.cover_url ?? "");

    const run = (fn: () => Promise<{ success: true } | { error: string }>) => {
        setError(null);
        startTransition(async () => {
            const res = await fn();
            if ("error" in res) setError(res.error);
            else {
                setEditing(false);
                router.refresh();
            }
        });
    };

    return (
        <div className={`rounded-lg border p-3 ${edition.isPreferred ? "border-teal/40 bg-teal/5" : "border-teal/10 bg-card"}`}>
            <div className="flex gap-3">
                {edition.cover_url ? (
                    <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden shadow-sm">
                        <Image src={edition.cover_url} alt={edition.title ?? ""} fill className="object-cover" sizes="48px" />
                    </div>
                ) : (
                    <div className="w-12 h-16 shrink-0 rounded bg-grey/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-grey/40" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{edition.title || "Sin título"}</p>
                        {edition.isPreferred && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-dark bg-teal/15 py-0.5 px-1.5 rounded">
                                <Star className="w-3 h-3 fill-current" /> Preferida
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {[edition.publisher, edition.language, edition.publication_year, edition.format]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {edition.isbn13 || edition.isbn || "sin ISBN"}
                        {edition.page_count ? ` · ${edition.page_count} pág.` : ""}
                        {edition.source ? ` · ${edition.source}` : ""}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                        {!edition.isPreferred && (
                            <button
                                disabled={pending}
                                onClick={() => run(() => setPreferredEditionAction(bookId, edition.id))}
                                className="inline-flex items-center gap-1 text-xs text-teal-dark hover:underline disabled:opacity-50"
                            >
                                <Star className="w-3.5 h-3.5" /> Preferida
                            </button>
                        )}
                        <button
                            onClick={() => setEditing((v) => !v)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Pencil className="w-3.5 h-3.5" /> {editing ? "Cerrar" : "Editar"}
                        </button>
                        <button
                            disabled={pending}
                            onClick={() => {
                                if (confirm("¿Borrar esta edición?")) run(() => deleteEditionAction(bookId, edition.id));
                            }}
                            className="inline-flex items-center gap-1 text-xs text-coral hover:underline disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Borrar
                        </button>
                    </div>
                </div>
            </div>

            {editing && (
                <div className="mt-3 pt-3 border-t border-teal/10 grid grid-cols-2 gap-2">
                    <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
                    <input className={inputCls} value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Editorial" />
                    <input className={inputCls} value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Idioma" />
                    <input className={inputCls} value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Formato" />
                    <input className={inputCls} type="number" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="Páginas" />
                    <input className={inputCls} type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año edición" />
                    <input className={`${inputCls} col-span-2`} value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL de portada" />
                    <div className="col-span-2 flex items-center gap-2">
                        <button
                            disabled={pending}
                            onClick={() =>
                                run(() =>
                                    updateEditionAction(bookId, edition.id, {
                                        title,
                                        publisher,
                                        language,
                                        page_count: pages.trim() ? Number(pages) || null : null,
                                        publication_year: year.trim() ? Number(year) || null : null,
                                        format,
                                        cover_url: coverUrl,
                                    }),
                                )
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium bg-teal text-white py-1.5 px-3 rounded-md hover:bg-teal-dark disabled:opacity-50"
                        >
                            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Guardar
                        </button>
                        <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                    </div>
                </div>
            )}

            {error && <p className="text-xs text-coral mt-2">{error}</p>}
        </div>
    );
}

export function EdicionesTab({ bookId, editions }: { bookId: string; editions: BookEdition[] }) {
    const router = useRouter();
    const [adding, setAdding] = useState(false);

    return (
        <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {editions.length} {editions.length === 1 ? "edición" : "ediciones"}. La preferida define la portada del libro.
                </p>
                <button
                    onClick={() => setAdding((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors"
                >
                    <Plus className="w-4 h-4" /> Añadir edición
                </button>
            </div>

            {adding && (
                <AddEditionPanel
                    bookId={bookId}
                    onDone={() => {
                        setAdding(false);
                        router.refresh();
                    }}
                />
            )}

            {editions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-teal/20 p-8 text-center text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Este libro no tiene ediciones. Añade una desde ISBNdb.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {editions.map((e) => (
                        <EditionCard key={e.id} bookId={bookId} edition={e} />
                    ))}
                </div>
            )}
        </div>
    );
}

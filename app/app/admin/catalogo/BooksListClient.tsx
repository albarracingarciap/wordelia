"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, BookOpen, ChevronRight, Check, FileText, Dna } from "lucide-react";
import { listBooksAction } from "./actions";
import type { BookListRow } from "./data";

function guidePill(status: BookListRow["guideStatus"]) {
    if (status === "published")
        return <span className="text-[11px] font-medium py-0.5 px-1.5 rounded text-teal-dark bg-teal/15">Publicada</span>;
    if (status === "draft")
        return <span className="text-[11px] font-medium py-0.5 px-1.5 rounded text-amber-700 bg-amber-100">Borrador</span>;
    return <span className="text-[11px] text-muted-foreground">—</span>;
}

function genomePill(row: BookListRow) {
    if (row.genomeChromosomes === 0) return <span className="text-[11px] text-muted-foreground">—</span>;
    return (
        <span
            className={`text-[11px] font-medium py-0.5 px-1.5 rounded ${
                row.genomePublished ? "text-teal-dark bg-teal/15" : "text-amber-700 bg-amber-100"
            }`}
        >
            {row.genomeChromosomes} crom.{row.genomePublished ? " · pub." : ""}
        </span>
    );
}

export function BooksListClient({ initialBooks }: { initialBooks: BookListRow[] }) {
    const [books, setBooks] = useState<BookListRow[]>(initialBooks);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const { books: result, error } = await listBooksAction(val);
                if (!error && result) setBooks(result);
            } catch (e) {
                console.error("Error buscando libros", e);
            } finally {
                setIsLoading(false);
            }
        }, 400);
    };

    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-teal/10">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por título o autor..."
                        className="w-full pl-9 pr-9 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-shadow"
                        value={query}
                        onChange={(e) => runSearch(e.target.value)}
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-teal" />
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                {books.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No se encontraron libros.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Libro</th>
                                <th className="px-6 py-3 font-medium">Género</th>
                                <th className="px-6 py-3 font-medium"><FileText className="inline w-3.5 h-3.5 mr-1" />Guía</th>
                                <th className="px-6 py-3 font-medium"><Dna className="inline w-3.5 h-3.5 mr-1" />Genoma</th>
                                <th className="px-6 py-3 font-medium">Colección</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal/5">
                            {books.map((b) => (
                                <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-3">
                                        <Link href={`/app/admin/catalogo/${b.id}`} className="flex items-center gap-3">
                                            {b.coverUrl ? (
                                                <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden shadow-sm">
                                                    <Image src={b.coverUrl} alt={b.title} fill className="object-cover" sizes="36px" />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-12 shrink-0 rounded bg-grey/10 flex items-center justify-center">
                                                    <BookOpen className="w-4 h-4 text-grey/40" />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-foreground group-hover:text-teal-dark transition-colors truncate max-w-[280px]">
                                                    {b.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                                                    {b.author || "Autor desconocido"}
                                                    {b.year ? ` · ${b.year}` : ""}
                                                </span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-3 text-muted-foreground">{b.genre || "—"}</td>
                                    <td className="px-6 py-3">{guidePill(b.guideStatus)}</td>
                                    <td className="px-6 py-3">{genomePill(b)}</td>
                                    <td className="px-6 py-3">
                                        {b.collectionName ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-teal-dark">
                                                <Check className="w-3 h-3" /> {b.collectionName}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/admin/catalogo/${b.id}`}
                                            className="inline-flex text-muted-foreground group-hover:text-teal transition-colors"
                                            aria-label="Abrir ficha"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {books.length >= 60 && (
                <div className="p-4 border-t border-teal/10 text-center text-xs text-muted-foreground">
                    Se muestran los primeros 60. Usa la búsqueda para acotar.
                </div>
            )}
        </div>
    );
}

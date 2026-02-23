"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Book, Plus } from "lucide-react";
import { searchBooksAction } from "./actions";
import { BookSearchResult } from "@/lib/isbndb";
import Image from "next/image";
import Link from "next/link";

export function CatalogSearchClient() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setHasSearched(true);
        try {
            const books = await searchBooksAction(query);
            setResults(books);
        } catch (error) {
            console.error("Error searching books:", error);
            alert("Error al buscar libros.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Catálogo de Libros</h1>
                <p className="text-muted-foreground mt-1">
                    Busca libros en ISBNdb para importarlos a la base de datos de Wordelia.
                </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título, autor o ISBN..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button type="submit" variant="primary" disabled={isSearching || !query.trim()}>
                    {isSearching ? "Buscando..." : "Buscar"}
                </Button>
            </form>

            <div className="mt-8">
                {isSearching ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-teal border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Buscando en ISBNdb...</p>
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <Book className="w-12 h-12 text-grey/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No se encontraron resultados</h3>
                        <p className="text-sm text-grey/60 mt-1">
                            Prueba con otros términos de búsqueda o un ISBN válido.
                        </p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {results.map((book) => (
                            <div key={book.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                                {book.cover_url ? (
                                    <div className="relative w-16 h-24 flex-shrink-0 bg-transparent rounded shadow overflow-hidden">
                                        <Image
                                            src={book.cover_url}
                                            alt={book.title}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-24 flex-shrink-0 bg-grey/10 rounded flex items-center justify-center">
                                        <Book className="w-6 h-6 text-grey/40" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <h3 className="font-semibold text-sm line-clamp-2" title={book.title}>
                                        {book.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        {book.authors?.join(', ') || 'Autor desconocido'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 uppercase">
                                        ISBN: {book.isbn || 'N/A'}
                                    </p>

                                    <div className="mt-auto pt-3">
                                        <Link href={`/app/admin/catalogo/importar?isbn=${book.isbn}`}>
                                            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                                                <Plus className="w-3 h-3" />
                                                Importar a Wordelia
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

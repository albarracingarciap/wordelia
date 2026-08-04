"use client";

import { toast } from "@/components/ui/toast";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { searchBooksAction } from "@/app/app/search/actions";
import { BookSearchResult } from "@/lib/isbndb";
import { BookOpen, Plus, Star, Check } from "lucide-react";
import { addBookToLibrary } from "./actions";

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get("q") || "";

    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingBookId, setAddingBookId] = useState<string | null>(null);
    const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());

    // ... (rest of search logic) ...

    const statusParam = searchParams.get("status");
    const initialStatus = (statusParam === 'READING' || statusParam === 'READ') ? statusParam : 'WANT_TO_READ';

    const handleAddBook = async (book: BookSearchResult) => {
        if (addingBookId) return;
        setAddingBookId(book.id);

        try {
            const result = await addBookToLibrary(book, initialStatus);
            if (result.success) {
                setAddedBooks(prev => new Set(prev).add(book.id));
                // If we improved the flow, we'd redirect to Mi Lectura if status was READING
                if (initialStatus === 'READING') {
                    router.push('/app/mi-lectura');
                }
            } else {
                toast.error("Error al añadir: " + result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error inesperado al añadir libro");
        } finally {
            setAddingBookId(null);
        }
    };


    useEffect(() => {
        if (query) {
            handleSearch(query);
        }
    }, [query]);

    const handleSearch = async (searchQuery: string) => {
        setLoading(true);
        try {
            // Updated to use Server Action for ISBNdb
            const isbnResults = await searchBooksAction(searchQuery);
            setResults(isbnResults);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSearch = (val: string) => {
        if (!val.trim()) return;
        router.push(`/app/search?q=${encodeURIComponent(val)}`);
    };

    return (
        <div className="min-h-screen bg-cream pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-md border-b border-teal/5 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <div className="flex-1">
                        <SearchInput
                            defaultValue={query}
                            placeholder="Buscar título, autor o ISBN..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") updateSearch(e.currentTarget.value);
                            }}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="font-serif text-3xl text-teal-dark">
                        {query ? `Resultados para "${query}"` : "Explora nuevos libros"}
                    </h1>
                    <p className="text-grey/60 text-sm mt-1">
                        {loading
                            ? "Buscando en bibliotecas..."
                            : results.length > 0
                                ? `Hemos encontrado ${results.length} libros`
                                : "Encuentra tu próxima lectura"
                        }
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="space-y-3 animate-pulse">
                                <div className="aspect-[2/3] bg-teal/5 rounded-lg w-full"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-teal/5 rounded w-3/4"></div>
                                    <div className="h-3 bg-teal/5 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {results.map((book) => (
                            <div
                                key={book.id}
                                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-teal/5 flex flex-col"
                            >
                                {/* Cover */}
                                <div className="relative aspect-[2/3] w-full bg-grey/5 overflow-hidden">
                                    {book.cover_url ? (
                                        <Image
                                            src={book.cover_url}
                                            alt={book.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-teal/40 p-4 text-center">
                                            <BookOpen size={32} strokeWidth={1.5} />
                                            <span className="text-xs mt-2 font-medium">Sin portada</span>
                                        </div>
                                    )}

                                    {/* Quick Actions Overlay (Mobile friendly: always show button on mobile? or Keep clean) */}
                                    <div className="absolute inset-0 bg-teal-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                        {addedBooks.has(book.id) ? (
                                            <div className="w-full bg-green-500 text-white py-2 rounded-xl flex items-center justify-center text-xs font-bold shadow-md">
                                                <Check size={16} className="mr-1" /> Añadido
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                className="w-full text-xs"
                                                onClick={() => handleAddBook(book)}
                                                isLoading={addingBookId === book.id}
                                            >
                                                <Plus size={14} className="mr-1" /> Añadir
                                            </Button>
                                        )}
                                        <Link href={`/app/libros/${book.id}${initialStatus === 'READING' ? '?status=READING' : ''}`} className="w-full">
                                            <Button size="sm" variant="secondary" className="w-full text-xs bg-white/10 hover:bg-white/20 text-white border-white/40">
                                                Ver detalles
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col">
                                    <h3 className="font-serif text-base text-teal-dark leading-tight line-clamp-2 mb-1" title={book.title}>
                                        {book.title}
                                    </h3>
                                    <p className="text-xs text-grey/70 line-clamp-1 mb-2">
                                        {book.authors.join(", ") || "Autor desconocido"}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between">
                                        {book.average_rating ? (
                                            <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                                                <Star size={12} fill="currentColor" />
                                                {book.average_rating}
                                            </div>
                                        ) : <span></span>}

                                        {/* Optional: Add badge if already in library */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && query && results.length === 0 && (
                    <div className="text-center py-20 opacity-60">
                        <BookOpen size={48} className="mx-auto mb-4 text-teal/40" />
                        <h3 className="text-xl font-serif text-teal-dark">No se encontraron libros</h3>
                        <p className="text-sm">Intenta buscar por otro título o autor.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div></div>}>
            <SearchResults />
        </Suspense>
    );
}

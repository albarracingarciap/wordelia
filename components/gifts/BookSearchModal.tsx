"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, Search, Loader2, BookOpen, Plus } from "lucide-react";
import { searchBooksAction } from "@/app/app/search/actions";
import { BookSearchResult } from "@/lib/isbndb";

export interface WishlistBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    price: number | null;
    isbn: string | null;
    publisher: string | null;
    year: string | null;
    description: string | null;
}

interface BookSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (book: WishlistBook) => void;
    title?: string;
}

function mapToWishlistBook(b: BookSearchResult): WishlistBook {
    const year = b.published_date
        ? new Date(b.published_date).getFullYear().toString()
        : null;

    return {
        id: b.id,
        title: b.title,
        author: b.authors?.[0] ?? "Autor desconocido",
        coverUrl: b.cover_url,
        price: b.price ?? null,
        isbn: b.isbn,
        publisher: b.publisher,
        year,
        description: b.description,
    };
}

export function BookSearchModal({ isOpen, onClose, onAdd, title = "Añadir libro 📚" }: BookSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<WishlistBook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selected, setSelected] = useState<WishlistBook | null>(null);
    const [customPrice, setCustomPrice] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleQueryChange = useCallback((value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            setHasSearched(true);
            try {
                const raw = await searchBooksAction(value.trim());
                setResults(raw.map(mapToWishlistBook));
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, []);

    function handleAdd(book: WishlistBook) {
        const finalPrice = customPrice.trim() !== "" ? parseFloat(customPrice.replace(',', '.')) : null;
        onAdd({ ...book, price: finalPrice !== null && !isNaN(finalPrice) ? finalPrice : null });
        reset();
    }

    function reset() {
        setQuery("");
        setResults([]);
        setHasSearched(false);
        setSelected(null);
        setCustomPrice("");
        setIsLoading(false);
    }

    function handleClose() {
        reset();
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-grey/10 shrink-0">
                    <h3 className="font-serif text-xl text-teal font-bold">{title}</h3>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full hover:bg-grey/10 flex items-center justify-center text-grey/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40" />
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Busca por título, autor o ISBN..."
                            className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm placeholder:text-grey/30 transition-colors"
                        />
                        {isLoading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal animate-spin" />
                        )}
                    </div>
                    <p className="text-[11px] text-grey/40 mt-2 ml-1">Los resultados aparecen al escribir. Buscamos en ISBNdb.</p>
                </div>

                {/* Results */}
                <div className="overflow-y-auto flex-1 px-4 pb-4">
                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-grey/40">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm">Buscando libros...</p>
                        </div>
                    )}

                    {/* No results */}
                    {!isLoading && hasSearched && results.length === 0 && (
                        <div className="text-center py-10 text-grey/40">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No encontramos resultados para "<span className="font-medium">{query}</span>"</p>
                            <p className="text-xs mt-1">Prueba con otro título o ISBN</p>
                        </div>
                    )}

                    {/* Placeholder */}
                    {!isLoading && !hasSearched && (
                        <div className="text-center py-10 text-grey/30">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Escribe para buscar libros</p>
                        </div>
                    )}

                    {/* Result list */}
                    {!isLoading && results.length > 0 && !selected && (
                        <div className="space-y-2">
                            {results.map((book) => (
                                <button
                                    key={book.id || book.isbn || book.title}
                                    onClick={() => {
                                        setSelected(book);
                                        if (book.price) {
                                            setCustomPrice(book.price.toString());
                                        } else {
                                            setCustomPrice("");
                                        }
                                    }}
                                    className="w-full text-left flex gap-3 p-3 hover:bg-cream/60 rounded-xl transition-colors group"
                                >
                                    {/* Cover */}
                                    <div className="relative w-12 h-16 shrink-0 rounded-md overflow-hidden bg-grey/10 shadow-sm">
                                        {book.coverUrl ? (
                                            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-grey/30 text-xs">📚</div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="font-bold text-sm text-teal truncate leading-tight">{book.title}</p>
                                        <p className="text-xs text-grey/70 truncate">{book.author}</p>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            {book.year && <span className="text-[10px] text-grey/50">{book.year}</span>}
                                            {book.publisher && <span className="text-[10px] text-grey/50 truncate max-w-[120px]">{book.publisher}</span>}
                                            {book.isbn && <span className="text-[10px] text-grey/30">ISBN: {book.isbn}</span>}
                                        </div>
                                    </div>
                                    <div className="self-center shrink-0">
                                        <span className="text-xs font-bold text-teal bg-teal/10 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver →
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Book detail / confirm panel */}
                    {selected && (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                            <button
                                onClick={() => setSelected(null)}
                                className="text-sm text-grey/60 hover:text-teal mb-4 inline-flex items-center gap-1"
                            >
                                ← Volver a resultados
                            </button>

                            <div className="flex gap-4 mb-4">
                                {/* Cover */}
                                <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-md bg-grey/10">
                                    {selected.coverUrl ? (
                                        <Image src={selected.coverUrl} alt={selected.title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                                    )}
                                </div>
                                {/* Meta */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-serif font-bold text-teal text-lg leading-tight">{selected.title}</h4>
                                    <p className="text-sm text-grey/80 mt-0.5">{selected.author}</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-grey/50">
                                        {selected.year && <span>📅 {selected.year}</span>}
                                        {selected.publisher && <span>🏢 {selected.publisher}</span>}
                                        {selected.isbn && <span>ISBN: {selected.isbn}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Synopsis */}
                            {selected.description && (
                                <div className="bg-cream/40 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
                                    <p className="text-xs text-grey/70 leading-relaxed line-clamp-6">
                                        {selected.description}
                                    </p>
                                </div>
                            )}

                            {/* Price Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-grey/80 mb-1">
                                    Precio aproximado (€) <span className="text-grey/40 font-normal">(opcional)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Ej: 19.90"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border-2 border-grey/10 focus:border-teal/40 focus:outline-none text-sm transition-colors"
                                />
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={() => handleAdd(selected)}
                                className="w-full h-12 bg-coral text-white rounded-full font-medium hover:bg-opacity-90 transition-all shadow-md shadow-coral/20 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir a la lista
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

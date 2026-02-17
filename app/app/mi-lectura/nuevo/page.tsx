"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { searchBooksAction, addBookToLibrary } from "@/app/app/search/actions";
import { BookSearchResult } from "@/lib/isbndb";
import { Loader2, ArrowLeft, Eye } from "lucide-react";

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

    // Initialize query from URL if available
    const initialQuery = searchParams.get("q")?.toString() || "";
    const [searchQuery, setSearchQuery] = React.useState(initialQuery);
    const [results, setResults] = React.useState<BookSearchResult[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [isAdding, setIsAdding] = React.useState<string | null>(null);

    // Manual Form State
    const [showManualForm, setShowManualForm] = React.useState(false);
    const [manualData, setManualData] = React.useState({
        title: "",
        author: "",
        isbn: "",
        pages: "",
    });

    // Debounce Search & URL Sync
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length > 2) {
                // Update URL params without refreshing
                const params = new URLSearchParams(searchParams.toString());
                params.set("q", searchQuery);
                router.replace(`${pathname}?${params.toString()}`);

                handleSearch();
            } else {
                if (searchQuery.length === 0) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("q");
                    router.replace(`${pathname}?${params.toString()}`);
                }
                setResults([]);
            }
        }, 600);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        setShowManualForm(false); // Hide manual form when searching
        try {
            const data = await searchBooksAction(searchQuery);
            setResults(data);
        } catch (error) {
            console.error("Search failed:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddBook = async (book: BookSearchResult, status: "READING" | "READ" | "WANT_TO_READ") => {
        if (isAdding) return;
        setIsAdding(book.id || book.isbn || "unknown"); // Use ID for loading state

        try {
            const result = await addBookToLibrary(book, status);
            if (result.success) {
                router.push("/app/mi-lectura");
            } else {
                alert("Error al añadir libro: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado.");
        } finally {
            setIsAdding(null);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualData.title || !manualData.author) return;

        // Construct a pseudo BookSearchResult
        const manualBook: BookSearchResult = {
            id: `manual-${Date.now()}`,
            title: manualData.title,
            authors: [manualData.author],
            cover_url: null, // Optional: could allow user to paste URL
            description: null,
            isbn: manualData.isbn || null,
            page_count: manualData.pages ? parseInt(manualData.pages) : null,
            published_date: null,
            publisher: null,
            categories: [],
            average_rating: null,
            ratings_count: null,
            language: "es",
            source: 'db' // Treated as a DB book
        };

        // Add with default status "WANT_TO_READ" (or could add selector in form)
        // For simplicity, let's say "Quiero leer" by default, or ask status.
        // Let's default to 'WANT_TO_READ' as it's the safest bet for a new add.
        await handleAddBook(manualBook, "WANT_TO_READ");
    };

    const handleScanClick = () => {
        alert("📷 [MOCK] Cámara abierta.\nEscaneando código de barras...\n\n(En una app real, aquí se abriría la cámara del dispositivo)");
        setSearchQuery("9788418055663"); // Mock ISBN found
    };

    const hasQuery = searchQuery.length > 2;
    const hasResults = results.length > 0;

    // Determine what view to show
    // 1. Manual Form active?
    // 2. Search active & Results?
    // 3. Search active & No Results?
    // 4. Default state (Empty) -> Show "Add Manually" CTA

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Link href="/app/mi-lectura" className="p-2 -ml-2 text-grey/40 hover:text-teal hover:bg-teal/5 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-serif text-teal">Añadir nuevo libro</h1>
                        <p className="text-coral text-xs">Busca por título, autor o ISBN</p>
                    </div>
                </div>

                {!showManualForm && (
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Escribe el título, autor o ISBN..."
                            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-teal/10 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/10 focus:border-teal transition-all text-base placeholder:text-grey/40"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        {/* Search Icon */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-grey/40 pointer-events-none group-focus-within:text-teal transition-colors">
                            {isSearching ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            )}
                        </div>

                        {/* Scanner Icon */}
                        <button
                            onClick={handleScanClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-grey/40 hover:text-teal hover:bg-teal/5 rounded-full transition-all"
                            title="Escanear código de barras"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="11" width="10" height="2" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Manual Entry Form */}
            {showManualForm ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal/10 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-teal font-serif">Añadir manualmente</h2>
                        <button
                            onClick={() => setShowManualForm(false)}
                            className="text-xs text-coral hover:underline"
                        >
                            Cancelar
                        </button>
                    </div>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-1.5">Título *</label>
                            <input
                                required
                                type="text"
                                className="w-full h-12 px-4 rounded-xl border border-grey/20 bg-grey/5 focus:bg-white focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all outline-none"
                                placeholder="Ej. El Quijote"
                                value={manualData.title}
                                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-1.5">Autor *</label>
                            <input
                                required
                                type="text"
                                className="w-full h-12 px-4 rounded-xl border border-grey/20 bg-grey/5 focus:bg-white focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all outline-none"
                                placeholder="Ej. Miguel de Cervantes"
                                value={manualData.author}
                                onChange={(e) => setManualData({ ...manualData, author: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-1.5">ISBN</label>
                                <input
                                    type="text"
                                    className="w-full h-12 px-4 rounded-xl border border-grey/20 bg-grey/5 focus:bg-white focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all outline-none"
                                    placeholder="Opcional"
                                    value={manualData.isbn}
                                    onChange={(e) => setManualData({ ...manualData, isbn: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-1.5">Páginas</label>
                                <input
                                    type="number"
                                    className="w-full h-12 px-4 rounded-xl border border-grey/20 bg-grey/5 focus:bg-white focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all outline-none"
                                    placeholder="Opcional"
                                    value={manualData.pages}
                                    onChange={(e) => setManualData({ ...manualData, pages: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-12 text-base" disabled={!!isAdding}>
                                {isAdding ? <Loader2 className="animate-spin" /> : "Guardar Libro"}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Results List */
                <section>
                    {hasQuery && (
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-xs font-bold text-grey/40 uppercase tracking-widest flex items-center gap-2">
                                <span>Resultados</span>
                                <span className="bg-teal/10 text-teal px-1.5 py-0.5 rounded text-[10px]">{results.length}</span>
                            </h2>
                        </div>
                    )}

                    {results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {results.map((book, idx) => (
                                <div key={book.id || idx} className="bg-white p-3 rounded-xl border border-teal/5 shadow-sm hover:shadow-md hover:border-teal/20 transition-all flex gap-4 group items-center relative overflow-visible">
                                    {/* Cover */}
                                    <div className="relative w-12 h-16 shrink-0 bg-grey/10 rounded overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        {book.cover_url ? (
                                            <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-grey/20">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-serif text-base font-bold text-teal leading-tight truncate">{book.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-coral font-medium truncate">
                                                {book.authors?.join(", ") || "Autor desconocido"}
                                            </p>
                                        </div>
                                        {book.published_date && (
                                            <p className="text-[10px] text-grey/40 mt-1">Publicado en {book.published_date.substring(0, 4)}</p>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="relative group/actions shrink-0 flex items-center gap-2">
                                        <Link
                                            href={`/app/libros/${book.id || book.isbn}`}
                                            className="h-9 w-9 flex items-center justify-center text-grey/40 hover:text-teal hover:bg-teal/5 rounded-lg transition-all"
                                            title="Ver detalle"
                                        >
                                            <Eye size={20} />
                                        </Link>

                                        <div className="relative">
                                            <button
                                                className="h-9 px-4 bg-teal/5 text-teal hover:bg-teal hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!!isAdding}
                                            >
                                                {isAdding === (book.id || book.isbn) ? (
                                                    <Loader2 className="animate-spin" size={14} />
                                                ) : (
                                                    <>
                                                        Añadir
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                                                    </>
                                                )}
                                            </button>

                                            {/* Dropdown Menu - Customized Position */}
                                            {!isAdding && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-teal/10 overflow-hidden hidden group-hover/actions:block z-20 animate-fade-in-up origin-top-right">
                                                    <button onClick={() => handleAddBook(book, "READING")} className="w-full text-left px-4 py-3 text-xs font-medium text-grey hover:bg-teal/5 hover:text-teal transition-colors border-b border-teal/5 flex items-center gap-2">
                                                        📖 Estoy leyendo
                                                    </button>
                                                    <button onClick={() => handleAddBook(book, "WANT_TO_READ")} className="w-full text-left px-4 py-3 text-xs font-medium text-grey hover:bg-teal/5 hover:text-teal transition-colors border-b border-teal/5 flex items-center gap-2">
                                                        🔖 Quiero leer
                                                    </button>
                                                    <button onClick={() => handleAddBook(book, "READ")} className="w-full text-left px-4 py-3 text-xs font-medium text-grey hover:bg-teal/5 hover:text-teal transition-colors flex items-center gap-2">
                                                        ✅ Ya leído
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Not searching (empty state) OR Searching but no results
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-teal/10 flex flex-col items-center justify-center mt-4">
                            <div className="w-12 h-12 bg-teal/5 text-teal rounded-full flex items-center justify-center mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            </div>

                            {hasQuery ? (
                                <p className="text-grey/60 mb-1 font-medium">No encontramos "{searchQuery}"</p>
                            ) : (
                                <p className="text-grey/60 mb-1 font-medium font-serif text-lg">¿No encuentras tu libro?</p>
                            )}

                            <p className="text-xs text-grey/40 mb-6 max-w-xs mx-auto">
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

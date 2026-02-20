import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { searchBooks } from "@/app/app/clubs/crear/actions";
import { BookSearchResult } from "@/lib/isbndb";

interface SearchBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBook: (book: BookSearchResult) => void;
}

export function SearchBookModal({ isOpen, onClose, onSelectBook }: SearchBookModalProps) {
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<BookSearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasSearched, setHasSearched] = React.useState(false);

    const handleSearch = async () => {
        if (query.length < 3) return;
        setIsLoading(true);
        setHasSearched(true);
        try {
            const data = await searchBooks(query);
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Elige la próxima lectura">
            <div className="flex flex-col gap-4 max-h-[80vh]">
                <div className="flex gap-2 p-1">
                    <Input
                        placeholder="Buscar por título, autor o ISBN..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <Button onClick={handleSearch} disabled={isLoading || query.length < 3} variant="primary">
                        {isLoading ? "..." : "Buscar"}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    {isLoading && (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
                        </div>
                    )}

                    {!isLoading && hasSearched && results.length === 0 && (
                        <div className="text-center py-10 text-grey/60">
                            No se encontraron libros. Intenta con otro término.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((book) => (
                            <button
                                key={book.isbn}
                                onClick={() => onSelectBook(book)}
                                className="flex gap-4 p-3 rounded-lg border border-transparent hover:border-teal/20 hover:bg-teal/5 text-left transition-all group"
                            >
                                <div className="w-16 h-24 bg-grey/10 rounded flex-shrink-0 overflow-hidden shadow-sm">
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-grey/40">No Cover</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-grey-dark text-sm truncate group-hover:text-teal transition-colors">{book.title}</h4>
                                    <p className="text-xs text-grey/60 truncate">{book.authors?.join(", ") || "Autor desconocido"}</p>
                                    <p className="text-[10px] text-grey/40 mt-2">{(book as any).date_published?.substring(0, 4)} · {book.page_count ? `${book.page_count} págs` : "N/A"}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

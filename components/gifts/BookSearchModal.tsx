'use client';

import { useState } from "react";
import Image from "next/image";

interface BookSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (book: any) => void;
}

// Mock search results
const MOCK_SEARCH_RESULTS = [
    { id: 's1', title: "Cien años de soledad", author: "Gabriel García Márquez", coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f" },
    { id: 's2', title: "El amor en los tiempos del cólera", author: "Gabriel García Márquez", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794" },
    { id: 's3', title: "Crónica de una muerte anunciada", author: "Gabriel García Márquez", coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e" },
];

export function BookSearchModal({ isOpen, onClose, onAdd }: BookSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof MOCK_SEARCH_RESULTS>([]);

    if (!isOpen) return null;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate search delay
        setTimeout(() => {
            setResults(MOCK_SEARCH_RESULTS);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-grey/10 flex justify-between items-center bg-cream/30">
                    <h3 className="font-serif text-xl text-teal font-bold">Añadir Idea de Regalo 🎁</h3>
                    <button onClick={onClose} className="text-grey/40 hover:text-coral text-2xl leading-none">&times;</button>
                </div>

                {/* Search Input */}
                <div className="p-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por título, autor o ISBN..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-grey/20 focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all outline-none"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        <span className="absolute left-3 top-3.5 text-grey/40">🔍</span>
                        <button type="submit" className="hidden">Buscar</button>
                    </form>
                </div>

                {/* Results List */}
                <div className="max-h-[300px] overflow-y-auto px-4 pb-4 space-y-2">
                    {results.length === 0 && query.length > 0 && (
                        <p className="text-center text-grey/40 text-sm py-4">Presiona Enter para buscar...</p>
                    )}

                    {results.map(book => (
                        <div key={book.id} className="flex gap-3 p-2 hover:bg-grey/5 rounded-lg group transition-colors cursor-pointer" onClick={() => onAdd(book)}>
                            <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden bg-grey/10">
                                <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="font-bold text-teal text-sm truncate">{book.title}</h4>
                                <p className="text-xs text-grey">{book.author}</p>
                            </div>
                            <button className="self-center px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                AÑADIR
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

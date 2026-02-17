import * as React from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

// Mock Results
const MOCK_BOOKS = [
    { id: "b1", title: "El infinito en un junco", author: "Irene Vallejo", coverUrl: "/assets/images/book_cover_2.png", pages: 450 },
    { id: "b2", title: "Seda", author: "Alessandro Baricco", coverUrl: "/assets/images/book_cover_3.png", pages: 120 },
    { id: "b3", title: "Dune", author: "Frank Herbert", coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg", pages: 800 },
];

interface StepBookProps {
    data: any;
    onUpdate: (field: string, value: any) => void;
}

export function StepBook({ data, onUpdate }: StepBookProps) {
    const [search, setSearch] = React.useState("");
    const [results, setResults] = React.useState<any[]>([]);

    // Simulate Search
    React.useEffect(() => {
        if (search.length > 2) {
            setResults(MOCK_BOOKS.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())));
        } else {
            setResults([]);
        }
    }, [search]);

    const handleSelect = (book: any) => {
        onUpdate("book", book);
        setSearch("");
        setResults([]);
    };

    if (data.book) {
        return (
            <Card className="animate-fade-in-up">
                <h3 className="text-lg font-serif text-teal mb-6">Libro seleccionado</h3>
                <div className="flex gap-4 items-start bg-teal/5 p-4 rounded-xl border border-teal/10">
                    <div className="relative w-16 h-24 shadow-md rounded overflow-hidden shrink-0">
                        <Image src={data.book.coverUrl} alt={data.book.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-grey-dark">{data.book.title}</h4>
                        <p className="text-sm text-grey/60">{data.book.author}</p>
                        <div className="mt-2">
                            <span className="text-[10px] uppercase font-bold text-teal bg-white px-2 py-0.5 rounded border border-teal/20">
                                {data.book.pages} páginas
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onUpdate("book", null)} className="text-coral hover:bg-coral/5">
                        Cambiar
                    </Button>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold text-grey-dark mb-1.5">¿Cuándo empezáis?</label>
                        <input
                            type="date"
                            className="w-full md:w-auto rounded-xl border border-grey/20 bg-white px-4 py-2 text-sm text-grey-dark focus:border-teal focus:outline-none"
                            value={data.startDate || ""}
                            onChange={(e) => onUpdate("startDate", e.target.value)}
                        />
                        <p className="text-xs text-grey/50 mt-1">Si lo dejas vacío, empezáis cuando queráis.</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="animate-fade-in-up">
            <h3 className="text-lg font-serif text-teal mb-6">Elige la lectura</h3>

            <div className="relative">
                <SearchInput
                    placeholder="Busca por título o autor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Results Dropdown */}
                {results.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-grey/10 rounded-xl shadow-xl mt-2 z-10 overflow-hidden">
                        {results.map(book => (
                            <button
                                key={book.id}
                                onClick={() => handleSelect(book)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-teal/5 text-left border-b border-gray-50 last:border-0 transition-colors"
                            >
                                <div className="relative w-10 h-14 shrink-0 bg-gray-100 rounded overflow-hidden">
                                    <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-grey-dark">{book.title}</p>
                                    <p className="text-xs text-grey/60">{book.author}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {search.length > 2 && results.length === 0 && (
                    <div className="mt-4 p-4 text-center text-sm text-grey/60 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No encontramos ese libro. Prueba con otra búsqueda.
                    </div>
                )}
            </div>

            <div className="mt-8">
                <h4 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-3">Sugerencias populares</h4>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {MOCK_BOOKS.slice(0, 2).map((book) => ( // Show first 2 as suggestions
                        <button
                            key={book.id}
                            onClick={() => handleSelect(book)}
                            className="flex items-center gap-2 p-2 pr-4 bg-white border border-grey/10 rounded-lg hover:border-teal/30 hover:shadow-sm transition-all shrink-0"
                        >
                            <div className="relative w-8 h-10 rounded overflow-hidden grayscale opacity-80">
                                <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-grey-dark truncate max-w-[120px]">{book.title}</p>
                                <p className="text-[10px] text-grey/60">{book.author}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Card>
    );
}

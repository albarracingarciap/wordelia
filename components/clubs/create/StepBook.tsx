import * as React from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { searchBooks } from "@/app/app/clubs/crear/actions";

interface StepBookProps {
    data: any;
    onUpdate: (field: string, value: any) => void;
}

export function StepBook({ data, onUpdate }: StepBookProps) {
    const [search, setSearch] = React.useState("");
    const [results, setResults] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.length > 2) {
                setLoading(true);
                try {
                    const books = await searchBooks(search);
                    setResults(books);
                } catch (err) {
                    console.error("Search failed", err);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    if (data.book) {
        return (
            <Card className="animate-fade-in-up">
                <h3 className="text-lg font-serif text-teal mb-6">Libro seleccionado</h3>
                <div className="flex gap-4 items-start bg-teal/5 p-4 rounded-xl border border-teal/10">
                    <div className="relative w-16 h-24 shadow-md rounded overflow-hidden shrink-0 bg-white">
                        {data.book.cover_url ? (
                            <Image src={data.book.cover_url} alt={data.book.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-grey/40">No Cover</div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-grey-dark">{data.book.title}</h4>
                        <p className="text-sm text-grey/60 mb-2">{data.book.authors ? data.book.authors.join(", ") : data.book.author}</p>

                        <div className="flex flex-wrap gap-2 text-xs text-grey/70">
                            {data.book.published_date && <span className="bg-white px-2 py-0.5 rounded border border-grey/10">{new Date(data.book.published_date).getFullYear()}</span>}
                            {/* ISBNdb doesn't return genre easily, using categories if available */}
                            {data.book.categories && data.book.categories[0] && <span className="bg-white px-2 py-0.5 rounded border border-grey/10">{data.book.categories[0]}</span>}
                            <span className="bg-white px-2 py-0.5 rounded border border-grey/10 font-bold text-teal">
                                {data.book.page_count || "?"} páginas
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

                {/* Grid Results */}
                {loading && (
                    <div className="mt-8 text-center text-grey/40">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-teal rounded-full" role="status" aria-label="loading"></div>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                        {results.map(book => (
                            <button
                                key={book.id}
                                onClick={() => {
                                    onUpdate("book", book);
                                    setSearch(""); // Reset search on select
                                }}
                                className="flex flex-col text-left group"
                            >
                                <div className="relative w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow mb-2 border border-black/5">
                                    {book.cover_url ? (
                                        <Image src={book.cover_url} alt={book.title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-center p-2 text-grey/40">No Cover</div>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-grey-dark leading-tight line-clamp-2 group-hover:text-teal transition-colors">{book.title}</p>
                                <p className="text-[10px] text-grey/60 truncate">{book.authors ? book.authors[0] : ''}</p>
                            </button>
                        ))}
                    </div>
                )}

                {search.length > 2 && !loading && results.length === 0 && (
                    <div className="mt-12 p-8 text-center text-sm text-grey/60 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No encontramos ese libro. ¿Quizás otro título?
                    </div>
                )}

                {search.length === 0 && (
                    <div className="mt-12 text-center text-grey/40 italic">
                        Empieza a escribir para buscar...
                    </div>
                )}
            </div>
        </Card>
    );
}

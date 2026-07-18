"use client";

import Image from "next/image";
import { BookOpen, Dna } from "lucide-react";
import type { PublicBook } from "@/app/explorar/actions";

// Todos los libros de esta vista tienen guía y genoma publicados por
// definición del conjunto, así que las insignias son informativas, no
// condicionales: comunican qué diferencia a Wordelia de un listado cualquiera.
export function CatalogBookCard({ book, onClick }: { book: PublicBook; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-teal/10 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-grey/10">
                {book.coverUrl ? (
                    <Image
                        src={book.coverUrl}
                        alt={`Portada de ${book.title}`}
                        fill
                        sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-3">
                        <p className="text-center font-serif text-xs text-grey/60">{book.title}</p>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-teal-dark">
                    {book.title}
                </h3>
                {book.author && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-grey/60">{book.author}</p>
                )}

                <div className="mt-auto flex flex-wrap gap-1.5 pt-2 text-[10px] font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-teal">
                        <BookOpen className="h-3 w-3" aria-hidden="true" />
                        Guía
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-coral">
                        <Dna className="h-3 w-3" aria-hidden="true" />
                        Genoma
                    </span>
                </div>
            </div>
        </button>
    );
}

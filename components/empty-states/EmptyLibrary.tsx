"use client";

import React from "react";
import { BookOpen, FolderInput, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function EmptyLibrary() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (searchQuery.trim()) {
            router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="flex min-h-[60vh] animate-fade-in flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-teal/5 text-teal/40 ring-8 ring-teal/5">
                <BookOpen size={40} className="stroke-1" />
            </div>

            <h2 className="mb-3 font-serif text-2xl text-teal-dark md:text-3xl">
                Tu biblioteca está esperando historias
            </h2>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-grey/80">
                Este es tu espacio personal para organizar lecturas, guardar citas y seguir tu progreso.
                Empieza añadiendo tu primer libro.
            </p>

            <form onSubmit={handleSearch} className="group relative mb-8 w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search size={20} className="text-teal/40 transition-colors group-focus-within:text-teal" />
                </div>
                <input
                    type="text"
                    placeholder="Busca un título, autor o ISBN..."
                    className="w-full rounded-xl border border-teal/10 bg-white py-4 pl-12 pr-4 text-lg text-teal-dark shadow-sm transition-all placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                />
            </form>

            <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
                <Button
                    variant="outline"
                    className="h-auto justify-start border-dashed border-teal/20 px-4 py-4 text-grey hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
                    onClick={() => router.push("/app/mi-lectura/nuevo?from=/app/mi-lectura/estanterias")}
                >
                    <div className="mr-3 rounded-lg bg-teal/10 p-2">
                        <Plus size={18} className="text-teal" />
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-medium">Añadir manualmente</span>
                        <span className="block text-xs text-grey/60">Si no lo encuentras</span>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto justify-start border-dashed border-teal/20 px-4 py-4 text-grey hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
                    onClick={() => {
                        // Placeholder for a future import flow.
                    }}
                >
                    <div className="mr-3 rounded-lg bg-teal/10 p-2">
                        <FolderInput size={18} className="text-teal" />
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-medium">Importar biblioteca</span>
                        <span className="block text-xs text-grey/60">Desde Goodreads o CSV</span>
                    </div>
                </Button>
            </div>

            <div className="mt-12 w-full max-w-2xl border-t border-teal/5 pt-8 text-center">
                <p className="text-sm italic text-grey/40">
                    &quot;Una habitación sin libros es como un cuerpo sin alma.&quot; Cicerón
                </p>
            </div>
        </div>
    );
}

"use client";

import React from "react";
import { Search, BookOpen, Plus, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
            {/* Visual */}
            <div className="w-24 h-24 bg-teal/5 rounded-full flex items-center justify-center mb-6 text-teal/40 ring-8 ring-teal/5">
                <BookOpen size={40} className="stroke-1" />
            </div>

            {/* Content */}
            <h2 className="text-2xl md:text-3xl font-serif text-teal-dark mb-3">
                Tu biblioteca está esperando historias
            </h2>
            <p className="text-grey/80 max-w-lg mb-8 leading-relaxed text-lg">
                Este es tu espacio personal para organizar lecturas, guardar citas y seguir tu progreso.
                Empieza añadiendo tu primer libro.
            </p>

            {/* Main Action: Search */}
            <form onSubmit={handleSearch} className="w-full max-w-md relative group mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-teal/40 group-focus-within:text-teal transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Busca un título, autor o ISBN..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-teal/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-grey/40 text-teal-dark text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                />
            </form>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                <Button
                    variant="outline"
                    className="h-auto py-4 justify-start px-4 border-dashed border-teal/20 hover:border-teal/40 hover:bg-teal/5 text-grey hover:text-teal"
                    onClick={() => router.push('/app/mi-lectura/nuevo')}
                >
                    <div className="bg-teal/10 p-2 rounded-lg mr-3">
                        <Plus size={18} className="text-teal" />
                    </div>
                    <div className="text-left">
                        <span className="block font-medium text-sm">Añadir manualmente</span>
                        <span className="block text-xs text-grey/60">Si no lo encuentras</span>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-4 justify-start px-4 border-dashed border-teal/20 hover:border-teal/40 hover:bg-teal/5 text-grey hover:text-teal"
                    onClick={() => {/* Import flow placeholder */ }}
                >
                    <div className="bg-teal/10 p-2 rounded-lg mr-3">
                        <FolderInput size={18} className="text-teal" />
                    </div>
                    <div className="text-left">
                        <span className="block font-medium text-sm">Importar biblioteca</span>
                        <span className="block text-xs text-grey/60">Desde Goodreads o CSV</span>
                    </div>
                </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-teal/5 w-full max-w-2xl text-center">
                <p className="text-sm text-grey/40 italic">
                    "Una habitación sin libros es como un cuerpo sin alma." — Cicerón
                </p>
            </div>
        </div>
    );
}

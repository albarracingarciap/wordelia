"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bookmark, MessageSquare, Quote, Heart, Users } from "lucide-react";
import Link from "next/link";

type Tab = "reseñas" | "debates" | "citas";

export default function GuardadosClient() {
    const [activeTab, setActiveTab] = useState<Tab>("reseñas");

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Tabs */}
            <div className="flex gap-2 pb-4 overflow-x-auto hide-scrollbar border-b border-teal/10">
                <button
                    onClick={() => setActiveTab("reseñas")}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "reseñas"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-teal/5 text-teal hover:bg-teal/10"
                        }`}
                >
                    Reseñas (0)
                </button>
                <button
                    onClick={() => setActiveTab("debates")}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "debates"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-teal/5 text-teal hover:bg-teal/10"
                        }`}
                >
                    Debates de Clubs (0)
                </button>
                <button
                    onClick={() => setActiveTab("citas")}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "citas"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-teal/5 text-teal hover:bg-teal/10"
                        }`}
                >
                    Citas destacadas (0)
                </button>
            </div>

            {/* Content Area - Currently Empty States */}
            <div className="min-h-[400px]">
                {activeTab === "reseñas" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in bg-white/50 rounded-2xl border border-teal/5 p-8">
                        <div className="w-20 h-20 bg-teal/5 rounded-full flex items-center justify-center mb-6 text-teal/40">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif text-teal mb-2">Aún no has guardado ninguna reseña</h3>
                        <p className="text-grey/80 max-w-md mb-8 leading-relaxed">
                            Cuando leas un análisis brillante o una opinión que te haga pensar en un libro de forma diferente, guárdalo para no perderlo nunca.
                        </p>
                        <Link href="/app/explorar">
                            <Button className="bg-teal hover:bg-teal-dark">Explorar libros y reseñas</Button>
                        </Link>
                    </div>
                )}

                {activeTab === "debates" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in bg-white/50 rounded-2xl border border-teal/5 p-8">
                        <div className="w-20 h-20 bg-teal/5 rounded-full flex items-center justify-center mb-6 text-teal/40">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif text-teal mb-2">Tus hilos de debate favoritos</h3>
                        <p className="text-grey/80 max-w-md mb-8 leading-relaxed">
                            A veces en los clubs surgen conversaciones inolvidables. Guarda los mejores hilos para revisitarlos más adelante.
                        </p>
                        <Link href="/app/clubs">
                            <Button className="bg-teal hover:bg-teal-dark">Descubrir Clubs Activos</Button>
                        </Link>
                    </div>
                )}

                {activeTab === "citas" && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in bg-white/50 rounded-2xl border border-teal/5 p-8">
                        <div className="w-20 h-20 bg-teal/5 rounded-full flex items-center justify-center mb-6 text-teal/40">
                            <Quote size={32} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif text-teal mb-2">Colecciona frases que inspiran</h3>
                        <p className="text-grey/80 max-w-md mb-8 leading-relaxed">
                            Explora las notas públicas de otros lectores y guarda esas citas que te llegan al corazón.
                        </p>
                        <Link href="/app/explorar">
                            <Button className="bg-teal hover:bg-teal-dark">Ver qué lee la comunidad</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function ExploreHero() {
    return (
        <section className="relative bg-gradient-to-br from-teal to-teal-dark rounded-2xl p-8 md:p-12 overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4">
                    <span className="text-white drop-shadow-md">Descubre libros por cómo te harán sentir,</span>{" "}
                    <span className="italic text-cream font-bold drop-shadow-md">no solo por género</span>
                </h1>

                <p className="text-white mb-6 text-base md:text-lg leading-relaxed">
                    En Wordelia clasificamos libros por la <strong className="text-cream font-bold">experiencia de lectura</strong> que ofrecen.
                    ¿Buscas tensión narrativa? ¿Universos complejos? ¿Prosa poética? Te mostramos exactamente qué esperar.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/register">
                        <Button
                            style={{ color: '#234A4E' }}
                            className="bg-cream hover:bg-white border-none font-bold shadow-lg hover:shadow-xl transition-all text-base"
                        >
                            Crear cuenta gratis
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button
                            variant="outline"
                            className="border-2 border-white !text-white bg-transparent hover:bg-white hover:!text-teal-dark font-semibold transition-all"
                        >
                            Ya tengo cuenta
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
                <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
            </div>

            {/* Decorative book spines */}
            <div className="absolute bottom-0 right-0 w-64 h-full hidden lg:block opacity-20 pointer-events-none">
                <div className="absolute right-4 bottom-8 w-12 h-48 bg-white/30 rounded-sm transform rotate-12" />
                <div className="absolute right-20 bottom-16 w-12 h-56 bg-white/30 rounded-sm transform -rotate-6" />
                <div className="absolute right-36 bottom-20 w-12 h-44 bg-white/30 rounded-sm transform rotate-3" />
            </div>
        </section>
    );
}

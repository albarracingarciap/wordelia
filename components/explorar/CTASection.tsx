"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Sparkles, Users, TrendingUp } from "lucide-react";

export function CTASection() {
    return (
        <section className="bg-gradient-to-br from-cream to-teal/5 rounded-2xl p-8 md:p-12 border border-teal/10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="bg-teal/10 rounded-full p-4">
                        <Sparkles className="w-8 h-8 text-teal" />
                    </div>
                </div>

                {/* Headline */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-serif text-grey mb-3">
                        ¿Listo para encontrar tu próximo libro favorito?
                    </h2>
                    <p className="text-grey/70 text-lg">
                        Únete a miles de lectores que descubren libros de una forma diferente
                    </p>
                </div>

                {/* Features */}
                <div className="flex flex-col sm:flex-row justify-center gap-6 py-6">
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="bg-teal/10 rounded-full p-2">
                            <TrendingUp className="w-5 h-5 text-teal" />
                        </div>
                        <span className="text-sm font-medium">Mapas Emocionales</span>
                    </div>
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="bg-teal/10 rounded-full p-2">
                            <Users className="w-5 h-5 text-teal" />
                        </div>
                        <span className="text-sm font-medium">Clubs de Lectura</span>
                    </div>
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="bg-teal/10 rounded-full p-2">
                            <Sparkles className="w-5 h-5 text-teal" />
                        </div>
                        <span className="text-sm font-medium">IA Personalizada</span>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/register">
                        <Button
                            size="lg"
                            className="bg-teal hover:bg-teal-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            Crear cuenta gratis
                        </Button>
                    </Link>
                    <Link href="/app/adn">
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-2 border-teal/30 text-teal hover:bg-teal/5"
                        >
                            Ver cómo funciona
                        </Button>
                    </Link>
                </div>

                {/* Trust signal */}
                <p className="text-xs text-grey/50">
                    ✨ Sin tarjeta de crédito • Acceso inmediato • Cancela cuando quieras
                </p>
            </div>
        </section>
    );
}

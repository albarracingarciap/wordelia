"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Sparkles, Users, TrendingUp } from "lucide-react";

export function CTASection() {
    return (
        <section className="rounded-2xl border border-teal/10 bg-gradient-to-br from-cream to-teal/5 p-8 md:p-12">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-teal/10 p-4">
                        <Sparkles className="h-8 w-8 text-teal" />
                    </div>
                </div>

                <div>
                    <h2 className="mb-3 text-3xl text-teal md:text-4xl">
                        ¿Listo para encontrar tu próximo libro favorito?
                    </h2>
                    <p className="text-lg text-grey/70">
                        Únete a miles de lectores que descubren libros de una forma diferente
                    </p>
                </div>

                <div className="flex flex-col justify-center gap-6 py-6 sm:flex-row">
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="rounded-full bg-teal/10 p-2">
                            <TrendingUp className="h-5 w-5 text-teal" />
                        </div>
                        <span className="text-sm font-medium">Mapas emocionales</span>
                    </div>
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="rounded-full bg-teal/10 p-2">
                            <Users className="h-5 w-5 text-teal" />
                        </div>
                        <span className="text-sm font-medium">Clubs de lectura</span>
                    </div>
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="rounded-full bg-teal/10 p-2">
                            <Sparkles className="h-5 w-5 text-teal" />
                        </div>
                        <span className="text-sm font-medium">IA personalizada</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Link href="/register">
                        <Button
                            size="lg"
                            className="bg-teal font-semibold text-white shadow-lg transition-all hover:bg-teal-dark hover:shadow-xl"
                        >
                            Crear cuenta gratis
                        </Button>
                    </Link>
                </div>

                <p className="text-xs text-grey/50">
                    Sin tarjeta de crédito · Acceso inmediato · Cancela cuando quieras
                </p>
            </div>
        </section>
    );
}

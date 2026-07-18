import Link from "next/link";
import { Sparkles, Users, Dna } from "lucide-react";

export function CTASection() {
    return (
        <section className="rounded-3xl border border-teal/10 bg-gradient-to-br from-cream to-teal/5 p-8 md:p-12">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-teal/10 p-4">
                        <Sparkles className="h-8 w-8 text-teal" aria-hidden="true" />
                    </div>
                </div>

                <div>
                    <h2 className="mb-3 text-3xl text-teal md:text-4xl">
                        ¿Listo para encontrar tu próxima lectura?
                    </h2>
                    <p className="text-lg text-grey/70">
                        Wordelia se lanza al público el 2 de agosto. Regístrate antes del 1 de septiembre
                        y consigue tu insignia de Miembro Fundador.
                    </p>
                </div>

                <div className="flex flex-col justify-center gap-6 py-6 sm:flex-row">
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="rounded-full bg-teal/10 p-2">
                            <Dna className="h-5 w-5 text-teal" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-medium">Genomas literarios</span>
                    </div>
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="rounded-full bg-teal/10 p-2">
                            <Users className="h-5 w-5 text-teal" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-medium">Clubs de lectura</span>
                    </div>
                    <div className="flex items-center gap-3 text-grey/80">
                        <div className="rounded-full bg-teal/10 p-2">
                            <Sparkles className="h-5 w-5 text-teal" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-medium">Guías de discusión</span>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link
                        href="/register?source=explorar"
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-coral px-8 font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852]"
                    >
                        Empezar
                    </Link>
                    <Link
                        href="/planes"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-teal/30 px-8 font-semibold text-teal transition-all hover:bg-teal/5"
                    >
                        Ver planes
                    </Link>
                </div>
            </div>
        </section>
    );
}

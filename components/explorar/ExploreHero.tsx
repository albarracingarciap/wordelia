import Link from "next/link";

export function ExploreHero() {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-teal-dark p-8 shadow-xl md:p-12">
            <div className="relative z-10 max-w-2xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cream">
                    Explorar
                </p>
                <h1 className="mb-4 text-3xl font-serif md:text-4xl lg:text-5xl">
                    <span className="text-white drop-shadow-md">Descubre libros por cómo te harán sentir,</span>{" "}
                    <span className="italic font-bold text-cream drop-shadow-md">no solo por género</span>
                </h1>

                <p className="mb-6 text-base leading-relaxed text-white md:text-lg">
                    En Wordelia agrupamos los libros por la{" "}
                    <strong className="font-bold text-cream">experiencia de lectura</strong> que ofrecen.
                    ¿Buscas tensión narrativa? ¿Universos complejos? ¿Prosa poética? Te mostramos qué esperar
                    antes de empezar.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                        href="/register?source=explorar"
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-cream px-8 font-semibold text-teal-dark shadow-lg transition-all hover:bg-white hover:shadow-xl"
                    >
                        Empezar
                    </Link>
                    <Link
                        href="/genomas"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-white bg-transparent px-8 font-semibold text-white transition-all hover:bg-white hover:text-teal-dark"
                    >
                        Ver los genomas literarios
                    </Link>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            </div>

            {/* Decorative book spines */}
            <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-64 opacity-20 lg:block">
                <div className="absolute bottom-8 right-4 h-48 w-12 rotate-12 transform rounded-sm bg-white/30" />
                <div className="absolute bottom-16 right-20 h-56 w-12 -rotate-6 transform rounded-sm bg-white/30" />
                <div className="absolute bottom-20 right-36 h-44 w-12 rotate-3 transform rounded-sm bg-white/30" />
            </div>
        </section>
    );
}

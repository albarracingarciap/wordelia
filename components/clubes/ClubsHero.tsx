import Link from "next/link";

export function ClubsHero() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-teal-dark p-8 shadow-xl md:p-12 lg:p-16">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-teal-dark/30 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cream">
                    Wordelia Originals
                </p>
                <h1 className="mb-6 text-4xl !text-white drop-shadow-lg md:text-5xl lg:text-6xl">
                    Clubs de lectura guiados
                </h1>
                <p className="mb-8 text-base leading-relaxed text-cream/90 md:text-lg">
                    Clubs oficiales con guías de discusión por checkpoints, conversaciones sin spoilers
                    y registro de emociones. Wordelia se lanza al público el 2 de agosto.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                        href="/register?source=clubes"
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-cream px-8 font-semibold text-teal-dark shadow-lg transition-all hover:bg-white hover:shadow-xl"
                    >
                        Empezar
                    </Link>
                    <Link
                        href="/demo-adn"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-white bg-transparent px-8 font-semibold text-white transition-all hover:bg-white hover:text-teal-dark"
                    >
                        Ver un genoma literario
                    </Link>
                </div>
            </div>
        </div>
    );
}

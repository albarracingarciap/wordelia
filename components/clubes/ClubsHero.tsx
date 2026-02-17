import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function ClubsHero() {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-teal to-teal-dark rounded-3xl shadow-2xl mb-12 p-8 md:p-12 lg:p-16">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-dark/30 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 max-w-3xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 drop-shadow-lg">
                    Clubes Wordelia Originals
                </h1>
                <p className="text-lg md:text-xl text-cream font-bold mb-2">
                    Clubs de lectura curados por expertos
                </p>
                <p className="text-base md:text-lg text-cream/90 mb-8 leading-relaxed">
                    Únete a nuestros clubs oficiales con guías de discusión profesionales, mapas emocionales detallados y calendario estructurado. Todos los clubs comienzan el <span className="font-bold text-white">15 de marzo de 2026</span>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/register">
                        <Button
                            style={{ color: '#234A4E' }}
                            className="bg-cream hover:bg-white border-none font-bold shadow-lg hover:shadow-xl transition-all text-base"
                        >
                            Únete ahora
                        </Button>
                    </Link>
                    <Link href="/app/adn">
                        <Button
                            variant="outline"
                            className="border-2 border-white !text-white bg-transparent hover:bg-white hover:!text-teal-dark font-semibold transition-all"
                        >
                            Demo ADN literario
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

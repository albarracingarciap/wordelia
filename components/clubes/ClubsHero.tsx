import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function ClubsHero() {
    return (
        <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-teal-dark p-8 shadow-2xl md:p-12 lg:p-16">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-teal-dark/30 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
                <h1 className="mb-6 text-4xl !text-white drop-shadow-lg md:text-5xl lg:text-6xl">
                    Clubs Wordelia Originals
                </h1>
                <p className="mb-2 text-lg font-bold text-cream md:text-xl">
                    Clubs de lectura curados por expertos
                </p>
                <p className="mb-8 text-base leading-relaxed text-cream/90 md:text-lg">
                    Únete a nuestros clubs oficiales con guías de discusión profesionales, mapas emocionales
                    detallados y calendario estructurado. Todos los clubs comienzas en las próximas semanas.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Link href="/register">
                        <Button
                            style={{ color: "#234A4E" }}
                            className="border-none bg-cream text-base font-bold shadow-lg transition-all hover:bg-white hover:shadow-xl"
                        >
                            Únete ahora
                        </Button>
                    </Link>
                    <Link href="/app/adn">
                        <Button
                            variant="outline"
                            className="border-2 border-white bg-transparent font-semibold !text-white transition-all hover:bg-white hover:!text-teal-dark"
                        >
                            Demo ADN literario
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

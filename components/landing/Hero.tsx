import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Sparkles, Users } from "lucide-react";
import { Section } from "../ui/Section";

const BETA_TOTAL_SPOTS = 200;

type HeroProps = {
    founderCount?: number;
};

export function Hero({ founderCount = 38 }: HeroProps) {
    const reservedSpots = Math.min(Math.max(founderCount, 0), BETA_TOTAL_SPOTS);
    const availableSpots = Math.max(BETA_TOTAL_SPOTS - reservedSpots, 0);
    const percentage = Math.min((reservedSpots / BETA_TOTAL_SPOTS) * 100, 100);

    return (
        <Section
            className="min-h-[calc(100svh-68px)] overflow-hidden bg-[#D8E2DC] pt-24 pb-12 md:min-h-[calc(100svh-72px)] md:pt-32 md:pb-20"
            containerClassName="relative"
        >
            <div className="pointer-events-none absolute bottom-16 right-0 top-24 hidden w-[46%] opacity-95 lg:block xl:right-6 xl:w-[43%]">
                <Image
                    src="/assets/images/hero_background.png"
                    alt=""
                    fill
                    className="object-contain"
                    priority
                    sizes="55vw"
                />
            </div>

            <div className="relative z-10 max-w-[690px] space-y-7 md:space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-coral/20">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Acceso anticipado beta
                </div>

                <div className="space-y-5">
                    <h1 className="max-w-[760px] text-[clamp(2.7rem,10vw,5.8rem)] leading-[0.98] text-teal tracking-normal">
                        Acceso anticipado a Wordelia
                    </h1>
                    <p className="max-w-xl text-base leading-relaxed text-grey md:text-lg">
                        Entra en la primera beta de Wordelia y ayuda a dar forma a una experiencia para leer sin prisa,
                        guardar lo que te mueve y compartir libros con clubs cuidados.
                    </p>
                </div>

                <div className="grid max-w-xl gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/50 bg-white/55 p-4 shadow-sm backdrop-blur-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-dark">
                            <Users className="h-4 w-4" aria-hidden="true" />
                            Plazas
                        </div>
                        <p className="text-2xl font-bold text-teal-dark">{availableSpots}</p>
                        <p className="text-xs text-grey/70">de {BETA_TOTAL_SPOTS} disponibles</p>
                    </div>
                    <div className="rounded-2xl border border-white/50 bg-white/55 p-4 shadow-sm backdrop-blur-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-dark">
                            <CalendarDays className="h-4 w-4" aria-hidden="true" />
                            Beta
                        </div>
                        <p className="text-lg font-bold text-teal-dark">10 jun</p>
                        <p className="text-xs text-grey/70">30 días de prueba</p>
                    </div>
                    <div className="rounded-2xl border border-white/50 bg-white/55 p-4 shadow-sm backdrop-blur-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-dark">
                            <CalendarDays className="h-4 w-4" aria-hidden="true" />
                            Lanzamiento
                        </div>
                        <p className="text-lg font-bold text-teal-dark">15 jul</p>
                        <p className="text-xs text-grey/70">apertura pública</p>
                    </div>
                </div>

                <div className="max-w-xl rounded-2xl border border-teal/10 bg-white/45 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-teal-dark">
                        <span>Lectores fundadores</span>
                        <span>{reservedSpots} / {BETA_TOTAL_SPOTS}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-teal/10">
                        <div
                            className="h-full rounded-full bg-coral transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-teal-dark">
                        <span className="rounded-full bg-white/70 px-3 py-1">Insignia fundador</span>
                        <span className="rounded-full bg-white/70 px-3 py-1">Prioridad en novedades</span>
                        <span className="rounded-full bg-white/70 px-3 py-1">Voz en el producto</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <Link
                        href="/register?source=beta"
                        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-coral px-8 text-lg font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852] hover:shadow-md"
                    >
                        Solicitar acceso anticipado
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <Link
                        href="#ia-literaria"
                        className="inline-flex h-14 items-center justify-center rounded-2xl border border-coral px-8 text-lg font-semibold text-coral transition-all hover:bg-white/50"
                    >
                        Ver cómo funciona
                    </Link>
                </div>
            </div>

            <div className="relative mx-auto mt-10 aspect-[5/4] w-full max-w-[420px] lg:hidden">
                <Image
                    src="/assets/images/hero_background.png"
                    alt="Lectores disfrutando de Wordelia"
                    fill
                    className="object-contain"
                    priority
                    sizes="90vw"
                />
            </div>
        </Section>
    );
}

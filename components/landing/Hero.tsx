import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Section } from "../ui/Section";

const BETA_TOTAL_SPOTS = 200;

type HeroProps = {
    founderCount?: number;
};

export function Hero({ founderCount = 38 }: HeroProps) {
    const reservedSpots = Math.min(Math.max(founderCount, 0), BETA_TOTAL_SPOTS);
    const availableSpots = Math.max(BETA_TOTAL_SPOTS - reservedSpots, 0);

    return (
        <Section
            className="overflow-hidden bg-[#D8E2DC] pt-24 pb-8 md:pt-28 md:pb-10"
            containerClassName="relative"
        >
            <div className="space-y-8 md:space-y-10">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)] lg:items-start xl:gap-16">
                    <div className="relative z-10 max-w-[720px] space-y-7 md:space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-coral/20">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Lecturas elegidas por experiencia
                        </div>

                        <h1 className="wordelia-handwritten max-w-[720px] text-[clamp(3.3rem,6vw,5.2rem)] leading-[1.02] text-teal tracking-normal">
                            Donde las palabras importan... y donde cada historia merece su tiempo
                        </h1>
                    </div>

                    <div className="relative mx-auto aspect-[5/4] w-full max-w-[460px] lg:mt-20 lg:max-w-none xl:mt-16">
                        <Image
                            src="/assets/images/hero_background.png"
                            alt="Lectores disfrutando de Wordelia"
                            fill
                            className="object-contain"
                            priority
                            sizes="(min-width: 1024px) 38vw, 90vw"
                        />
                    </div>
                </div>

                <p className="mx-auto max-w-5xl text-center font-serif text-lg leading-relaxed text-grey md:text-xl">
                    En Wordelia estamos reimaginando el placer de leer, creando una forma completamente nueva de
                    descubrir, compartir y profundizar en la literatura.
                </p>

                <div className="mx-auto max-w-2xl space-y-5 text-center md:space-y-6">
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="#planes"
                            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-coral px-8 text-lg font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852] hover:shadow-md"
                        >
                            Empezar
                        </Link>
                        <Link
                            href="#para-ti"
                            className="inline-flex h-14 items-center justify-center rounded-2xl border border-coral px-8 text-lg font-semibold text-coral transition-all hover:bg-white/50"
                        >
                            Ver cómo funciona
                        </Link>
                    </div>

                    <p className="text-sm font-medium text-teal-dark">
                        {availableSpots} plazas disponibles para lectores fundadores.
                    </p>
                </div>
            </div>
        </Section>
    );
}

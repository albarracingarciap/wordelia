import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarClock, Sparkles } from "lucide-react";
import { discussionGuides } from "@/lib/guides";
import { Section } from "../ui/Section";

export function GuidesSection() {
    const freeGuide = discussionGuides.find((guide) => guide.isFree) || discussionGuides[0];
    const paidGuides = discussionGuides.filter((guide) => !guide.isFree).slice(0, 3);

    return (
        <Section id="guias" className="bg-cream pb-8 pt-16 md:pb-10 md:pt-24">
            <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center md:mb-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Guías de discusión y Genoma literario premium</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Material listo para llevar una lectura a conversación
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Preguntas, checkpoints, contexto y mapas emocionales para clubs, aulas y lectores que quieren
                    ir más allá de “me ha gustado”.
                </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="overflow-hidden rounded-3xl border border-teal/10 bg-offwhite shadow-sm">
                    <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                        <div className="bg-[#D8E2DC] p-6">
                            <div className="relative mx-auto aspect-[2/3] w-36 overflow-hidden rounded-2xl shadow-lg md:w-full">
                                <Image
                                    src={freeGuide.cover}
                                    alt={`Portada de ${freeGuide.bookTitle}`}
                                    fill
                                    className="object-cover"
                                    sizes="(min-width: 768px) 190px, 144px"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
                            <div className="space-y-4">
                                <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                    {freeGuide.badge}
                                </span>
                                <div>
                                    <h3 className="text-3xl leading-tight text-teal">{freeGuide.bookTitle}</h3>
                                    <p className="mt-1 text-sm font-semibold text-grey">{freeGuide.author}</p>
                                </div>
                                <p className="text-sm leading-relaxed text-grey md:text-base">
                                    {freeGuide.description}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-white px-3 py-1.5 text-coral">{freeGuide.priceLabel}</span>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Link
                                    href="/demo-guia"
                                    className="inline-flex h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-coral px-5 font-semibold text-white transition-colors hover:bg-[#C25852]"
                                >
                                    Muestra gratuita
                                </Link>
                                <Link
                                    href="/guias"
                                    className="inline-flex h-12 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-teal/30 px-5 font-semibold text-teal transition-colors hover:bg-teal hover:text-white"
                                >
                                    Ver todas las guías
                                </Link>
                            </div>
                        </div>
                    </div>
                </article>

                <div className="grid gap-4">
                    <div className="rounded-3xl border border-teal/10 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <BookOpenCheck className="h-5 w-5 text-teal" aria-hidden="true" />
                            <h3 className="text-2xl font-semibold text-teal">Guías individuales</h3>
                        </div>
                        <div className="space-y-3">
                            {paidGuides.map((guide) => (
                                <Link
                                    key={guide.slug}
                                    href={`/guias#${guide.slug}`}
                                    className="group flex items-center justify-between gap-4 rounded-2xl bg-cream p-3 transition-colors hover:bg-[#D8E2DC]"
                                >
                                    <div>
                                        <p className="font-semibold text-teal-dark">{guide.bookTitle}</p>
                                        <p className="text-sm text-grey">{guide.sessions} · {guide.priceLabel}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-teal/10 bg-teal p-5 text-white shadow-sm">
                        <h3 className="text-2xl font-semibold !text-white">Compra desde tu cuenta</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/85">
                            Las guías y genomas se consultan dentro de Wordelia. Crea tu cuenta gratis, prueba la
                            muestra y desbloquea el catálogo completo cuando quieras.
                        </p>
                        <div className="mt-4 flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-white/90">Desde 6,99 € por título</p>
                            <Link
                                href="/register?source=guias-landing"
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-coral px-4 text-sm font-semibold text-white transition-colors hover:bg-[#C25852]"
                            >
                                Crear cuenta
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-col items-start gap-4 rounded-3xl border border-teal/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-5 md:mt-6 md:p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                    <CalendarClock className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Novedades cada mes</p>
                    <h3 className="mt-1 text-xl font-semibold text-teal">El catálogo crece mes a mes</h3>
                    <p className="mt-1 text-sm leading-relaxed text-grey">
                        Cada mes añadimos nuevas guías de discusión y genomas literarios. En los planes Voraz
                        o Bibliófilo, las novedades están incluidas.
                    </p>
                </div>
            </div>

        </Section>
    );
}

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, CheckCircle2, Layers, Sparkles } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { discussionGuides, getGuidesBySlug, guidePacks } from "@/lib/guides";

export const metadata: Metadata = {
    title: "Guías de discusión | Wordelia",
    description: "Guías de discusión Wordelia para clubs de lectura, aulas y lectores que quieren profundizar en cada obra.",
};

export default function GuidesPage() {
    const freeGuide = discussionGuides.find((guide) => guide.isFree) || discussionGuides[0];
    const paidGuides = discussionGuides.filter((guide) => !guide.isFree);

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <div className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-8 md:pt-32">
                <section className="mb-12 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Guías Wordelia</p>
                    <h1 className="mx-auto mt-4 max-w-4xl text-4xl leading-tight text-teal md:text-6xl">
                        Guías de discusión para clubs que quieren ir más allá
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-grey">
                        Preguntas por checkpoints, contexto, mapas emocionales y dinámicas para convertir una
                        lectura compartida en una conversación memorable.
                    </p>
                </section>

                <section className="mb-14 overflow-hidden rounded-3xl border border-teal/10 bg-offwhite shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
                        <div className="bg-[#D8E2DC] p-8">
                            <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-2xl shadow-xl lg:w-full">
                                <Image
                                    src={freeGuide.cover}
                                    alt={`Portada de ${freeGuide.bookTitle}`}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(min-width: 1024px) 260px, 192px"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-between gap-7 p-7 md:p-10">
                            <div className="space-y-5">
                                <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                    Gratis con registro
                                </span>
                                <div>
                                    <h2 className="text-3xl leading-tight text-teal md:text-5xl">{freeGuide.title}</h2>
                                    <p className="mt-2 text-grey">{freeGuide.author}</p>
                                </div>
                                <p className="max-w-3xl text-base leading-relaxed text-grey md:text-lg">
                                    {freeGuide.description}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {[
                                        `${freeGuide.checkpoints} checkpoints`,
                                        freeGuide.sessions,
                                        freeGuide.level,
                                    ].map((item) => (
                                        <div key={item} className="rounded-2xl bg-white p-4 text-center">
                                            <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-teal" aria-hidden="true" />
                                            <p className="text-sm font-semibold text-teal-dark">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/register?source=free-guide&guide=el-cuento-de-la-criada"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                                >
                                    Conseguir guía gratuita
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                                {freeGuide.pdfUrl && (
                                    <Link
                                        href={freeGuide.pdfUrl}
                                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-coral px-6 font-semibold text-coral transition-colors hover:bg-coral/10"
                                    >
                                        Ver muestra PDF
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="packs" className="mb-14">
                    <div className="mb-6 flex items-center gap-3">
                        <Layers className="h-6 w-6 text-coral" aria-hidden="true" />
                        <h2 className="text-3xl text-teal">Packs de guías</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        {guidePacks.map((pack) => {
                            const packGuides = getGuidesBySlug(pack.guideSlugs);

                            return (
                                <article key={pack.slug} className="rounded-3xl border border-teal/10 bg-white p-6 shadow-sm">
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">{pack.tone}</p>
                                            <h3 className="mt-2 text-2xl font-semibold text-teal">{pack.title}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-teal-dark">{pack.priceLabel}</p>
                                            <p className="text-xs text-coral">{pack.savingsLabel}</p>
                                        </div>
                                    </div>
                                    <p className="mb-5 text-sm leading-relaxed text-grey">{pack.description}</p>
                                    <div className="mb-6 flex -space-x-3">
                                        {packGuides.map((guide) => (
                                            <div key={guide.slug} className="relative h-20 w-14 overflow-hidden rounded-lg border-2 border-white shadow-sm">
                                                <Image
                                                    src={guide.cover}
                                                    alt={guide.bookTitle}
                                                    fill
                                                    className="object-cover"
                                                    sizes="56px"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <Link
                                        href={`/register?source=guide-pack&pack=${pack.slug}`}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-teal px-5 font-semibold text-white transition-colors hover:bg-teal-dark"
                                    >
                                        Comprar pack
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <div className="mb-6 flex items-center gap-3">
                        <BookOpenCheck className="h-6 w-6 text-coral" aria-hidden="true" />
                        <h2 className="text-3xl text-teal">Guías individuales</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        {paidGuides.map((guide) => (
                            <article
                                key={guide.slug}
                                id={guide.slug}
                                className="flex h-full flex-col rounded-3xl border border-teal/10 bg-offwhite p-5 shadow-sm"
                            >
                                <div className="relative mb-5 aspect-[2/3] w-full overflow-hidden rounded-2xl bg-grey/10 shadow-sm">
                                    <Image
                                        src={guide.cover}
                                        alt={`Portada de ${guide.bookTitle}`}
                                        fill
                                        className="object-cover"
                                        sizes="(min-width: 768px) 30vw, 90vw"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">{guide.badge}</p>
                                    <h3 className="mt-2 text-2xl font-semibold text-teal">{guide.bookTitle}</h3>
                                    <p className="mt-1 text-sm text-grey">{guide.author}</p>
                                    <p className="mt-4 text-sm leading-relaxed text-grey">{guide.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {guide.themes.map((theme) => (
                                            <span key={theme} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal">
                                                {theme}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-semibold text-grey">
                                        <span>{guide.sessions}</span>
                                        <span>{guide.checkpoints} checkpoints</span>
                                        <span>{guide.level}</span>
                                        <span className="text-coral">{guide.priceLabel}</span>
                                    </div>
                                    <Link
                                        href={`/register?source=guide&guide=${guide.slug}`}
                                        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-coral px-5 font-semibold text-white transition-colors hover:bg-[#C25852]"
                                    >
                                        Comprar guía
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    );
}

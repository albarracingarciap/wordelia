import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, LockKeyhole, Route, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { ResourceRegisterWall } from "@/components/landing/ResourceRegisterWall";
import { createClient } from "@/utils/supabase/server";
import { DemoGuiaClient } from "./DemoGuiaClient";
import { demoDiscussionGuide, type DiscussionGuide } from "./guide-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Demo guía de discusión | Wordelia",
    description:
        "Demo dinámica de una guía de discusión Wordelia para clubs de lectura, construida desde JSON.",
};

function GuideTeaser({ guide }: { guide: DiscussionGuide }) {
    const firstRoute = guide.mapa_discusion_rutas[0];

    return (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 md:px-8">
            <div className="mb-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-teal/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-coral" aria-hidden="true" />
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Duración sugerida</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-teal-dark">{guide.como_usar_guia.duracion_sugerida}</p>
                    <p className="mt-1 text-sm text-grey">{guide.como_usar_guia.formato}</p>
                </div>
                <div className="rounded-xl border border-teal/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Route className="h-5 w-5 text-coral" aria-hidden="true" />
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Rutas</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-teal-dark">{guide.mapa_discusion_rutas.length} ejes</p>
                    <p className="mt-1 text-sm text-grey">Mapa de conversación</p>
                </div>
                <div className="rounded-xl border border-teal/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-coral" aria-hidden="true" />
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Personajes</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-teal-dark">{guide.personajes_tarjetas.length} tarjetas</p>
                    <p className="mt-1 text-sm text-grey">Análisis listo para debate</p>
                </div>
            </div>

            {firstRoute && (
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Mapa de discusión · muestra</p>
                    <h2 className="mt-2 text-3xl leading-tight text-teal md:text-4xl">
                        Una de las {guide.mapa_discusion_rutas.length} rutas de conversación
                    </h2>
                    <div className="mt-6 overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm md:p-7">
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-teal text-lg font-bold text-white">
                                {firstRoute.eje_numero}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-2xl font-semibold leading-tight text-teal">{firstRoute.titulo}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-grey md:text-base">{firstRoute.linea_conceptual}</p>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {firstRoute.preguntas_analiticas.map((pregunta, index) => (
                                        <div key={`teaser-pregunta-${index}`} className="border-l-2 border-coral bg-offwhite px-4 py-3 text-sm leading-relaxed text-grey">
                                            {pregunta}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default async function DemoGuiaPage() {
    const guide = demoDiscussionGuide;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = Boolean(user);

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <section className="relative overflow-hidden pt-28 md:pt-32">
                <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,#FBF7F1_0%,#FFFAEF_100%)]" />
                <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 md:px-8">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </Link>
                    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
                        <div className="pb-4">
                            <div className="mb-5 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 bg-teal px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                                    <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    Guía demo
                                </span>
                                <span className="inline-flex items-center gap-2 border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-coral">
                                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                                    Recurso premium
                                </span>
                            </div>

                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">
                                {guide.metadata.marca} · Guía de discusión
                            </p>
                            <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] text-teal md:text-7xl">
                                {guide.cabecera.titulo_libro}
                            </h1>
                            <p className="mt-4 text-xl font-medium text-teal-dark">
                                {guide.cabecera.autor} · {guide.cabecera.ano_publicacion}
                            </p>
                            <p className="mt-5 max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                                Una guía preparada para moderar una conversación literaria exigente, con rutas,
                                preguntas, actividades y notas de apoyo organizadas en pestañas.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm md:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-coral" aria-hidden="true" />
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Idea central</p>
                            </div>
                            <blockquote className="border-l-4 border-coral pl-5 text-lg leading-relaxed text-teal-dark">
                                {guide.cabecera.idea_central_apertura.replace(/^>\s?/, "")}
                            </blockquote>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {guide.cabecera.conceptos_clave.map((concept) => (
                                    <span key={concept} className="bg-offwhite px-3 py-1.5 text-sm font-semibold text-teal">
                                        {concept}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {isAuthenticated ? (
                <DemoGuiaClient guide={guide} />
            ) : (
                <>
                    <GuideTeaser guide={guide} />
                    <ResourceRegisterWall kind="guide" bookTitle={guide.cabecera.titulo_libro} />
                </>
            )}

            <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:px-8">
                <div className="overflow-hidden rounded-3xl border border-teal/10 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">
                                Catálogo Wordelia
                            </p>
                            <h2 className="mt-2 text-3xl leading-tight text-teal md:text-4xl">
                                Descubre todas las guías disponibles
                            </h2>
                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-grey">
                                Explora el catálogo de guías de discusión y selecciona las lecturas que quieres
                                preparar para tu club.
                            </p>
                        </div>
                        <Link
                            href="/guias"
                            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                        >
                            Ver catálogo de guías
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Dna, LockKeyhole } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { ResourceRegisterWall } from "@/components/landing/ResourceRegisterWall";
import { createClient } from "@/utils/supabase/server";
import { DemoAdnClient } from "./DemoAdnClient";
import { chromosomeTabs, demoChromosomes } from "./adn-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Demo ADN literario | Wordelia",
    description:
        "Demo dinámica del Genoma literario Wordelia, construida desde cromosomas literarios en JSON.",
};

type TeaserChromosome = {
    nombre?: string;
    libro?: { titulo?: string; autor?: string; año?: number | null };
    visualizacion?: {
        descripcion_corta?: string;
        puntuacion_global?: number;
        caracteristicas_destacadas?: string[];
    };
};

function GenomeTeaser() {
    const previewKeys = chromosomeTabs.slice(0, 3);
    const firstChromosome = demoChromosomes.narrative_structure as TeaserChromosome;
    const book = firstChromosome.libro || {};

    return (
        <section className="relative overflow-hidden pt-8 md:pt-10">
            <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,#FBF7F1_0%,#FFFAEF_100%)]" />
            <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 md:px-8">
                <div className="mb-10 max-w-3xl">
                    <div className="mb-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 bg-teal px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                            <Dna className="h-3.5 w-3.5" aria-hidden="true" />
                            ADN demo
                        </span>
                        <span className="inline-flex items-center gap-2 border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-coral">
                            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                            Recurso premium
                        </span>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Wordelia · Genoma literario</p>
                    <h1 className="mt-4 text-5xl leading-[0.95] text-teal md:text-7xl">{book.titulo || "Genoma literario"}</h1>
                    <p className="mt-4 text-xl font-medium text-teal-dark">
                        {book.autor || "Autor desconocido"}{book.año ? ` · ${book.año}` : ""}
                    </p>
                    <p className="mt-5 text-base leading-relaxed text-grey md:text-lg">
                        Un vistazo a 3 de los 8 cromosomas literarios que componen el genoma de esta obra. Regístrate
                        para explorarlos todos al detalle.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {previewKeys.map((tab, index) => {
                        const data = demoChromosomes[tab.key] as TeaserChromosome;
                        const visual = data.visualizacion || {};

                        return (
                            <article key={tab.key} className="flex h-full flex-col overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-teal text-sm font-bold text-white">
                                        {index + 1}
                                    </span>
                                    {typeof visual.puntuacion_global === "number" && (
                                        <span className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral">
                                            {visual.puntuacion_global}/10
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-semibold leading-tight text-teal">{data.nombre || tab.label}</h2>
                                <p className="mt-3 text-sm leading-relaxed text-grey">{visual.descripcion_corta}</p>
                                {visual.caracteristicas_destacadas && visual.caracteristicas_destacadas.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {visual.caracteristicas_destacadas.slice(0, 3).map((item) => (
                                            <span key={item} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-teal">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default async function DemoAdnPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = Boolean(user);

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 md:px-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Volver
                </Link>
            </div>

            {isAuthenticated ? (
                <DemoAdnClient />
            ) : (
                <>
                    <GenomeTeaser />
                    <ResourceRegisterWall kind="genome" bookTitle="El túnel" />
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
                                Explora los genomas literarios premium disponibles
                            </h2>
                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-grey">
                                Consulta el catálogo de obras con genoma literario y análisis premium
                            </p>
                        </div>
                        <Link
                            href="/genomas"
                            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                        >
                            Ver catálogo
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

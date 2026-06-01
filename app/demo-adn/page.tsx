import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { DemoAdnClient } from "./DemoAdnClient";

export const metadata: Metadata = {
    title: "Demo ADN literario | Wordelia",
    description:
        "Demo dinámica del Genoma literario Wordelia, construida desde cromosomas literarios en JSON.",
};

export default function DemoAdnPage() {
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

            <DemoAdnClient />

            <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:px-8">
                <div className="overflow-hidden rounded-3xl border border-teal/10 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">
                                Catálogo Wordelia
                            </p>
                            <h2 className="mt-2 text-3xl leading-tight text-teal md:text-4xl">
                                Explora las guías y recursos premium disponibles
                            </h2>
                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-grey">
                                Consulta el catálogo de obras con guías de discusión y análisis literario premium
                            </p>
                        </div>
                        <Link
                            href="/guias"
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

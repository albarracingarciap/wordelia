import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LibreriaCard } from "@/components/librerias/LibreriaCard";
import { getOrganizations } from "@/app/app/librerias/actions";

export const metadata: Metadata = {
    title: "Librerías | Wordelia — Clubs de lectura en tu librería",
    description:
        "Descubre librerías que organizan clubs de lectura con Wordelia: guías de discusión, genomas literarios y encuentros en tienda.",
};

export const dynamic = "force-dynamic";

export default async function LibreriasPage() {
    const organizations = await getOrganizations();

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar mode="public" />

            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-6 pb-16 pt-6 md:px-10">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </Link>

                    <section className="mb-10 text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Librerías Wordelia</p>
                        <h1 className="mx-auto mt-4 max-w-3xl text-4xl leading-tight text-teal md:text-5xl">
                            Clubs de lectura en tu librería de barrio
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                            Librerías que organizan clubs de lectura con Wordelia: guías de discusión, genomas literarios
                            y encuentros en tienda.
                        </p>
                    </section>

                    {organizations.length > 0 ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {organizations.map((org) => (
                                <LibreriaCard key={org.id} organization={org} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/40">
                                <Store className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <p className="text-grey/70">Aún no hay librerías publicadas.</p>
                            <Link href="/app/librerias" className="mt-4 inline-flex text-sm font-semibold text-teal hover:text-coral">
                                ¿Tienes una librería? Regístrala aquí
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

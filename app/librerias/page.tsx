import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getOrganizations } from "@/app/app/librerias/actions";
import { SITE_URL } from "@/lib/site";
import { LibrariesSearch } from "./LibrariesSearch";

export const metadata: Metadata = {
    title: "Librerías | Wordelia — Clubs de lectura en tu librería",
    description:
        "Descubre librerías que organizan clubs de lectura con Wordelia: guías de discusión, genomas literarios y encuentros en tienda.",
    alternates: { canonical: `${SITE_URL}/librerias` },
    openGraph: {
        title: "Librerías independientes en Wordelia",
        description:
            "Descubre librerías de barrio que organizan clubs de lectura con Wordelia: guías, genomas y encuentros en tienda.",
        url: `${SITE_URL}/librerias`,
        siteName: "Wordelia",
        type: "website",
    },
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

                    <LibrariesSearch initialOrganizations={organizations} />
                </div>
            </main>

            <Footer />
        </div>
    );
}

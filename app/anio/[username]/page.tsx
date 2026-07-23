import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download, Instagram } from "lucide-react";
import { fetchSharedWrapped } from "@/lib/shared-wrapped";
import { WrappedCard } from "@/components/wrapped/WrappedCard";

export const dynamic = "force-dynamic";

function resolveYear(raw?: string): number {
    const now = new Date().getFullYear();
    const y = raw ? parseInt(raw, 10) : now;
    return Number.isFinite(y) && y >= 2000 && y <= now ? y : now;
}

export async function generateMetadata(
    { params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ year?: string }> },
): Promise<Metadata> {
    const { username } = await params;
    const year = resolveYear((await searchParams).year);
    const w = await fetchSharedWrapped(username, year);
    if (!w) return { title: "Tu año en lectura — Wordelia" };

    const title = `Tu año en lectura ${w.year} — Wordelia`;
    const description = `${w.booksRead} libros, ${w.pages} páginas y ${w.hours}h de lectura en ${w.year}.`;
    return {
        title,
        description,
        openGraph: { title, description, type: "article" },
        twitter: { card: "summary_large_image", title, description },
    };
}

function narrative(w: Awaited<ReturnType<typeof fetchSharedWrapped>>): string {
    if (!w) return "";
    if (w.booksRead >= 40) return "Un año de lectura extraordinario. Los libros han sido tu hogar.";
    if (w.booksRead >= 20) return "Un año de gran constancia lectora. Enhorabuena.";
    if (w.booksRead >= 5) return "Un año con buenas lecturas y momentos para ti.";
    return "Cada libro cuenta. Este ha sido tu año lector.";
}

export default async function WrappedPage(
    { params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ year?: string }> },
) {
    const { username } = await params;
    const year = resolveYear((await searchParams).year);
    const w = await fetchSharedWrapped(username, year);

    if (!w) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
                <p className="font-serif text-2xl text-teal-dark">Este resumen no está disponible</p>
                <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark">
                    Descubre Wordelia <ArrowRight className="h-4 w-4" />
                </Link>
            </main>
        );
    }

    const q = `?year=${w.year}`;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-cream to-[#E7EFE9] px-4 py-12">
            <WrappedCard wrapped={w} />

            <div className="flex flex-col items-center gap-4 text-center">
                <p className="max-w-md font-serif text-lg italic text-teal-dark">{narrative(w)}</p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    <a href={`/anio/${username}/image${q}`} download="mi-anio-wordelia.png" className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5">
                        <Download className="h-4 w-4" /> Descargar imagen
                    </a>
                    <a href={`/anio/${username}/image${q}&format=square`} download="mi-anio-wordelia-instagram.png" className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5">
                        <Instagram className="h-4 w-4" /> Para Instagram
                    </a>
                </div>

                <p className="text-sm text-grey/70">Sigue tus lecturas, descubre libros en profundidad y celebra tu año.</p>
                <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-dark">
                    Descubre Wordelia <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </main>
    );
}

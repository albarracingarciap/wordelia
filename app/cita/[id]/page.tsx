import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download, Instagram } from "lucide-react";
import { fetchSharedQuote } from "@/lib/shared-quote";
import { SharedQuoteCard } from "@/components/quotes/SharedQuoteCard";
import { SaveButton } from "@/components/social/SaveButton";

export const dynamic = "force-dynamic";

function excerpt(text: string, max = 160) {
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const quote = await fetchSharedQuote(id);
    if (!quote) return { title: "Cita — Wordelia" };

    const title = quote.book.title ? `Una cita de «${quote.book.title}» — Wordelia` : "Una cita — Wordelia";
    const description = excerpt(quote.content);
    return {
        title,
        description,
        openGraph: { title, description, type: "article" },
        twitter: { card: "summary_large_image", title, description },
    };
}

export default async function SharedQuotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const quote = await fetchSharedQuote(id);

    if (!quote) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
                <p className="font-serif text-2xl text-teal-dark">Esta cita ya no está disponible</p>
                <p className="text-grey/70">Puede que se haya eliminado o sea privada.</p>
                <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark">
                    Descubre Wordelia <ArrowRight className="h-4 w-4" />
                </Link>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-cream to-[#E7EFE9] px-4 py-12">
            <SharedQuoteCard quote={quote} />

            <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <a
                        href={`/cita/${id}/image`}
                        download="cita-wordelia.png"
                        className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
                    >
                        <Download className="h-4 w-4" /> Descargar imagen
                    </a>
                    <a
                        href={`/cita/${id}/image?format=square`}
                        download="cita-wordelia-instagram.png"
                        className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
                    >
                        <Instagram className="h-4 w-4" /> Para Instagram
                    </a>
                    <SaveButton itemType="quote" itemId={id} variant="pill" />
                </div>

                <p className="text-sm text-grey/70">Guarda tus citas, sigue tus lecturas y descubre libros en profundidad.</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-dark"
                >
                    Descubre Wordelia <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </main>
    );
}

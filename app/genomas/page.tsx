import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { discussionGuides } from "@/lib/guides";
import { createClient } from "@/utils/supabase/server";
import { GuidesCatalogTable, type CatalogGuide } from "../guias/GuidesCatalogTable";

export const metadata: Metadata = {
    title: "Genomas literarios | Wordelia",
    description:
        "Genoma literario Wordelia: estructura, estilo, emociones, temas y contexto de cada obra en ocho cromosomas.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BookGuideRow = {
    book_id: string;
};

type BookRow = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    first_publication_year: number | null;
};

type SupabaseTableClient = {
    from: (table: string) => {
        select: (columns: string) => {
            order: (
                column: string,
                options: { ascending: boolean }
            ) => Promise<{ data: BookGuideRow[] | BookRow[] | null; error: { message: string } | null }>;
            in: (
                column: string,
                values: string[]
            ) => {
                order: (
                    column: string,
                    options: { ascending: boolean }
                ) => Promise<{ data: BookRow[] | null; error: { message: string } | null }>;
            };
        };
    };
};

async function getCatalogBooks(): Promise<CatalogGuide[]> {
    const supabase = (await createClient()) as unknown as SupabaseTableClient;

    const { data: guideRows, error: guideError } = await supabase
        .from("book_guides")
        .select("book_id")
        .order("book_id", { ascending: true });

    if (guideError) {
        console.error("[Genomas] Error fetching book guides:", guideError.message);
        return [];
    }

    const bookIds = Array.from(new Set(((guideRows || []) as BookGuideRow[]).map((row) => row.book_id)));

    if (bookIds.length === 0) {
        return [];
    }

    const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id, title, author, genre, first_publication_year")
        .in("id", bookIds)
        .order("title", { ascending: true });

    if (booksError) {
        console.error("[Genomas] Error fetching books for genomes:", booksError.message);
        return [];
    }

    return (books || []).map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        firstPublicationYear: book.first_publication_year,
    }));
}

export default async function GenomasPage() {
    const freeGenome = discussionGuides.find((guide) => guide.isFree) || discussionGuides[0];
    const catalogBooks = await getCatalogBooks();

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <div className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-8 md:pt-32">
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Volver
                </Link>

                <section className="mb-12 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Genomas Wordelia</p>
                    <h1 className="mx-auto mt-4 max-w-4xl text-4xl leading-tight text-teal md:text-6xl">
                        El genoma literario que revela cada obra por dentro
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-grey">
                        Estructura, estilo, emociones, temas, personajes, ritmo, lenguaje y contexto cultural: ocho
                        cromosomas que muestran el ADN de cada libro.
                    </p>
                </section>

                <section className="mb-14 overflow-hidden rounded-3xl border border-teal/10 bg-offwhite shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
                        <div className="bg-[#D8E2DC] p-8">
                            <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-2xl shadow-xl lg:w-full">
                                <Image
                                    src={freeGenome.cover}
                                    alt={`Portada de ${freeGenome.bookTitle}`}
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
                                    Muestra gratuita
                                </span>
                                <div>
                                    <h2 className="text-3xl leading-tight text-teal md:text-5xl">{freeGenome.bookTitle}</h2>
                                    <p className="mt-2 text-grey">{freeGenome.author}</p>
                                </div>
                                <p className="max-w-3xl text-base leading-relaxed text-grey md:text-lg">
                                    Explora el genoma literario de {freeGenome.bookTitle}: estructura narrativa, estilo,
                                    perfil emocional, temas, personajes, ritmo, lenguaje y contexto cultural, analizados
                                    en ocho cromosomas.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {[
                                        "8 cromosomas",
                                        "Perfil emocional y temas",
                                        "Ritmo, estilo y contexto",
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
                                    href="/demo-adn"
                                    className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                                >
                                    Ver muestra gratuita
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <GuidesCatalogTable
                    guides={catalogBooks}
                    title="Genomas individuales"
                    subtitle="Cada genoma desglosa la obra en ocho cromosomas: estructura, estilo, emociones y contexto."
                    iconName="dna"
                    price={6.99}
                    originalPrice={9.99}
                    emptyLabel="Aún no hay genomas individuales disponibles."
                    noun="genomas"
                    sampleHref="/demo-adn"
                    registerSource="genoma-catalogo"
                />
            </div>

            <Footer />
        </main>
    );
}

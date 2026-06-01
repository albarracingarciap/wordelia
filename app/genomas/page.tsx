import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Dna, Sparkles } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
    title: "Genomas literarios | Wordelia",
    description: "Catálogo de obras con análisis literario premium en Wordelia.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 10;

type ChromosomeRow = {
    book_id: string;
};

type BookRow = {
    id: string;
    title: string;
    first_publication_year: number | null;
    genre: string | null;
    author: string | null;
};

type SupabaseTableClient = {
    from: (table: string) => {
        select: (columns: string) => {
            order: (
                column: string,
                options: { ascending: boolean }
            ) => Promise<{ data: ChromosomeRow[] | null; error: { message: string } | null }>;
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

async function getGenomeBooks(): Promise<BookRow[]> {
    const supabase = (await createClient()) as unknown as SupabaseTableClient;

    const { data: chromosomeRows, error: chromosomeError } = await supabase
        .from("book_literary_chromosomes")
        .select("book_id")
        .order("book_id", { ascending: true });

    if (chromosomeError) {
        console.error("[Genomas] Error fetching literary chromosomes:", chromosomeError.message);
        return [];
    }

    const bookIds = Array.from(new Set((chromosomeRows || []).map((row) => row.book_id)));

    if (bookIds.length === 0) {
        return [];
    }

    const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id, title, author, first_publication_year, genre")
        .in("id", bookIds)
        .order("title", { ascending: true });

    if (booksError) {
        console.error("[Genomas] Error fetching books:", booksError.message);
        return [];
    }

    return books || [];
}

type GenomasPageProps = {
    searchParams: Promise<{ page?: string }>;
};

export default async function GenomasPage({ searchParams }: GenomasPageProps) {
    const { page } = await searchParams;
    const books = await getGenomeBooks();
    const totalPages = Math.max(1, Math.ceil(books.length / PAGE_SIZE));
    const parsedPage = Number.parseInt(page || "1", 10);
    const currentPage = Number.isFinite(parsedPage) ? Math.min(Math.max(parsedPage, 1), totalPages) : 1;
    const visibleBooks = books.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <div className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-8 md:pt-32">
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Volver
                </Link>

                <section className="mb-10 overflow-hidden rounded-3xl border border-teal/10 bg-white p-7 shadow-sm md:p-10">
                    <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-coral">
                                <Dna className="h-4 w-4" aria-hidden="true" />
                                Genoma literario
                            </p>
                            <h1 className="mt-4 max-w-4xl text-4xl leading-tight text-teal md:text-6xl">
                                Obras con análisis literario premium
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                                Catálogo de libros que ya tienen asociado análisis de genoma literario en Wordelia.
                            </p>
                        </div>
                        <Link
                            href="/demo-adn"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                        >
                            Ver muestra gratuita
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </section>

                {books.length > 0 ? (
                    <section className="overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-teal/10 bg-offwhite px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-teal">Catálogo de genomas</h2>
                                <p className="mt-1 text-sm text-grey">
                                    {books.length} obra{books.length === 1 ? "" : "s"} disponible{books.length === 1 ? "" : "s"}
                                </p>
                            </div>
                            <p className="text-sm font-semibold text-teal">
                                Página {currentPage} de {totalPages}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-teal/10 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                                        <th className="px-5 py-4">Libro</th>
                                        <th className="px-5 py-4">Autor</th>
                                        <th className="px-5 py-4">Año</th>
                                        <th className="px-5 py-4">Género</th>
                                        <th className="px-5 py-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-teal/10">
                                    {visibleBooks.map((book) => (
                                        <tr key={book.id} className="transition-colors hover:bg-cream/60">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                                                        <Dna className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                    <span className="font-semibold text-teal-dark">{book.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-grey">{book.author || "Autor desconocido"}</td>
                                            <td className="px-5 py-4 text-sm text-grey">{book.first_publication_year || "N/D"}</td>
                                            <td className="px-5 py-4">
                                                {book.genre ? (
                                                    <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{book.genre}</span>
                                                ) : (
                                                    <span className="text-sm text-grey">N/D</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                                                    Disponible
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex flex-col gap-3 border-t border-teal/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-grey">
                                    Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, books.length)} de {books.length}
                                </p>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/genomas?page=${Math.max(1, currentPage - 1)}`}
                                        aria-disabled={currentPage === 1}
                                        className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
                                            currentPage === 1
                                                ? "pointer-events-none border-teal/10 text-grey/40"
                                                : "border-teal/20 text-teal hover:bg-teal hover:text-white"
                                        }`}
                                    >
                                        Anterior
                                    </Link>
                                    <Link
                                        href={`/genomas?page=${Math.min(totalPages, currentPage + 1)}`}
                                        aria-disabled={currentPage === totalPages}
                                        className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
                                            currentPage === totalPages
                                                ? "pointer-events-none border-teal/10 text-grey/40"
                                                : "border-teal/20 text-teal hover:bg-teal hover:text-white"
                                        }`}
                                    >
                                        Siguiente
                                    </Link>
                                </div>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="rounded-3xl border border-teal/10 bg-offwhite p-10 text-center shadow-sm">
                        <Sparkles className="mx-auto mb-4 h-10 w-10 text-coral" aria-hidden="true" />
                        <h2 className="text-3xl text-teal">Aún no hay genomas publicados</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-grey">
                            Cuando un libro exista en `book_literary_chromosomes`, aparecerá aquí automáticamente.
                        </p>
                        <Link
                            href="/demo-adn"
                            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]"
                        >
                            Ver muestra gratuita
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </section>
                )}
            </div>

            <Footer />
        </main>
    );
}

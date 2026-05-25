import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Search, Star } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { searchBooks } from "@/lib/book-search";
import { getReadingExperience } from "@/lib/reading-experiences";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
    title: "Buscar libros | Wordelia",
    description: "Busca libros por título, autora, autor, ISBN o experiencia de lectura en Wordelia.",
};

// Forzamos rendering dinámico: la búsqueda depende de searchParams y consulta
// APIs externas en cada request. Sin esto Next.js puede cachear la página.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchPageProps = {
    searchParams: Promise<{ q?: string; experience?: string }>;
};

export default async function PublicSearchPage({ searchParams }: SearchPageProps) {
    const { q, experience: experienceSlug } = await searchParams;
    const query = typeof q === "string" ? q.trim() : "";
    const experience = getReadingExperience(experienceSlug);
    const results = experience
        ? await searchBooks({ experienceLabel: experience.label, experienceTerms: experience.searchTerms })
        : query
            ? await searchBooks({ query })
            : [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = Boolean(user);
    const hasSearch = Boolean(query || experience);
    const title = experience
        ? experience.label
        : query
            ? `Resultados para “${query}”`
            : "Busca por título, autor o ISBN";
    const description = experience
        ? experience.description
        : "Encuentra una obra y, muy pronto, entra en su ficha Wordelia con análisis, experiencia lectora y clubs relacionados.";

    return (
        <main className="min-h-screen bg-cream">
            <Navbar mode="public" />

            <div className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-8 md:pt-32">
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-2 rounded-full text-sm font-medium text-grey transition-colors hover:text-teal"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Volver al inicio
                </Link>

                <section className="mb-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">
                        {experience ? "Experiencia de lectura" : "Buscar libros"}
                    </p>
                    <h1 className="mx-auto mt-4 max-w-4xl text-4xl leading-tight text-teal md:text-5xl">
                        {title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                        {description}
                    </p>
                    {experience && (
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                            {experience.signals.map((signal) => (
                                <span key={signal} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal shadow-sm">
                                    {signal}
                                </span>
                            ))}
                        </div>
                    )}
                </section>

                <form
                    action="/buscar"
                    className="mx-auto mb-10 grid max-w-4xl gap-3 rounded-2xl border border-teal/10 bg-white p-3 shadow-sm md:grid-cols-[1fr_auto] md:p-4"
                >
                    <div className="flex min-h-14 items-center gap-3 rounded-xl bg-cream px-4 text-grey">
                        <Search className="h-5 w-5 text-teal" aria-hidden="true" />
                        <input
                            type="search"
                            name="q"
                            defaultValue={query}
                            required
                            placeholder="Buscar por ISBN, título, autora o autor"
                            className="min-w-0 flex-1 bg-transparent text-sm text-teal-dark outline-none placeholder:text-grey md:text-base"
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-teal px-6 font-semibold text-white transition-colors hover:bg-teal-dark"
                    >
                        Buscar
                        <Search className="h-4 w-4" aria-hidden="true" />
                    </button>
                </form>

                {hasSearch && (
                    <p className="mb-6 text-sm font-medium text-grey">
                        {results.length > 0
                            ? `Hemos encontrado ${results.length} resultados.`
                            : "No hemos encontrado resultados para esta búsqueda."}
                    </p>
                )}

                {hasSearch && results.length === 0 && (
                    <div className="rounded-3xl border border-teal/10 bg-offwhite p-10 text-center">
                        <BookOpen className="mx-auto mb-4 h-10 w-10 text-teal/50" aria-hidden="true" />
                        {experience ? (
                            <>
                                <h2 className="text-2xl text-teal">Aún estamos preparando esta experiencia</h2>
                                <p className="mx-auto mt-2 max-w-xl text-grey">
                                    Pronto encontrarás aquí una selección curada de libros para “{experience.label.toLowerCase()}”.
                                    Mientras tanto puedes buscar por título, autora o autor.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl text-teal">Prueba con otra búsqueda</h2>
                                <p className="mx-auto mt-2 max-w-xl text-grey">
                                    Puedes buscar por ISBN, título completo, nombre de la autora o autor, o volver a
                                    explorar por experiencias.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {results.length > 0 && (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {results.map((book) => (
                            <article
                                key={book.id || `${book.title}-${book.isbn}`}
                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-teal/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="relative aspect-[2/3] w-full bg-grey/10">
                                    {book.cover_url ? (
                                        <Image
                                            src={book.cover_url}
                                            alt={book.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(min-width: 1280px) 15vw, (min-width: 1024px) 18vw, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 45vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-teal/45">
                                            <BookOpen className="h-7 w-7" aria-hidden="true" />
                                            <span className="mt-2 text-[10px] font-semibold">Sin portada</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col p-3">
                                    <h2 className="line-clamp-2 text-sm font-semibold leading-tight text-teal-dark">
                                        {book.title}
                                    </h2>
                                    <p className="mt-1 line-clamp-1 text-xs text-grey">
                                        {book.authors.join(", ") || "Autor desconocido"}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                                        {book.published_date && (
                                            <span className="rounded-full bg-cream px-2 py-0.5 text-grey">
                                                {new Date(book.published_date).getFullYear()}
                                            </span>
                                        )}
                                        {book.average_rating && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-coral">
                                                <Star className="h-3 w-3" fill="currentColor" aria-hidden="true" />
                                                {book.average_rating}
                                            </span>
                                        )}
                                    </div>

                                    {isLoggedIn && (
                                        <Link
                                            href={`/app/libros/${book.id}`}
                                            className="mt-auto pt-3 inline-flex h-9 items-center justify-center rounded-xl bg-coral px-3 text-xs font-semibold text-white transition-colors hover:bg-[#C25852]"
                                        >
                                            Ver en Wordelia
                                        </Link>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}

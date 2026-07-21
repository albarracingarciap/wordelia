import Link from "next/link";
import type { Metadata } from "next";
import { Star, ArrowRight, BookOpen, ThumbsUp, ShoppingBag, Store } from "lucide-react";
import { fetchPublicBook, type PublicReview } from "@/lib/public-book";
import { getBookBuyOptions } from "@/lib/book-buy";
import { getMyPrimaryLibrary } from "@/app/librerias/my-library-actions";
import { getBookRecommenders } from "@/app/app/librerias/recommendation-actions";
import { RecommendersView } from "@/components/librerias/RecommendersView";
import { getClubsReadingBook } from "@/app/app/clubs/book-clubs-actions";
import { ClubsReadingView } from "@/components/club/ClubsReadingView";
import { isSaved } from "@/app/app/guardados/actions";
import { SaveButton } from "@/components/social/SaveButton";
import { buildBuyLink } from "@/lib/buy-link";
import { SITE_URL } from "@/lib/site";
import { ShareBookButton } from "@/components/book/ShareBookButton";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
    const rounded = Math.round(value);
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    style={{ width: size, height: size }}
                    className={i <= rounded ? "fill-coral text-coral" : "fill-grey/10 text-grey/20"}
                />
            ))}
        </span>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const book = await fetchPublicBook(id);
    if (!book) return { title: "Libro — Wordelia" };

    const author = book.author ? ` de ${book.author}` : "";
    const title = `${book.title}${author} — Reseñas y opiniones | Wordelia`;
    const description = book.rating.count
        ? `${book.rating.average}/5 con ${book.rating.count} reseña${book.rating.count === 1 ? "" : "s"}. Lee qué opina la comunidad de «${book.title}» en Wordelia.`
        : `Descubre «${book.title}»${author} en Wordelia: reseñas, valoraciones y análisis en profundidad.`;
    return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/libro/${id}` },
        openGraph: { title, description, type: "book", url: `${SITE_URL}/libro/${id}` },
        twitter: { card: "summary", title, description },
    };
}

function ReviewCard({ review }: { review: PublicReview }) {
    const name = review.reader.name || (review.reader.username ? `@${review.reader.username}` : "Lector");
    const facets = [review.emotionalTone, review.pace, review.recommendedFor ? `Para: ${review.recommendedFor}` : null, ...review.tags].filter(Boolean) as string[];

    return (
        <article className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-teal-dark">{name}</span>
                    {review.type === "FIRST_IMPRESSIONS" && (
                        <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">Primeras impresiones</span>
                    )}
                </div>
                {review.rating ? <Stars value={review.rating} size={14} /> : null}
            </div>

            {review.content && (
                review.containsSpoilers ? (
                    <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-coral">⚠ Contiene spoilers — mostrar</summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-grey-dark">{review.content}</p>
                    </details>
                ) : (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-grey-dark">{review.content}</p>
                )
            )}

            {facets.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {facets.slice(0, 6).map((f, i) => (
                        <span key={i} className="rounded-full bg-teal/5 px-2.5 py-1 text-[11px] font-medium text-teal">{f}</span>
                    ))}
                </div>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs text-grey/50">
                <span>{fmtDate(review.createdAt)}</span>
                {review.helpfulCount > 0 && (
                    <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {review.helpfulCount}</span>
                )}
            </div>
        </article>
    );
}

export default async function PublicBookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const book = await fetchPublicBook(id);

    if (!book) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
                <p className="font-serif text-2xl text-teal-dark">No encontramos este libro</p>
                <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                    Descubre Wordelia <ArrowRight className="h-4 w-4" />
                </Link>
            </main>
        );
    }

    const total = book.rating.count;
    const [buy, primaryLibrary] = await Promise.all([
        getBookBuyOptions(book.id, { title: book.title, preferredEditionId: book.preferredEditionId }),
        getMyPrimaryLibrary(),
    ]);
    // Librería principal del lector con enlace propio → opción destacada arriba.
    const primaryBuyUrl = primaryLibrary?.buyLinkTemplate
        ? buildBuyLink({ template: primaryLibrary.buyLinkTemplate, isbn: buy.isbn, title: book.title, fallback: false })
        : null;
    // No repetir la principal en la lista de "librerías que leen este libro".
    const otherStores = primaryLibrary ? buy.stores.filter((s) => s.id !== primaryLibrary.id) : buy.stores;
    const hasBuyOptions = !!primaryBuyUrl || otherStores.length > 0 || !!buy.indieSearchUrl;
    // Librerías que avalan este libro con una nota del librero (prueba social humana).
    const recommenders = await getBookRecommenders(book.id, buy.isbn);
    // Clubs públicos/oficiales que lo están leyendo.
    const bookClubs = await getClubsReadingBook(book.id);
    const savedBook = await isSaved("book", book.id);

    return (
        <main className="min-h-screen bg-gradient-to-b from-cream to-[#F0F4F1] px-4 py-10">
            <div className="mx-auto max-w-3xl space-y-8">
                {/* Cabecera del libro */}
                <div className="flex flex-col gap-6 sm:flex-row">
                    {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.coverUrl} alt={book.title} className="h-52 w-36 shrink-0 self-center rounded-lg object-cover shadow-lg sm:self-start" />
                    ) : (
                        <div className="flex h-52 w-36 shrink-0 items-center justify-center self-center rounded-lg bg-teal/10 sm:self-start">
                            <BookOpen className="h-10 w-10 text-teal/40" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="font-serif text-3xl text-teal-dark">{book.title}</h1>
                        {book.author && <p className="mt-1 text-lg text-grey/70">{book.author}{book.year ? ` · ${book.year}` : ""}</p>}

                        <div className="mt-4 flex items-center gap-3">
                            {total > 0 ? (
                                <>
                                    <Stars value={book.rating.average} size={20} />
                                    <span className="text-lg font-bold text-teal-dark">{book.rating.average}</span>
                                    <span className="text-sm text-grey/60">· {total} reseña{total === 1 ? "" : "s"}</span>
                                </>
                            ) : (
                                <span className="text-sm text-grey/60">Aún sin reseñas. ¡Sé el primero!</span>
                            )}
                        </div>

                        {book.description && <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-grey/80">{book.description}</p>}

                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link href={`/app/libros/${book.id}`} className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                                Añadir a mi biblioteca <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href={`/app/libros/${book.id}?review=1`} className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-5 py-2.5 text-sm font-semibold text-teal hover:bg-teal/5">
                                <Star className="h-4 w-4" /> Valorar
                            </Link>
                            <ShareBookButton title={`${book.title}${book.author ? ` — ${book.author}` : ""}`} />
                            <SaveButton itemType="book" itemId={book.id} initialSaved={savedBook} variant="pill" />
                        </div>
                    </div>
                </div>

                {/* Comprar en indie — el wedge anti-Amazon: llevar al lector a una librería de barrio */}
                {hasBuyOptions && (
                    <section className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-serif text-lg text-teal-dark">Cómpralo en una librería independiente</h2>
                                <p className="mt-0.5 text-sm leading-relaxed text-grey/70">
                                    En Wordelia te llevamos a una librería de barrio, no a un gigante del comercio.
                                </p>
                            </div>
                        </div>

                        {primaryBuyUrl && primaryLibrary && (
                            <a
                                href={primaryBuyUrl}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                style={primaryLibrary.brandColor ? { backgroundColor: primaryLibrary.brandColor } : undefined}
                                className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-teal px-4 py-3 text-white transition-opacity hover:opacity-95"
                            >
                                <span className="min-w-0">
                                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/70">Tu librería</span>
                                    <span className="block truncate text-sm font-bold">Comprar en {primaryLibrary.name}</span>
                                </span>
                                <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
                            </a>
                        )}

                        {otherStores.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-grey/40">Librerías que leen este libro</p>
                                <div className="flex flex-col gap-2">
                                    {otherStores.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-teal/10 bg-cream/40 px-3 py-2.5">
                                            <Link href={s.slug ? `/librerias/${s.slug}` : "/librerias"} className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-teal-dark hover:text-teal">
                                                <Store className="h-4 w-4 shrink-0 text-teal/60" aria-hidden="true" />
                                                <span className="min-w-0">
                                                    <span className="block truncate">{s.name}</span>
                                                    {s.city && <span className="block text-xs font-normal text-grey/50">{s.city}</span>}
                                                </span>
                                            </Link>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer sponsored"
                                                style={s.brandColor ? { color: s.brandColor, borderColor: s.brandColor, backgroundColor: `${s.brandColor}14` } : undefined}
                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal transition-colors hover:bg-teal/10"
                                            >
                                                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> Comprar
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {buy.indieSearchUrl && (
                            <a
                                href={buy.indieSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
                            >
                                <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Buscar en librerías independientes
                            </a>
                        )}
                        <p className="mt-2 text-center text-[11px] text-grey/40">
                            Todostuslibros.com, la red de librerías independientes de España (CEGAL).
                        </p>
                    </section>
                )}

                {/* Recomendado por librerías — prueba social humana (anti-algoritmo) */}
                <RecommendersView recommenders={recommenders} />

                {/* Clubs leyendo este libro */}
                <ClubsReadingView clubs={bookClubs} />

                {/* Distribución de valoraciones */}
                {total > 0 && (
                    <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-grey/50">Valoraciones</h2>
                        <div className="space-y-1.5">
                            {([5, 4, 3, 2, 1] as const).map((star) => {
                                const n = book.rating.distribution[star];
                                const pct = total ? Math.round((n / total) * 100) : 0;
                                return (
                                    <div key={star} className="flex items-center gap-2 text-sm">
                                        <span className="w-3 text-grey/60">{star}</span>
                                        <Star className="h-3.5 w-3.5 fill-coral text-coral" />
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal/10">
                                            <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="w-8 text-right text-xs text-grey/50">{n}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Reseñas */}
                {book.reviews.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-grey/50">Lo que opina la comunidad</h2>
                        {book.reviews.map((r) => (
                            <ReviewCard key={r.id} review={r} />
                        ))}
                    </section>
                )}

                {/* CTA final */}
                <div className="flex flex-col items-center gap-3 border-t border-teal/10 pt-8 text-center">
                    <p className="text-sm text-grey/70">Sigue tus lecturas, guarda citas y descubre libros en profundidad.</p>
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-dark">
                        Descubre Wordelia <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </main>
    );
}

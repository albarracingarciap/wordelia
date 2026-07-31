"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getBookDetailsAction } from "@/app/app/search/actions";
import { BookSearchResult } from "@/lib/isbndb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, BookOpen, Calendar, Star, Check, Plus, BookCopy, MessageSquare } from "lucide-react";
import { addBookToLibrary } from "@/app/app/search/actions";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { ReviewsListModal } from "@/components/reviews/ReviewsListModal";
import { BookReviewsSection } from "@/components/reviews/BookReviewsSection";
import { BuyBookButton } from "@/components/book/BuyBookButton";
import { BookRecommenders } from "@/components/librerias/BookRecommenders";
import { BookClubsReading } from "@/components/club/BookClubsReading";
import { BookChallengeShortcut } from "@/components/retos/BookChallengeShortcut";
import { SaveButton } from "@/components/social/SaveButton";
import { bookAuthorName, bookAuthorLabel } from "@/lib/book-author";

function BookHelper() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const statusParam = searchParams.get("status");
    const initialStatus = (statusParam === 'READING' || statusParam === 'READ') ? statusParam : 'WANT_TO_READ';

    const [dbBookId, setDbBookId] = useState<string | null>(null);
    const [userStatus, setUserStatus] = useState<string | null>(null);
    const [isReviewsListOpen, setIsReviewsListOpen] = useState(false);

    const [book, setBook] = useState<BookSearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isAdded, setIsAdded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

    useEffect(() => {
        async function fetchBook() {
            if (!id) return;
            setLoading(true);

            try {
                // Determine source based on ID format
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                const supabase = createClient();

                if (isUuid) {
                    // Fetch from Supabase: book (obra) + preferred_edition (con datos de edición).
                    const { data: dbBook, error: dbError } = await supabase
                        .from("books")
                        .select(`
                            id, title, description,
                            author,
                            preferred_edition:editions!books_preferred_edition_fk (
                                isbn, isbn13, cover_url, page_count, published_date, language, publisher
                            )
                        `)
                        .eq("id", id)
                        .single();

                    if (dbError) throw dbError;

                    if (dbBook) {
                        // PostgREST devuelve embeds como objeto (no array) en queries con FK 1:1.
                        const ed = Array.isArray(dbBook.preferred_edition)
                            ? dbBook.preferred_edition[0]
                            : dbBook.preferred_edition;
                        setBook({
                            id: dbBook.id,
                            title: dbBook.title,
                            authors: bookAuthorName(dbBook) ? [bookAuthorName(dbBook)!] : [],
                            cover_url: ed?.cover_url ?? null,
                            description: dbBook.description,
                            isbn: ed?.isbn13 ?? ed?.isbn ?? null,
                            isbn13: ed?.isbn13 ?? null,
                            page_count: ed?.page_count ?? null,
                            published_date: ed?.published_date ?? null,
                            publisher: ed?.publisher ?? null,
                            categories: [],
                            average_rating: null,
                            ratings_count: null,
                            language: ed?.language ?? null,
                            price: null,
                            source: 'db'
                        });
                        setDbBookId(dbBook.id);
                        setIsAdded(true); // Temporarily true, refined below via user_books check
                    }

                } else {
                    // Fetch from ISBNdb. La existencia en BD ahora se chequea contra `editions`,
                    // no `books` (los ISBN viven en editions).
                    const isbnBook = await getBookDetailsAction(id);
                    if (isbnBook) {
                        setBook(isbnBook);
                        const canonicalIsbn = getCanonicalIsbn(isbnBook);
                        if (canonicalIsbn) {
                            const { data: existingEdition } = await supabase
                                .from("editions")
                                .select("book_id")
                                .or(`isbn13.eq.${canonicalIsbn},isbn.eq.${canonicalIsbn}`)
                                .maybeSingle();

                            if (existingEdition?.book_id) {
                                setDbBookId(existingEdition.book_id);
                            }
                        }
                    } else {
                        throw new Error("Libro no encontrado en ISBNdb");
                    }
                }

                // Check if user has this book (if logged in)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // If we have a dbBookId (either from UUID param or ISBN lookup), use it
                    // If not, we can't really check user_books easily unless we searched by ISBN earlier?
                    // Actually if we found it by ISBN, dbBookId is set. 

                    if (dbBookId || isUuid) {
                        // Note: dbBookId might only be set in the next render if set inside the if(existing) above? 
                        // No, in standard react, yes. But here we can use a temp variable or structure logic differently.
                        // Ideally we chain promises. But let's assume if isUuid is true, id is dbBookId.

                        const canonicalIsbn = book ? getCanonicalIsbn(book) : "";
                        const targetId = isUuid
                            ? id
                            : (await supabase.from("editions").select("book_id").or(`isbn13.eq.${canonicalIsbn},isbn.eq.${canonicalIsbn}`).maybeSingle()).data?.book_id;

                        // Refetching existing ID just to be safe if local variables aren't handy
                        // Ideally the code block above for ISBN already found it. 

                        if (targetId) {
                            setDbBookId(targetId); // Ensure it's set

                            const { data: userBook } = await supabase
                                .from("user_books")
                                .select("status")
                                .eq("user_id", user.id)
                                .eq("book_id", targetId)
                                .single();

                            if (userBook) {
                                setIsAdded(true);
                                setUserStatus(userBook.status);
                            } else {
                                setIsAdded(false); // Can be in DB (books table) but not in user_books
                                setUserStatus(null);
                            }
                        }
                    }
                }

            } catch (err) {
                console.error(err);
                setError("No pudimos cargar la información del libro.");
            } finally {
                setLoading(false);
            }
        }

        fetchBook();
    }, [id]);

    // Abre el modal de reseña si venimos de la ficha pública con ?review=1.
    useEffect(() => {
        if (searchParams.get("review") === "1" && dbBookId) setIsReviewOpen(true);
    }, [searchParams, dbBookId]);

    const handleAdd = async () => {
        if (!book || isAdded) return;
        setIsAdding(true);
        try {
            const res = await addBookToLibrary(book, initialStatus);
            if (res.success) {
                setIsAdded(true);
                setUserStatus(initialStatus);
                // We should also try to setDbBookId here by querying based on ISBN
                const canonicalIsbn = getCanonicalIsbn(book);
                if (canonicalIsbn) {
                    const supabase = createClient();
                    const { data: existing } = await supabase.from("editions").select("book_id").or(`isbn13.eq.${canonicalIsbn},isbn.eq.${canonicalIsbn}`).maybeSingle();
                    if (existing?.book_id) setDbBookId(existing.book_id);
                }

                // Redirect if Reading
                if (initialStatus === 'READING') {
                    router.push('/app/mi-lectura');
                }
            } else {
                alert("Error: " + res.error);
            }
        } catch {
            alert("Ocurrió un error inesperado");
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
                <BookOpen size={64} className="text-teal/20 mb-4" />
                <h1 className="text-2xl font-serif text-teal-dark mb-2">Libro no encontrado</h1>
                <p className="text-grey/60 mb-6">{error || "Parece que este libro no existe o ha sido eliminado."}</p>
                <Link href="/app/search">
                    <Button>Volver al buscador</Button>
                </Link>
            </div>
        );
    }

    // Determine Review Button State
    const canReview = isAdded && dbBookId && (userStatus === 'READ' || userStatus === 'READING');
    const reviewButtonLabel = userStatus === 'READING' ? "Primeras impresiones" : "Dejar reseña";

    return (
        <div className="min-h-screen bg-cream pb-20">
            {/* Hero Header with Blurred Background */}
            <div className="relative w-full h-[220px] md:h-[280px] overflow-hidden bg-teal-dark">
                {book.cover_url && (
                    <Image
                        src={book.cover_url}
                        alt="Background"
                        fill
                        className="object-cover opacity-30 blur-xl scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cream/90"></div>

                <div className="absolute top-6 left-6 z-10">
                    <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Cover Image */}
                    <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-4 border-white transform rotate-0 md:-rotate-2 transition-transform hover:rotate-0 duration-500 bg-grey/10">
                        {book.cover_url ? (
                            <Image
                                src={book.cover_url}
                                alt={book.title}
                                width={300}
                                height={450}
                                className="w-full h-auto object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full aspect-[2/3] flex items-center justify-center text-teal/40 bg-white">
                                <BookOpen size={48} />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full pt-4 md:pt-12 text-center md:text-left">
                        {/* Categories / Badges */}
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                            {book.categories.map(cat => (
                                <Badge key={cat} variant="teal" size="sm">{cat}</Badge>
                            ))}
                            {book.source === 'google' && (
                                <Badge variant="outline" size="sm" className="opacity-60">Google Books</Badge>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-serif text-teal-dark mb-2 leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-lg md:text-xl text-coral font-medium mb-6">
                            {book.authors.join(", ") || "Autor desconocido"}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-grey/80 mb-8">
                            {book.published_date && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-teal" />
                                    <span>{new Date(book.published_date).getFullYear()}</span>
                                </div>
                            )}
                            {book.page_count && (
                                <div className="flex items-center gap-2">
                                    <BookCopy size={18} className="text-teal" />
                                    <span>{book.page_count} páginas</span>
                                </div>
                            )}
                            {book.average_rating && (
                                <div className="flex items-center gap-1 font-bold text-teal-dark">
                                    <Star size={18} className="text-orange-400 fill-orange-400" />
                                    <span>{book.average_rating}</span>
                                    <span className="text-grey/40 font-normal">({book.ratings_count})</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4 mb-4 justify-center md:justify-start">
                            {isAdded ? (
                                <Button size="lg" className="bg-green-600 hover:bg-green-700 pointer-events-none w-full sm:w-auto sm:shrink-0 whitespace-nowrap">
                                    <Check size={20} className="mr-2 shrink-0" /> En tu biblioteca
                                </Button>
                            ) : (
                                <Button size="lg" onClick={handleAdd} isLoading={isAdding} className="w-full sm:w-auto sm:shrink-0 whitespace-nowrap shadow-lg shadow-coral/20">
                                    <Plus size={20} className="mr-2 shrink-0" /> Añadir a mi lectura
                                </Button>
                            )}

                            {canReview && (
                                <Button variant="outline" size="lg" className="w-full sm:w-auto sm:shrink-0 whitespace-nowrap" onClick={() => setIsReviewOpen(true)}>
                                    <MessageSquare size={20} className="mr-2 shrink-0" /> {reviewButtonLabel}
                                </Button>
                            )}

                            <BuyBookButton isbn={book.isbn} title={book.title} className="w-full sm:w-auto sm:shrink-0 whitespace-nowrap" />
                            {dbBookId && <SaveButton itemType="book" itemId={dbBookId} variant="pill" />}
                        </div>

                        <BookRecommenders bookId={dbBookId} isbn={book.isbn13 ?? book.isbn} />

                        <BookClubsReading bookId={dbBookId} />

                        <BookChallengeShortcut bookId={dbBookId} status={userStatus} />


                        {/* Synopsis */}
                        <div className="prose prose-teal max-w-none text-left">
                            <h3 className="font-serif text-xl border-b border-teal/10 pb-2 mb-4">Sinopsis</h3>
                            <div
                                className="text-grey leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: book.description || "No hay descripción disponible." }}
                            />
                        </div>

                        {/* Additional Metadata */}
                        {(book.isbn || book.publisher || book.language) && (
                            <div className="mt-12 pt-8 border-t border-teal/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                                {book.publisher && (
                                    <div>
                                        <span className="block text-xs text-grey/50 uppercase tracking-wider mb-1">Editorial</span>
                                        <span className="text-sm font-medium text-teal-dark">{book.publisher}</span>
                                    </div>
                                )}
                                {book.isbn && (
                                    <div>
                                        <span className="block text-xs text-grey/50 uppercase tracking-wider mb-1">ISBN</span>
                                        <span className="text-sm font-medium text-teal-dark font-mono">{book.isbn}</span>
                                    </div>
                                )}
                                {book.language && (
                                    <div>
                                        <span className="block text-xs text-grey/50 uppercase tracking-wider mb-1">Idioma</span>
                                        <span className="text-sm font-medium text-teal-dark uppercase">{book.language}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <BookReviewsSection
                            bookId={dbBookId}
                            canReview={!!canReview}
                            reviewButtonLabel={reviewButtonLabel}
                            refreshKey={reviewsRefreshKey}
                            onOpenReview={() => setIsReviewOpen(true)}
                            onOpenAll={() => setIsReviewsListOpen(true)}
                        />

                    </div>
                </div>

                {/* Modals */}
                <ReviewsListModal
                    isOpen={isReviewsListOpen}
                    onClose={() => setIsReviewsListOpen(false)}
                    bookId={dbBookId}
                    bookTitle={book.title}
                />

                {dbBookId && (
                    <ReviewModal
                        isOpen={isReviewOpen}
                        onClose={() => setIsReviewOpen(false)}
                        bookId={dbBookId}
                        bookTitle={book.title}
                        status={userStatus || ''}
                        onSuccess={() => setReviewsRefreshKey((current) => current + 1)}
                    />
                )}
            </div>
        </div>
    );
}

function getCanonicalIsbn(book: Pick<BookSearchResult, "isbn" | "isbn13">) {
    return book.isbn13 || (book.isbn && normalizeISBN(book.isbn)?.length === 13 ? normalizeISBN(book.isbn) : null) || book.isbn || "";
}

function normalizeISBN(value: string) {
    const normalized = value.replace(/[^0-9Xx]/g, "").toUpperCase();
    return normalized.length === 10 || normalized.length === 13 ? normalized : null;
}

export default function BookPage() {
    return <BookHelper />;
}

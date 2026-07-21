"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, BookOpen, Clock, Users, Dna, ArrowRight } from "lucide-react";
import { BookSearchResult } from "@/lib/isbndb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/utils/supabase/client";
import { addBookToLibrary } from "@/app/app/search/actions";
import { getBookExtras, type BookExtras } from "@/app/explorar/actions";

interface BookPreviewModalProps {
    book: BookSearchResult;
    /** Id en nuestro catálogo, si la ficha viene de /explorar. Evita resolver por ISBN. */
    bookId?: string;
    /** Colección curada desde la que se abrió la ficha, para dar contexto real. */
    collection?: { name: string; description: string; tag_line: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

const WORDS_PER_PAGE = 250;
const WORDS_PER_MINUTE = 250;

/** Tiempo de lectura estimado a partir de las páginas. Cálculo, no promesa. */
function readingTime(pageCount?: number | null): string | null {
    if (!pageCount || pageCount < 10) return null;

    const minutes = (pageCount * WORDS_PER_PAGE) / WORDS_PER_MINUTE;
    const hours = Math.round(minutes / 60);

    if (hours < 1) return "menos de 1 h";
    return `~${hours} h de lectura`;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function formatDate(value?: string | null): string | null {
    if (!value) return null;
    const [datePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return null;

    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" })
        .format(new Date(year, month - 1, day));
}

export function BookPreviewModal({ book, bookId, collection, isOpen, onClose }: BookPreviewModalProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAddingBook, setIsAddingBook] = useState(false);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [extras, setExtras] = useState<BookExtras | null>(null);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setActionMessage("");
        setActionError("");
        setExtras(null);

        supabase.auth.getUser().then(({ data }) => {
            if (isMounted) setIsAuthenticated(Boolean(data.user));
        });

        // Datos propios de Wordelia sobre este libro (club oficial, guía).
        getBookExtras(book.isbn || book.id || "", book.title, bookId).then((result) => {
            if (isMounted) setExtras(result);
        });

        return () => {
            isMounted = false;
        };
    }, [isOpen, supabase, book.isbn, book.id, book.title, bookId]);

    if (!isOpen) return null;

    const synopsis = book.description ? stripHtml(book.description) : "";
    const time = readingTime(book.page_count);
    const year = book.published_date ? new Date(book.published_date).getFullYear() : null;
    const clubStart = formatDate(extras?.club?.start_date);

    const handleAddToLibrary = async () => {
        if (isAddingBook) return;

        setIsAddingBook(true);
        setActionMessage("");
        setActionError("");

        try {
            const result = await addBookToLibrary(book, "WANT_TO_READ");
            if (result.success) {
                setActionMessage("Libro añadido a tu lista Quiero leer.");
                router.refresh();
            } else {
                setActionError(result.error || "No hemos podido añadir el libro a tu biblioteca.");
            }
        } catch (error) {
            console.error("Error adding book to library:", error);
            setActionError("No hemos podido añadir el libro a tu biblioteca.");
        } finally {
            setIsAddingBook(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 pointer-events-none sm:items-center sm:p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={book.title}
                    className="max-h-[calc(100dvh-4.5rem)] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-white shadow-2xl pointer-events-auto animate-scale-in sm:max-h-[90dvh] sm:max-w-3xl sm:rounded-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="sticky top-3 float-right mr-3 mt-3 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-grey/10"
                        aria-label="Cerrar vista previa"
                    >
                        <X className="h-5 w-5 text-grey" />
                    </button>

                    <div className="p-5 pt-10 pb-8 sm:p-6 md:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6 md:gap-8">
                            <div className="shrink-0 self-center sm:self-start">
                                <div className="relative aspect-[2/3] w-36 overflow-hidden rounded-lg bg-grey/10 shadow-lg sm:w-44 md:w-48">
                                    {book.cover_url ? (
                                        <Image
                                            src={book.cover_url}
                                            alt={`Portada de ${book.title}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 144px, 192px"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                            <p className="text-center font-serif text-sm text-grey/60">{book.title}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-5">
                                <div>
                                    <h2 className="mb-2 text-2xl font-semibold leading-tight text-teal-dark md:text-3xl">
                                        {book.title}
                                    </h2>
                                    <p className="text-base text-grey/70 md:text-lg">{book.authors.join(", ")}</p>
                                </div>

                                {/* Ficha de lectura: metadatos reales y tiempo calculado. */}
                                <div className="flex flex-wrap gap-2 text-xs font-medium">
                                    {book.page_count && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-teal-dark">
                                            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                            {book.page_count} páginas
                                        </span>
                                    )}
                                    {time && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-teal-dark">
                                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                            {time}
                                        </span>
                                    )}
                                    {year && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-teal-dark">
                                            {year}
                                        </span>
                                    )}
                                </div>

                                {book.categories && book.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {book.categories.slice(0, 3).map((category, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Por qué está en esta colección: contexto editorial real. */}
                                {collection && (
                                    <div className="rounded-xl border border-teal/10 bg-teal/5 p-4">
                                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-teal">
                                            Por qué está aquí
                                        </p>
                                        <p className="text-sm leading-relaxed text-grey/80">
                                            Forma parte de <strong className="text-teal-dark">{collection.name}</strong>.{" "}
                                            {collection.description}
                                        </p>
                                    </div>
                                )}

                                {synopsis && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-grey/40">
                                            Sinopsis
                                        </h3>
                                        <p className="whitespace-pre-line text-sm leading-relaxed text-grey/80">
                                            {synopsis}
                                        </p>
                                    </div>
                                )}

                                {/* Club oficial que lo está leyendo. Solo si existe de verdad. */}
                                {extras?.club && (
                                    <Link
                                        href={`/clubes/${extras.club.slug || extras.club.id}`}
                                        className="block rounded-xl border border-coral/20 bg-coral/5 p-4 transition-colors hover:bg-coral/10"
                                    >
                                        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                            Se lee en un club de Wordelia
                                        </p>
                                        <p className="font-semibold text-teal-dark">
                                            {extras.club.name}
                                            {clubStart && (
                                                <span className="font-normal text-grey/60"> · empieza el {clubStart}</span>
                                            )}
                                        </p>
                                        {extras.club.hook_question && (
                                            <p className="mt-2 font-serif text-sm italic leading-relaxed text-teal-dark">
                                                “{extras.club.hook_question}”
                                            </p>
                                        )}
                                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-coral">
                                            Ver el club <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                        </span>
                                    </Link>
                                )}

                                {/* Guía de discusión publicada para este libro. */}
                                {extras?.guideSlug && (
                                    <Link
                                        href="/guias"
                                        className="flex items-center gap-3 rounded-xl border border-teal/15 bg-white p-4 transition-colors hover:bg-teal/5"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                                            <Dna className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block font-semibold text-teal-dark">
                                                Hay guía de discusión para este libro
                                            </span>
                                            <span className="block text-sm text-grey/60">
                                                Con checkpoints y preguntas por sesión
                                            </span>
                                        </span>
                                        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                                    </Link>
                                )}

                                <div className="rounded-xl border border-teal/20 bg-gradient-to-r from-teal/10 to-coral/10 p-4 sm:p-6">
                                    {isAuthenticated ? (
                                        <>
                                            <h3 className="mb-2 text-lg font-semibold text-teal">Guarda esta lectura</h3>
                                            <p className="mb-4 text-sm text-grey/70">
                                                Añádelo a tu biblioteca para tenerlo en tu lista Quiero leer.
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={handleAddToLibrary}
                                                isLoading={isAddingBook}
                                                className="w-full bg-teal font-semibold text-white hover:bg-teal-dark"
                                            >
                                                Añadir a Quiero leer
                                            </Button>
                                            {actionMessage && (
                                                <p className="mt-3 text-center text-xs font-medium text-teal">
                                                    {actionMessage}{" "}
                                                    <Link href="/app/mi-lectura/estanterias" className="underline">
                                                        Ver biblioteca
                                                    </Link>
                                                </p>
                                            )}
                                            {actionError && (
                                                <p className="mt-3 text-center text-xs font-medium text-coral">{actionError}</p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="mb-2 text-lg font-semibold text-teal">
                                                Guárdalo para cuando lo leas
                                            </h3>
                                            <p className="mb-4 text-sm text-grey/70">
                                                Crea tu cuenta para guardar libros en tus estanterías, seguir tu lectura
                                                y acceder a las guías y genomas literarios de Wordelia.
                                            </p>
                                            <Link href="/register?source=explorar">
                                                <Button className="w-full bg-teal font-semibold text-white hover:bg-teal-dark">
                                                    Empezar
                                                </Button>
                                            </Link>
                                            <p className="mt-3 text-center text-xs text-grey/50">
                                                ¿Ya tienes cuenta?{" "}
                                                <Link href="/login" className="text-teal hover:underline">
                                                    Inicia sesión
                                                </Link>
                                            </p>
                                        </>
                                    )}
                                </div>

                                {bookId && (
                                    <Link
                                        href={`/libro/${bookId}`}
                                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-teal transition-colors hover:text-coral"
                                    >
                                        Ver ficha completa y reseñas <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

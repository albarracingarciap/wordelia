"use client";

import { BookSearchResult } from "@/lib/isbndb";
import Image from "next/image";
import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { addBookToLibrary } from "@/app/app/search/actions";

interface BookPreviewModalProps {
    book: BookSearchResult;
    isOpen: boolean;
    onClose: () => void;
}

function InsightPreview({ locked }: { locked: boolean }) {
    const content = (
        <div className="space-y-4">
            <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-grey/40">
                    Mapa emocional
                </h3>
                {locked ? (
                    <div className="h-24 rounded-lg bg-gradient-to-r from-teal/20 to-coral/20 sm:h-32" />
                ) : (
                    <div className="rounded-lg border border-teal/10 bg-gradient-to-r from-teal/10 to-coral/10 p-4">
                        <p className="text-sm leading-relaxed text-grey/70">
                            Un vistazo orientativo a la intensidad, tensión y tono emocional de esta lectura.
                        </p>
                    </div>
                )}
            </div>

            <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-grey/40">
                    Reseñas de la comunidad
                </h3>
                {locked ? (
                    <div className="space-y-2">
                        <div className="h-14 rounded-lg bg-grey/10 sm:h-16" />
                        <div className="h-14 rounded-lg bg-grey/10 sm:h-16" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="rounded-lg bg-grey/10 p-3 text-sm text-grey/70">
                            Lectores con gustos similares destacan su ritmo y tensión narrativa.
                        </div>
                        <div className="rounded-lg bg-grey/10 p-3 text-sm text-grey/70">
                            Ideal si buscas una lectura absorbente y con atmósfera marcada.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (!locked) return content;

    return (
        <div className="relative">
            <div className="filter blur-sm select-none pointer-events-none">
                <div className="opacity-40">{content}</div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white p-4 shadow-xl">
                    <Lock className="h-7 w-7 text-teal sm:h-8 sm:w-8" />
                </div>
            </div>
        </div>
    );
}

export function BookPreviewModal({ book, isOpen, onClose }: BookPreviewModalProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isAddingBook, setIsAddingBook] = useState(false);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setIsCheckingSession(true);
        setActionMessage("");
        setActionError("");

        supabase.auth.getUser().then(({ data }) => {
            if (!isMounted) return;
            setIsAuthenticated(Boolean(data.user));
            setIsCheckingSession(false);
        });

        return () => {
            isMounted = false;
        };
    }, [isOpen, supabase]);

    if (!isOpen) return null;

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    const previewDescription = book.description
        ? `${stripHtml(book.description).slice(0, 150)}...`
        : "No hay descripción disponible.";

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

                    <div className="p-5 pt-10 pb-28 sm:p-6 md:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6 md:gap-8">
                            <div className="shrink-0 self-center sm:self-start">
                                <div className="relative w-36 overflow-hidden rounded-lg bg-grey/10 shadow-lg aspect-[2/3] sm:w-44 md:w-48">
                                    {book.cover_url ? (
                                        <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 144px, 192px" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                            <p className="text-center font-serif text-sm text-grey/60">{book.title}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-4">
                                <div>
                                    <h2 className="mb-2 text-2xl font-semibold leading-tight text-grey md:text-3xl">
                                        {book.title}
                                    </h2>
                                    <p className="text-base text-grey/70 md:text-lg">{book.authors.join(", ")}</p>
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

                                <div className="space-y-1 text-sm text-grey/60">
                                    {book.publisher && <p>Editorial: {book.publisher}</p>}
                                    {book.published_date && <p>Publicado: {new Date(book.published_date).getFullYear()}</p>}
                                    {book.page_count && <p>Páginas: {book.page_count}</p>}
                                </div>

                                <div>
                                    <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-grey/40">
                                        Sinopsis
                                    </h3>
                                    <p className="text-sm leading-relaxed text-grey/80">{previewDescription}</p>
                                </div>

                                <div className="relative">
                                    <InsightPreview locked={!isAuthenticated} />

                                    <div className="mt-5 rounded-xl border border-teal/20 bg-gradient-to-r from-teal/10 to-coral/10 p-4 sm:mt-6 sm:p-6">
                                        {isCheckingSession ? (
                                            <>
                                                <h3 className="mb-2 text-lg font-semibold text-teal">Preparando opciones</h3>
                                                <p className="text-sm text-grey/70">
                                                    Estamos comprobando tu sesión para mostrarte la acción adecuada.
                                                </p>
                                            </>
                                        ) : isAuthenticated ? (
                                            <>
                                                <h3 className="mb-2 text-lg font-semibold text-teal">Guarda esta lectura</h3>
                                                <p className="mb-4 text-sm text-grey/70">
                                                    Añade este libro a tu biblioteca para tenerlo en tu lista Quiero leer.
                                                </p>
                                                <Button type="button" onClick={handleAddToLibrary} isLoading={isAddingBook} className="w-full bg-teal font-semibold text-white hover:bg-teal-dark">
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
                                                {actionError && <p className="mt-3 text-center text-xs font-medium text-coral">{actionError}</p>}
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="mb-2 text-lg font-semibold text-teal">Desbloquea el análisis completo</h3>
                                                <p className="mb-4 text-sm text-grey/70">
                                                    Regístrate gratis para ver el mapa emocional, reseñas de la comunidad,
                                                    análisis de complejidad y mucho más.
                                                </p>
                                                <Link href="/register">
                                                    <Button className="w-full bg-teal font-semibold text-white hover:bg-teal-dark">
                                                        Crear cuenta gratis
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

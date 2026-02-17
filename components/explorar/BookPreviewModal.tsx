"use client";

import { BookSearchResult } from "@/lib/isbndb";
import Image from "next/image";
import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useEffect } from "react";

interface BookPreviewModalProps {
    book: BookSearchResult;
    isOpen: boolean;
    onClose: () => void;
}

export function BookPreviewModal({ book, isOpen, onClose }: BookPreviewModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Function to strip HTML tags
    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    // Get first 150 characters of description for preview (without HTML tags)
    const previewDescription = book.description
        ? stripHtml(book.description).slice(0, 150) + "..."
        : "No hay descripción disponible.";

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-grey/10 hover:bg-grey/20 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-grey" />
                    </button>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Book Cover */}
                            <div className="shrink-0">
                                <div className="relative w-48 aspect-[2/3] bg-grey/10 rounded-lg overflow-hidden shadow-lg">
                                    {book.cover_url ? (
                                        <Image
                                            src={book.cover_url}
                                            alt={book.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                            <p className="text-sm text-grey/60 text-center font-serif">
                                                {book.title}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Book Info */}
                            <div className="flex-1 space-y-4">
                                {/* Title & Author */}
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-serif text-grey mb-2">
                                        {book.title}
                                    </h2>
                                    <p className="text-grey/70 text-lg">
                                        {book.authors.join(", ")}
                                    </p>
                                </div>

                                {/* Categories/Genres */}
                                {book.categories && book.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {book.categories.slice(0, 3).map((category, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Publication Info */}
                                <div className="text-sm text-grey/60 space-y-1">
                                    {book.publisher && <p>Editorial: {book.publisher}</p>}
                                    {book.published_date && (
                                        <p>Publicado: {new Date(book.published_date).getFullYear()}</p>
                                    )}
                                    {book.page_count && <p>Páginas: {book.page_count}</p>}
                                </div>

                                {/* Preview Description (visible) */}
                                <div>
                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2">
                                        Sinopsis
                                    </h3>
                                    <p className="text-grey/80 text-sm leading-relaxed">
                                        {previewDescription}
                                    </p>
                                </div>

                                {/* Blurred Content Section */}
                                <div className="relative">
                                    {/* Blur overlay */}
                                    <div className="relative">
                                        <div className="filter blur-sm select-none pointer-events-none">
                                            <div className="space-y-4 opacity-40">
                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2">
                                                        Mapa Emocional
                                                    </h3>
                                                    <div className="h-32 bg-gradient-to-r from-teal/20 to-coral/20 rounded-lg" />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2">
                                                        Reseñas de la Comunidad
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="h-16 bg-grey/10 rounded-lg" />
                                                        <div className="h-16 bg-grey/10 rounded-lg" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2">
                                                        Análisis de Complejidad
                                                    </h3>
                                                    <div className="h-20 bg-grey/10 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lock icon overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white rounded-full p-4 shadow-xl">
                                                <Lock className="w-8 h-8 text-teal" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA on blur */}
                                    <div className="mt-6 bg-gradient-to-r from-teal/10 to-coral/10 rounded-xl p-6 border-2 border-teal/20">
                                        <h3 className="text-lg font-serif text-teal mb-2">
                                            🔓 Desbloquea el análisis completo
                                        </h3>
                                        <p className="text-grey/70 text-sm mb-4">
                                            Regístrate gratis para ver el Mapa Emocional, reseñas de la comunidad,
                                            análisis de complejidad y mucho más.
                                        </p>
                                        <Link href="/register">
                                            <Button className="w-full bg-teal hover:bg-teal-dark text-white font-semibold">
                                                Crear cuenta gratis
                                            </Button>
                                        </Link>
                                        <p className="text-xs text-grey/50 text-center mt-3">
                                            ¿Ya tienes cuenta?{" "}
                                            <Link href="/login" className="text-teal hover:underline">
                                                Inicia sesión
                                            </Link>
                                        </p>
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

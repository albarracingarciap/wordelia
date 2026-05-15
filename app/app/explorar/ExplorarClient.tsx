"use client";

import { useState } from "react";
import Image from "next/image";
import { MetricSection } from "@/components/explorar/MetricSection";
import { BookPreviewModal } from "@/components/explorar/BookPreviewModal";
import { BookSearchResult } from "@/lib/isbndb";
import type { CuratedCollectionWithBooks } from "@/app/explorar/actions";
import { Card } from "@/components/ui/Card";
import { Sparkles } from "lucide-react";

interface ExplorarClientProps {
    initialCollections: CuratedCollectionWithBooks[];
}

const sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-grey/40 lg:text-sm";

export default function ExplorarClient({ initialCollections }: ExplorarClientProps) {
    const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBookClick = (_isbn: string, book: BookSearchResult) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedBook(null), 200);
    };

    if (!initialCollections || initialCollections.length === 0) {
        return (
            <div className="space-y-8 animate-fade-in pb-8">
                <div className="rounded-2xl border border-teal/5 bg-white/50 px-4 py-10 text-center">
                    <p className="text-grey/60">No hay colecciones disponibles en este momento.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 animate-fade-in pb-12 md:space-y-10">
                <section>
                    <div className="mb-3 flex items-center gap-2 md:mb-4">
                        <Sparkles className="h-4 w-4 text-teal md:h-5 md:w-5" />
                        <h2 className={sectionTitleClass}>Para ti</h2>
                    </div>
                    <Card className="flex flex-col gap-5 border-teal/10 bg-gradient-to-br from-teal/5 to-cream p-4 sm:p-5 md:flex-row md:items-center md:gap-6 md:p-6">
                        <div className="flex-1 space-y-2">
                            <h3 className="text-base font-bold text-teal-dark md:text-lg">Basado en tu actividad reciente</h3>
                            <p className="text-sm leading-relaxed text-grey/80">
                                Porque guardaste libros de fantasía épica, creemos que estas historias llenas de mundos complejos y magia antigua te encantarán.
                            </p>
                        </div>
                        <div className="-mx-4 flex max-w-full snap-x gap-3 overflow-x-auto px-4 pb-1 hide-scrollbar sm:mx-0 sm:px-0 md:max-w-[50%] md:gap-4">
                            {initialCollections[0]?.books.slice(0, 3).map((book, index) => (
                                <button
                                    type="button"
                                    key={book.isbn || book.id || `${book.title}-${index}`}
                                    className="w-20 shrink-0 snap-start cursor-pointer text-left transition-transform hover:scale-105 sm:w-24"
                                    onClick={() => handleBookClick(book.isbn || book.id || "", book)}
                                >
                                    {book.cover_url ? (
                                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded shadow-sm">
                                            <Image
                                                src={book.cover_url}
                                                alt={book.title}
                                                fill
                                                sizes="96px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex aspect-[2/3] w-full items-center justify-center rounded border border-teal/20 bg-teal/10 p-2 text-center text-xs text-teal-dark">
                                            {book.title}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>
                </section>

                <div className="space-y-10 text-teal md:space-y-12">
                    {initialCollections.map((collection) => (
                        <MetricSection
                            key={collection.id}
                            collection={collection}
                            onBookClick={handleBookClick}
                        />
                    ))}
                </div>

                <section>
                    <h2 className={`${sectionTitleClass} mb-4`}>Tendencias en la comunidad</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="cursor-pointer p-5 transition-colors hover:border-teal/30 group">
                            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal/50">Club más activo</p>
                            <h3 className="text-md font-bold text-grey transition-colors group-hover:text-teal">Lectores de Fantasía Épica</h3>
                            <p className="mt-2 line-clamp-2 text-sm text-grey/60">
                                Comentando actualmente &ldquo;El Archivo de las Tormentas&rdquo;. Únete a la discusión del capítulo 5.
                            </p>
                            <div className="mt-3 text-xs font-medium text-teal">124 miembros activos hoy</div>
                        </Card>
                        <Card className="cursor-pointer p-5 transition-colors hover:border-teal/30 group">
                            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal/50">Debate candente</p>
                            <h3 className="text-md font-bold text-grey transition-colors group-hover:text-teal">¿El final de Proyecto Hail Mary?</h3>
                            <p className="mt-2 line-clamp-2 text-sm text-grey/60">
                                Spoilers permitidos. Discutiendo las implicaciones físicas del final.
                            </p>
                            <div className="mt-3 text-xs font-medium text-teal">89 comentarios nuevos</div>
                        </Card>
                        <Card className="cursor-pointer p-5 transition-colors hover:border-teal/30 group">
                            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal/50">Reseña destacada</p>
                            <h3 className="text-md font-bold text-grey transition-colors group-hover:text-teal">&ldquo;Una obra maestra imperfecta&rdquo;</h3>
                            <p className="mt-2 line-clamp-2 text-sm text-grey/60">
                                Análisis profundo sobre el desarrollo de personajes en Babel por R.F. Kuang.
                            </p>
                            <div className="mt-3 text-xs font-medium text-teal">Por @saraleetodo</div>
                        </Card>
                    </div>
                </section>
            </div>

            {selectedBook && (
                <BookPreviewModal
                    book={selectedBook}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}

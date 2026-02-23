"use client";

import { useState } from "react";
import { MetricSection } from "@/components/explorar/MetricSection";
import { BookPreviewModal } from "@/components/explorar/BookPreviewModal";
import { BookSearchResult } from "@/lib/isbndb";
import type { CuratedCollectionWithBooks } from "@/app/explorar/actions";
import { Card } from "@/components/ui/Card";
import { Sparkles } from "lucide-react";

interface ExplorarClientProps {
    initialCollections: CuratedCollectionWithBooks[];
}

export default function ExplorarClient({ initialCollections }: ExplorarClientProps) {
    const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBookClick = (isbn: string, book: BookSearchResult) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Small delay before clearing to allow animation
        setTimeout(() => setSelectedBook(null), 200);
    };

    if (!initialCollections || initialCollections.length === 0) {
        return (
            <div className="space-y-12 animate-fade-in pb-8">
                <div className="text-center py-12">
                    <p className="text-grey/60">No hay colecciones disponibles en este momento.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-10 animate-fade-in pb-12">
                {/* Personalized Recommendation (Mock for now, could be its own component later) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-teal" />
                        <h2 className="text-xl font-serif text-teal">Para ti</h2>
                    </div>
                    <Card className="bg-gradient-to-br from-teal/5 to-cream border-teal/10 p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-bold text-teal-dark">Basado en tu actividad reciente</h3>
                            <p className="text-sm text-grey/80">Porque guardaste libros de fantasía épica, creemos que estas historias llenas de mundos complejos y magia antigua te encantarán.</p>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar max-w-full md:max-w-[50%]">
                            {/* Taking a few books from the first available collection just to show something interesting */}
                            {initialCollections[0]?.books.slice(0, 3).map((book) => (
                                <div
                                    key={book.isbn || book.id || String(Math.random())}
                                    className="shrink-0 w-24 snap-start cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => handleBookClick(book.isbn || book.id || '', book)}
                                >
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} className="w-full h-36 object-cover rounded shadow-sm" />
                                    ) : (
                                        <div className="w-full h-36 bg-teal/10 rounded flex items-center justify-center text-xs text-center p-2 text-teal-dark border border-teal/20">
                                            {book.title}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* Metric Sections (from public explore) */}
                <div className="space-y-12 text-teal">
                    {initialCollections.map((collection) => (
                        <MetricSection
                            key={collection.id}
                            collection={collection}
                            onBookClick={handleBookClick}
                        />
                    ))}
                </div>

                {/* Community Trends */}
                <section>
                    <h2 className="text-xl font-serif text-teal mb-4">Tendencias en la comunidad</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="p-5 hover:border-teal/30 transition-colors cursor-pointer group">
                            <p className="text-xs font-bold text-teal/50 uppercase tracking-widest mb-1">Club más activo</p>
                            <h3 className="text-md font-bold text-grey group-hover:text-teal transition-colors">Lectores de Fantasía Épica</h3>
                            <p className="text-sm text-grey/60 mt-2 line-clamp-2">Comentando actualmente "El Archivo de las Tormentas". ¡Únete a la discusión del capítulo 5!</p>
                            <div className="mt-3 text-xs text-teal font-medium">124 miembros activos hoy</div>
                        </Card>
                        <Card className="p-5 hover:border-teal/30 transition-colors cursor-pointer group">
                            <p className="text-xs font-bold text-teal/50 uppercase tracking-widest mb-1">Debate candente</p>
                            <h3 className="text-md font-bold text-grey group-hover:text-teal transition-colors">¿El final de Proyecto Hail Mary?</h3>
                            <p className="text-sm text-grey/60 mt-2 line-clamp-2">Spoilers permitidos. Discutiendo las implicaciones físicas del final.</p>
                            <div className="mt-3 text-xs text-teal font-medium">89 comentarios nuevos</div>
                        </Card>
                        <Card className="p-5 hover:border-teal/30 transition-colors cursor-pointer group">
                            <p className="text-xs font-bold text-teal/50 uppercase tracking-widest mb-1">Reseña destacada</p>
                            <h3 className="text-md font-bold text-grey group-hover:text-teal transition-colors">"Una obra maestra imperfecta"</h3>
                            <p className="text-sm text-grey/60 mt-2 line-clamp-2">Análisis profundo sobre el desarrollo de personajes en Babel por R.F. Kuang.</p>
                            <div className="mt-3 text-xs text-teal font-medium">Por @saraleetodo</div>
                        </Card>
                    </div>
                </section>
            </div>

            {/* Book Preview Modal */}
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

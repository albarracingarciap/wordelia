"use client";

import { useState } from "react";
import { ExploreHero } from "@/components/explorar/ExploreHero";
import { MetricSection } from "@/components/explorar/MetricSection";
import { BookPreviewModal } from "@/components/explorar/BookPreviewModal";
import { CTASection } from "@/components/explorar/CTASection";
import { BookSearchResult } from "@/lib/isbndb";
import type { CuratedCollectionWithBooks } from "./actions";

interface ExplorarPageClientProps {
    initialCollections: CuratedCollectionWithBooks[];
}

export default function ExplorarPageClient({ initialCollections }: ExplorarPageClientProps) {
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
                <ExploreHero />
                <div className="text-center py-12">
                    <p className="text-grey/60">No hay colecciones disponibles en este momento.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Hero Section */}
                <ExploreHero />

                {/* Metric Sections */}
                {initialCollections.map((collection) => (
                    <MetricSection
                        key={collection.id}
                        collection={collection}
                        onBookClick={handleBookClick}
                    />
                ))}

                {/* CTA Section */}
                <CTASection />
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

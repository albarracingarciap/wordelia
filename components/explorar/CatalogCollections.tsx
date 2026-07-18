"use client";

import { useState } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PublicBook, PublicCollection } from "@/app/explorar/actions";
import { CatalogBookCard } from "./CatalogBookCard";
import { BookPreviewModal } from "./BookPreviewModal";
import type { BookSearchResult } from "@/lib/isbndb";

const COLOR_THEMES: Record<string, { gradient: string; accent: string; bg: string }> = {
    "red-orange": { gradient: "from-red-50 to-orange-50", accent: "text-red-600", bg: "bg-red-500/10" },
    "blue-purple": { gradient: "from-blue-50 to-purple-50", accent: "text-blue-600", bg: "bg-blue-500/10" },
    "yellow-orange": { gradient: "from-yellow-50 to-orange-50", accent: "text-yellow-700", bg: "bg-yellow-500/10" },
    "green-gold": { gradient: "from-green-50 to-yellow-50", accent: "text-green-700", bg: "bg-green-500/10" },
    "blue-grey": { gradient: "from-blue-50 to-grey/10", accent: "text-blue-700", bg: "bg-blue-500/10" },
};

const iconMap = LucideIcons as unknown as Record<string, LucideIcon | undefined>;

function toPascalCaseIcon(icon: string) {
    return icon.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

/**
 * El modal está escrito contra BookSearchResult (la forma de ISBNdb). Aquí se
 * adapta el libro del catálogo a esa forma para no duplicar el componente.
 */
function toSearchResult(book: PublicBook): BookSearchResult {
    return {
        id: book.id,
        title: book.title,
        authors: book.author ? [book.author] : [],
        cover_url: book.coverUrl,
        description: book.description,
        isbn: book.isbn,
        isbn13: book.isbn,
        page_count: book.pageCount,
        published_date: book.publishedDate,
        publisher: book.publisher,
        categories: [],
        average_rating: null,
        ratings_count: null,
        language: null,
        price: null,
        source: "db",
    };
}

export function CollectionSection({
    collection,
    showAllLink = true,
    onBookClick,
}: {
    collection: PublicCollection;
    showAllLink?: boolean;
    onBookClick: (book: PublicBook, collection: PublicCollection) => void;
}) {
    const theme = COLOR_THEMES[collection.colorTheme] || COLOR_THEMES["blue-grey"];
    const Icon = iconMap[toPascalCaseIcon(collection.icon)] || LucideIcons.BookOpen;
    const hasMore = collection.totalBooks > collection.books.length;

    if (collection.books.length === 0) return null;

    return (
        <section className="space-y-4 md:space-y-6">
            <div className={`rounded-2xl border border-grey/10 bg-gradient-to-r ${theme.gradient} p-4 sm:p-5 md:p-8`}>
                <div className="flex items-start gap-3 md:gap-4">
                    <div className={`${theme.bg} shrink-0 rounded-xl p-2.5 md:p-3`}>
                        <Icon className={`h-6 w-6 md:h-8 md:w-8 ${theme.accent}`} aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className={`text-xl font-semibold leading-tight md:text-3xl ${theme.accent}`}>
                                {collection.name}
                            </h2>
                            {showAllLink && hasMore && (
                                <Link
                                    href={`/explorar/${collection.slug}`}
                                    className={`text-sm font-semibold ${theme.accent} hover:underline`}
                                >
                                    Ver los {collection.totalBooks} →
                                </Link>
                            )}
                        </div>
                        <p className="mb-2 mt-1 text-sm leading-relaxed text-grey/70 md:text-base">
                            {collection.description}
                        </p>
                        <p className={`text-xs font-medium italic md:text-sm ${theme.accent} opacity-80`}>
                            &ldquo;{collection.tagLine}&rdquo;
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {collection.books.map((book) => (
                    <CatalogBookCard
                        key={book.id}
                        book={book}
                        onClick={() => onBookClick(book, collection)}
                    />
                ))}
            </div>
        </section>
    );
}

/** Envoltorio con el modal compartido por /explorar y /explorar/[slug]. */
export function CatalogCollections({
    collections,
    showAllLink = true,
}: {
    collections: PublicCollection[];
    showAllLink?: boolean;
}) {
    const [selected, setSelected] = useState<{ book: PublicBook; collection: PublicCollection } | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (book: PublicBook, collection: PublicCollection) => {
        setSelected({ book, collection });
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setTimeout(() => setSelected(null), 200);
    };

    return (
        <>
            <div className="space-y-10 md:space-y-14">
                {collections.map((collection) => (
                    <CollectionSection
                        key={collection.id}
                        collection={collection}
                        showAllLink={showAllLink}
                        onBookClick={handleClick}
                    />
                ))}
            </div>

            {selected && (
                <BookPreviewModal
                    book={toSearchResult(selected.book)}
                    bookId={selected.book.id}
                    collection={{
                        name: selected.collection.name,
                        description: selected.collection.description,
                        tag_line: selected.collection.tagLine,
                    }}
                    isOpen={isOpen}
                    onClose={close}
                />
            )}
        </>
    );
}

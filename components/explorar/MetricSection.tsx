"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookSearchResult } from "@/lib/isbndb";
import { ExploreBookCard } from "./ExploreBookCard";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricSectionProps {
    collection: {
        id: string;
        slug: string;
        name: string;
        description: string;
        tag_line: string;
        icon: string;
        color_theme: string;
        books: BookSearchResult[];
    };
    onBookClick: (isbn: string, book: BookSearchResult) => void;
}

const COLOR_THEMES: Record<string, { gradient: string; accent: string; bg: string }> = {
    "red-orange": {
        gradient: "from-red-50 to-orange-50",
        accent: "text-red-600",
        bg: "bg-red-500/10",
    },
    "blue-purple": {
        gradient: "from-blue-50 to-purple-50",
        accent: "text-blue-600",
        bg: "bg-blue-500/10",
    },
    "yellow-orange": {
        gradient: "from-yellow-50 to-orange-50",
        accent: "text-yellow-700",
        bg: "bg-yellow-500/10",
    },
    "green-gold": {
        gradient: "from-green-50 to-yellow-50",
        accent: "text-green-700",
        bg: "bg-green-500/10",
    },
    "blue-grey": {
        gradient: "from-blue-50 to-grey/10",
        accent: "text-blue-700",
        bg: "bg-blue-500/10",
    },
};

const iconMap = LucideIcons as unknown as Record<string, LucideIcon | undefined>;

function toPascalCaseIcon(icon: string) {
    return icon
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
}

function BookCarousel({
    books,
    colorAccent,
    onBookClick,
}: {
    books: BookSearchResult[];
    colorAccent: string;
    onBookClick: (isbn: string, book: BookSearchResult) => void;
}) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const updateScrollState = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
        setCanScrollPrev(scroller.scrollLeft > 4);
        setCanScrollNext(scroller.scrollLeft < maxScrollLeft - 4);
    }, []);

    useEffect(() => {
        updateScrollState();
        window.addEventListener("resize", updateScrollState);
        return () => window.removeEventListener("resize", updateScrollState);
    }, [books.length, updateScrollState]);

    const scrollByPage = (direction: "prev" | "next") => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        scroller.scrollBy({
            left: direction === "next" ? scroller.clientWidth * 0.9 : -scroller.clientWidth * 0.9,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative overflow-hidden lg:hidden">
            <div
                ref={scrollerRef}
                onScroll={updateScrollState}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 hide-scrollbar"
            >
                {books.map((book, index) => (
                    <div
                        key={book.isbn || book.id || `${book.title}-${index}`}
                        className="min-w-0 shrink-0 basis-[132px] snap-start sm:basis-[148px] md:basis-[156px]"
                    >
                        <ExploreBookCard
                            book={book}
                            onClick={() => onBookClick(book.isbn || book.id || "", book)}
                            colorAccent={colorAccent}
                            className="w-full"
                        />
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => scrollByPage("prev")}
                disabled={!canScrollPrev}
                className="absolute left-2 top-[82px] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-teal/10 bg-white/95 text-teal shadow-md backdrop-blur transition-all hover:border-teal/25 hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:top-[92px]"
                aria-label="Ver libros anteriores"
            >
                <LucideIcons.ChevronLeft className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => scrollByPage("next")}
                disabled={!canScrollNext}
                className="absolute right-2 top-[82px] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-teal/10 bg-white/95 text-teal shadow-md backdrop-blur transition-all hover:border-teal/25 hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:top-[92px]"
                aria-label="Ver libros siguientes"
            >
                <LucideIcons.ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

export function MetricSection({ collection, onBookClick }: MetricSectionProps) {
    const theme = COLOR_THEMES[collection.color_theme] || COLOR_THEMES["blue-grey"];
    const IconComponent = iconMap[toPascalCaseIcon(collection.icon)] || LucideIcons.BookOpen;

    return (
        <section className="space-y-4 md:space-y-6">
            <div className={`rounded-2xl border border-grey/10 bg-gradient-to-r ${theme.gradient} p-4 sm:p-5 md:p-8`}>
                <div className="flex items-start gap-3 md:gap-4">
                    <div className={`${theme.bg} shrink-0 rounded-xl p-2.5 md:p-3`}>
                        <IconComponent className={`h-6 w-6 md:h-8 md:w-8 ${theme.accent}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className={`mb-1 text-xl font-semibold leading-tight md:mb-2 md:text-3xl ${theme.accent}`}>
                            {collection.name}
                        </h2>
                        <p className="mb-2 text-sm leading-relaxed text-grey/70 md:text-base">
                            {collection.description}
                        </p>
                        <p className={`text-xs font-medium italic md:text-sm ${theme.accent} opacity-80`}>
                            &ldquo;{collection.tag_line}&rdquo;
                        </p>
                    </div>
                </div>
            </div>

            <BookCarousel
                books={collection.books}
                colorAccent={theme.accent}
                onBookClick={onBookClick}
            />

            <div className="hidden grid-cols-6 gap-6 lg:grid">
                {collection.books.map((book, index) => (
                    <ExploreBookCard
                        key={book.isbn || book.id || `${book.title}-${index}`}
                        book={book}
                        onClick={() => onBookClick(book.isbn || book.id || "", book)}
                        colorAccent={theme.accent}
                        className="min-w-0"
                    />
                ))}
            </div>
        </section>
    );
}

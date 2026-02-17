"use client";

import { BookSearchResult } from "@/lib/isbndb";
import { ExploreBookCard } from "./ExploreBookCard";
import * as LucideIcons from "lucide-react";

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

// Color theme configurations
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

export function MetricSection({ collection, onBookClick }: MetricSectionProps) {
    const theme = COLOR_THEMES[collection.color_theme] || COLOR_THEMES["blue-grey"];

    // Get the icon component dynamically
    const IconComponent = (LucideIcons as any)[
        collection.icon
            .split("-")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("")
    ] || LucideIcons.BookOpen;

    return (
        <section className="space-y-6">
            {/* Section Header */}
            <div className={`bg-gradient-to-r ${theme.gradient} rounded-2xl p-6 md:p-8 border border-grey/10`}>
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`${theme.bg} rounded-xl p-3 shrink-0`}>
                        <IconComponent className={`w-8 h-8 ${theme.accent}`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                        <h2 className={`text-2xl md:text-3xl font-serif mb-2 ${theme.accent}`}>
                            {collection.name}
                        </h2>
                        <p className="text-grey/70 mb-2 text-sm md:text-base">
                            {collection.description}
                        </p>
                        <p className={`text-xs md:text-sm font-medium italic ${theme.accent} opacity-80`}>
                            "{collection.tag_line}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {collection.books.map((book) => (
                    <ExploreBookCard
                        key={book.isbn || book.id}
                        book={book}
                        onClick={() => onBookClick(book.isbn || book.id, book)}
                        colorAccent={theme.accent}
                    />
                ))}
            </div>
        </section>
    );
}

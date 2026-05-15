"use client";

import Image from "next/image";
import { BookSearchResult } from "@/lib/isbndb";
import { useState } from "react";

interface ExploreBookCardProps {
    book: BookSearchResult;
    onClick: () => void;
    colorAccent?: string;
    className?: string;
}

export function ExploreBookCard({ book, onClick, colorAccent = "text-teal", className = "" }: ExploreBookCardProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-start rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-teal/50 ${className}`}
        >
            {/* Book Cover */}
            <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden rounded-lg border border-black/5 bg-grey/10 shadow-sm transition-all group-hover:border-teal/20 group-hover:shadow-md md:mb-3">
                {book.cover_url && !imageError ? (
                    <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 144px, (max-width: 1024px) 33vw, 16vw"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                        <p className="text-xs text-grey/60 text-center font-serif line-clamp-3">
                            {book.title}
                        </p>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]" />
            </div>

            {/* Book Info */}
            <div className="w-full">
                <h3 className="mb-1 line-clamp-2 text-sm font-medium text-grey transition-colors group-hover:text-teal">
                    {book.title}
                </h3>
                <p className="line-clamp-1 text-xs text-grey/60">
                    {book.authors.join(", ")}
                </p>
            </div>

            {/* Click indicator */}
            <div className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 ${colorAccent}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}

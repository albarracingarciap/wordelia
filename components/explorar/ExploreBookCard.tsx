"use client";

import Image from "next/image";
import { BookSearchResult } from "@/lib/isbndb";
import { useState } from "react";

interface ExploreBookCardProps {
    book: BookSearchResult;
    onClick: () => void;
    colorAccent?: string;
}

export function ExploreBookCard({ book, onClick, colorAccent = "text-teal" }: ExploreBookCardProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-start text-left transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal/50 rounded-lg"
        >
            {/* Book Cover */}
            <div className="relative w-full aspect-[2/3] bg-grey/10 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow mb-3">
                {book.cover_url && !imageError ? (
                    <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                        <p className="text-xs text-grey/60 text-center font-serif line-clamp-3">
                            {book.title}
                        </p>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Book Info */}
            <div className="w-full">
                <h3 className="text-sm font-medium text-grey line-clamp-2 mb-1 group-hover:text-teal transition-colors">
                    {book.title}
                </h3>
                <p className="text-xs text-grey/60 line-clamp-1">
                    {book.authors.join(", ")}
                </p>
            </div>

            {/* Click indicator */}
            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${colorAccent}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}

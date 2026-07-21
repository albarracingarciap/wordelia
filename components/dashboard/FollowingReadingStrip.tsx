"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getFollowingCurrentlyReading, type FollowingReadingItem } from "./actions";

/** Tira de portadas: qué leen ahora las personas que sigues (aunque no tengan actividad). */
export function FollowingReadingStrip() {
    const [items, setItems] = React.useState<FollowingReadingItem[] | null>(null);

    React.useEffect(() => {
        getFollowingCurrentlyReading(12).then(setItems).catch(() => setItems([]));
    }, []);

    if (!items || items.length === 0) return null;

    return (
        <div className="border-b border-teal/5 bg-cream/20 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-grey/45">Leyendo ahora</p>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
                {items.map((it, i) => (
                    <Link
                        key={`${it.userId}-${it.bookId}-${i}`}
                        href={`/app/libros/${it.bookId}`}
                        title={`${it.userName} · ${it.bookTitle}`}
                        className="relative shrink-0"
                    >
                        <div className="h-16 w-11 overflow-hidden rounded border border-teal/10 bg-teal/5 shadow-sm">
                            {it.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={it.coverUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-teal/40" />
                                </div>
                            )}
                        </div>
                        {it.avatar && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.avatar} alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white object-cover" />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}

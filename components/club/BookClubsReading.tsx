"use client";

import * as React from "react";
import { getClubsReadingBook, type BookClub } from "@/app/app/clubs/book-clubs-actions";
import { ClubsReadingView } from "@/components/club/ClubsReadingView";

/** Envoltorio cliente de "Clubs leyendo este libro" para la ficha in-app. */
export function BookClubsReading({ bookId }: { bookId: string | null }) {
    const [clubs, setClubs] = React.useState<BookClub[]>([]);

    React.useEffect(() => {
        let alive = true;
        if (!bookId) return;
        getClubsReadingBook(bookId).then((c) => { if (alive) setClubs(c); }).catch(() => {});
        return () => { alive = false; };
    }, [bookId]);

    if (clubs.length === 0) return null;
    return (
        <div className="mt-8">
            <ClubsReadingView clubs={clubs} />
        </div>
    );
}

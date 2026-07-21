"use client";

import * as React from "react";
import { getBookRecommenders, type BookRecommender } from "@/app/app/librerias/recommendation-actions";
import { RecommendersView } from "@/components/librerias/RecommendersView";

/**
 * Envoltorio cliente de "Recomendado por librerías" para superficies que resuelven
 * el libro en el cliente (ficha in-app). Se auto-consulta por book_id y/o ISBN.
 */
export function BookRecommenders({ bookId, isbn }: { bookId: string | null; isbn: string | null }) {
    const [recommenders, setRecommenders] = React.useState<BookRecommender[]>([]);

    React.useEffect(() => {
        let alive = true;
        if (!bookId && !isbn) return;
        getBookRecommenders(bookId, isbn).then((r) => { if (alive) setRecommenders(r); }).catch(() => {});
        return () => { alive = false; };
    }, [bookId, isbn]);

    if (recommenders.length === 0) return null;
    return (
        <div className="mt-8">
            <RecommendersView recommenders={recommenders} />
        </div>
    );
}

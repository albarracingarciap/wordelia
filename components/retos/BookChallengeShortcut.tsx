"use client";

import * as React from "react";
import Link from "next/link";
import { Trophy, Check, Loader2, ChevronRight } from "lucide-react";
import { challengeGoalLabel } from "@/lib/challenges";
import {
    getManualChallengesForBook,
    attributeBookToChallenge,
    removeBookFromChallenge,
    type ManualChallengeForBook,
} from "@/app/app/retos/actions";

/**
 * Atajo en la ficha del libro: marcar que este libro (leído) cuenta para un reto
 * curado. Solo aparece si el libro está leído y hay retos manuales activos.
 */
export function BookChallengeShortcut({ bookId, status }: { bookId: string | null; status: string | null }) {
    const [items, setItems] = React.useState<ManualChallengeForBook[] | null>(null);
    const [busyId, setBusyId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const eligible = !!bookId && status === "READ";

    React.useEffect(() => {
        if (!eligible || !bookId) { setItems(null); return; }
        let alive = true;
        getManualChallengesForBook(bookId).then((r) => { if (alive) setItems(r); });
        return () => { alive = false; };
    }, [bookId, eligible]);

    if (!eligible || !items || items.length === 0) return null;

    const toggle = async (c: ManualChallengeForBook) => {
        if (!bookId) return;
        setBusyId(c.id); setError(null);
        const res = c.attributed
            ? await removeBookFromChallenge(c.id, bookId)
            : await attributeBookToChallenge(c.id, bookId);
        setBusyId(null);
        if (res.error) { setError(res.error); return; }
        setItems((prev) => prev!.map((x) => (x.id === c.id ? { ...x, attributed: !x.attributed } : x)));
    };

    return (
        <div className="mb-8 rounded-2xl border border-teal/10 bg-white p-4 text-left shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-coral" />
                <h3 className="font-serif text-base font-bold text-teal">Cuenta para un reto</h3>
            </div>
            <p className="mb-3 text-sm text-grey/60">Marca este libro como parte de uno de tus retos temáticos.</p>

            <ul className="space-y-2">
                {items.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                        <button
                            onClick={() => toggle(c)}
                            disabled={busyId === c.id}
                            className="flex flex-1 items-center gap-3 rounded-xl border border-grey/10 px-3 py-2 text-left transition-colors hover:bg-cream/50 disabled:opacity-60"
                        >
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${c.attributed ? "border-teal bg-teal text-white" : "border-grey/25 text-transparent"}`}>
                                {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-teal" /> : <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-teal">{c.title}</span>
                                <span className="block text-xs text-grey/55">{challengeGoalLabel("manual", c.goalTarget, null)}</span>
                            </span>
                        </button>
                        <Link href={`/app/retos/${c.id}`} className="shrink-0 rounded-full p-1.5 text-grey/40 transition-colors hover:text-teal" title="Ver reto">
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </li>
                ))}
            </ul>
            {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
        </div>
    );
}

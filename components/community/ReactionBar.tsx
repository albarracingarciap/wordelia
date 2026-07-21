"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { setReaction, type ReactionState } from "@/app/app/comunidad/actions";
import { REACTIONS } from "@/lib/community-reactions";

/** Barra de reacciones con emoji (una por usuario, cambiable). Optimista. */
export function ReactionBar({ activityId, initial }: { activityId: string; initial?: ReactionState }) {
    const [counts, setCounts] = React.useState<Record<string, number>>(initial?.counts ?? {});
    const [mine, setMine] = React.useState<string | null>(initial?.mine ?? null);
    const [pickerOpen, setPickerOpen] = React.useState(false);

    const react = (emoji: string) => {
        setPickerOpen(false);
        // Optimista.
        setCounts((prev) => {
            const next = { ...prev };
            if (mine === emoji) { next[emoji] = Math.max(0, (next[emoji] ?? 1) - 1); }
            else {
                if (mine) next[mine] = Math.max(0, (next[mine] ?? 1) - 1);
                next[emoji] = (next[emoji] ?? 0) + 1;
            }
            return next;
        });
        setMine((m) => (m === emoji ? null : emoji));
        void setReaction(activityId, emoji);
    };

    const active = REACTIONS.filter((e) => (counts[e] ?? 0) > 0);

    return (
        <div className="relative flex items-center gap-1">
            {active.map((e) => (
                <button
                    key={e}
                    onClick={() => react(e)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${mine === e ? "border-teal/40 bg-teal/10 text-teal-dark" : "border-teal/10 bg-white text-grey/70 hover:bg-teal/5"}`}
                >
                    <span>{e}</span>
                    <span className="font-semibold">{counts[e]}</span>
                </button>
            ))}

            <button
                onClick={() => setPickerOpen((v) => !v)}
                title="Reaccionar"
                className="flex h-7 w-7 items-center justify-center rounded-full text-grey/40 transition-colors hover:bg-teal/5 hover:text-teal"
            >
                <SmilePlus className="h-4 w-4" />
            </button>

            {pickerOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
                    <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border border-teal/15 bg-white px-2 py-1.5 shadow-lg">
                        {REACTIONS.map((e) => (
                            <button
                                key={e}
                                onClick={() => react(e)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 ${mine === e ? "bg-teal/10" : "hover:bg-cream/60"}`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

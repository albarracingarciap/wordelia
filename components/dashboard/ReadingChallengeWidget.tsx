"use client";

import * as React from "react";
import { Target, Trophy, Pencil, Check, X, Loader2 } from "lucide-react";
import { getReadingChallenge, setReadingGoalAction, type ReadingChallenge } from "@/app/app/mi-lectura/challenge-actions";
import { ShareChallengeButton } from "./ShareChallengeButton";

export function ReadingChallengeWidget() {
    const [challenge, setChallenge] = React.useState<ReadingChallenge | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [editing, setEditing] = React.useState(false);
    const [input, setInput] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        const data = await getReadingChallenge();
        setChallenge(data);
        setLoading(false);
        if (data && !data.target) setEditing(true); // sin meta → invita a fijarla
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        const target = parseInt(input, 10);
        if (!Number.isFinite(target) || target < 1) {
            setError("Escribe un número de libros.");
            return;
        }
        setSaving(true);
        setError(null);
        const res = await setReadingGoalAction(challenge!.year, target);
        setSaving(false);
        if ("error" in res) {
            setError(res.error);
            return;
        }
        setEditing(false);
        await load();
    };

    if (loading || !challenge) {
        return <div className="h-28 animate-pulse rounded-2xl bg-teal/5" />;
    }

    const { year, target, booksRead } = challenge;
    const pct = target ? Math.min(100, Math.round((booksRead / target) * 100)) : 0;
    const achieved = target != null && booksRead >= target;

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal">
                        {achieved ? <Trophy className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                    </span>
                    <div>
                        <p className="text-sm font-bold text-teal-dark">Reto de lectura {year}</p>
                        {target != null && !editing && (
                            <p className="text-xs text-grey/60">
                                {achieved ? "¡Reto conseguido!" : `${target - booksRead} para tu meta`}
                            </p>
                        )}
                    </div>
                </div>
                {target != null && !editing && (
                    <div className="flex items-center gap-2">
                        {challenge.goalId && <ShareChallengeButton goalId={challenge.goalId} />}
                        <button
                            onClick={() => {
                                setInput(String(target));
                                setEditing(true);
                            }}
                            className="text-grey/40 transition-colors hover:text-teal"
                            title="Editar meta"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className="space-y-2">
                    <p className="text-sm text-grey/70">¿Cuántos libros quieres leer en {year}?</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ej. 24"
                            className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
                            autoFocus
                        />
                        <button
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Fijar meta
                        </button>
                        {target != null && (
                            <button onClick={() => setEditing(false)} className="text-grey/50 transition-colors hover:text-grey" title="Cancelar">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {error && <p className="text-xs text-coral">{error}</p>}
                </div>
            ) : (
                <>
                    <div className="mb-1.5 flex items-end justify-between">
                        <span className="text-2xl font-bold text-teal-dark">
                            {booksRead} <span className="text-base font-medium text-grey/50">/ {target} libros</span>
                        </span>
                        <span className="text-sm font-semibold text-teal">{pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-teal/10">
                        <div className={`h-full rounded-full transition-all ${achieved ? "bg-coral" : "bg-teal"}`} style={{ width: `${pct}%` }} />
                    </div>
                </>
            )}
        </div>
    );
}

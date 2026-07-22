"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trophy, Loader2, Check, CalendarClock, Users, Award } from "lucide-react";
import { joinChallenge, type RetoItem } from "./actions";
import { challengeGoalLabel } from "@/lib/challenges";

function formatRange(start: string | null, end: string | null) {
    const f = (d: string) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    if (start && end) return `${f(start)} – ${f(end)}`;
    if (end) return `Hasta el ${f(end)}`;
    if (start) return `Desde el ${f(start)}`;
    return "Sin fechas";
}

function RetoCard({ reto }: { reto: RetoItem }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const target = reto.goalTarget ?? 0;
    const pct = target > 0 ? Math.min(100, Math.round((reto.progress / target) * 100)) : 0;

    const join = async () => {
        setBusy(true); setError(null);
        const res = await joinChallenge(reto.id);
        setBusy(false);
        if ("error" in res && res.error) { setError(res.error); return; }
        router.refresh();
    };

    return (
        <div className={`flex flex-col rounded-2xl border p-5 shadow-sm ${reto.completed ? "border-teal/30 bg-teal/5" : "border-teal/10 bg-card"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-serif text-lg font-medium text-teal">{reto.title}</h3>
                    <p className="mt-1 text-sm font-medium text-teal-dark">{challengeGoalLabel(reto.goalType, reto.goalTarget, reto.goalGenre)}</p>
                </div>
                {reto.completed && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal px-2.5 py-1 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" /> Completado</span>}
            </div>

            {reto.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{reto.description}</p>}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatRange(reto.startDate, reto.endDate)}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {reto.participants} participante{reto.participants === 1 ? "" : "s"}</span>
                {reto.rewardBadgeName && <span className="inline-flex items-center gap-1 text-coral"><Award className="h-3.5 w-3.5" /> {reto.rewardBadgeName}</span>}
            </div>

            {reto.joined && !reto.completed && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Tu progreso</span>
                        <span>{reto.progress}/{target}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal/10">
                        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
                    </div>
                </div>
            )}

            <div className="mt-4">
                {reto.completed ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal"><Trophy className="h-4 w-4" /> ¡Reto conseguido!</span>
                ) : reto.joined ? (
                    <span className="text-sm font-medium text-teal">Estás participando</span>
                ) : !reto.active ? (
                    <span className="text-sm text-muted-foreground">Reto finalizado</span>
                ) : (
                    <button
                        onClick={join}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Unirme al reto
                    </button>
                )}
                {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
            </div>
        </div>
    );
}

export default function RetosClient({ retos }: { retos: RetoItem[] }) {
    if (retos.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-teal/20 bg-cream/30 p-10 text-center">
                <Trophy className="mx-auto mb-3 h-10 w-10 text-teal/30" />
                <p className="text-sm text-muted-foreground">Todavía no hay retos activos. Vuelve pronto: iremos proponiendo retos para la comunidad.</p>
            </div>
        );
    }
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            {retos.map((r) => <RetoCard key={r.id} reto={r} />)}
        </div>
    );
}

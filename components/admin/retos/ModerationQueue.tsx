"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Calendar, Inbox } from "lucide-react";
import { challengeGoalLabel } from "@/lib/challenges";
import { approveCommunityChallenge, rejectCommunityChallenge, type PendingProposal } from "@/app/app/admin/retos/nuevo/actions";

export function ModerationQueue({ proposals }: { proposals: PendingProposal[] }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const act = async (id: string, kind: "approve" | "reject") => {
        setBusy(`${kind}:${id}`);
        setError(null);
        const res = kind === "approve" ? await approveCommunityChallenge(id) : await rejectCommunityChallenge(id);
        setBusy(null);
        if (res && "error" in res && res.error) { setError(res.error); return; }
        router.refresh();
    };

    return (
        <section className="rounded-xl border border-coral/25 bg-coral/5 p-5">
            <div className="mb-4 flex items-center gap-2">
                <Inbox className="h-5 w-5 text-coral" />
                <h2 className="text-lg font-bold text-teal">Propuestas de la comunidad</h2>
                <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">{proposals.length}</span>
            </div>

            {error && <p className="mb-3 text-sm font-medium text-coral">{error}</p>}

            {proposals.length === 0 ? (
                <p className="text-sm text-grey/60">No hay propuestas pendientes de revisar.</p>
            ) : (
                <div className="space-y-3">
                    {proposals.map((p) => (
                        <div key={p.id} className="rounded-lg border border-border bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-teal">{p.title}</h3>
                                    <p className="mt-0.5 text-sm font-medium text-teal-dark">{challengeGoalLabel(p.goalType, p.goalTarget, p.goalGenre)}</p>
                                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                                            {p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}{" – "}{p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
                                        </span>
                                        <span>Propuesto por <strong>{p.authorName ?? "Un lector"}</strong></span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        onClick={() => act(p.id, "approve")}
                                        disabled={!!busy}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-sm font-bold text-white hover:bg-teal-dark disabled:opacity-50"
                                    >
                                        {busy === `approve:${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Aprobar
                                    </button>
                                    <button
                                        onClick={() => act(p.id, "reject")}
                                        disabled={!!busy}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-coral/40 px-3 py-1.5 text-sm font-bold text-coral hover:bg-coral/10 disabled:opacity-50"
                                    >
                                        {busy === `reject:${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

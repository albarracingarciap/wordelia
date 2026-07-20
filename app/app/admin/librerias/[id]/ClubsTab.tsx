"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, Archive, ArchiveRestore, Unlink, ExternalLink, BookOpen, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { OrgClub } from "../data";
import { setClubArchivedAction, unlinkClubAction } from "../actions";

export function ClubsTab({ orgId, clubs }: { orgId: string; clubs: OrgClub[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const run = (fn: () => Promise<{ success: true } | { error: string }>, okMsg: string) => {
        setFeedback(null);
        startTransition(async () => {
            const res = await fn();
            if ("error" in res) setFeedback({ ok: false, msg: res.error });
            else {
                setFeedback({ ok: true, msg: okMsg });
                router.refresh();
            }
        });
    };

    if (clubs.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-teal/20 p-10 text-center text-muted-foreground max-w-3xl">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Esta librería no aloja ningún club todavía.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">{clubs.length} {clubs.length === 1 ? "club alojado" : "clubs alojados"}.</p>

            {feedback && (
                <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${feedback.ok ? "bg-teal/10 text-teal-dark border border-teal/20" : "bg-coral/10 text-coral border border-coral/20"}`}>
                    {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            <div className="space-y-2">
                {clubs.map((c) => (
                    <div
                        key={c.id}
                        className={`rounded-lg border p-3 flex items-center gap-3 flex-wrap ${c.isArchived ? "border-teal/10 bg-muted/30 opacity-80" : "border-teal/10 bg-card"}`}
                    >
                        {c.coverUrl ? (
                            <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden shadow-sm">
                                <Image src={c.coverUrl} alt={c.name} fill className="object-cover" sizes="40px" />
                            </div>
                        ) : (
                            <div className="w-10 h-14 shrink-0 rounded bg-grey/10 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-grey/40" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm truncate">{c.name}</span>
                                {c.isOfficial && <span className="text-[10px] font-semibold text-teal-dark bg-teal/15 px-1.5 py-0.5 rounded">Oficial</span>}
                                {c.isArchived && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Archivado</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {c.currentBookTitle ? `Leyendo: ${c.currentBookTitle}` : "Sin lectura actual"} · {c.membersCount} {c.membersCount === 1 ? "miembro" : "miembros"}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <Link href={`/app/clubs/${c.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-dark" title="Ver club">
                                <ExternalLink className="w-3.5 h-3.5" /> Ver
                            </Link>
                            <button
                                disabled={pending}
                                onClick={() => run(() => setClubArchivedAction(orgId, c.id, !c.isArchived), c.isArchived ? "Club restaurado." : "Club archivado.")}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                                {c.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                {c.isArchived ? "Restaurar" : "Archivar"}
                            </button>
                            <button
                                disabled={pending}
                                onClick={() => { if (confirm("¿Desvincular este club de la librería? El club seguirá existiendo, pero deja de estar alojado aquí.")) run(() => unlinkClubAction(orgId, c.id), "Club desvinculado."); }}
                                className="inline-flex items-center gap-1 text-xs text-coral hover:underline disabled:opacity-50"
                            >
                                <Unlink className="w-3.5 h-3.5" /> Desvincular
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

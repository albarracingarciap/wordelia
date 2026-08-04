"use client";

import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import Link from "next/link";
import { Radio, CalendarClock, Plus, Trash2, ChevronRight, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
    getLiveSessions,
    createLiveSession,
    deleteLiveSession,
    type LiveSession,
    type AgendaBlock,
} from "@/app/app/clubs/[id]/session-actions";

function fmtWhen(iso: string) {
    return new Date(iso).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ClubLiveSessions({ clubId, isManager }: { clubId: string; isManager: boolean }) {
    const [sessions, setSessions] = React.useState<LiveSession[] | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Formulario de programación.
    const [title, setTitle] = React.useState("");
    const [when, setWhen] = React.useState("");
    const [duration, setDuration] = React.useState("60");
    const [agenda, setAgenda] = React.useState<AgendaBlock[]>([]);

    const refresh = React.useCallback(async () => {
        setSessions(await getLiveSessions(clubId));
    }, [clubId]);

    React.useEffect(() => { void refresh(); }, [refresh]);

    const live = sessions?.find((s) => s.status === "live") ?? null;
    const upcoming = (sessions ?? []).filter((s) => s.status === "scheduled").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    const nextScheduled = upcoming[0] ?? null;
    const past = (sessions ?? []).filter((s) => s.status === "ended");

    const resetForm = () => { setTitle(""); setWhen(""); setDuration("60"); setAgenda([]); setError(null); };

    const submit = () => {
        if (!title.trim()) { setError("Ponle un título."); return; }
        if (!when) { setError("Elige fecha y hora."); return; }
        setBusy(true);
        setError(null);
        (async () => {
            const res = await createLiveSession(clubId, {
                title,
                scheduledAt: new Date(when).toISOString(),
                durationMinutes: Number(duration) || 60,
                agenda,
            });
            setBusy(false);
            if ("error" in res) { setError(res.error ?? "No se pudo programar la sesión."); return; }
            setModalOpen(false);
            resetForm();
            await refresh();
        })();
    };

    const removeSession = async (id: string) => {
        if (!(await confirmDialog({ title: "Eliminar sesión", message: "¿Eliminar esta sesión?", confirmLabel: "Eliminar", tone: "danger" }))) return;
        (async () => { await deleteLiveSession(id); await refresh(); })();
    };

    if (sessions === null) return null;
    if (sessions.length === 0 && !isManager) return null;

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-grey/40">
                    <Radio className="h-4 w-4" aria-hidden="true" /> Sesiones en vivo
                </h3>
                {isManager && (
                    <button onClick={() => { resetForm(); setModalOpen(true); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-coral">
                        <Plus className="h-4 w-4" aria-hidden="true" /> Programar
                    </button>
                )}
            </div>

            {live ? (
                <Link
                    href={`/app/clubs/${clubId}/sesion/${live.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-coral/30 bg-coral/5 p-3 transition-colors hover:bg-coral/10"
                >
                    <span className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-coral">
                            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-coral" /></span>
                            En vivo ahora
                        </span>
                        <span className="mt-0.5 block truncate font-semibold text-teal-dark">{live.title}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white">Entrar <ChevronRight className="h-3.5 w-3.5" /></span>
                </Link>
            ) : nextScheduled ? (
                <Link
                    href={`/app/clubs/${clubId}/sesion/${nextScheduled.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-teal/10 bg-cream/40 p-3 transition-colors hover:border-teal/25"
                >
                    <span className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-grey/40">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Próxima sesión
                        </span>
                        <span className="mt-0.5 block truncate font-semibold text-teal-dark">{nextScheduled.title}</span>
                        <span className="block text-xs capitalize text-grey/55">{fmtWhen(nextScheduled.scheduledAt)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-grey/30" />
                </Link>
            ) : (
                <p className="rounded-xl border border-dashed border-teal/15 bg-cream/30 p-4 text-center text-sm text-grey/50">
                    No hay sesiones programadas.
                </p>
            )}

            {/* Resto de próximas + pasadas */}
            {(upcoming.length > 1 || past.length > 0) && (
                <div className="mt-3 space-y-1.5">
                    {upcoming.slice(1).map((s) => (
                        <SessionRow key={s.id} clubId={clubId} s={s} isManager={isManager} onRemove={removeSession} />
                    ))}
                    {past.slice(0, 5).map((s) => (
                        <SessionRow key={s.id} clubId={clubId} s={s} isManager={isManager} onRemove={removeSession} ended />
                    ))}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Programar sesión en vivo">
                <div className="space-y-4">
                    <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Charla final del libro" autoFocus />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">Fecha y hora</label>
                            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-lg border border-teal/15 bg-white px-3 py-2 text-sm text-teal-dark focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">Duración (min)</label>
                            <input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-teal/15 bg-white px-3 py-2 text-sm text-teal-dark focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15" />
                        </div>
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-grey/60">Agenda (opcional)</label>
                            <button type="button" onClick={() => setAgenda([...agenda, { title: "", minutes: 10 }])} className="text-xs font-semibold text-teal hover:text-coral">+ Bloque</button>
                        </div>
                        <div className="space-y-2">
                            {agenda.map((b, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input value={b.title} onChange={(e) => setAgenda(agenda.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Tema del bloque" className="flex-1 rounded-lg border border-teal/15 bg-white px-3 py-1.5 text-sm focus:border-teal/40 focus:outline-none" />
                                    <input type="number" min={1} value={b.minutes} onChange={(e) => setAgenda(agenda.map((x, j) => j === i ? { ...x, minutes: Number(e.target.value) || 0 } : x))} className="w-16 rounded-lg border border-teal/15 bg-white px-2 py-1.5 text-sm focus:border-teal/40 focus:outline-none" />
                                    <span className="text-xs text-grey/40">min</span>
                                    <button type="button" onClick={() => setAgenda(agenda.filter((_, j) => j !== i))} className="text-grey/40 hover:text-coral"><X className="h-4 w-4" /></button>
                                </div>
                            ))}
                            {agenda.length === 0 && <p className="text-xs text-grey/40">Sin agenda: será una charla libre.</p>}
                        </div>
                    </div>

                    {error && <p className="text-sm font-medium text-coral">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={submit} disabled={busy} isLoading={busy}>Programar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function SessionRow({ clubId, s, isManager, onRemove, ended }: { clubId: string; s: LiveSession; isManager: boolean; onRemove: (id: string) => void; ended?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <Link href={`/app/clubs/${clubId}/sesion/${s.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-cream/50">
                <span className="min-w-0 truncate font-medium text-teal-dark">{s.title}</span>
                <span className={`shrink-0 text-xs ${ended ? "text-grey/40" : "text-grey/55"}`}>{ended ? "Finalizada" : new Date(s.scheduledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
            </Link>
            {isManager && !ended && (
                <button onClick={() => onRemove(s.id)} className="shrink-0 rounded p-1 text-grey/30 hover:text-coral" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
        </div>
    );
}

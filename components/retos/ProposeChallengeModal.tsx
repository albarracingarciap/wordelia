"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CHALLENGE_GOAL_TYPES } from "@/lib/challenges";
import { proposeChallenge } from "@/app/app/retos/actions";

const EMPTY = { title: "", description: "", goalType: "books", goalTarget: "3", goalGenre: "", startDate: "", endDate: "" };

export function ProposeChallengeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const router = useRouter();
    const [form, setForm] = React.useState({ ...EMPTY });
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");
    const [done, setDone] = React.useState(false);

    React.useEffect(() => {
        if (open) {
            setForm({ ...EMPTY });
            setError("");
            setDone(false);
        }
    }, [open]);

    const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));
    const inputCls = "w-full rounded-lg border border-grey/20 bg-white px-3 py-2 text-sm outline-none focus:border-teal/40";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await proposeChallenge({
            title: form.title,
            description: form.description || undefined,
            goalType: form.goalType,
            goalTarget: Number(form.goalTarget),
            goalGenre: form.goalGenre || undefined,
            startDate: form.startDate || undefined,
            endDate: form.endDate || undefined,
        });
        setBusy(false);
        if (res.error) { setError(res.error); return; }
        setDone(true);
        router.refresh();
    };

    return (
        <Transition appear show={open}>
            <Dialog as="div" className="relative z-50 focus:outline-none" onClose={() => !busy && onClose()}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-teal/10">
                        {done ? (
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                                    <CheckCircle2 className="h-7 w-7" />
                                </div>
                                <DialogTitle as="h3" className="font-serif text-xl font-bold text-teal">¡Propuesta enviada!</DialogTitle>
                                <p className="mt-2 text-sm text-grey/65">
                                    Un miembro del equipo la revisará. Si se aprueba, aparecerá en los retos de la comunidad.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="mt-6 h-11 w-full rounded-full bg-teal text-sm font-bold text-white hover:bg-teal-dark"
                                >
                                    Entendido
                                </button>
                            </div>
                        ) : (
                            <>
                                <DialogTitle as="h3" className="font-serif text-xl font-bold text-teal">Proponer un reto</DialogTitle>
                                <p className="mt-1 mb-4 text-sm text-grey/60">
                                    Propón un reto de lectura para la comunidad. Un admin lo revisará antes de publicarlo.
                                </p>

                                {error && (
                                    <div className="mb-4 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-medium text-coral">{error}</div>
                                )}

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-grey/50">Título *</label>
                                        <input className={inputCls} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ej. 5 clásicos rusos" required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-grey/50">Descripción</label>
                                        <textarea rows={2} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="¿De qué trata el reto?" />
                                    </div>

                                    <div className="rounded-lg border border-teal/15 bg-teal/5 p-3">
                                        <p className="mb-2 text-xs font-semibold text-teal-dark">Objetivo</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="block text-sm">
                                                <span className="mb-1 block text-xs font-medium text-grey/60">Tipo</span>
                                                <select className={inputCls} value={form.goalType} onChange={(e) => set({ goalType: e.target.value })}>
                                                    {CHALLENGE_GOAL_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                                                </select>
                                            </label>
                                            <label className="block text-sm">
                                                <span className="mb-1 block text-xs font-medium text-grey/60">{form.goalType === "manual" ? "Nº de libros" : "Objetivo"}</span>
                                                <input type="number" min={1} className={inputCls} value={form.goalTarget} onChange={(e) => set({ goalTarget: e.target.value })} />
                                            </label>
                                        </div>
                                        {form.goalType === "genre" && (
                                            <label className="mt-2 block text-sm">
                                                <span className="mb-1 block text-xs font-medium text-grey/60">Género</span>
                                                <input className={inputCls} value={form.goalGenre} onChange={(e) => set({ goalGenre: e.target.value })} placeholder="Ej. Ciencia ficción" />
                                            </label>
                                        )}
                                        {form.goalType === "manual" && (
                                            <p className="mt-2 text-[11px] leading-snug text-grey/55">Reto temático: cada participante elige a mano qué libros leídos cuentan.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="block text-sm">
                                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-grey/50">Inicio</span>
                                            <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
                                        </label>
                                        <label className="block text-sm">
                                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-grey/50">Fin</span>
                                            <input type="date" className={inputCls} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
                                        </label>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 text-sm font-medium text-grey/60 hover:text-teal">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={busy || !form.title.trim()} className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#C25852] disabled:opacity-50">
                                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enviar propuesta
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

"use client";

import { toast } from "@/components/ui/toast";
import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Plus, Loader2, Pencil, X, Coins, Users } from "lucide-react";
import {
    adminCreateEvent, adminUpdateEvent, adminSetEventPublished, adminDeleteEvent,
    type AdminEvent, type EventInput,
} from "./actions";

const EMPTY: EventInput = { title: "", description: "", coverUrl: "", location: "", startsAt: "", priceCoins: 0, capacity: null };

// La fecha ISO → valor para <input type="datetime-local"> (local, sin zona).
function toLocalInput(iso: string): string {
    try {
        const d = new Date(iso);
        const pad = (n: number) => `${n}`.padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
}

function formatWhen(iso: string) {
    try {
        return new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
}

export function EventsAdminClient({ initial }: { initial: AdminEvent[] }) {
    const router = useRouter();
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState<EventInput>(EMPTY);
    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const startCreate = () => { setEditingId(null); setForm(EMPTY); setError(null); setOpen(true); };
    const startEdit = (e: AdminEvent) => {
        setEditingId(e.id);
        setForm({
            title: e.title, description: e.description ?? "", coverUrl: e.coverUrl ?? "",
            location: e.location ?? "", startsAt: toLocalInput(e.startsAt), priceCoins: e.priceCoins, capacity: e.capacity,
        });
        setError(null); setOpen(true);
    };

    const save = async () => {
        setBusy(true); setError(null);
        const res = editingId ? await adminUpdateEvent(editingId, form) : await adminCreateEvent(form);
        setBusy(false);
        if (res?.error) { setError(res.error); return; }
        setOpen(false); router.refresh();
    };

    const run = async (fn: () => Promise<any>) => {
        const res = await fn();
        if (res?.error) { toast.error(res.error); return; }
        router.refresh();
    };

    const set = (patch: Partial<EventInput>) => setForm((f) => ({ ...f, ...patch }));

    return (
        <div className="max-w-3xl space-y-6">
            <button
                onClick={startCreate}
                className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
            >
                <Plus className="h-4 w-4" /> Nuevo evento
            </button>

            {open && (
                <div className="rounded-xl border border-teal/20 bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-medium text-foreground">{editingId ? "Editar evento" : "Nuevo evento"}</h2>
                        <button onClick={() => setOpen(false)} className="rounded-full p-1 text-muted-foreground hover:text-coral"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2 block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Título</span>
                            <input value={form.title} onChange={(e) => set({ title: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                        <label className="sm:col-span-2 block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Descripción</span>
                            <textarea value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Fecha y hora</span>
                            <input type="datetime-local" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Lugar</span>
                            <input value={form.location ?? ""} onChange={(e) => set({ location: e.target.value })} placeholder="Online, Madrid…"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Precio (monedas)</span>
                            <input type="number" min={0} value={form.priceCoins} onChange={(e) => set({ priceCoins: Number(e.target.value) })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Aforo (opcional)</span>
                            <input type="number" min={1} value={form.capacity ?? ""} onChange={(e) => set({ capacity: e.target.value === "" ? null : Number(e.target.value) })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                        <label className="sm:col-span-2 block text-sm">
                            <span className="mb-1 block font-medium text-foreground">Imagen (URL, opcional)</span>
                            <input value={form.coverUrl ?? ""} onChange={(e) => set({ coverUrl: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal" />
                        </label>
                    </div>
                    {error && <p className="mt-3 text-sm font-medium text-coral">{error}</p>}
                    <div className="mt-4 flex gap-2">
                        <button onClick={save} disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-50">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar
                        </button>
                        <button onClick={() => setOpen(false)} className="rounded-md border border-input px-4 py-2 text-sm text-muted-foreground hover:bg-accent">Cancelar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {initial.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay eventos.</p>
                ) : initial.map((e) => (
                    <div key={e.id} className={`rounded-xl border p-4 ${e.isPublished ? "border-teal/30 bg-teal/5" : "border-teal/10 bg-card"}`}>
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate font-medium text-foreground">{e.title}</p>
                                    {e.isPublished
                                        ? <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal">Publicado</span>
                                        : <span className="rounded-full bg-grey/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-grey/50">Borrador</span>}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {formatWhen(e.startsAt)}{e.location ? ` · ${e.location}` : ""}
                                </p>
                                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> {e.priceCoins} monedas</span>
                                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {e.ticketCount}{e.capacity ? `/${e.capacity}` : ""} entradas</span>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button onClick={() => run(() => adminSetEventPublished(e.id, !e.isPublished))} title={e.isPublished ? "Despublicar" : "Publicar"}
                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/5 hover:text-teal">
                                    {e.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <button onClick={() => startEdit(e)} title="Editar"
                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/5 hover:text-teal">
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={async () => { if (await confirmDialog({ title: "Eliminar evento", message: "¿Eliminar este evento?", confirmLabel: "Eliminar", tone: "danger" })) void run(() => adminDeleteEvent(e.id)); }} title="Eliminar"
                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-coral/5 hover:text-coral">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

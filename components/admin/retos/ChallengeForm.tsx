"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CHALLENGE_GOAL_TYPES } from "@/lib/challenges";
import type { ChallengeInput } from "@/app/app/admin/retos/nuevo/actions";

const EMPTY: ChallengeInput = {
    title: "", description: "", start_date: "", end_date: "", rules: "",
    is_published: false, goal_type: "books", goal_target: 5, goal_genre: "", reward_badge_id: "",
};

export function ChallengeForm({
    initial,
    badges,
    title,
    submitLabel,
    onSubmit,
}: {
    initial?: Partial<ChallengeInput>;
    badges: { id: string; name: string }[];
    title: string;
    submitLabel: string;
    onSubmit: (input: ChallengeInput) => Promise<{ error?: string; success?: boolean }>;
}) {
    const router = useRouter();
    const [form, setForm] = React.useState<ChallengeInput>({ ...EMPTY, ...initial });
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const set = (patch: Partial<ChallengeInput>) => setForm((f) => ({ ...f, ...patch }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true); setError(null);
        const res = await onSubmit(form);
        setBusy(false);
        if (res?.error) { setError(res.error); return; }
        router.push("/app/admin/retos");
    };

    const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

    return (
        <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/app/admin/retos" className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            </div>

            <form onSubmit={submit} className="space-y-6 rounded-xl border border-border bg-white p-6">
                <div>
                    <label className="mb-1.5 block text-sm font-medium">Título *</label>
                    <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ej. 5 libros de Ciencia Ficción" required />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium">Descripción</label>
                    <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe de qué trata el reto…" />
                </div>

                {/* Criterio medible */}
                <div className="rounded-lg border border-teal/15 bg-teal/5 p-4">
                    <p className="mb-3 text-sm font-semibold text-teal-dark">Objetivo (se mide solo desde las lecturas)</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium">Tipo</span>
                            <select className={inputCls} value={form.goal_type} onChange={(e) => set({ goal_type: e.target.value })}>
                                {CHALLENGE_GOAL_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium">Objetivo</span>
                            <input type="number" min={1} className={inputCls} value={form.goal_target ?? ""} onChange={(e) => set({ goal_target: e.target.value === "" ? null : Number(e.target.value) })} />
                        </label>
                        {form.goal_type === "genre" && (
                            <label className="block text-sm">
                                <span className="mb-1 block font-medium">Género</span>
                                <input className={inputCls} value={form.goal_genre} onChange={(e) => set({ goal_genre: e.target.value })} placeholder="Ej. Ciencia ficción" />
                            </label>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-grey/50">El progreso se cuenta desde los libros leídos (o páginas) dentro de las fechas del reto.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm">
                        <span className="mb-1.5 block font-medium">Fecha de inicio</span>
                        <Input type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} />
                    </label>
                    <label className="block text-sm">
                        <span className="mb-1.5 block font-medium">Fecha de fin</span>
                        <Input type="date" value={form.end_date} onChange={(e) => set({ end_date: e.target.value })} />
                    </label>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium">Insignia de recompensa</label>
                    <select className={inputCls} value={form.reward_badge_id} onChange={(e) => set({ reward_badge_id: e.target.value })}>
                        <option value="">Sin insignia</option>
                        {badges.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-grey/50">Se concede automáticamente al completar el reto.</p>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium">Reglas (opcional, texto)</label>
                    <textarea rows={2} className={inputCls} value={form.rules} onChange={(e) => set({ rules: e.target.value })} placeholder="Notas o matices para los participantes…" />
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_published} onChange={(e) => set({ is_published: e.target.checked })} className="h-4 w-4 accent-teal" />
                    <span className="font-medium">Publicado (visible para los usuarios)</span>
                </label>

                {error && <p className="text-sm font-medium text-coral">{error}</p>}

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                    <Link href="/app/admin/retos"><Button type="button" variant="ghost">Cancelar</Button></Link>
                    <Button type="submit" variant="primary" disabled={busy || !form.title.trim()}>
                        {busy ? "Guardando…" : submitLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
}

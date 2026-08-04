"use client";

import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Plus, Loader2 } from "lucide-react";
import { adminCreatePrompt, adminSetPromptActive, adminDeletePrompt, type CommunityPrompt } from "@/app/app/comunidad/prompt-actions";

export function PromptsAdminClient({ initial }: { initial: CommunityPrompt[] }) {
    const router = useRouter();
    const [question, setQuestion] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const run = async (fn: () => Promise<any>) => {
        setBusy(true); setError(null);
        const res = await fn();
        setBusy(false);
        if (res?.error) { setError(res.error); return; }
        router.refresh();
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-teal/10 bg-card p-4 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-foreground">Nueva pregunta</label>
                <div className="flex gap-2">
                    <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ej. ¿Qué libro no pudiste soltar?"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                    <button
                        onClick={() => run(async () => { const r = await adminCreatePrompt(question); if (!r.error) setQuestion(""); return r; })}
                        disabled={busy || !question.trim()}
                        className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear
                    </button>
                </div>
                {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
            </div>

            <div className="space-y-2">
                {initial.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay prompts.</p>
                ) : initial.map((p) => (
                    <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 ${p.isActive ? "border-teal/40 bg-teal/5" : "border-teal/10 bg-card"}`}>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">{p.question}</p>
                            {p.isActive && <span className="text-[11px] font-bold uppercase tracking-wide text-teal">Activo</span>}
                        </div>
                        <button
                            onClick={() => run(() => adminSetPromptActive(p.id, !p.isActive))}
                            title={p.isActive ? "Desactivar" : "Activar"}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-teal/5 hover:text-teal"
                        >
                            {p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={async () => { if (await confirmDialog({ title: "Eliminar prompt", message: "¿Eliminar este prompt?", confirmLabel: "Eliminar", tone: "danger" })) void run(() => adminDeletePrompt(p.id)); }}
                            title="Eliminar"
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-coral/5 hover:text-coral"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

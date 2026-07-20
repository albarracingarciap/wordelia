"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileJson } from "lucide-react";

export interface ImportOutcome {
    ok: boolean;
    message: string;
}

/**
 * Panel genérico para importar un recurso desde JSON (pegar o subir .json).
 * Delega la validación/guardado en `onImport` (server action) y refresca al ok.
 */
export function JsonImportPanel({
    title,
    onImport,
}: {
    title: string;
    onImport: (raw: string) => Promise<ImportOutcome>;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [raw, setRaw] = useState("");
    const [feedback, setFeedback] = useState<ImportOutcome | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        setRaw(text);
        setFeedback(null);
    };

    const submit = () => {
        if (!raw.trim()) return;
        setFeedback(null);
        startTransition(async () => {
            const res = await onImport(raw);
            setFeedback(res);
            if (res.ok) {
                setRaw("");
                if (fileRef.current) fileRef.current.value = "";
                router.refresh();
            }
        });
    };

    return (
        <div className="rounded-xl border border-teal/10 bg-card shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-teal" />
                <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
                Pega el JSON generado por el script o sube un archivo. Se valida y se guarda como borrador conservando el
                estado actual.
            </p>

            <textarea
                value={raw}
                onChange={(e) => {
                    setRaw(e.target.value);
                    setFeedback(null);
                }}
                rows={8}
                placeholder='{ … }'
                className="w-full bg-background border border-input rounded-md text-xs font-mono px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal resize-y"
            />

            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={submit}
                    disabled={pending || !raw.trim()}
                    className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Importar
                </button>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 text-sm font-medium border border-input py-2 px-4 rounded-md hover:bg-muted transition-colors"
                >
                    <FileJson className="w-4 h-4" /> Subir .json
                </button>
                <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
            </div>

            {feedback && (
                <div
                    className={`flex items-start gap-2 text-sm rounded-lg px-4 py-3 ${
                        feedback.ok
                            ? "bg-teal/10 text-teal-dark border border-teal/20"
                            : "bg-coral/10 text-coral border border-coral/20"
                    }`}
                >
                    {feedback.ok ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Braces } from "lucide-react";
import { SectionEditor, RawJsonField } from "./GuideFields";
import { GENOME_WRAPPER_SPEC } from "./genome-form-schema";
import { chromosomeLabel } from "@/lib/resources-schema";
import { saveChromosomeAction } from "../actions";

export function ChromosomeEditor({
    bookId,
    chromosomeKey,
    initialData,
    onBack,
}: {
    bookId: string;
    chromosomeKey: string;
    initialData: any;
    onBack: () => void;
}) {
    const router = useRouter();
    const [data, setData] = useState<any>(
        initialData && typeof initialData === "object" && !Array.isArray(initialData) ? initialData : {},
    );
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const save = () => {
        setFeedback(null);
        startTransition(async () => {
            const res = await saveChromosomeAction(bookId, chromosomeKey, data);
            if ("error" in res) setFeedback({ ok: false, msg: res.error });
            else {
                setFeedback({ ok: true, msg: "Cromosoma guardado." });
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-4 max-w-3xl">
            <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Volver a cromosomas
            </button>

            <h4 className="font-semibold text-lg">{chromosomeLabel(chromosomeKey)}</h4>

            {/* Envoltura estructurada */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                <SectionEditor spec={GENOME_WRAPPER_SPEC} value={data} onChange={setData} />
            </div>

            {/* Análisis (JSON) */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5 space-y-2">
                <div className="flex items-center gap-2">
                    <Braces className="w-4 h-4 text-teal" />
                    <h5 className="font-semibold text-sm">Análisis (JSON)</h5>
                </div>
                <p className="text-xs text-muted-foreground">
                    Bloque profundo generado por el script. Edítalo como JSON; se valida al vuelo.
                </p>
                <RawJsonField value={data.analisis} onChange={(v) => setData((d: any) => ({ ...d, analisis: v }))} />
            </div>

            <div className="flex items-center gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3">
                <button
                    onClick={save}
                    disabled={pending}
                    className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-5 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cromosoma
                </button>
                {feedback && (
                    <span className={`inline-flex items-center gap-1.5 text-sm ${feedback.ok ? "text-teal-dark" : "text-coral"}`}>
                        {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {feedback.msg}
                    </span>
                )}
            </div>
        </div>
    );
}

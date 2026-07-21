"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Library } from "lucide-react";
import {
    parseReadingCsv,
    summarizeByStatus,
    IMPORT_BATCH_SIZE,
    type ParseResult,
    type ImportBatchResult,
    type ImportReadingStatus,
} from "@/lib/reading-import";
import { importReadingBatchAction } from "../import-actions";

type Phase = "select" | "preview" | "running" | "done";

const SOURCE_LABEL: Record<string, string> = { goodreads: "Goodreads", storygraph: "StoryGraph", unknown: "Formato no reconocido" };
const STATUS_LABEL: Record<ImportReadingStatus, string> = {
    WANT_TO_READ: "Quiero leer",
    READING: "Leyendo",
    READ: "Leído",
    DNF: "Abandonado",
    PAUSED: "En pausa",
};

export function ImportClient() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [phase, setPhase] = useState<Phase>("select");
    const [parsed, setParsed] = useState<ParseResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ processed: 0, total: 0 });
    const [agg, setAgg] = useState<ImportBatchResult>({ imported: 0, updated: 0, skippedExisting: 0, failed: 0, failures: [] });
    const [showFailures, setShowFailures] = useState(false);
    const [updateExisting, setUpdateExisting] = useState(false);
    const [withShelves, setWithShelves] = useState(true);

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        try {
            const text = await file.text();
            const result = parseReadingCsv(text);
            if (result.books.length === 0) {
                setError("No se han encontrado libros en el archivo. ¿Es un CSV de Goodreads o StoryGraph?");
                return;
            }
            setParsed(result);
            setPhase("preview");
        } catch {
            setError("No se pudo leer el archivo.");
        }
    };

    const run = async () => {
        if (!parsed) return;
        const books = parsed.books;
        setPhase("running");
        setProgress({ processed: 0, total: books.length });
        const acc: ImportBatchResult = { imported: 0, updated: 0, skippedExisting: 0, failed: 0, failures: [] };
        const opts = { mode: updateExisting ? ("update" as const) : ("skip" as const), withShelves };

        for (let i = 0; i < books.length; i += IMPORT_BATCH_SIZE) {
            const chunk = books.slice(i, i + IMPORT_BATCH_SIZE);
            const { result, error } = await importReadingBatchAction(chunk, opts);
            if (error || !result) {
                acc.failed += chunk.length;
            } else {
                acc.imported += result.imported;
                acc.updated += result.updated;
                acc.skippedExisting += result.skippedExisting;
                acc.failed += result.failed;
                if (acc.failures.length < 50) acc.failures.push(...result.failures.slice(0, 50 - acc.failures.length));
            }
            setProgress({ processed: Math.min(i + chunk.length, books.length), total: books.length });
            setAgg({ ...acc });
        }

        setPhase("done");
        router.refresh();
    };

    const summary = parsed ? summarizeByStatus(parsed.books) : null;
    const pct = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;

    return (
        <div className="space-y-6">
            <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm text-grey/70 hover:text-teal-dark transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a mi lectura
            </Link>

            <div>
                <h1 className="text-2xl font-serif text-teal-dark">Importar biblioteca</h1>
                <p className="text-grey/70 mt-1 text-sm">
                    Sube el CSV que exportaste de <b>Goodreads</b> o <b>StoryGraph</b> y llenamos tus estanterías.
                    No tocamos los libros que ya tengas.
                </p>
            </div>

            {error && (
                <div className="flex items-start gap-2 text-sm bg-coral/10 text-coral border border-coral/20 rounded-lg px-4 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
            )}

            {/* Selección de archivo */}
            {(phase === "select" || phase === "preview") && (
                <div>
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full rounded-xl border-2 border-dashed border-teal/20 hover:border-teal/40 hover:bg-teal/5 transition-colors py-8 flex flex-col items-center gap-2 text-grey"
                    >
                        <UploadCloud className="w-8 h-8 text-teal/60" />
                        <span className="text-sm font-medium">Elegir archivo CSV</span>
                        <span className="text-xs text-grey/50">Goodreads: Ajustes → Import/Export → Export Library</span>
                    </button>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
                </div>
            )}

            {/* Preview */}
            {phase === "preview" && parsed && summary && (
                <div className="bg-white rounded-xl border border-teal/10 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-teal" />
                        <span>Formato: <b>{SOURCE_LABEL[parsed.source]}</b></span>
                        <span className="text-grey/50">·</span>
                        <span><b>{parsed.books.length}</b> libros{parsed.skipped ? ` (${parsed.skipped} filas ignoradas)` : ""}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(Object.keys(STATUS_LABEL) as ImportReadingStatus[]).filter((s) => summary[s] > 0).map((s) => (
                            <div key={s} className="rounded-lg bg-teal/5 px-3 py-2 text-sm">
                                <span className="font-semibold text-teal-dark">{summary[s]}</span> <span className="text-grey/70">{STATUS_LABEL[s]}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 border-t border-teal/5 pt-3">
                        <label className="flex items-center gap-2 text-sm text-grey/80 cursor-pointer">
                            <input type="checkbox" checked={withShelves} onChange={(e) => setWithShelves(e.target.checked)} className="accent-teal" />
                            Recrear mis estanterías / etiquetas como colecciones
                        </label>
                        <label className="flex items-center gap-2 text-sm text-grey/80 cursor-pointer">
                            <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="accent-teal" />
                            Actualizar los libros que ya tenga (estado, valoración, reseña)
                        </label>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={run}
                            className="inline-flex items-center gap-2 text-sm font-semibold bg-teal text-white py-2.5 px-5 rounded-lg hover:bg-teal-dark transition-colors"
                        >
                            <UploadCloud className="w-4 h-4" /> Importar {parsed.books.length} libros
                        </button>
                        <button onClick={() => { setParsed(null); setPhase("select"); }} className="text-sm text-grey/70 hover:text-foreground">
                            Elegir otro archivo
                        </button>
                    </div>
                </div>
            )}

            {/* Progreso */}
            {phase === "running" && (
                <div className="bg-white rounded-xl border border-teal/10 shadow-sm p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-teal-dark">
                        <Loader2 className="w-4 h-4 animate-spin" /> Importando… {progress.processed}/{progress.total}
                    </div>
                    <div className="h-2 rounded-full bg-teal/10 overflow-hidden">
                        <div className="h-full bg-teal transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-grey/60">
                        Añadidos {agg.imported}
                        {agg.updated > 0 ? ` · actualizados ${agg.updated}` : ` · ya tenías ${agg.skippedExisting}`} · fallidos {agg.failed}
                    </p>
                </div>
            )}

            {/* Resumen */}
            {phase === "done" && (
                <div className="bg-white rounded-xl border border-teal/10 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 text-teal-dark">
                        <CheckCircle2 className="w-5 h-5 text-teal" />
                        <h2 className="font-semibold">Import completado</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-teal/5 py-3"><div className="text-xl font-bold text-teal-dark">{agg.imported}</div><div className="text-xs text-grey/60">añadidos</div></div>
                        {updateExisting ? (
                            <div className="rounded-lg bg-teal/5 py-3"><div className="text-xl font-bold text-teal-dark">{agg.updated}</div><div className="text-xs text-grey/60">actualizados</div></div>
                        ) : (
                            <div className="rounded-lg bg-muted/40 py-3"><div className="text-xl font-bold">{agg.skippedExisting}</div><div className="text-xs text-grey/60">ya tenías</div></div>
                        )}
                        <div className="rounded-lg bg-coral/5 py-3"><div className="text-xl font-bold text-coral">{agg.failed}</div><div className="text-xs text-grey/60">fallidos</div></div>
                    </div>

                    {agg.failures.length > 0 && (
                        <div>
                            <button onClick={() => setShowFailures((v) => !v)} className="inline-flex items-center gap-1 text-xs text-grey/70 hover:text-coral">
                                {showFailures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                Ver no importados ({agg.failures.length}{agg.failed > agg.failures.length ? "+" : ""})
                            </button>
                            {showFailures && (
                                <ul className="mt-2 space-y-1 max-h-56 overflow-auto text-xs text-grey/70">
                                    {agg.failures.map((f, i) => (
                                        <li key={i} className="flex justify-between gap-3 border-b border-teal/5 py-1">
                                            <span className="truncate">{f.title}</span>
                                            <span className="text-grey/40 shrink-0">{f.reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold bg-teal text-white py-2.5 px-5 rounded-lg hover:bg-teal-dark transition-colors">
                        <Library className="w-4 h-4" /> Ir a mi biblioteca
                    </Link>
                </div>
            )}
        </div>
    );
}

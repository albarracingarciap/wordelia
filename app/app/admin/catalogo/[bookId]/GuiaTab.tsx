"use client";

import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, FileText, Eye, Pencil } from "lucide-react";
import type { GuideContent } from "../data";
import { GUIDE_SECTIONS, unwrapGuidePayload } from "@/lib/resources-schema";
import { importGuideAction } from "../actions";
import { JsonImportPanel, type ImportOutcome } from "./JsonImportPanel";
import { GuideEditor } from "./GuideEditor";

export function GuiaTab({ bookId, content }: { bookId: string; content: GuideContent | null }) {
    const [showRaw, setShowRaw] = useState(false);
    const [mode, setMode] = useState<"view" | "edit">("view");

    const guide = content?.discussion_guide ? unwrapGuidePayload(content.discussion_guide) : null;
    const presentKeys = guide && typeof guide === "object" ? new Set(Object.keys(guide)) : new Set<string>();
    const extraKeys =
        guide && typeof guide === "object"
            ? Object.keys(guide).filter((k) => !GUIDE_SECTIONS.some((s) => s.key === k))
            : [];

    const onImport = async (raw: string): Promise<ImportOutcome> => {
        const res = await importGuideAction(bookId, raw);
        if ("error" in res) return { ok: false, message: res.error };
        const extra = res.extraKeys.length ? ` (${res.extraKeys.length} clave(s) extra ignoradas por el índice)` : "";
        return { ok: true, message: `Guía importada: ${res.sections.length} secciones reconocidas${extra}.` };
    };

    return (
        <div className="space-y-5 max-w-4xl">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal" />
                    <h3 className="font-semibold">Guía de discusión</h3>
                    {content ? (
                        <span
                            className={`text-xs font-medium py-0.5 px-2 rounded ${
                                content.status === "published" ? "text-teal-dark bg-teal/15" : "text-amber-700 bg-amber-100"
                            }`}
                        >
                            {content.status === "published" ? "Publicada" : "Borrador"}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground">Sin guía</span>
                    )}
                </div>

                <div className="inline-flex rounded-md border border-input overflow-hidden text-sm">
                    <button
                        onClick={() => setMode("view")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${mode === "view" ? "bg-teal text-white" : "hover:bg-muted"}`}
                    >
                        <Eye className="w-4 h-4" /> Vista
                    </button>
                    <button
                        onClick={() => setMode("edit")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${mode === "edit" ? "bg-teal text-white" : "hover:bg-muted"}`}
                    >
                        <Pencil className="w-4 h-4" /> Editar
                    </button>
                </div>
            </div>

            {mode === "edit" ? (
                <GuideEditor bookId={bookId} initialGuide={guide} />
            ) : content ? (
                <div className="rounded-xl border border-teal/10 bg-card shadow-sm p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {GUIDE_SECTIONS.map((s) => {
                            const present = presentKeys.has(s.key);
                            return (
                                <div
                                    key={s.key}
                                    className={`flex items-center gap-1.5 text-xs rounded-md px-2 py-1.5 ${
                                        present ? "text-teal-dark bg-teal/5" : "text-muted-foreground bg-muted/40"
                                    }`}
                                >
                                    {present ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                                    {s.label}
                                </div>
                            );
                        })}
                    </div>
                    {extraKeys.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">Claves extra: {extraKeys.join(", ")}</p>
                    )}
                    <button
                        onClick={() => setShowRaw((v) => !v)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-dark mt-3"
                    >
                        {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showRaw ? "Ocultar" : "Ver"} JSON
                    </button>
                    {showRaw && (
                        <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] font-mono">
                            {JSON.stringify(guide, null, 2)}
                        </pre>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-teal/20 p-8 text-center text-muted-foreground">
                    <p>Este libro no tiene guía. Créala en <b>Editar</b> o impórtala abajo.</p>
                </div>
            )}

            <JsonImportPanel title="Importar guía (JSON)" onImport={onImport} />
        </div>
    );
}

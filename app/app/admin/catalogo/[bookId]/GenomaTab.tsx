"use client";

import { useState } from "react";
import { Check, X, Dna, Pencil } from "lucide-react";
import type { GenomeRow } from "../data";
import { CHROMOSOME_KEYS, chromosomeLabel } from "@/lib/resources-schema";
import { importGenomeAction } from "../actions";
import { JsonImportPanel, type ImportOutcome } from "./JsonImportPanel";
import { ChromosomeEditor } from "./ChromosomeEditor";

export function GenomaTab({ bookId, rows }: { bookId: string; rows: GenomeRow[] }) {
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const byKey = new Map(rows.map((c) => [c.chromosome_key, c]));

    const onImport = async (raw: string): Promise<ImportOutcome> => {
        const res = await importGenomeAction(bookId, raw);
        if ("error" in res) return { ok: false, message: res.error };
        const unknown = res.unknownKeys.length ? ` Ignoradas ${res.unknownKeys.length} clave(s) no reconocida(s).` : "";
        return { ok: true, message: `Genoma importado: ${res.imported.length}/8 cromosomas.${unknown}` };
    };

    if (editingKey) {
        const row = byKey.get(editingKey);
        return (
            <ChromosomeEditor
                bookId={bookId}
                chromosomeKey={editingKey}
                initialData={row?.chromosome_data ?? {}}
                onBack={() => setEditingKey(null)}
            />
        );
    }

    return (
        <div className="space-y-5 max-w-3xl">
            <div className="rounded-xl border border-teal/10 bg-card shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Dna className="w-4 h-4 text-teal" />
                        <h3 className="font-semibold">Genoma literario</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{rows.length}/8 cromosomas</span>
                </div>

                <div className="space-y-1.5">
                    {CHROMOSOME_KEYS.map((key) => {
                        const c = byKey.get(key);
                        return (
                            <div
                                key={key}
                                className={`flex items-center justify-between gap-3 text-sm rounded-md px-3 py-2 ${
                                    c ? "bg-teal/5" : "bg-muted/40"
                                }`}
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    {c ? (
                                        <Check className="w-4 h-4 text-teal-dark shrink-0" />
                                    ) : (
                                        <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                    )}
                                    <span className={c ? "truncate" : "text-muted-foreground truncate"}>
                                        {chromosomeLabel(key)}
                                    </span>
                                </span>
                                <span className="flex items-center gap-3 shrink-0">
                                    {c ? (
                                        <>
                                            {c.version != null && <span className="text-xs text-muted-foreground">v{c.version}</span>}
                                            <span
                                                className={`text-xs font-medium py-0.5 px-1.5 rounded ${
                                                    c.status === "published"
                                                        ? "text-teal-dark bg-teal/15"
                                                        : "text-amber-700 bg-amber-100"
                                                }`}
                                            >
                                                {c.status === "published" ? "Publicado" : "Borrador"}
                                            </span>
                                            <button
                                                onClick={() => setEditingKey(key)}
                                                className="inline-flex items-center gap-1 text-xs text-teal-dark hover:underline"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Editar
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Impórtalo primero</span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-teal/5">
                    Editar = envoltura estructurada (nombre/visualización/metadatos) + análisis como JSON. El import acepta
                    el objeto agregado {"{clave_cromosoma: datos}"} o un array.
                </p>
            </div>

            <JsonImportPanel title="Importar genoma (JSON)" onImport={onImport} />
        </div>
    );
}

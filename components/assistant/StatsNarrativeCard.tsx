"use client";

import * as React from "react";
import { Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { peekStatsNarrative, getStatsNarrative, type NarrativeResult } from "@/app/app/asistente/actions";

type ViewState = NarrativeResult | { status: "empty" } | { status: "loading" };

export function StatsNarrativeCard() {
    const [state, setState] = React.useState<ViewState>({ status: "loading" });
    const [generating, setGenerating] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        peekStatsNarrative()
            .then((r) => { if (active) setState(r); })
            .catch(() => { if (active) setState({ status: "empty" }); });
        return () => { active = false; };
    }, []);

    const generate = async (force: boolean) => {
        setGenerating(true);
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const r = await getStatsNarrative(tz, force);
            setState(r);
        } catch {
            setState({ status: "error", message: "No hemos podido generar la narrativa." });
        } finally {
            setGenerating(false);
        }
    };

    if (state.status === "loading") return null;
    // Sin plan: no metemos ruido en estadísticas (es un extra Bibliófilo).
    if (state.status === "locked") return null;
    // Sin datos suficientes: mejor no mostrar nada aún.
    if (state.status === "no_data") return null;

    return (
        <div className="mb-6 rounded-2xl border border-coral/15 bg-gradient-to-br from-coral/5 to-cream/40 p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-coral">
                    <Sparkles className="h-3.5 w-3.5" /> Tu lectura en palabras
                </p>
                {state.status === "ok" && (
                    <button
                        onClick={() => generate(true)}
                        disabled={generating}
                        className="inline-flex items-center gap-1 text-xs font-medium text-grey/50 transition-colors hover:text-teal disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} /> Actualizar
                    </button>
                )}
            </div>

            {state.status === "ok" ? (
                <p className="font-serif text-lg leading-relaxed text-teal-dark">{state.text}</p>
            ) : state.status === "limit" ? (
                <p className="text-sm text-grey/60">Has alcanzado tu límite de generaciones de este mes.</p>
            ) : state.status === "error" ? (
                <div className="flex items-center gap-3">
                    <p className="text-sm text-grey/60">{state.message}</p>
                    <button onClick={() => generate(false)} disabled={generating} className="text-sm font-bold text-teal hover:underline disabled:opacity-50">Reintentar</button>
                </div>
            ) : (
                // empty → CTA
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-grey/70">Deja que Wordelia resuma tu año lector en un párrafo.</p>
                    <button
                        onClick={() => generate(false)}
                        disabled={generating}
                        className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
                    >
                        {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {generating ? "Escribiendo..." : "Generar"}
                        {!generating && <ArrowRight className="h-3.5 w-3.5" />}
                    </button>
                </div>
            )}
        </div>
    );
}

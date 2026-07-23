"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, RefreshCw, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { peekNextRead, getNextReadRecommendation, type NextReadResult } from "@/app/app/asistente/actions";

const sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-grey/40 lg:text-sm";

type ViewState = NextReadResult | { status: "empty" } | { status: "loading" };

export function NextReadCard() {
    const [state, setState] = React.useState<ViewState>({ status: "loading" });
    const [generating, setGenerating] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        peekNextRead()
            .then((r) => { if (active) setState(r); })
            .catch(() => { if (active) setState({ status: "empty" }); });
        return () => { active = false; };
    }, []);

    const generate = async (force: boolean) => {
        setGenerating(true);
        try {
            const r = await getNextReadRecommendation(force);
            setState(r);
        } catch {
            setState({ status: "error", message: "No hemos podido generar la recomendación." });
        } finally {
            setGenerating(false);
        }
    };

    // No mostramos nada mientras carga ni si el usuario no tiene el plan
    // (evita ruido; es un extra del plan Bibliófilo).
    if (state.status === "loading") return null;
    if (state.status === "locked") {
        if (state.reason === "unauthenticated") return null;
        return (
            <section>
                <h2 className={`${sectionTitleClass} mb-3`}>Tu próxima lectura</h2>
                <Card className="border-coral/15 bg-gradient-to-br from-coral/5 to-cream/30">
                    <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-teal-dark">Recomendaciones con IA</p>
                            <p className="mt-1 text-xs text-grey/60">Deja que el bibliotecario de Wordelia elija tu próxima lectura según tus gustos.</p>
                            <Link href="/planes" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-coral hover:underline">
                                Incluido en Bibliófilo <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </section>
        );
    }

    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className={sectionTitleClass}>Tu próxima lectura</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                    <Sparkles className="h-3 w-3" /> IA
                </span>
            </div>

            <Card className="bg-white">
                {state.status === "ok" ? (
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-grey/10 shadow-sm">
                                {state.book.coverUrl ? (
                                    <Image src={state.book.coverUrl} alt="" fill className="object-cover" sizes="56px" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-grey/30"><BookOpen className="h-5 w-5" /></div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold leading-tight text-teal-dark">{state.book.title}</p>
                                <p className="mt-0.5 text-xs text-coral">{state.book.author}</p>
                            </div>
                        </div>
                        <p className="text-sm italic leading-relaxed text-grey-dark">&ldquo;{state.reason}&rdquo;</p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <Link href="/app/mi-lectura/estanterias" className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:text-teal-dark">
                                Ver en mi lista <ArrowRight className="h-3 w-3" />
                            </Link>
                            <button
                                onClick={() => generate(true)}
                                disabled={generating}
                                className="inline-flex items-center gap-1 text-xs font-medium text-grey/50 transition-colors hover:text-teal disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} /> Otra
                            </button>
                        </div>
                    </div>
                ) : state.status === "no_candidates" ? (
                    <p className="py-2 text-center text-xs text-grey/60">
                        Aún no hay libros que recomendarte. Explora el catálogo o añade alguno a tu lista &ldquo;Quiero leer&rdquo;.
                    </p>
                ) : state.status === "limit" ? (
                    <p className="py-2 text-center text-xs text-grey/60">Has alcanzado tu límite de sugerencias de este mes. Vuelve el mes que viene.</p>
                ) : state.status === "error" ? (
                    <div className="space-y-2 text-center">
                        <p className="text-xs text-grey/60">{state.message}</p>
                        <button onClick={() => generate(false)} disabled={generating} className="text-xs font-bold text-teal hover:underline disabled:opacity-50">
                            Reintentar
                        </button>
                    </div>
                ) : (
                    // empty → CTA para generar
                    <div className="space-y-3 py-1 text-center">
                        <p className="text-xs text-grey/60">Deja que el bibliotecario de Wordelia elija tu próxima lectura según tus gustos.</p>
                        <button
                            onClick={() => generate(false)}
                            disabled={generating}
                            className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
                        >
                            {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            {generating ? "Pensando..." : "Sugerir mi próxima lectura"}
                        </button>
                    </div>
                )}
            </Card>
        </section>
    );
}

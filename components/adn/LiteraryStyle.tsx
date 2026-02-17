"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface LiteraryStyleData {
    vocabulary: {
        value: number; // 1-10
        label: string; // "Muy complejo"
        details: string[];
    };
    sentenceLength: {
        value: number; // 1-10
        label: string;
        details: string[];
    };
    descriptiveDensity: {
        value: number; // 1-10
        label: string;
        details: string[];
    };
    dialogueRatio: {
        dialogue: number; // percentage
        narration: number; // percentage
    };
    tone: {
        somberness: number; // 1-10 (Ligero -> Sombrío)
        pessimism: number; // 1-10 (Optimista -> Pesimista)
    };
    rhetoricalFigures: {
        name: string;
        value: number; // 1-10 relevance/frequency
        label: string; // e.g. "9/10 (muy frecuente)"
    }[];
    register: string[];
}

interface LiteraryStyleProps {
    data: LiteraryStyleData;
    className?: string;
}

function ProgressBar({ value, labelLeft, labelRight, colorClass = "bg-teal" }: { value: number, labelLeft: string, labelRight: string, colorClass?: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-grey/60 font-medium">
                <span>{labelLeft}</span>
                <span>{labelRight}</span>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-2.5 flex-1 rounded-sm transition-all duration-500 first:rounded-l-md last:rounded-r-md",
                            i < value ? colorClass : "bg-teal/5"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

export function LiteraryStyle({ data, className }: LiteraryStyleProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Estilo Literario</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-8">
                    {/* Complexity Block (Vocab, Length, Density) */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-8">

                        {/* Vocabulary */}
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Complejidad Vocabulario</h3>
                                <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.vocabulary.value}/10</span>
                            </div>
                            <ProgressBar value={data.vocabulary.value} labelLeft="Accesible" labelRight="Muy complejo" />
                            <ul className="mt-3 space-y-1">
                                {data.vocabulary.details.map((item, i) => (
                                    <li key={i} className="text-xs text-grey/80 pl-2 border-l-2 border-teal/20">{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="h-px bg-teal/5" />

                        {/* Sentence Length */}
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Longitud de oraciones</h3>
                                <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.sentenceLength.value}/10</span>
                            </div>
                            <ProgressBar value={data.sentenceLength.value} labelLeft="Cortas" labelRight="Muy largas" />
                            <ul className="mt-3 space-y-1">
                                {data.sentenceLength.details.map((item, i) => (
                                    <li key={i} className="text-xs text-grey/80 pl-2 border-l-2 border-teal/20">{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="h-px bg-teal/5" />

                        {/* Density */}
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Densidad Descriptiva</h3>
                                <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.descriptiveDensity.value}/10</span>
                            </div>
                            <ProgressBar value={data.descriptiveDensity.value} labelLeft="Austera" labelRight="Muy rica" />
                            <ul className="mt-3 space-y-1">
                                {data.descriptiveDensity.details.map((item, i) => (
                                    <li key={i} className="text-xs text-grey/80 pl-2 border-l-2 border-teal/20">{item}</li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Dialogue vs Narration */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Diálogo vs Narración</h3>

                        <div className="relative h-6 w-full rounded-full overflow-hidden flex bg-teal/5">
                            <div
                                style={{ width: `${data.dialogueRatio.dialogue}%` }}
                                className="h-full bg-coral/80 flex items-center justify-start pl-3 text-[10px] sm:text-xs font-bold text-white whitespace-nowrap overflow-hidden"
                            >
                                DIÁLOGO {data.dialogueRatio.dialogue}%
                            </div>
                            <div
                                style={{ width: `${data.dialogueRatio.narration}%` }}
                                className="h-full bg-teal/80 flex items-center justify-end pr-3 text-[10px] sm:text-xs font-bold text-white whitespace-nowrap overflow-hidden"
                            >
                                NARRACIÓN {data.dialogueRatio.narration}%
                            </div>
                        </div>
                    </div>

                    {/* Tone */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Tono General</h3>

                        <ProgressBar value={data.tone.somberness} labelLeft="Ligero" labelRight="Sombrío" colorClass="bg-teal-dark" />
                        <ProgressBar value={data.tone.pessimism} labelLeft="Optimista" labelRight="Pesimista" colorClass="bg-teal-dark" />
                    </div>

                    {/* Rhetorical Figures */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Figuras Retóricas</h3>
                        <div className="space-y-3">
                            {data.rhetoricalFigures.map((fig) => (
                                <div key={fig.name} className="flex items-center gap-3 text-sm">
                                    <span className="w-20 font-medium text-teal-dark">{fig.name}</span>
                                    <div className="flex-1 h-2 bg-teal/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal rounded-full"
                                            style={{ width: `${(fig.value / 10) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-grey/60 w-8 text-right">{fig.value}/10</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Register */}
                    <div className="bg-cream/40 rounded-xl p-4 border border-teal/5">
                        <h3 className="text-xs font-bold text-teal/60 uppercase tracking-wider mb-2">Registro Lingüístico</h3>
                        <ul className="space-y-1">
                            {data.register.map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-grey italic">
                                    <span className="w-1 h-1 rounded-full bg-coral/50" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

            </div>
        </section>
    );
}

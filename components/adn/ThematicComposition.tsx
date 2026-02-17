"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface ThematicData {
    thematicCloud: {
        word: string;
        weight: number; // 1-10 for sizing
    }[];
    topThemes: {
        id: number;
        title: string;
        presence: number; // 1-10
        depth: number; // 1-10
        points: string[];
    }[];
    secondaryThemes: string[];
    philosophicalDepth: number; // 1-10
    moralAmbiguity: number; // 1-10
}

interface ThematicCompositionProps {
    data: ThematicData;
    className?: string;
}

function ProgressBar({ value, max = 10, colorClass = "bg-teal" }: { value: number; max?: number; colorClass?: string }) {
    return (
        <div className="flex gap-1 h-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        i < (value / max) * 10 ? colorClass : "bg-teal/5"
                    )}
                />
            ))}
        </div>
    );
}

export function ThematicComposition({ data, className }: ThematicCompositionProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Composición Temática</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            {/* Thematic Cloud */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-teal/10 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-8">Temas Principales</h3>

                <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 max-w-2xl mx-auto">
                    {data.thematicCloud.map((item, idx) => {
                        // Calculate dynamic sizing based on weight
                        const sizeClass =
                            item.weight >= 9 ? "text-3xl md:text-4xl font-bold tracking-tight text-teal-dark" :
                                item.weight >= 7 ? "text-2xl md:text-3xl font-semibold text-teal" :
                                    item.weight >= 5 ? "text-xl md:text-2xl font-medium text-teal/80" :
                                        "text-lg text-grey/60";

                        return (
                            <span
                                key={idx}
                                className={cn(
                                    "transition-all duration-300 hover:scale-110 cursor-default select-none",
                                    sizeClass
                                )}
                            >
                                {item.word}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Left Column: Top Themes (7 cols) */}
                <div className="md:col-span-7 space-y-6">
                    <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-2">Análisis Detallado (Top 5)</h3>

                    {data.topThemes.map((theme) => (
                        <div key={theme.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-teal/10 hover:border-teal/20 transition-all">
                            <h4 className="font-serif text-lg text-teal-dark mb-4">{theme.id}. {theme.title}</h4>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] uppercase font-bold text-grey/60">Presencia</span>
                                        <span className="text-[10px] font-bold text-teal">{theme.presence}/10</span>
                                    </div>
                                    <ProgressBar value={theme.presence} />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] uppercase font-bold text-grey/60">Profundidad</span>
                                        <span className="text-[10px] font-bold text-coral">{theme.depth}/10</span>
                                    </div>
                                    <ProgressBar value={theme.depth} colorClass="bg-coral" />
                                </div>
                            </div>

                            <ul className="space-y-1.5">
                                {theme.points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-grey">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-teal/40 shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Right Column: Secondary & Indices (5 cols) */}
                <div className="md:col-span-5 space-y-8">

                    {/* Secondary Themes */}
                    <div className="bg-cream/40 rounded-2xl p-6 border border-teal/5">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Temas Secundarios</h3>
                        <ul className="space-y-3">
                            {data.secondaryThemes.map((theme, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-grey font-medium">
                                    <span className="w-1.5 h-1.5 border border-coral rounded-full" />
                                    {theme}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Depth & Ambiguity */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">

                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Profundidad Filosófica</h3>
                                <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.philosophicalDepth}/10</span>
                            </div>
                            <div className="flex gap-1 h-2">
                                <div className="flex-1 bg-gradient-to-r from-teal/10 to-teal rounded-full relative overflow-hidden">
                                    <div className="absolute right-0 top-0 h-full bg-white/80 transition-all duration-1000" style={{ width: `${100 - (data.philosophicalDepth * 10)}%` }} />
                                </div>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-grey/40 font-medium uppercase">
                                <span>Superficial</span>
                                <span>Muy profunda</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Nivel de Ambigüedad Moral</h3>
                                <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.moralAmbiguity}/10</span>
                            </div>
                            <div className="flex gap-1 h-2">
                                <div className="flex-1 bg-gradient-to-r from-teal/10 to-teal rounded-full relative overflow-hidden">
                                    <div className="absolute right-0 top-0 h-full bg-white/80 transition-all duration-1000" style={{ width: `${100 - (data.moralAmbiguity * 10)}%` }} />
                                </div>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-grey/40 font-medium uppercase">
                                <span>Blanco/Negro</span>
                                <span>Muy ambiguo</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}

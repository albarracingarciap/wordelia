"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface RhythmDensityData {
    narrativeSpeed: {
        value: number; // 1-10
        label: string; // e.g. "Pausado" -> "Vertiginoso"
        breakdown: { part: string; desc: string }[];
    };
    infoDensity: {
        value: number; // 1-10
        label: string;
        points: string[];
    };
    actionProportion: {
        label: string;
        value: number; // percentage
        color: string;
    }[];
    readingTime: {
        fast: string;
        average: string;
        slow: string;
        pagesPerHour: number;
        note: string;
    };
    rhythmCurve: {
        label: string;
        value: number; // 1-10 intensity
    }[];
}

interface RhythmDensityProps {
    data: RhythmDensityData;
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

export function RhythmDensity({ data, className }: RhythmDensityProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Ritmo y Densidad</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-8">

                    {/* Narrative Speed */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Velocidad Narrativa</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-grey/60 font-medium whitespace-nowrap">Pausado - Vertiginoso</span>
                                    <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.narrativeSpeed.value}/10</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-teal/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal/60 to-teal rounded-full"
                                    style={{ width: `${data.narrativeSpeed.value * 10}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-cream/40 rounded-xl p-4 border border-teal/5">
                            <h4 className="text-xs font-bold text-grey/60 uppercase mb-3">Variación del Ritmo</h4>
                            <ul className="space-y-2">
                                {data.narrativeSpeed.breakdown.map((item, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-grey">
                                        <span className="font-bold text-teal whitespace-nowrap">{item.part}:</span>
                                        <span>{item.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Information Density */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Densidad de Información</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-grey/60 font-medium whitespace-nowrap">Ligera - Muy densa</span>
                                    <span className="text-xs font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full">{data.infoDensity.value}/10</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-teal/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-coral/60 to-coral rounded-full"
                                    style={{ width: `${data.infoDensity.value * 10}%` }}
                                />
                            </div>
                        </div>

                        <ul className="space-y-2 pl-2">
                            {data.infoDensity.points.map((pt, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-grey">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-teal shrink-0" />
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Proportion */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Proporción de Acción</h3>

                        <div className="flex h-8 rounded-full overflow-hidden mb-4">
                            {data.actionProportion.map((item, i) => (
                                <div
                                    key={i}
                                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                    className="h-full flex items-center justify-center relative group"
                                >
                                    <div className="absolute opacity-0 group-hover:opacity-100 bg-black/80 text-white text-[10px] px-2 py-1 rounded bottom-full mb-2 whitespace-nowrap transition-opacity pointer-events-none">
                                        {item.label}: {item.value}%
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {data.actionProportion.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-grey font-medium">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span>{item.label} ({item.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Reading Time */}
                    <div className="bg-teal text-white rounded-2xl p-8 border border-white/10 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-coral/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-8 relative z-10">Tiempo de Lectura Estimado</h3>

                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-sm font-medium text-white/80">Lector Rápido</span>
                                <span className="text-xl font-bold font-serif">{data.readingTime.fast}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-sm font-medium text-white/80">Lector Promedio</span>
                                <span className="text-2xl font-bold font-serif text-coral-light">{data.readingTime.average}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-sm font-medium text-white/80">Lector Pausado</span>
                                <span className="text-xl font-bold font-serif">{data.readingTime.slow}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/10 text-center">
                            <p className="text-2xl font-bold text-white mb-1">{data.readingTime.pagesPerHour}</p>
                            <p className="text-[10px] uppercase font-bold text-white/60 mb-3">Páginas por hora (Promedio)</p>
                            <p className="text-xs text-white/60 italic leading-relaxed px-4">"{data.readingTime.note}"</p>
                        </div>
                    </div>

                    {/* Rhythm Curve */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm relative overflow-visible h-[300px] flex flex-col">
                        <div className="flex justify-between items-baseline mb-6">
                            <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Curva de Ritmo</h3>
                            <span className="text-xs bg-teal/10 text-teal px-2 py-1 rounded font-medium">Intensidad por Parte</span>
                        </div>

                        <div className="flex-1 flex items-end gap-1 md:gap-2 relative pl-6 pb-6">
                            {/* Y Axis Labels */}
                            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-grey/40 font-medium py-1">
                                <span>10</span>
                                <span>5</span>
                                <span>0</span>
                            </div>

                            {/* X Axis Line */}
                            <div className="absolute bottom-6 left-6 right-0 h-px bg-teal/10" />

                            {/* Bars */}
                            {data.rhythmCurve.map((point, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end h-full gap-2 group relative">
                                    <div className="w-full relative flex items-end h-full">
                                        <div
                                            className="w-full bg-teal/40 rounded-t-sm transition-all duration-500 group-hover:bg-coral/80"
                                            style={{ height: `${point.value * 10}%` }}
                                        />
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-teal-dark text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                            Intensidad: {point.value}/10
                                        </div>
                                    </div>
                                    {/* X Axis Label for groupings - simplified here assuming data grouping */}
                                </div>
                            ))}
                        </div>

                        {/* X Axis Labels Manual for 1984 structure */}
                        <div className="flex justify-between text-xs font-bold text-grey/60 px-2 mt-1 pl-6">
                            <div className="text-center w-1/3">Parte I</div>
                            <div className="text-center w-1/3">Parte II</div>
                            <div className="text-center w-1/3">Parte III</div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}

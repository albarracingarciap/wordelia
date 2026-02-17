"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Types ---
export interface ComparisonData {
    book1: {
        title: string;
        author: string;
        coverColor: string; // Hex for visual distinction
    };
    book2: {
        title: string;
        author: string;
        coverColor: string;
    };
    compatibility: {
        percentage: number;
        label: string;
    };
    chromosomes: {
        label: string;
        value1: number;
        value2: number;
        diffLabel?: string; // e.g. "Mayor diferencia"
    }[];
    similarities: string[];
    differences: {
        aspect: string;
        book1Desc: string;
        book1Value?: number; // Optional 1-10 scale
        book2Desc: string;
        book2Value?: number;
        insight: string;
    }[];
    recommendation: {
        text: string;
        readingOrder: string;
    };
}

interface BookComparisonProps {
    data: ComparisonData;
    className?: string;
}

function ProgressBar({ value, max = 100, colorClass = "bg-teal" }: { value: number; max?: number; colorClass?: string }) {
    return (
        <div className="h-2 w-full bg-grey/10 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all duration-1000", colorClass)}
                style={{ width: `${(value / max) * 100}%` }}
            />
        </div>
    );
}

export function BookComparison({ data, className }: BookComparisonProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-12 pb-20", className)}>

            {/* Header */}
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-teal/5 border border-teal/10 rounded-full px-4 py-1.5 mb-2">
                    <span className="text-xs font-bold text-teal uppercase tracking-wider">🔬 Comparación de ADN Literario</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-serif text-teal-dark flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                    <span>{data.book1.title}</span>
                    <span className="text-2xl text-grey/40 font-sans italic">vs.</span>
                    <span>{data.book2.title}</span>
                </h1>
                <div className="text-sm text-grey font-medium">
                    {data.book1.author} <span className="mx-2 opacity-30">|</span> {data.book2.author}
                </div>
            </header>

            {/* Compatibility */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-teal/10 shadow-sm text-center max-w-2xl mx-auto">
                <h3 className="text-xs font-bold text-grey/60 uppercase tracking-widest mb-4">Compatibilidad Genética</h3>
                <div className="flex justify-between items-end mb-2 px-2">
                    <span className="text-4xl font-serif font-bold text-teal">{data.compatibility.percentage}%</span>
                    <span className="text-sm font-bold text-teal-dark bg-teal/10 px-3 py-1 rounded-full">{data.compatibility.label}</span>
                </div>
                <ProgressBar value={data.compatibility.percentage} colorClass="bg-gradient-to-r from-teal to-coral" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Chromosomes Comparison Chart */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider border-b border-teal/10 pb-2">Comparativa por Cromosoma</h3>

                    <div className="space-y-4">
                        {/* Header Row */}
                        <div className="flex justify-between text-[10px] font-bold text-grey/40 uppercase px-2">
                            <span className="w-24 text-right">{data.book1.title}</span>
                            <span className="flex-1 text-center">Dimensiones</span>
                            <span className="w-24 text-left">{data.book2.title}</span>
                        </div>

                        {/* Rows */}
                        {data.chromosomes.map((chrom, i) => (
                            <div key={i} className="relative flex items-center group">
                                {/* Connector Line */}
                                <div className="absolute top-1/2 left-24 right-24 h-px bg-grey/10 -z-10" />

                                {/* Book 1 Dot */}
                                <div className="w-24 flex justify-end items-center gap-3 pr-2">
                                    <span className="text-xs font-bold text-teal opacity-60">{chrom.value1}</span>
                                    <div className="w-3 h-3 rounded-full bg-teal shadow-sm border border-white z-10" />
                                </div>

                                {/* Label */}
                                <div className="flex-1 text-center">
                                    <span className="text-xs font-medium text-grey bg-white/80 px-2 py-0.5 rounded shadow-sm border border-grey/5">
                                        {chrom.label}
                                    </span>
                                </div>

                                {/* Book 2 Dot */}
                                <div className="w-24 flex flex-col justify-center items-start pl-2 relative">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-coral shadow-sm border border-white z-10" />
                                        <span className="text-xs font-bold text-coral opacity-60">{chrom.value2}</span>
                                    </div>

                                    {/* Difference Indicator (if flagged) */}
                                    {chrom.diffLabel && (
                                        <div className="absolute top-5 left-0 whitespace-nowrap z-20">
                                            <span className="text-[9px] font-bold text-coral bg-coral/5 px-1.5 py-0.5 rounded border border-coral/10 flex items-center gap-1">
                                                <span className="text-[10px]">↑</span> {chrom.diffLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Similarities */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider border-b border-teal/10 pb-2">Similitudes Clave</h3>
                    <ul className="space-y-3">
                        {data.similarities.map((sim, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-grey group">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center text-teal text-[10px] font-bold mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">✓</span>
                                <span className="leading-relaxed">{sim}</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            {/* Detailed Differences */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider border-b border-teal/10 pb-2">Diferencias Clave</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.differences.map((diff, i) => (
                        <div key={i} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-xs font-bold text-grey/60 uppercase mb-4">{diff.aspect}</h4>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-bold text-teal-dark">{data.book1.title}</span>
                                        {diff.book1Value && <span className="text-xs font-mono text-teal opacity-60">{diff.book1Value}/10</span>}
                                    </div>
                                    <p className="text-sm text-grey">{diff.book1Desc}</p>
                                    {diff.book1Value && (
                                        <div className="h-1.5 w-full bg-teal/10 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-teal" style={{ width: `${diff.book1Value * 10}%` }} />
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-grey/5 pt-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm font-bold text-coral-dark">{data.book2.title}</span>
                                        {diff.book2Value && <span className="text-xs font-mono text-coral opacity-60">{diff.book2Value}/10</span>}
                                    </div>
                                    <p className="text-sm text-grey">{diff.book2Desc}</p>
                                    {diff.book2Value && (
                                        <div className="h-1.5 w-full bg-coral/10 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-coral" style={{ width: `${diff.book2Value * 10}%` }} />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-grey/5 rounded-lg p-3 text-xs italic text-grey/80 border-l-2 border-grey/20">
                                    {diff.insight}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-br from-teal-dark to-black text-white rounded-3xl p-8 relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-coral/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <h3 className="text-sm font-bold text-coral-light uppercase tracking-widest">Recomendación de Lectura</h3>
                    <p className="text-lg md:text-xl font-serif leading-relaxed text-white/90">
                        "{data.recommendation.text}"
                    </p>
                    <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl">
                        <span className="text-sm font-bold text-white uppercase tracking-wider">{data.recommendation.readingOrder}</span>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <button className="text-xs font-bold text-white/60 hover:text-white hover:underline transition-colors uppercase tracking-wider">
                            Ver más comparaciones
                        </button>
                        <span className="text-white/20">|</span>
                        <button className="text-xs font-bold text-white/60 hover:text-white hover:underline transition-colors uppercase tracking-wider">
                            Análisis detallado
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <Link href="/app/adn" className="text-sm font-medium text-grey hover:text-teal transition-colors flex items-center gap-2">
                    ← Volver al Genoma
                </Link>
            </div>

        </section>
    );
}

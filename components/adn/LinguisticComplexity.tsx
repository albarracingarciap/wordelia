"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface LinguisticComplexityData {
    readingLevel: {
        value: number; // 1-10
        label: string; // e.g. "7/10"
        age: string; // "16+ años"
        eduLevel: string; // "Secundaria superior"
    };
    lexicalRichness: {
        uniqueWords: string; // "~8,500"
        diversity: number; // 1-10
        difficultWords: {
            count: string; // "~450 (5%)"
            examples: string[];
        }
    };
    syntax: {
        value: number; // 1-10
        label: string; // "Muy compleja"
        points: string[];
    };
    readability: {
        fleschEase: string; // "65/100"
        fleschEaseDesc: string; // "Ligeramente difícil"
        kincaidGrade: string; // "9.2"
        kincaidGradeDesc: string; // "Nivel 3º ESO"
    };
    innovations: {
        list: string[];
        culturalImpact: number; // 1-10
        impactDesc: string;
    };
}

interface LinguisticComplexityProps {
    data: LinguisticComplexityData;
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

export function LinguisticComplexity({ data, className }: LinguisticComplexityProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Complejidad Lingüística</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-8">

                    {/* Reading Level */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Nivel de Lectura</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-grey/60 font-medium whitespace-nowrap">Primaria - Universidad</span>
                                    <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.readingLevel.value}/10</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-teal/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal/60 to-teal rounded-full"
                                    style={{ width: `${data.readingLevel.value * 10}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1 bg-cream/60 rounded-xl p-3 border border-teal/5">
                                <span className="block text-[10px] uppercase font-bold text-grey/60 mb-1">Edad rec.</span>
                                <span className="text-sm font-bold text-teal-dark">{data.readingLevel.age}</span>
                            </div>
                            <div className="flex-1 bg-cream/60 rounded-xl p-3 border border-teal/5">
                                <span className="block text-[10px] uppercase font-bold text-grey/60 mb-1">Nivel Edu.</span>
                                <span className="text-sm font-bold text-teal-dark">{data.readingLevel.eduLevel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Syntax */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Sintaxis</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-grey/60 font-medium whitespace-nowrap">Simple - Muy compleja</span>
                                    <span className="text-xs font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full">{data.syntax.value}/10</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-teal/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-coral/60 to-coral rounded-full"
                                    style={{ width: `${data.syntax.value * 10}%` }}
                                />
                            </div>
                        </div>

                        <ul className="space-y-2 pl-2">
                            {data.syntax.points.map((pt, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-grey">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-teal shrink-0" />
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Innovations */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Innovaciones Lingüísticas</h3>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {data.innovations.list.map((word, i) => (
                                <span key={i} className="px-3 py-1 bg-teal/5 text-teal-dark text-xs font-medium rounded-full border border-teal/10">
                                    {word}
                                </span>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-teal/5">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-sm font-medium text-grey">Impacto Cultural</span>
                                <span className="text-xs font-bold text-coral">{data.innovations.culturalImpact}/10</span>
                            </div>
                            <ProgressBar value={data.innovations.culturalImpact} colorClass="bg-coral" />
                            <p className="text-xs text-grey/60 italic mt-2 text-right">{data.innovations.impactDesc}</p>
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Lexical Richness */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Riqueza Léxica</h3>

                        <div className="bg-cream/40 rounded-xl p-4 border border-teal/5 text-center">
                            <span className="text-3xl font-serif font-bold text-teal-dark block mb-1">{data.lexicalRichness.uniqueWords}</span>
                            <span className="text-xs font-medium text-grey/60 uppercase">Palabras Únicas</span>
                        </div>

                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-sm font-medium text-grey">Diversidad del vocabulario</span>
                                <span className="text-xs font-bold text-teal">{data.lexicalRichness.diversity}/10</span>
                            </div>
                            <ProgressBar value={data.lexicalRichness.diversity} />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-grey">Palabras Difíciles</span>
                                <span className="font-bold text-coral">{data.lexicalRichness.difficultWords.count}</span>
                            </div>
                            <ul className="space-y-1 pl-4 border-l-2 border-teal/10">
                                {data.lexicalRichness.difficultWords.examples.map((ex, i) => (
                                    <li key={i} className="text-xs text-grey/80 italic">{ex}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Readability Indices */}
                    <div className="bg-teal text-white rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-coral/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-6 relative z-10">Índices de Legibilidad</h3>

                        <div className="grid grid-cols-1 gap-6 relative z-10">
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
                                <span className="block text-[10px] uppercase font-bold text-white/60 mb-1">Flesch Reading Ease</span>
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-serif font-bold">{data.readability.fleschEase}</span>
                                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded text-white/90">{data.readability.fleschEaseDesc}</span>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
                                <span className="block text-[10px] uppercase font-bold text-white/60 mb-1">Flesch-Kincaid Grade</span>
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-serif font-bold text-coral-light">{data.readability.kincaidGrade}</span>
                                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded text-white/90">{data.readability.kincaidGradeDesc}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}

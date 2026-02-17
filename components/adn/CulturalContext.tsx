"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface CulturalContextData {
    publication: {
        year: number;
        context: string[];
    };
    narrative: {
        year: number;
        location: string;
        period: string;
    };
    movement: string[];
    // Evolution Data
    evolution: {
        points: {
            year: number;
            work: string;
            complexity: number; // 0-10 y-axis
        }[];
        insights: string[];
        signature: string;
    };
    // Tree Data
    tree: {
        ancestors: {
            title: string;
            author: string;
            year: number;
            dnaMatch: number;
        }[];
        descendants: {
            title: string;
            author: string;
            year: number;
            dnaMatch: number;
        }[];
    };
    relevance: {
        value: number; // 1-10
        points: string[];
    };
}

interface CulturalContextProps {
    data: CulturalContextData;
    className?: string;
}

// --- Evolution Chart Component ---
function EvolutionChart({ points }: { points: CulturalContextData["evolution"]["points"] }) {
    const width = 100;
    const height = 60;
    const padding = 10;

    // Scales
    const minYear = Math.min(...points.map(p => p.year));
    const maxYear = Math.max(...points.map(p => p.year));
    const yearRange = maxYear - minYear || 1;

    const getX = (year: number) => padding + ((year - minYear) / yearRange) * (width - 2 * padding);
    const getY = (val: number) => height - padding - (val / 10) * (height - 2 * padding);

    const pathD = "M" + points.map(p => `${getX(p.year)},${getY(p.complexity)}`).join(" L");

    return (
        <div className="w-full aspect-[16/9] relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                {[0, 2.5, 5, 7.5, 10].map(val => (
                    <line key={val} x1={padding} y1={getY(val)} x2={width - padding} y2={getY(val)} stroke="#e5e5e5" strokeWidth="0.5" strokeDasharray="2 2" />
                ))}

                {/* Axis Labels */}
                <text x={padding - 2} y={getY(10)} className="text-[3px] fill-grey/60 text-right" dominantBaseline="middle" textAnchor="end">10</text>
                <text x={padding - 2} y={getY(0)} className="text-[3px] fill-grey/60 text-right" dominantBaseline="middle" textAnchor="end">0</text>

                {/* Line */}
                <path d={pathD} fill="none" stroke="var(--color-teal)" strokeWidth="1" />

                {/* Area under curve */}
                <path d={`${pathD} L${getX(maxYear)},${getY(0)} L${getX(minYear)},${getY(0)} Z`} fill="var(--color-teal)" fillOpacity="0.1" />

                {/* Points */}
                {points.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                        <circle cx={getX(p.year)} cy={getY(p.complexity)} r="1.5" fill="var(--color-coral)" className="transition-transform group-hover:scale-150" />
                        {/* Tooltip */}
                        <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <rect x={getX(p.year) - 15} y={getY(p.complexity) - 12} width="30" height="8" rx="2" fill="white" stroke="#e5e5e5" strokeWidth="0.5" />
                            <text x={getX(p.year)} y={getY(p.complexity) - 8} textAnchor="middle" className="text-[3px] font-bold fill-teal-dark">{p.work}</text>
                            <text x={getX(p.year)} y={getY(p.complexity) - 5} textAnchor="middle" className="text-[2.5px] fill-grey">{p.year}</text>
                        </g>

                        {/* X Axis Labels */}
                        <text x={getX(p.year)} y={height - 2} textAnchor="middle" className="text-[3px] fill-grey/80">{p.year}</text>
                    </g>
                ))}
            </svg>
            <div className="absolute top-2 left-2 text-[10px] text-grey/40 uppercase font-bold">Complejidad</div>
        </div>
    );
}


// --- Tree Component ---
function GenealogicalTree({ data }: { data: CulturalContextData["tree"] }) {
    return (
        <div className="flex flex-col items-center gap-6 relative py-4">
            {/* Ancestors */}
            <div className="flex flex-col gap-4 w-full">
                <h4 className="text-center text-xs font-bold text-grey/60 uppercase tracking-widest mb-1">Antecesores</h4>
                <div className="flex justify-center gap-4">
                    {data.ancestors.map((book, i) => (
                        <div key={i} className="bg-white/40 border border-teal/10 rounded-xl p-3 text-center w-32 relative group hover:bg-white transition-colors">
                            <div className="text-xs font-bold text-teal-dark truncate">{book.title}</div>
                            <div className="text-[10px] text-grey">{book.author}, {book.year}</div>
                            <div className="mt-1 inline-block bg-teal/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-teal">ADN: {book.dnaMatch}%</div>

                            {/* Connector Line to Main Book */}
                            <div className="absolute top-full left-1/2 w-px h-6 bg-teal/20 -z-10" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Connection Node */}
            <div className="w-px h-4 bg-teal/20" />

            {/* Main Book */}
            <div className="relative z-10">
                <div className="bg-teal text-white rounded-xl p-4 shadow-lg border-2 border-white text-center w-40">
                    <span className="block text-sm font-bold tracking-wider">ESTA OBRA</span>
                </div>
            </div>

            {/* Connection Node */}
            <div className="w-px h-4 bg-teal/20" />

            {/* Descendants */}
            <div className="flex flex-col gap-4 w-full">
                <div className="flex justify-center gap-4 flex-wrap">
                    {data.descendants.map((book, i) => (
                        <div key={i} className="bg-white/40 border border-teal/10 rounded-xl p-3 text-center w-32 relative hover:bg-white transition-colors">
                            {/* Connector Line from Main Book */}
                            <div className="absolute bottom-full left-1/2 w-px h-6 bg-teal/20 -z-10" />

                            <div className="text-xs font-bold text-teal-dark truncate">{book.title}</div>
                            <div className="text-[10px] text-grey">{book.author}, {book.year}</div>
                            <div className="mt-1 inline-block bg-coral/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-coral">ADN: {book.dnaMatch}%</div>
                        </div>
                    ))}
                </div>
                <h4 className="text-center text-xs font-bold text-grey/60 uppercase tracking-widest mt-1">Descendientes</h4>
            </div>
        </div>
    );
}

export function CulturalContext({ data, className }: CulturalContextProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Contexto Cultural</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Context & Evolution */}
                <div className="space-y-8">

                    {/* Eras Comparison (Condensed) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-teal/10 shadow-sm">
                            <h3 className="text-[10px] font-bold text-grey/60 uppercase mb-2">Publicación</h3>
                            <span className="block text-2xl font-serif font-bold text-teal-dark">{data.publication.year}</span>
                            <span className="text-[10px] text-grey">{data.publication.context[0]}</span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-teal/10 shadow-sm">
                            <h3 className="text-[10px] font-bold text-grey/60 uppercase mb-2">Narrativa</h3>
                            <span className="block text-2xl font-serif font-bold text-coral">{data.narrative.year}</span>
                            <span className="text-[10px] text-grey">{data.narrative.location}</span>
                        </div>
                    </div>

                    {/* Literary Evolution Chart (NEW) */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm relative overflow-hidden">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4 border-b border-teal/5 pb-2">
                            📈 Evolución Literaria
                        </h3>
                        <EvolutionChart points={data.evolution.points} />
                        <div className="mt-4 space-y-2 bg-white/40 p-3 rounded-xl border border-teal/5">
                            <h4 className="text-[10px] font-bold text-grey uppercase">Insights:</h4>
                            <ul className="space-y-1">
                                {data.evolution.insights.map((insight, i) => (
                                    <li key={i} className="text-xs text-grey italic">• {insight}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-[10px] font-bold text-grey/40 uppercase mr-2">Firma Evolutiva:</span>
                            <span className="text-xs font-mono text-teal-dark">{data.evolution.signature}</span>
                        </div>
                    </div>

                    {/* Movement */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Movimiento</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.movement.map((mov, i) => (
                                <span key={i} className="px-3 py-1.5 bg-cream rounded-lg text-xs font-medium text-grey border border-teal/5">
                                    {mov}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Relevance & Tree */}
                <div className="space-y-8">

                    {/* Relevance - Hero Card (Compact) */}
                    <div className="bg-teal-dark text-white rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-dark via-teal-dark to-black" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-coral/30 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Vigencia Actual</h3>
                                <span className="text-[10px] uppercase font-bold text-white/40">Muy importante</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-3xl font-serif font-bold text-coral-light">{data.relevance.value}/10</span>
                            </div>
                        </div>
                        <ul className="relative z-10 space-y-1 mt-4">
                            {data.relevance.points.slice(0, 3).map((pt, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-medium text-white/90">
                                    <span className="w-1 h-1 bg-coral-light rounded-full" />
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Genealogical Tree (NEW - Replaces Text Lists) */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4 border-b border-teal/5 pb-2">
                            🌳 Árbol Genealógico
                        </h3>
                        <GenealogicalTree data={data.tree} />
                        <div className="mt-4 text-center">
                            <button className="text-xs font-bold text-grey/60 hover:text-teal transition-colors border-b border-dotted border-grey/40 hover:border-teal">
                                Ver red completa de influencias
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}

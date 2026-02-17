"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface NarrativeData {
    structureType: string;
    perspective: string;
    plotLines: {
        active: number;
        total: number;
    };
    complexity: {
        value: number; // 1-10
        label: string; // e.g. "Muy compleja" or just a text description if needed
    };
    division: string[];
    turningPoints: {
        id: number;
        label: string;
        page: number; // or string like "pág. 20"
    }[];
}

const STRUCTURE_OPTIONS = [
    "Lineal cronológica",
    "Flashbacks/Analepsis",
    "Fragmentada/No lineal",
    "Circular",
    "Múltiples líneas temporales"
];

const PERSPECTIVE_OPTIONS = [
    "Tercera persona limitada",
    "Primera persona",
    "Tercera omnisciente",
    "Segunda persona",
    "Múltiples narradores"
];

interface NarrativeStructureProps {
    data: NarrativeData;
    className?: string;
}

export function NarrativeStructure({ data, className }: NarrativeStructureProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Estructura Narrativa</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Classification */}
                <div className="space-y-8">
                    {/* Structure Type */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Tipo de estructura</h3>
                        <ul className="space-y-2.5">
                            {STRUCTURE_OPTIONS.map((option) => {
                                const isActive = option === data.structureType;
                                return (
                                    <li key={option} className="flex items-center group cursor-default">
                                        <div className={cn(
                                            "w-2.5 h-2.5 rounded-full mr-3 border transition-all duration-300",
                                            isActive
                                                ? "bg-coral border-coral scale-110 shadow-sm"
                                                : "bg-transparent border-grey/40 group-hover:border-teal/60"
                                        )} />
                                        <span className={cn(
                                            "text-sm transition-colors duration-300",
                                            isActive ? "text-teal-dark font-semibold" : "text-grey/80"
                                        )}>
                                            {option}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Perspective */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Perspectiva narrativa</h3>
                        <ul className="space-y-2.5">
                            {PERSPECTIVE_OPTIONS.map((option) => {
                                const isActive = option === data.perspective;
                                return (
                                    <li key={option} className="flex items-center group cursor-default">
                                        <div className={cn(
                                            "w-2.5 h-2.5 rounded-full mr-3 border transition-all duration-300",
                                            isActive
                                                ? "bg-coral border-coral scale-110 shadow-sm"
                                                : "bg-transparent border-grey/40 group-hover:border-teal/60"
                                        )} />
                                        <span className={cn(
                                            "text-sm transition-colors duration-300",
                                            isActive ? "text-teal-dark font-semibold" : "text-grey/80"
                                        )}>
                                            {option}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Plot Lines & Complexity */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        {/* Lines */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Líneas argumentales</h3>
                                <span className="text-xs font-semibold text-coral">{data.plotLines.active} tramas principales</span>
                            </div>
                            <div className="flex gap-1.5">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-2 flex-1 rounded-full transition-all duration-500",
                                            i < data.plotLines.active ? "bg-teal" : "bg-teal/10"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Complexity */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Complejidad</h3>
                                <div className="text-right">
                                    <span className="text-xs font-semibold text-coral block">{data.complexity.value}/10</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs text-grey/60 font-medium w-12 text-right">Simple</span>
                                <div className="flex-1 h-3 bg-teal/5 rounded-full overflow-hidden relative">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal/60 to-teal rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(data.complexity.value / 10) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-grey/60 font-medium w-20">Muy compleja</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Structure Details */}
                <div className="space-y-8">
                    {/* Division Formal */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-teal/10 shadow-sm relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6 pb-2 border-b border-teal/10">División Formal</h3>
                        <ul className="space-y-4">
                            {data.division.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cream border border-teal/20 text-xs text-teal font-serif shrink-0">
                                        {idx + 1}
                                    </span>
                                    <p className="text-base text-grey font-medium leading-relaxed">{item}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Turning Points - Timeline */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-teal/10 shadow-sm h-fit">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6 flex items-center gap-2">
                            Puntos de giro
                            <span className="px-2 py-0.5 bg-coral/10 text-coral text-[10px] rounded-full normal-case font-semibold">
                                {data.turningPoints.length} momentos clave
                            </span>
                        </h3>

                        <div className="relative pl-4 space-y-0">
                            {/* Vertical Line */}
                            <div className="absolute top-2 bottom-4 left-[23px] w-0.5 bg-gradient-to-b from-teal/20 via-teal/20 to-transparent" />

                            {data.turningPoints.map((point, idx) => (
                                <div key={point.id} className="relative flex items-baseline gap-6 pb-8 last:pb-0 group">
                                    {/* Dot */}
                                    <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-white border-2 border-teal group-hover:border-coral group-hover:scale-125 transition-all duration-300 shrink-0" />

                                    {/* Content */}
                                    <div className="-mt-1.5 transition-transform duration-300 group-hover:translate-x-1">
                                        <p className="text-base font-serif text-teal-dark font-medium leading-tight mb-1">
                                            {point.label}
                                        </p>
                                        <span className="text-xs text-grey/60 font-mono tracking-wide bg-cream px-1.5 py-0.5 rounded">
                                            pág. {point.page}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

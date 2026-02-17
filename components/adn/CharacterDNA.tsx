"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface CharacterData {
    distribution: {
        protagonists: number;
        main: number;
        secondary: number;
        background: string; // e.g. "15+"
    };
    complexity: {
        value: number; // 1-10
        label: string; // e.g. "Muy compleja"
        focusCharacter: {
            name: string; // "Winston Smith"
            points: string[];
        };
    };
    arcs: {
        name: string;
        stages: string[]; // [Start, Middle, End]
        intensity: number; // 1-10
    }[];
    diversity: {
        gender: { label: string; value: number }[];
        age: { label: string; value: number }[];
        social: { label: string; value: number }[];
    };
    relationships: {
        nodes: { id: string; x: number; y: number }[];
        edges: { source: string; target: string; label: string; type?: "solid" | "dashed" }[];
        dominantType: string;
        conflict: number; // 1-10
        collaboration: number; // 1-10
    };
}

interface CharacterDNAProps {
    data: CharacterData;
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

export function CharacterDNA({ data, className }: CharacterDNAProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">ADN de Personajes</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            {/* Distribution Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Protagonistas", value: data.distribution.protagonists },
                    { label: "Principales", value: data.distribution.main },
                    { label: "Secundarios", value: data.distribution.secondary },
                    { label: "Fondo", value: data.distribution.background },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-teal/10 text-center">
                        <span className="block text-2xl font-bold text-teal mb-1">{item.value}</span>
                        <span className="text-xs font-medium text-grey/60 uppercase">{item.label}</span>
                    </div>
                ))}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-8">

                    {/* Complexity */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Complejidad Psicológica</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-grey/60 font-medium">{data.complexity.label}</span>
                                    <span className="text-xs font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">{data.complexity.value}/10</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-teal/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal to-coral rounded-full"
                                    style={{ width: `${data.complexity.value * 10}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-cream/40 rounded-xl p-4 border border-teal/5">
                            <h4 className="font-serif text-teal-dark font-medium mb-3">{data.complexity.focusCharacter.name}</h4>
                            <ul className="space-y-2">
                                {data.complexity.focusCharacter.points.map((pt, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-grey">
                                        <span className="mt-1.5 w-1 h-1 bg-coral rounded-full shrink-0" />
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Diversity */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Diversidad</h3>

                        {/* Gender */}
                        <div>
                            <h4 className="text-xs font-bold text-grey/60 mb-2">GÉNERO</h4>
                            <div className="flex h-2 rounded-full overflow-hidden mb-1">
                                {data.diversity.gender.map((g, i) => (
                                    <div
                                        key={i}
                                        style={{ width: `${g.value}%` }}
                                        className={cn("h-full", i === 0 ? "bg-teal" : "bg-coral/60")}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-grey/80">
                                {data.diversity.gender.map(g => <span key={g.label}>{g.label} {g.value}%</span>)}
                            </div>
                        </div>

                        {/* Age */}
                        <div>
                            <h4 className="text-xs font-bold text-grey/60 mb-2">EDAD</h4>
                            <div className="space-y-2">
                                {data.diversity.age.map((ag) => (
                                    <div key={ag.label} className="flex items-center gap-3 text-xs">
                                        <span className="w-24 text-grey">{ag.label}</span>
                                        <div className="flex-1 h-1.5 bg-teal/5 rounded-full overflow-hidden">
                                            <div style={{ width: `${ag.value}%` }} className="h-full bg-teal/60 rounded-full" />
                                        </div>
                                        <span className="w-8 text-right font-medium text-teal">{ag.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social */}
                        <div>
                            <h4 className="text-xs font-bold text-grey/60 mb-2">CLASE SOCIAL</h4>
                            <div className="space-y-2">
                                {data.diversity.social.map((sc) => (
                                    <div key={sc.label} className="flex items-center gap-3 text-xs">
                                        <span className="w-24 text-grey">{sc.label}</span>
                                        <div className="flex-1 h-1.5 bg-teal/5 rounded-full overflow-hidden">
                                            <div style={{ width: `${sc.value}%` }} className="h-full bg-teal-dark rounded-full" />
                                        </div>
                                        <span className="w-8 text-right font-medium text-teal">{sc.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Arcs */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm relative overflow-hidden">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Arcos de Transformación</h3>

                        <div className="space-y-10">
                            {data.arcs.map((arc, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-serif text-teal-dark">{arc.name}</h4>
                                        <span className="text-[10px] font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full">Cambio {arc.intensity}/10</span>
                                    </div>

                                    {/* Timeline line */}
                                    <div className="absolute top-[3.2rem] left-0 right-0 h-0.5 bg-gradient-to-r from-teal/20 via-teal/40 to-coral/40" />

                                    <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                                        {arc.stages.map((stage, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 group">
                                                <div className="w-2.5 h-2.5 rounded-full border-2 border-cream shadow bg-teal group-hover:scale-125 transition-transform" />
                                                <span className="text-xs font-medium text-grey leading-tight max-w-[80px]">{stage}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Relationships Graph */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm h-fit">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Relaciones</h3>

                        <div className="relative h-64 w-full border border-teal/5 rounded-xl bg-white/40 mb-4">
                            {/* Simple Node Graph Implementation using absolute positioning for nodes and SVG lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#D56962" />
                                    </marker>
                                </defs>
                                {data.relationships.edges.map((edge, i) => {
                                    const source = data.relationships.nodes.find(n => n.id === edge.source)!;
                                    const target = data.relationships.nodes.find(n => n.id === edge.target)!;
                                    const midX = (source.x + target.x) / 2;
                                    const midY = (source.y + target.y) / 2;

                                    return (
                                        <g key={i}>
                                            <line
                                                x1={`${source.x}%`} y1={`${source.y}%`}
                                                x2={`${target.x}%`} y2={`${target.y}%`}
                                                stroke="#D56962"
                                                strokeWidth="1.5"
                                                opacity="0.4"
                                                strokeDasharray={edge.type === "dashed" ? "4" : undefined}
                                            />
                                            {/* Label bg */}
                                            <rect x={`${midX - 10}%`} y={`${midY - 4}%`} width="20%" height="8%" fill="var(--color-cream)" rx="4" opacity="0.8" />
                                            <text
                                                x={`${midX}%`} y={`${midY}%`}
                                                dominantBaseline="middle" textAnchor="middle"
                                                fontSize="10" fill="#737373" className="font-medium"
                                            >
                                                {edge.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Nodes */}
                            {data.relationships.nodes.map((node) => (
                                <div
                                    key={node.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-teal/20 z-10"
                                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                >
                                    <span className="text-xs font-serif font-bold text-teal text-center leading-tight">{node.id}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-teal/5">
                            <div>
                                <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-sm font-medium text-grey">Nivel de Conflicto</span>
                                    <span className="text-xs font-bold text-coral">{data.relationships.conflict}/10</span>
                                </div>
                                <ProgressBar value={data.relationships.conflict} colorClass="bg-coral" />
                            </div>
                            <div>
                                <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-sm font-medium text-grey">Nivel de Colaboración</span>
                                    <span className="text-xs font-bold text-teal">{data.relationships.collaboration}/10</span>
                                </div>
                                <ProgressBar value={data.relationships.collaboration} />
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </section>
    );
}

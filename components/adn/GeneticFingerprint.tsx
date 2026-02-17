"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Types ---
export interface GeneticFingerprintData {
    book: {
        title: string;
        author: string;
        year: number;
        genre: string;
    };
    dimensions: {
        label: string;
        value: number; // 1-10
        code: string; // e.g. "ST" for Structure
    }[];
    signature: string; // "ST10-EM9..."
    profile: string[];
}

interface GeneticFingerprintProps {
    data: GeneticFingerprintData;
    className?: string;
}

function RadarChart({ data }: { data: GeneticFingerprintData["dimensions"] }) {
    const size = 300;
    const center = size / 2;
    const radius = (size / 2) - 40; // Padding
    const angleStep = (Math.PI * 2) / data.length;

    // Helper to calculate points
    const getPoint = (value: number, index: number, max: number = 10) => {
        const angle = index * angleStep - Math.PI / 2; // Start at top
        const r = (value / max) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const points = data.map((d, i) => getPoint(d.value, i)).map(p => `${p.x},${p.y}`).join(" ");
    const fullPoints = data.map((_, i) => getPoint(10, i)).map(p => `${p.x},${p.y}`).join(" ");

    return (
        <div className="relative w-full aspect-square max-w-[400px] mx-auto">
            <svg viewBox={`-20 -20 ${size + 40} ${size + 40}`} className="w-full h-full overflow-visible">
                {/* Background Grid (Concentric webs) */}
                {[2, 4, 6, 8, 10].map((level) => {
                    const gridPoints = data.map((_, i) => getPoint(level, i)).map(p => `${p.x},${p.y}`).join(" ");
                    return (
                        <polygon
                            key={level}
                            points={gridPoints}
                            fill="none"
                            stroke="#e5e5e5"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    );
                })}

                {/* Axis Lines */}
                {data.map((_, i) => {
                    const p = getPoint(10, i);
                    return (
                        <line
                            key={i}
                            x1={center} y1={center}
                            x2={p.x} y2={p.y}
                            stroke="#e5e5e5"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* The Data Shape */}
                <polygon
                    points={points}
                    fill="rgba(59, 140, 133, 0.2)" // teal/20
                    stroke="var(--color-teal)"
                    strokeWidth="2"
                    className="drop-shadow-md transition-all duration-1000 ease-out"
                />

                {/* Points & Labels */}
                {data.map((d, i) => {
                    const p = getPoint(d.value, i);
                    const labelP = getPoint(12, i); // Push labels out further

                    return (
                        <g key={i} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="4" fill="var(--color-coral)" />

                            {/* Value Tooltip */}
                            <text
                                x={p.x} y={p.y - 10}
                                textAnchor="middle"
                                className="text-[10px] font-bold fill-teal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            >
                                {d.value}/10
                            </text>

                            {/* Label */}
                            <text
                                x={labelP.x} y={labelP.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-xs font-medium fill-grey uppercase tracking-wide"
                            >
                                {d.label}
                            </text>
                            <text
                                x={labelP.x} y={labelP.y + 12}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[10px] font-bold fill-teal"
                            >
                                ({d.value})
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export function GeneticFingerprint({ data, className }: GeneticFingerprintProps) {
    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header className="text-center space-y-2">
                <span className="text-xs font-bold text-coral bg-coral/5 px-3 py-1 rounded-full uppercase tracking-wider">ADN Literario Exclusivo</span>
                <h2 className="text-3xl md:text-4xl font-serif text-teal-dark">{data.book.title}</h2>
                <div className="flex justify-center items-center gap-3 text-sm text-grey font-medium">
                    <span>{data.book.author}</span>
                    <span className="w-1 h-1 bg-grey/40 rounded-full" />
                    <span>{data.book.year}</span>
                    <span className="w-1 h-1 bg-grey/40 rounded-full" />
                    <span>{data.book.genre}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                {/* Left: Radar Visual */}
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-teal/10 shadow-sm flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-coral/5 opacity-50" />
                    <RadarChart data={data.dimensions} />
                </div>

                {/* Right: Data & Actions */}
                <div className="space-y-8">

                    {/* Signature Code */}
                    <div className="bg-teal-dark text-white rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-coral/20 rounded-full blur-3xl pointer-events-none" />

                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Firma Genética Única</h3>
                        <div className="font-mono text-lg md:text-xl tracking-wider text-coral-light break-all leading-relaxed">
                            {data.signature}
                        </div>
                        <p className="text-[10px] text-white/40 mt-3 italic">
                            Identificador único generado a partir de 8 dimensiones de análisis profundo.
                        </p>
                    </div>

                    {/* Quick Profile */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-4">Perfil Rápido</h3>
                        <ul className="space-y-2">
                            {data.profile.map((pt, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-grey font-medium">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-teal rounded-full shrink-0" />
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-teal hover:bg-teal-dark text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-sm">
                            Ver Análisis Completo
                        </button>
                        <Link href="/app/adn/compare">
                            <button className="w-full bg-white hover:bg-gray-50 text-teal border border-teal/20 text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-sm">
                                Comparar Libro
                            </button>
                        </Link>
                        <Link href="/app/adn/genre">
                            <button className="w-full bg-white hover:bg-gray-50 text-teal border border-teal/20 text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-sm">
                                Analizar Género
                            </button>
                        </Link>
                        <button className="w-full bg-white hover:bg-gray-50 text-teal border border-teal/20 text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-sm col-span-2">
                            Compartir ADN
                        </button>
                    </div>

                </div>

            </div>
        </section>
    );
}

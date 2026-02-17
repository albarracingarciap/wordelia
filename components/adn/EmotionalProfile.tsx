"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getCatmullRomPath } from "@/lib/chart";

// --- Types ---
export interface EmotionalProfileData {
    curvePoints: { x: number; y: number }[]; // Coordinates for the curve (0-100 X, 0-10 Y)
    predominantEmotions: {
        emotion: string;
        percentage: number;
        emoji: string;
    }[];
    tensionType: {
        type: string;
        value: number; // 1-10
    }[];
    keyMoments: {
        id: number;
        label: string;
        emotions: string[];
    }[];
    ending: {
        type: string; // e.g. "Trágico/Desolador"
        climaxIntensity: number; // 1-10
        catharsis: number; // 1-10
    };
}

const ENDING_OPTIONS = [
    "Trágico/Desolador",
    "Abierto",
    "Esperanzador",
    "Ambiguo"
];

interface EmotionalProfileProps {
    data: EmotionalProfileData;
    className?: string;
}

function ProgressBar({ value, max = 10, colorClass = "bg-teal" }: { value: number; max?: number; colorClass?: string }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "h-2 flex-1 rounded-sm transition-all duration-500",
                        i < (value / max) * 10 ? colorClass : "bg-teal/5"
                    )}
                />
            ))}
        </div>
    );
}

function ChartVisualizer({ points }: { points: { x: number; y: number }[] }) {
    const [hoveredPoint, setHoveredPoint] = React.useState<{ x: number, y: number, value: number } | null>(null);

    // Generate smooth path
    const pathD = React.useMemo(() => {
        // Map points to SVG coordinates (0-100 Width, 0-10 Height but inverted Y)
        const svgPoints = points.map(p => ({ x: p.x, y: 10 - p.y }));
        return getCatmullRomPath(svgPoints);
    }, [points]);

    return (
        <div className="h-48 md:h-64 w-full relative group/chart">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-grey/40 pointer-events-none select-none">
                {[10, 8, 6, 4, 2, 0].map(val => (
                    <div key={val} className="flex items-center gap-2 w-full">
                        <span className="w-3 text-right">{val}</span>
                        <div className="h-px bg-teal/5 flex-1" />
                    </div>
                ))}
            </div>

            {/* SVG Chart */}
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pt-2 pb-6 pl-6 pr-4 overflow-visible">
                <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-coral)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--color-coral)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area under curve (Closed path) */}
                <path
                    d={`${pathD} L 100,10 L 0,10 Z`}
                    fill="url(#curveGradient)"
                    className="transition-all duration-1000 ease-in-out opacity-80"
                />

                {/* The Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="var(--color-coral)"
                    strokeWidth="0.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                />

                {/* Interactive Points */}
                {points.map((p, i) => (
                    <g key={i}>
                        {/* Invisible Hit Area */}
                        <circle
                            cx={p.x}
                            cy={10 - p.y}
                            r="3"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ x: p.x, y: 10 - p.y, value: p.y })}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                        {/* Visible Dot */}
                        <circle
                            cx={p.x}
                            cy={10 - p.y}
                            r={hoveredPoint?.x === p.x ? "0.8" : "0.5"}
                            fill="white"
                            stroke="var(--color-coral)"
                            strokeWidth={hoveredPoint?.x === p.x ? "0.3" : "0.2"}
                            className="pointer-events-none transition-all duration-300"
                        />
                    </g>
                ))}
            </svg>

            {/* Custom Tooltip */}
            {hoveredPoint && (
                <div
                    className="absolute z-20 pointer-events-none flex flex-col items-center"
                    style={{
                        left: `${hoveredPoint.x}%`,
                        top: `${(hoveredPoint.y / 10) * 100}%`,
                        transform: 'translate(-50%, -120%)' // Move up above the point
                    }}
                >
                    <div className="bg-teal-dark text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap mb-1">
                        Intensidad: {hoveredPoint.value}/10
                    </div>
                    {/* Little arrow */}
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-teal-dark" />
                </div>
            )}
        </div>
    );
}

export function EmotionalProfile({ data, className }: EmotionalProfileProps) {


    return (
        <section className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>

            <header>
                <h2 className="text-2xl md:text-3xl font-serif text-teal mb-2">Perfil Emocional</h2>
                <div className="h-1 w-20 bg-coral/60 rounded-full" />
            </header>

            {/* Emotional Curve - Full Width */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-teal/10 shadow-sm relative overflow-visible">
                <div className="flex justify-between items-baseline mb-6 relative z-10">
                    <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Curva Emocional</h3>
                    <span className="text-xs bg-teal/10 text-teal px-2 py-1 rounded font-medium">Análisis IA</span>
                </div>

                <ChartVisualizer points={data.curvePoints} />

                {/* X Axis Labels */}
                <div className="flex justify-between text-xs text-grey/60 font-medium mt-2 px-4">
                    <span>Inicio</span>
                    <span>Medio</span>
                    <span>Final</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-8">

                    {/* Predominant Emotions */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Emociones Predominantes</h3>
                        <div className="space-y-4">
                            {data.predominantEmotions.map((item) => (
                                <div key={item.emotion} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{item.emoji}</span>
                                            <span className="font-medium text-grey">{item.emotion}</span>
                                        </div>
                                        <span className="font-bold text-teal">{item.percentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-cream rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal/80 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tension Types */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Tipo de Tensión</h3>
                        <div className="space-y-5">
                            {data.tensionType.map((item) => (
                                <div key={item.type}>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <span className="text-sm font-medium text-grey">{item.type}</span>
                                        <span className="text-xs font-bold text-coral">{item.value}/10</span>
                                    </div>
                                    <ProgressBar value={item.value} />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="space-y-8">

                    {/* Key Moments */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6">Momentos Emocionales Clave</h3>
                        <ul className="space-y-4">
                            {data.keyMoments.map((moment, idx) => (
                                <li key={moment.id} className="relative pl-6 pb-2 border-l border-teal/10 last:border-0">
                                    <span className="absolute left-0 top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-coral border border-white shadow-sm" />
                                    <p className="text-sm font-medium text-teal-dark mb-0.5">{idx + 1}. {moment.label}</p>
                                    <p className="text-xs text-grey/60 italic">{moment.emotions.join(" / ")}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Ending Analysis */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-teal/10 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider">Tipo de Final</h3>

                        <div className="grid grid-cols-2 gap-3">
                            {ENDING_OPTIONS.map((opt) => (
                                <div
                                    key={opt}
                                    className={cn(
                                        "p-3 rounded-lg text-xs font-medium text-center transition-all",
                                        data.ending.type === opt
                                            ? "bg-teal text-white shadow-md scale-105"
                                            : "bg-cream text-grey/60 border border-transparent"
                                    )}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-teal/5">
                            <div>
                                <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-sm font-medium text-grey">Intensidad del clímax</span>
                                    <span className="text-xs font-bold text-coral">{data.ending.climaxIntensity}/10</span>
                                </div>
                                <ProgressBar value={data.ending.climaxIntensity} colorClass="bg-coral" />
                            </div>
                            <div>
                                <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-sm font-medium text-grey">Catarsis emocional</span>
                                    <span className="text-xs font-bold text-teal">{data.ending.catharsis}/10</span>
                                </div>
                                <ProgressBar value={data.ending.catharsis} />
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}

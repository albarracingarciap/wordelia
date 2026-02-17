"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface GenreDNAData {
    genre: string;
    sampleSize: number;
    characteristics: {
        label: string;
        value: number; // 0-10
        description: string;
    }[];
    emotions: {
        emotion: string;
        percentage: number;
        color: string;
    }[];
    themes: {
        id: number;
        name: string;
    }[];
    definingWorks: {
        title: string;
        author: string;
        match: number;
    }[];
}

interface GenreDNAProps {
    data: GenreDNAData;
    className?: string;
}

export function GenreDNA({ data, className }: GenreDNAProps) {
    return (
        <section className={cn("w-full max-w-5xl mx-auto space-y-12 pb-20", className)}>

            {/* Header */}
            <header className="text-center space-y-2">
                <span className="text-xs font-bold text-coral bg-coral/5 px-3 py-1 rounded-full uppercase tracking-wider">ADN del Género</span>
                <h1 className="text-4xl md:text-5xl font-serif text-teal-dark">{data.genre}</h1>
                <p className="text-sm text-grey font-medium">Basado en {data.sampleSize} obras analizadas</p>
            </header>

            {/* Characteristics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left: Stats List */}
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-teal/10 shadow-sm">
                    <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6 border-b border-teal/5 pb-2">Características Típicas</h3>
                    <div className="space-y-4">
                        {data.characteristics.map((char, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-grey">{char.label}:</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-grey/60 italic hidden group-hover:block transition-all">{char.description}</span>
                                    <div className="w-24 h-1.5 bg-grey/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal" style={{ width: `${char.value * 10}%` }} />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-teal w-8 text-right">[{char.value}/10]</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Emotions & Themes */}
                <div className="space-y-8">

                    {/* Emotions */}
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-teal/10 shadow-sm">
                        <h3 className="text-sm font-bold text-teal/80 uppercase tracking-wider mb-6 border-b border-teal/5 pb-2">Emociones Predominantes</h3>
                        <div className="space-y-3">
                            {data.emotions.map((emo, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-bold text-grey mb-1">
                                        <span>{emo.emotion}</span>
                                        <span>{emo.percentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-grey/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${emo.percentage}%`, backgroundColor: emo.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Themes */}
                    <div className="bg-teal-dark text-white rounded-3xl p-8 border border-white/10 shadow-lg">
                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Temas Recurrentes</h3>
                        <ul className="space-y-2">
                            {data.themes.map((theme, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-white/90">
                                    <span className="text-coral-light font-serif italic text-lg">{i + 1}.</span>
                                    {theme.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

            </div>

            {/* Defining Works */}
            <div className="bg-gradient-to-r from-teal/5 to-coral/5 rounded-3xl p-8 border border-teal/10 text-center">
                <h3 className="text-sm font-bold text-grey/60 uppercase tracking-widest mb-6">Obras Definitorias del Género</h3>
                <div className="flex flex-wrap justify-center gap-6">
                    {data.definingWorks.map((work, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-teal/5 w-64">
                            <div className="text-lg font-serif font-bold text-teal-dark mb-1">"{work.title}"</div>
                            <div className="text-xs text-grey mb-3">{work.author}</div>
                            <div className="inline-block bg-teal text-white px-3 py-1 rounded-full text-xs font-bold">
                                {work.match}% Match
                            </div>
                        </div>
                    ))}
                </div>
                <button className="mt-8 text-xs font-bold text-teal hover:underline uppercase tracking-wide">
                    Explorar género completo →
                </button>
            </div>

        </section>
    );
}

"use client";

import { useState } from "react";
import { BarChart3, BookOpen, Brain, Clock3, Dna, GitBranch, HelpCircle, Layers3, LockKeyhole, Route, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
    chromosomeTabs,
    demoChromosomes,
    type CharacterDnaChromosome,
    type ChromosomeKey,
    type CulturalContextChromosome,
    type EmotionalProfileChromosome,
    type LiteraryStyleChromosome,
    type LinguisticComplexityChromosome,
    type NarrativeChromosome,
    type RhythmDensityChromosome,
    type ThematicCompositionChromosome,
} from "./adn-data";

type GenomeBookHeader = {
    titulo: string;
    autor: string;
    año: string | number | null;
};

type GenomeChromosomes = Partial<Record<ChromosomeKey, unknown>>;

function formatKey(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
        .replace("Cronologica", "Cronológica")
        .replace("Omnisciente", "Omnisciente");
}

function scoreWidth(value: number, max = 10) {
    return `${Math.min(100, Math.max(0, (value / max) * 100))}%`;
}

function normalizeLabel(value: string) {
    const labels: Record<string, string> = {
        ironia: "Ironía",
        metafora: "Metáfora",
        simil: "Símil",
        colloquial: "Coloquial",
        muy_variable: "Muy variable",
        muy_frecuente: "Muy frecuente",
        psicologica: "Psicológica",
        fisica: "Física",
        climax_preparacion: "Preparación del clímax",
        resolucion: "Resolución",
        creciente_con_climax_intenso: "Creciente con clímax intenso",
        abierto_ambiguo: "Abierto y ambiguo",
        muy_profunda: "Muy profunda",
        filosofia_politica: "Filosofía política",
        heroe_tragico: "Héroe trágico",
        heroe: "Héroe",
        colaboracion: "Colaboración",
        mediana_edad: "Mediana edad",
        jovenes_adultos: "Jóvenes adultos",
        ninos_adolescentes: "Niños y adolescentes",
        ideologica_filosofica: "Ideológica filosófica",
        descripcion_ambiental: "Descripción ambiental",
        pre_climax: "Preclímax",
        formal_literario: "Formal literario",
        transgresion: "Transgresión",
        revelacion: "Revelación",
        catastrofe: "Catástrofe",
        destruccion: "Destrucción",
        victoria_temporal: "Victoria temporal",
        "difÃ­cil": "difícil",
        difícil: "difícil",
    };

    return labels[value] || formatKey(value);
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <div className={`overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <Card>
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">{label}</p>
                    <p className="mt-1 text-xl font-semibold leading-tight text-teal-dark">{value}</p>
                    {detail && <p className="mt-2 text-sm leading-relaxed text-grey">{detail}</p>}
                </div>
            </div>
        </Card>
    );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-teal-dark">{label}</p>
                <p className="text-sm font-bold text-coral">{value}/10</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-teal/10">
                <div className="h-full rounded-full bg-teal" style={{ width: scoreWidth(value) }} />
            </div>
        </div>
    );
}

function TooltipTerm({
    label,
    tooltip,
    light = false,
    align = "center",
}: {
    label: string;
    tooltip: string;
    light?: boolean;
    align?: "center" | "right";
}) {
    const tooltipPosition = align === "right" ? "right-0 translate-x-0" : "left-1/2 -translate-x-1/2";

    return (
        <span className="relative inline-flex items-center gap-1.5">
            <span>{label}</span>
            <span className="group relative inline-flex">
                <button
                    type="button"
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition ${
                        light ? "text-cream/80 hover:text-white focus-visible:text-white" : "text-teal/55 hover:text-teal focus-visible:text-teal"
                    }`}
                    aria-label={tooltip}
                >
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span
                    role="tooltip"
                    className={`pointer-events-none absolute top-full z-20 mt-2 w-56 rounded-lg bg-teal-dark px-3 py-2 text-left text-xs font-medium normal-case leading-relaxed tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${tooltipPosition}`}
                >
                    {tooltip}
                </span>
            </span>
        </span>
    );
}

const chromosomeIntro: Record<ChromosomeKey, string> = {
    narrative_structure:
        "En esta pestaña encontrarás cómo se organiza la novela: sus puntos de giro, el ritmo narrativo, la perspectiva, las tramas y el nivel de complejidad estructural.",
    literary_style:
        "En esta pestaña verás cómo está construido el estilo literario de la obra: vocabulario, frases, densidad descriptiva, tono y recursos retóricos.",
    emotional_profile:
        "En esta pestaña se muestra la curva emocional de la obra, sus emociones predominantes, los momentos de mayor tensión y el impacto afectivo que deja en el lector.",
    thematic_composition:
        "En esta pestaña se organizarán los grandes temas de la novela, su presencia relativa, profundidad y relaciones internas.",
    character_dna:
        "En esta pestaña se analizará el sistema de personajes: complejidad, arcos, relaciones, tensiones y funciones narrativas.",
    rhythm_density:
        "En esta pestaña se estudiará la velocidad de lectura, la densidad informativa, el equilibrio entre acción y reflexión, y la curva de intensidad.",
    linguistic_complexity:
        "En esta pestaña se evaluará la dificultad lingüística, riqueza léxica, sintaxis, legibilidad e innovaciones verbales.",
    cultural_context:
        "En esta pestaña se situará la obra en su contexto histórico, literario y cultural, además de sus ecos e influencia posterior.",
};

function getActiveChromosomeData(key: ChromosomeKey, chromosomes: GenomeChromosomes = demoChromosomes) {
    return chromosomes[key as keyof typeof chromosomes];
}

function getActiveCard(key: ChromosomeKey, chromosomes: GenomeChromosomes = demoChromosomes) {
    const data = getActiveChromosomeData(key, chromosomes) as {
        nombre?: string;
        visualizacion?: {
            descripcion_corta?: string;
            puntuacion_global?: number;
        };
    } | undefined;
    const fallback = chromosomeTabs.find((tab) => tab.key === key);

    return {
        title: data?.nombre || fallback?.label || "Cromosoma literario",
        description:
            data?.visualizacion?.descripcion_corta ||
            "Este cromosoma está preparado para mostrar el análisis cuando el libro tenga datos asociados.",
        score: data?.visualizacion?.puntuacion_global,
    };
}

function ChromosomePanel({ activeTab, chromosomes = demoChromosomes }: { activeTab: ChromosomeKey; chromosomes?: GenomeChromosomes }) {
    const data = getActiveChromosomeData(activeTab, chromosomes);
    const activeLabel = chromosomeTabs.find((tab) => tab.key === activeTab)?.label || "Cromosoma literario";

    if (activeTab === "narrative_structure" && data) {
        return <NarrativeStructureTab chromosome={data as NarrativeChromosome} />;
    }

    if (activeTab === "literary_style" && data) {
        return <LiteraryStyleTab chromosome={data as LiteraryStyleChromosome} />;
    }

    if (activeTab === "emotional_profile" && data) {
        return <EmotionalProfileTab chromosome={data as EmotionalProfileChromosome} />;
    }

    if (activeTab === "thematic_composition" && data) {
        return <ThematicCompositionTab chromosome={data as ThematicCompositionChromosome} />;
    }

    if (activeTab === "character_dna" && data) {
        return <CharacterDnaTab chromosome={data as CharacterDnaChromosome} />;
    }

    if (activeTab === "rhythm_density" && data) {
        return <RhythmDensityTab chromosome={data as RhythmDensityChromosome} />;
    }

    if (activeTab === "linguistic_complexity" && data) {
        return <LinguisticComplexityTab chromosome={data as LinguisticComplexityChromosome} />;
    }

    if (activeTab === "cultural_context" && data) {
        return <CulturalContextTab chromosome={data as CulturalContextChromosome} />;
    }

    return <EmptyChromosomeTab label={activeLabel} chromosomeKey={activeTab} />;
}

function LiteraryMetric({
    title,
    value,
    descriptor,
    description,
}: {
    title: string;
    value: number;
    descriptor: string;
    description: string;
}) {
    return (
        <Card>
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">{title}</p>
                    <h3 className="mt-1 text-2xl font-semibold text-teal-dark">{descriptor}</h3>
                </div>
                <span className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral">{value}/10</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-teal/10">
                <div className="h-full rounded-full bg-teal" style={{ width: scoreWidth(value) }} />
            </div>
            <p className="text-sm leading-relaxed text-grey">{description}</p>
        </Card>
    );
}

function LiteraryStyleTab({ chromosome }: { chromosome: LiteraryStyleChromosome }) {
    const { analisis, visualizacion } = chromosome;
    const proportions = analisis.proporcion_dialogo_narracion;
    const descriptionTypes = Object.entries(analisis.densidad_descriptiva.tipos_descripcion);

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <LiteraryMetric
                    title="Vocabulario"
                    value={analisis.complejidad_vocabulario.puntuacion}
                    descriptor={normalizeLabel(analisis.complejidad_vocabulario.nivel)}
                    description={analisis.complejidad_vocabulario.descripcion}
                />
                <LiteraryMetric
                    title="Oraciones"
                    value={analisis.longitud_oraciones.puntuacion_complejidad}
                    descriptor={normalizeLabel(analisis.longitud_oraciones.predominancia)}
                    description={analisis.longitud_oraciones.descripcion}
                />
                <LiteraryMetric
                    title="Descripción"
                    value={analisis.densidad_descriptiva.puntuacion}
                    descriptor={normalizeLabel(analisis.densidad_descriptiva.nivel)}
                    description={analisis.densidad_descriptiva.descripcion}
                />
                <LiteraryMetric
                    title="Musicalidad"
                    value={analisis.ritmo_prosa.musicalidad}
                    descriptor={normalizeLabel(analisis.ritmo_prosa.cadencia)}
                    description={analisis.ritmo_prosa.descripcion}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Diálogo, narración y reflexión</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{proportions.descripcion}</p>
                    <div className="mt-5 overflow-hidden rounded-full bg-teal/10 text-xs font-bold text-white">
                        <div className="flex h-10">
                            <div className="flex items-center justify-center bg-coral" style={{ width: `${proportions.dialogo_porcentaje}%` }}>
                                Diálogo {proportions.dialogo_porcentaje}%
                            </div>
                            <div className="flex items-center justify-center bg-teal" style={{ width: `${proportions.narracion_porcentaje}%` }}>
                                Narración {proportions.narracion_porcentaje}%
                            </div>
                            <div className="flex items-center justify-center bg-teal-dark" style={{ width: `${proportions.reflexion_interna_porcentaje}%` }}>
                                Reflexión {proportions.reflexion_interna_porcentaje}%
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Diálogo</p>
                            <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(proportions.estilo_dialogo)}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Párrafos</p>
                            <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(analisis.ritmo_prosa.longitud_parrafos)}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Repeticiones</p>
                            <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(analisis.ritmo_prosa.uso_repeticiones)}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Tono general</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.tono_general.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label={`Seriedad: ${analisis.tono_general.seriedad.descriptor}`} value={analisis.tono_general.seriedad.puntuacion} />
                        <ScoreBar label={`Emocionalidad: ${analisis.tono_general.emocionalidad.descriptor}`} value={analisis.tono_general.emocionalidad.puntuacion} />
                        <ScoreBar label={`Luminosidad: ${analisis.tono_general.luminosidad.descriptor}`} value={analisis.tono_general.luminosidad.puntuacion} />
                        <ScoreBar label={`Optimismo: ${analisis.tono_general.optimismo.descriptor}`} value={analisis.tono_general.optimismo.puntuacion} />
                    </div>
                    <div className="mt-5 rounded-xl bg-cream p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Tono predominante</p>
                        <p className="mt-1 text-lg font-semibold text-teal-dark">{normalizeLabel(analisis.tono_general.tono_predominante)}</p>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Figuras retóricas</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.figuras_retoricas.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        {analisis.figuras_retoricas.ranking.map((figure) => (
                            <div key={figure.nombre}>
                                <ScoreBar label={normalizeLabel(figure.nombre)} value={figure.frecuencia} />
                                <p className="mt-2 text-sm leading-relaxed text-grey">{figure.ejemplo_tipo}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-teal">Densidad descriptiva</h3>
                        <div className="mt-5 space-y-4">
                            {descriptionTypes.map(([type, value]) => (
                                <ScoreBar key={type} label={normalizeLabel(type)} value={value} />
                            ))}
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold text-teal">Registro lingüístico</h3>
                        <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.registro_linguistico.descripcion}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                                Principal: {normalizeLabel(analisis.registro_linguistico.principal)}
                            </span>
                            {analisis.registro_linguistico.secundarios.map((item) => (
                                <span key={item} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-teal">
                                    {normalizeLabel(item)}
                                </span>
                            ))}
                        </div>
                        <div className="mt-5">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Vocabulario recurrente</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {analisis.complejidad_vocabulario.ejemplos_vocabulario.map((word) => (
                                    <span key={word} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal shadow-sm">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function EmotionalCurve({
    points,
}: {
    points: EmotionalProfileChromosome["analisis"]["curva_emocional"]["grafica_puntos"];
}) {
    const width = 680;
    const height = 240;
    const paddingX = 34;
    const paddingY = 24;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    const toX = (value: number) => paddingX + (value / 100) * plotWidth;
    const toY = (value: number) => paddingY + (1 - value / 10) * plotHeight;
    const linePoints = points.map((point) => `${toX(point.x)},${toY(point.y)}`).join(" ");
    const areaPoints = `${paddingX},${height - paddingY} ${linePoints} ${width - paddingX},${height - paddingY}`;

    return (
        <div className="overflow-hidden rounded-xl bg-offwhite p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Curva emocional">
                <defs>
                    <linearGradient id="emotionArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#D56962" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#D56962" stopOpacity="0.03" />
                    </linearGradient>
                </defs>
                {[0, 2, 4, 6, 8, 10].map((level) => (
                    <g key={level}>
                        <line x1={paddingX} x2={width - paddingX} y1={toY(level)} y2={toY(level)} stroke="#336871" strokeOpacity="0.08" />
                        <text x={8} y={toY(level) + 4} className="fill-grey text-[10px]">
                            {level}
                        </text>
                    </g>
                ))}
                <polygon points={areaPoints} fill="url(#emotionArea)" />
                <polyline points={linePoints} fill="none" stroke="#D56962" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((point) => (
                    <g key={`${point.x}-${point.y}`}>
                        <circle cx={toX(point.x)} cy={toY(point.y)} r="6" fill="#FFFAEF" stroke="#D56962" strokeWidth="3" />
                        <text x={toX(point.x)} y={toY(point.y) - 14} textAnchor="middle" className="fill-teal text-[11px] font-bold">
                            {point.y}/10
                        </text>
                    </g>
                ))}
                <text x={paddingX} y={height - 4} className="fill-grey text-[11px]">Inicio</text>
                <text x={width / 2} y={height - 4} textAnchor="middle" className="fill-grey text-[11px]">Medio</text>
                <text x={width - paddingX} y={height - 4} textAnchor="end" className="fill-grey text-[11px]">Final</text>
            </svg>
        </div>
    );
}

function EmotionalProfileTab({ chromosome }: { chromosome: EmotionalProfileChromosome }) {
    const { analisis, visualizacion } = chromosome;

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Curva emocional</p>
                        <h3 className="mt-1 text-2xl font-semibold text-teal">De la inquietud al clímax moral</h3>
                    </div>
                    <span className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral">
                        {normalizeLabel(analisis.curva_emocional.patron_general)}
                    </span>
                </div>
                <EmotionalCurve points={analisis.curva_emocional.grafica_puntos} />
                <div className="mt-5 grid gap-3 md:grid-cols-5">
                    {analisis.curva_emocional.segmentos.map((segment) => (
                        <div key={segment.nombre} className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">
                                {segment.porcentaje_inicio}-{segment.porcentaje_fin}%
                            </p>
                            <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(segment.nombre)}</p>
                            <p className="mt-2 text-sm leading-relaxed text-grey">{segment.descripcion}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Emociones predominantes</h3>
                    <div className="mt-5 space-y-5">
                        {analisis.emociones_predominantes.map((emotion) => (
                            <div key={emotion.emocion}>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-teal-dark">
                                            {emotion.ranking}. {normalizeLabel(emotion.emocion)}
                                        </p>
                                        <p className="text-xs text-grey">Intensidad media {emotion.intensidad_promedio}/10</p>
                                    </div>
                                    <p className="text-sm font-bold text-coral">{emotion.porcentaje_presencia}%</p>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-teal/10">
                                    <div className="h-full rounded-full bg-teal" style={{ width: `${emotion.porcentaje_presencia}%` }} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {emotion.momentos_clave.map((moment) => (
                                        <span key={moment} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-teal">
                                            {moment}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Momentos emocionales clave</h3>
                    <div className="mt-5 space-y-4">
                        {analisis.momentos_emocionales_clave.map((moment) => (
                            <div key={moment.numero} className="grid gap-3 rounded-xl border border-teal/10 bg-offwhite p-4 md:grid-cols-[72px_1fr]">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{moment.ubicacion_porcentaje}%</p>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal/10">
                                        <div className="h-full rounded-full bg-coral" style={{ width: `${moment.ubicacion_porcentaje}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <h4 className="text-lg font-semibold text-teal-dark">{moment.titulo}</h4>
                                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal">
                                            Intensidad {moment.intensidad}/10
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-grey">{moment.descripcion}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {moment.emociones.map((emotion) => (
                                            <span key={emotion} className="rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral">
                                                {normalizeLabel(emotion)}
                                            </span>
                                        ))}
                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-grey">
                                            {normalizeLabel(moment.tipo_evento)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Tipo de tensión</h3>
                    <p className="mt-2 text-sm text-grey">
                        Dominante: <span className="font-semibold text-teal-dark">{normalizeLabel(analisis.tipo_tension.dominante)}</span>
                    </p>
                    <div className="mt-5 space-y-4">
                        {analisis.tipo_tension.ranking.map((tension) => (
                            <div key={tension.tipo}>
                                <ScoreBar label={normalizeLabel(tension.tipo)} value={tension.puntuacion} />
                                <p className="mt-2 text-xs leading-relaxed text-grey">{tension.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Tipo de final</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.tipo_final.descripcion}</p>
                    <div className="mt-5 rounded-xl bg-coral/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Clasificación</p>
                        <p className="mt-1 text-lg font-semibold text-teal-dark">{normalizeLabel(analisis.tipo_final.clasificacion)}</p>
                    </div>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label="Intensidad del clímax" value={analisis.tipo_final.intensidad_climax} />
                        <ScoreBar label="Catarsis" value={analisis.tipo_final.nivel_catarsis} />
                        <ScoreBar label="Satisfacción emocional" value={analisis.tipo_final.satisfaccion_emocional} />
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Impacto en lectores</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.impacto_en_lectores.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label="Emotividad general" value={analisis.impacto_en_lectores.emotividad_general} />
                        <ScoreBar label="Perturbación" value={analisis.impacto_en_lectores.nivel_perturbacion} />
                        <ScoreBar label="Probabilidad de llorar" value={analisis.impacto_en_lectores.probabilidad_llorar} />
                        <ScoreBar label="Resonancia duradera" value={analisis.impacto_en_lectores.resonancia_duradera} />
                        <ScoreBar label="Dificultad emocional" value={analisis.impacto_en_lectores.dificultad_emocional} />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ThematicCloud({ items }: { items: ThematicCompositionChromosome["visualizacion"]["nube_tematica"] }) {
    const maxWeight = Math.max(...items.map((item) => item.peso));

    return (
        <Card className="bg-offwhite">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Nube temática</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-center">
                {items.map((item) => {
                    const scale = item.peso / maxWeight;
                    const size = 18 + scale * 22;

                    return (
                        <span
                            key={item.tema}
                            className="font-serif font-semibold leading-none text-teal"
                            style={{ fontSize: `${size}px`, opacity: 0.62 + scale * 0.38 }}
                        >
                            {item.tema}
                        </span>
                    );
                })}
            </div>
        </Card>
    );
}

function ThematicCompositionTab({ chromosome }: { chromosome: ThematicCompositionChromosome }) {
    const { analisis, visualizacion } = chromosome;
    const mainTheme = analisis.temas_principales[0];

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <ThematicCloud items={visualizacion.nube_tematica} />

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Tema central</p>
                            <h3 className="mt-1 text-2xl font-semibold leading-tight text-teal">{mainTheme.nombre}</h3>
                        </div>
                        <span className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral">
                            Presencia {mainTheme.presencia}/10
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-grey">{mainTheme.descripcion}</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Introducción</p>
                            <p className="mt-2 text-sm leading-relaxed text-grey">{mainTheme.desarrollo.introduccion}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Evolución</p>
                            <p className="mt-2 text-sm leading-relaxed text-grey">{mainTheme.desarrollo.evolucion}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Resolución</p>
                            <p className="mt-2 text-sm leading-relaxed text-grey">{mainTheme.desarrollo.resolucion}</p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <ScoreBar label="Profundidad del tema central" value={mainTheme.profundidad} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {mainTheme.palabras_clave.map((word) => (
                            <span key={word} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal shadow-sm">
                                {word}
                            </span>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Manifestaciones del tema</h3>
                    <div className="mt-5 space-y-4">
                        {Object.entries(mainTheme.manifestaciones).map(([group, values]) => (
                            <div key={group} className="rounded-xl bg-offwhite p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{normalizeLabel(group)}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {values.map((value) => (
                                        <span key={value} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal">
                                            {value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Temas secundarios</h3>
                    <div className="mt-5 space-y-4">
                        {analisis.temas_secundarios.map((theme) => (
                            <div key={theme.nombre}>
                                <ScoreBar label={theme.nombre} value={theme.presencia} />
                                <p className="mt-2 text-sm leading-relaxed text-grey">{theme.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Profundidad filosófica</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.profundidad_filosofica.descripcion}</p>
                    <div className="mt-5">
                        <ScoreBar
                            label={normalizeLabel(analisis.profundidad_filosofica.nivel)}
                            value={analisis.profundidad_filosofica.puntuacion}
                        />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {analisis.profundidad_filosofica.corrientes_filosoficas.map((current) => (
                            <span key={current} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-teal">
                                {normalizeLabel(current)}
                            </span>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Ambigüedad moral</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.ambiguedad_moral.descripcion}</p>
                    <div className="mt-5">
                        <ScoreBar label={normalizeLabel(analisis.ambiguedad_moral.nivel)} value={analisis.ambiguedad_moral.puntuacion} />
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-grey">{analisis.ambiguedad_moral.complejidad_personajes}</p>
                    {analisis.ambiguedad_moral.dilemas_sin_resolucion && (
                        <p className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
                            Presenta dilemas sin resolución cerrada.
                        </p>
                    )}
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Relevancia temporal</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.relevancia_temporal.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label="Universalidad" value={analisis.relevancia_temporal.universalidad} />
                        <ScoreBar label="Relevancia actual" value={analisis.relevancia_temporal.relevancia_actual} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {analisis.relevancia_temporal.temas_profeticos.map((theme) => (
                            <span key={theme} className="rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                                {theme}
                            </span>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Interconexiones temáticas</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {analisis.interconexiones_tematicas.temas_en_tension.map((item) => (
                            <div key={`${item.tema1}-${item.tema2}`} className="rounded-xl bg-offwhite p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Tema en tensión</p>
                                <p className="mt-2 text-lg font-semibold text-teal-dark">
                                    {item.tema1} / {item.tema2}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{item.tension}</p>
                            </div>
                        ))}
                        {analisis.interconexiones_tematicas.temas_complementarios.map((item) => (
                            <div key={`${item.tema1}-${item.tema2}`} className="rounded-xl bg-offwhite p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Tema complementario</p>
                                <p className="mt-2 text-lg font-semibold text-teal-dark">
                                    {item.tema1} + {item.tema2}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{item.relacion}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {analisis.critica_social_politica.presente && (
                <div className="overflow-hidden rounded-xl border border-teal/10 bg-teal p-5 text-white shadow-sm">
                    <div className="grid gap-5 md:grid-cols-[0.75fr_1.25fr] md:items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cream">Crítica social y política</p>
                            <h3 className="mt-2 text-3xl font-semibold !text-white">{normalizeLabel(analisis.critica_social_politica.estilo ?? "")}</h3>
                            <p className="mt-3 text-sm text-white/80">Intensidad {analisis.critica_social_politica.intensidad}/10</p>
                        </div>
                        <div>
                            <p className="text-base leading-relaxed text-white/90">{analisis.critica_social_politica.descripcion}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {analisis.critica_social_politica.objetivo_critica.map((target) => (
                                    <span key={target} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
                                        {target}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CharacterDnaTab({ chromosome }: { chromosome: CharacterDnaChromosome }) {
    const { analisis, visualizacion } = chromosome;
    const distribution = analisis.cantidad_distribucion;
    const gender = analisis.diversidad.genero;
    const ageEntries = Object.entries(analisis.diversidad.edad);

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
                {[
                    ["Protagonistas", distribution.protagonistas],
                    ["Principales", distribution.principales],
                    ["Secundarios", distribution.secundarios_relevantes],
                    ["Menciones", `${distribution.menciones_estimadas}+`],
                ].map(([label, value]) => (
                    <Card key={label} className="text-center">
                        <p className="text-3xl font-bold text-teal">{value}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-coral">{label}</p>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Complejidad psicológica</h3>
                    <p className="mt-2 text-sm text-grey">
                        Nivel: <span className="font-semibold text-teal-dark">{normalizeLabel(analisis.complejidad_psychologica.nivel)}</span>
                    </p>
                    <div className="mt-5">
                        <ScoreBar label="Puntuación general" value={analisis.complejidad_psychologica.puntuacion_general} />
                    </div>
                    <div className="mt-5 grid gap-4">
                        {analisis.complejidad_psychologica.analisis_por_protagonista.map((character) => (
                            <div key={character.nombre} className="rounded-xl bg-offwhite p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <h4 className="text-lg font-semibold text-teal-dark">{character.nombre}</h4>
                                    <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                                        Complejidad {character.complejidad}/10
                                    </span>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{character.descripcion}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal">
                                        {normalizeLabel(character.coherencia)}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal">
                                        Motivaciones {normalizeLabel(character.motivaciones)}
                                    </span>
                                    {character.conflictos_internos && (
                                        <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                                            Conflictos internos
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Arcos de transformación</h3>
                    <div className="mt-5 space-y-5">
                        {analisis.arcos_transformacion.map((arc) => (
                            <div key={arc.personaje} className="rounded-xl border border-teal/10 bg-offwhite p-4">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-teal-dark">{arc.personaje}</h4>
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{normalizeLabel(arc.tipo_arco)}</p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal">
                                        Cambio {arc.intensidad_cambio}/10
                                    </span>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {[
                                        ["Punto de partida", arc.punto_partida],
                                        ["Punto intermedio", arc.punto_intermedio],
                                        ["Punto final", arc.punto_final],
                                    ].map(([label, values]) => (
                                        <div key={label as string} className="rounded-xl bg-white p-3">
                                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{label as string}</p>
                                            <ul className="mt-2 space-y-1">
                                                {(values as string[]).map((value) => (
                                                    <li key={value} className="text-sm leading-relaxed text-grey">{value}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-grey">{arc.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Diversidad</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.diversidad.evaluacion_general}</p>
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-teal-dark">Masculino</span>
                            <span className="font-bold text-coral">{gender.masculino_porcentaje}%</span>
                        </div>
                        <div className="mb-4 h-2 overflow-hidden rounded-full bg-coral/20">
                            <div className="h-full rounded-full bg-teal" style={{ width: `${gender.masculino_porcentaje}%` }} />
                        </div>
                        <p className="text-sm leading-relaxed text-grey">{gender.notas}</p>
                    </div>
                    <div className="mt-5 space-y-3">
                        {ageEntries.map(([label, value]) => (
                            <ScoreBar key={label} label={normalizeLabel(label)} value={value / 10} />
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Relaciones principales</h3>
                    <div className="mt-5 space-y-4">
                        {analisis.relaciones.principales.map((relationship) => (
                            <div key={`${relationship.tipo}-${relationship.personajes.join("-")}`} className="rounded-xl bg-offwhite p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{relationship.tipo}</p>
                                        <h4 className="mt-1 text-lg font-semibold text-teal-dark">{relationship.personajes.join(" / ")}</h4>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal">
                                        {relationship.importancia}/10
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-grey">{relationship.descripcion}</p>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-grey/70">
                                    Evolución {normalizeLabel(relationship.evolucion)}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Dinámica narrativa</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.relaciones.dinamica_general.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label="Conflicto" value={analisis.relaciones.dinamica_general.nivel_conflicto} />
                        <ScoreBar label="Colaboración" value={analisis.relaciones.dinamica_general.nivel_colaboracion} />
                    </div>
                    <div className="mt-5 rounded-xl bg-coral/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Tipo predominante</p>
                        <p className="mt-1 text-lg font-semibold text-teal-dark">
                            {normalizeLabel(analisis.relaciones.dinamica_general.tipo_predominante)}
                        </p>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Arquetipos</h3>
                    <div className="mt-5 space-y-4">
                        {analisis.arquetipos.map((archetype) => (
                            <div key={`${archetype.arquetipo}-${archetype.personaje}`} className="rounded-xl bg-offwhite p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{normalizeLabel(archetype.arquetipo)}</p>
                                <h4 className="mt-1 text-lg font-semibold text-teal-dark">{archetype.personaje}</h4>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{archetype.descripcion}</p>
                                {archetype.subversion && (
                                    <p className="mt-3 rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral">
                                        Subvierte el arquetipo
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Funcionalidad narrativa</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.funcionalidad_narrativa.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label="Motores de trama" value={analisis.funcionalidad_narrativa.motores_trama} />
                        <ScoreBar label="Espejos emocionales" value={analisis.funcionalidad_narrativa.espejos_emocionales} />
                        <ScoreBar label="Vehículos temáticos" value={analisis.funcionalidad_narrativa.vehiculos_tematicos} />
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        {Object.entries(analisis.diversidad.otros_aspectos).map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-cream p-3">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{normalizeLabel(label)}</p>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{value}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function RhythmBarChart({ sections }: { sections: RhythmDensityChromosome["analisis"]["velocidad_narrativa"]["por_seccion"] }) {
    return (
        <div className="rounded-xl bg-offwhite p-4">
            <div className="flex h-56 items-end gap-3">
                {sections.map((section) => (
                    <div key={section.seccion} className="flex flex-1 flex-col items-center gap-2">
                        <div
                            className="w-full rounded-t-xl bg-teal transition-all"
                            style={{ height: `${Math.max(18, section.velocidad * 18)}px` }}
                        />
                        <p className="text-center text-xs font-semibold text-teal-dark">{normalizeLabel(section.seccion)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CompositionStack({
    items,
}: {
    items: RhythmDensityChromosome["analisis"]["proporcion_elementos"]["grafico"];
}) {
    const colors = ["#D56962", "#336871", "#234A4E", "#8AA8A9", "#C9C1B8"];

    return (
        <div>
            <div className="flex h-12 overflow-hidden rounded-full bg-teal/10">
                {items.map((item, index) => (
                    <div
                        key={item.elemento}
                        className="flex items-center justify-center text-xs font-bold text-white"
                        style={{ width: `${item.porcentaje}%`, backgroundColor: colors[index % colors.length] }}
                    >
                        {item.porcentaje >= 10 ? `${item.porcentaje}%` : ""}
                    </div>
                ))}
            </div>
            <div className="mt-4 grid gap-3">
                {items.map((item, index) => (
                    <div key={item.elemento} className="grid grid-cols-[1fr_auto] gap-3 text-sm text-grey">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                            <span className="font-semibold leading-tight text-teal-dark">{item.elemento}</span>
                        </div>
                        <span className="font-medium">{item.porcentaje}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RhythmDensityTab({ chromosome }: { chromosome: RhythmDensityChromosome }) {
    const { analisis, visualizacion } = chromosome;
    const reading = analisis.tiempo_lectura;

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <Card>
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Velocidad narrativa</p>
                            <h3 className="mt-1 text-2xl font-semibold text-teal">{normalizeLabel(analisis.velocidad_narrativa.nivel)}</h3>
                        </div>
                        <span className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral">
                            {analisis.velocidad_narrativa.puntuacion_general}/10
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-grey">{analisis.velocidad_narrativa.descripcion}</p>
                    <div className="mt-5">
                        <RhythmBarChart sections={analisis.velocidad_narrativa.por_seccion} />
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {analisis.velocidad_narrativa.por_seccion.map((section) => (
                            <div key={section.seccion} className="rounded-xl bg-cream p-3">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">
                                    {section.porcentaje_inicio}-{section.porcentaje_fin}%
                                </p>
                                <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(section.seccion)}</p>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{section.descripcion}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl border border-teal/10 bg-teal p-5 text-white shadow-sm">
                        <h3 className="text-xl font-semibold !text-white">Tiempo de lectura</h3>
                        <p className="mt-3 text-sm leading-relaxed text-white/85">{reading.notas}</p>
                        <div className="mt-5 divide-y divide-white/15">
                            {[
                                ["Lector rápido", reading.lector_rapido],
                                ["Lector promedio", reading.lector_promedio],
                                ["Lector pausado", reading.lector_pausado],
                            ].map(([label, data]) => (
                                <div key={label as string} className="flex items-center justify-between gap-4 py-3">
                                    <div>
                                        <p className="font-semibold text-white">{label as string}</p>
                                        <p className="text-xs text-white/65">{(data as typeof reading.lector_rapido).paginas_hora} páginas/hora</p>
                                    </div>
                                    <p className="font-serif text-2xl font-semibold text-white">
                                        {(data as typeof reading.lector_rapido).horas_totales} h
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white/10 p-3">
                                <p className="text-2xl font-bold text-white">{reading.paginas_totales}</p>
                                <p className="text-xs text-white/70">páginas</p>
                            </div>
                            <div className="rounded-xl bg-white/10 p-3">
                                <p className="text-2xl font-bold text-white">{reading.sesiones_recomendadas}</p>
                                <p className="text-xs text-white/70">sesiones recomendadas</p>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <h3 className="text-xl font-semibold text-teal">Legibilidad</h3>
                        <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.legibilidad.descripcion}</p>
                        <div className="mt-5 space-y-4">
                            <ScoreBar label="Fluidez" value={analisis.legibilidad.fluidez} />
                            <ScoreBar label="Exigencia cognitiva" value={analisis.legibilidad.exigencia_cognitiva} />
                        </div>
                        {analisis.legibilidad.requiere_pausas && (
                            <p className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
                                Recomendada lectura con pausas.
                            </p>
                        )}
                    </Card>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="lg:row-span-2">
                    <h3 className="text-xl font-semibold text-teal">Densidad de información</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.densidad_informacion.descripcion}</p>
                    <div className="mt-5">
                        <ScoreBar label={normalizeLabel(analisis.densidad_informacion.nivel)} value={analisis.densidad_informacion.puntuacion} />
                    </div>
                    <div className="mt-5 space-y-3">
                        {analisis.densidad_informacion.tipo_informacion_predominante.map((item) => (
                            <div key={item.tipo}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-teal-dark">{normalizeLabel(item.tipo)}</span>
                                    <span className="font-bold text-coral">{item.porcentaje}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-teal/10">
                                    <div className="h-full rounded-full bg-teal" style={{ width: `${item.porcentaje}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid gap-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-teal">Proporción de elementos</h3>
                        <div className="mt-5">
                            <CompositionStack items={analisis.proporcion_elementos.grafico} />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-semibold text-teal">Variación del ritmo</h3>
                        <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr] lg:grid-cols-1 xl:grid-cols-[0.8fr_1.2fr]">
                            <div className="rounded-xl bg-cream p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Patrón</p>
                                <p className="mt-1 text-lg font-semibold text-teal-dark">{normalizeLabel(analisis.variacion_ritmo.patron)}</p>
                                <p className="mt-1 text-sm text-grey">Cambios: {normalizeLabel(analisis.variacion_ritmo.frecuencia_cambios)}</p>
                            </div>
                            <p className="text-sm leading-relaxed text-grey">{analisis.variacion_ritmo.descripcion}</p>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Máxima velocidad</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {analisis.variacion_ritmo.momentos_maxima_velocidad.map((item) => (
                                        <span key={item} className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{item}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Máxima lentitud</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {analisis.variacion_ritmo.momentos_maxima_lentitud.map((item) => (
                                        <span key={item} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-teal">{item}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Técnicas de ritmo</h3>
                    <div className="mt-5 space-y-4">
                        {analisis.tecnicas_ritmo.map((technique) => (
                            <div key={technique.tecnica} className="rounded-xl bg-offwhite p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <h4 className="text-lg font-semibold text-teal-dark">{technique.tecnica}</h4>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal">
                                        Frecuencia {technique.frecuencia}/10
                                    </span>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{technique.descripcion}</p>
                                <div className="mt-3">
                                    <ScoreBar label="Efectividad" value={technique.efectividad} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="self-start">
                    <h3 className="text-xl font-semibold text-teal">Puntos de fatiga</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">
                        Zonas donde la densidad y la exigencia cognitiva pueden pedir una lectura más lenta.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {analisis.legibilidad.puntos_fatiga.map((point) => (
                            <div key={point} className="rounded-xl bg-coral/10 px-4 py-3">
                                <p className="text-sm font-bold text-coral">{point}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function LinguisticComplexityTab({ chromosome }: { chromosome: LinguisticComplexityChromosome }) {
    const { analisis, visualizacion } = chromosome;

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card>
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Nivel de lectura</p>
                            <h3 className="mt-1 text-2xl font-semibold text-teal">{normalizeLabel(analisis.nivel_lectura.nivel)}</h3>
                        </div>
                        <span className="rounded-full bg-coral/10 px-3 py-1 text-sm font-bold text-coral">
                            {analisis.nivel_lectura.puntuacion}/10
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-grey">{analisis.nivel_lectura.descripcion}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Edad recomendada</p>
                            <p className="mt-1 text-2xl font-bold text-teal">{analisis.nivel_lectura.edad_recomendada_minima}+</p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Nivel educativo</p>
                            <p className="mt-1 text-lg font-semibold text-teal-dark">
                                {normalizeLabel(analisis.nivel_lectura.nivel_educativo_requerido)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Riqueza léxica</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.riqueza_lexica.descripcion}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-2xl font-bold text-teal">{analisis.riqueza_lexica.vocabulario_unico_estimado.toLocaleString("es-ES")}</p>
                            <p className="text-xs text-grey">vocabulario único estimado</p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-2xl font-bold text-teal">{analisis.riqueza_lexica.type_token_ratio}</p>
                            <p className="text-xs text-grey">type-token ratio</p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-2xl font-bold text-coral">{analisis.riqueza_lexica.palabras_dificiles.porcentaje}%</p>
                            <p className="text-xs text-grey">palabras difíciles</p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <ScoreBar label="Diversidad léxica" value={analisis.riqueza_lexica.diversidad_lexica} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {analisis.riqueza_lexica.palabras_dificiles.ejemplos.map((word) => (
                            <span key={word} className="rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                                {word}
                            </span>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Sintaxis</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.sintaxis.descripcion}</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <ScoreBar label="Complejidad sintáctica" value={analisis.sintaxis.complejidad_sintactica} />
                        <ScoreBar label="Profundidad de subordinación" value={analisis.sintaxis.subordinacion.profundidad * 2} />
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Nivel</p>
                            <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(analisis.sintaxis.nivel)}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Subordinación</p>
                            <p className="mt-1 font-semibold text-teal-dark">{normalizeLabel(analisis.sintaxis.subordinacion.frecuencia)}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-3">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Media oración</p>
                            <p className="mt-1 font-semibold text-teal-dark">{analisis.sintaxis.longitud_promedio_oracion} palabras</p>
                        </div>
                    </div>
                    {analisis.sintaxis.estructuras_especiales && (
                        <p className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
                            Presenta estructuras especiales y puntuación no convencional.
                        </p>
                    )}
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Accesibilidad</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.accesibilidad.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        <ScoreBar label="Traducibilidad" value={analisis.accesibilidad.traducibilidad} />
                        <ScoreBar label="Lectores no nativos" value={analisis.accesibilidad.lectores_no_nativos} />
                    </div>
                    <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Barreras principales</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {analisis.accesibilidad.barreras_principales.map((barrier) => (
                                <span key={barrier} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-teal">
                                    {barrier}
                                </span>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Registros lingüísticos</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.registro_variacion.descripcion}</p>
                    <div className="mt-5 space-y-4">
                        {analisis.registro_variacion.registros_presentes.map((register) => (
                            <div key={register.tipo}>
                                <ScoreBar label={`${normalizeLabel(register.tipo)} (${register.frecuencia_porcentaje}%)`} value={register.efectividad} />
                                <p className="mt-2 text-xs leading-relaxed text-grey">Uso: {register.contexto_uso}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {analisis.registro_variacion.variacion_por_contexto && (
                            <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral">Varía por contexto</span>
                        )}
                        {analisis.registro_variacion.variacion_por_personaje && (
                            <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral">Varía por personaje</span>
                        )}
                    </div>
                </Card>

                <div className="overflow-hidden rounded-xl border border-teal/10 bg-teal p-5 text-white shadow-sm">
                    <h3 className="text-xl font-semibold text-white">Índices de legibilidad</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/85">{analisis.indices_legibilidad.notas}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream">
                                <TooltipTerm
                                    label="Flesch Reading Ease"
                                    tooltip="Mide la facilidad de lectura. Cuanto más alto es el valor, más sencillo resulta el texto; valores bajos indican mayor complejidad."
                                    light
                                />
                            </p>
                            <p className="mt-1 text-3xl font-bold text-white">{analisis.indices_legibilidad.flesch_reading_ease.puntuacion}/100</p>
                            <p className="text-sm text-white/70">{normalizeLabel(analisis.indices_legibilidad.flesch_reading_ease.interpretacion)}</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream">
                                <TooltipTerm
                                    label="Flesch-Kincaid"
                                    tooltip="Estima el nivel escolar necesario para comprender el texto con comodidad, a partir de la longitud de frases y palabras."
                                    light
                                />
                            </p>
                            <p className="mt-1 text-3xl font-bold text-white">{analisis.indices_legibilidad.flesch_kincaid_grade}</p>
                            <p className="text-sm text-white/70">grado estimado</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream">
                                <TooltipTerm
                                    label="Gunning Fog"
                                    tooltip="Calcula la densidad de lectura según frases largas y palabras complejas. Un índice alto apunta a lectura más exigente."
                                    light
                                    align="right"
                                />
                            </p>
                            <p className="mt-1 text-3xl font-bold text-white">{analisis.indices_legibilidad.gunning_fog_index}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Innovaciones lingüísticas</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Neologismos</p>
                            <p className="mt-1 text-3xl font-bold text-teal">{analisis.innovaciones_linguisticas.neologismos.amount}</p>
                            <p className="mt-2 text-sm leading-relaxed text-grey">{analisis.innovaciones_linguisticas.neologismos.proposito}</p>
                        </div>
                        <div className="space-y-4">
                            <ScoreBar label="Juegos de palabras" value={analisis.innovaciones_linguisticas.juegos_palabras.frecuencia} />
                            <ScoreBar label="Complejidad de juegos" value={analisis.innovaciones_linguisticas.juegos_palabras.complejidad} />
                            <ScoreBar label="Impacto cultural" value={analisis.innovaciones_linguisticas.impacto_cultural} />
                        </div>
                    </div>
                    <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Términos destacados</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {[...new Set([...analisis.innovaciones_linguisticas.neologismos.ejemplos, ...analisis.innovaciones_linguisticas.terminos_trascendentes])].map((term) => (
                                <span key={term} className="rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                                    {term}
                                </span>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Lenguaje inventado</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">
                        {analisis.innovaciones_linguisticas.lenguaje_inventado.presente
                            ? analisis.innovaciones_linguisticas.lenguaje_inventado.descripcion
                            : "No aparece como sistema lingüístico autónomo, pero la obra sí consolida términos de fuerte carga simbólica."}
                    </p>
                    <div className="mt-5 rounded-xl bg-cream p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Alcance</p>
                        <p className="mt-1 text-lg font-semibold text-teal-dark">
                            {analisis.innovaciones_linguisticas.lenguaje_inventado.presente ? "Presente" : "No estructural"}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function CulturalContextTab({ chromosome }: { chromosome: CulturalContextChromosome }) {
    const { analisis, visualizacion } = chromosome;
    const timeline = [
        {
            label: "Publicación",
            value: analisis.epoca_publicacion.año,
            detail: analisis.epoca_publicacion.contexto_politico,
        },
        {
            label: "Narrativa",
            value: normalizeLabel(analisis.epoca_narrativa.periodo),
            detail: analisis.epoca_narrativa.ubicacion_geografica,
        },
        {
            label: "Recepción",
            value: "1998",
            detail: analisis.legado_impacto.recepcion_inicial,
        },
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-offwhite">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {visualizacion.caracteristicas_destacadas.map((item) => (
                        <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                            {item}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Coordenadas culturales</h3>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        {timeline.map((item) => (
                            <div key={item.label} className="rounded-xl bg-cream p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{item.label}</p>
                                <p className="mt-1 text-2xl font-bold text-teal">{item.value}</p>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Motivación del autor</p>
                        <p className="mt-2 text-sm leading-relaxed text-grey">{analisis.epoca_publicacion.motivacion_autor}</p>
                    </div>
                </Card>

                <div className="overflow-hidden rounded-xl border border-teal/10 bg-teal p-6 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cream">Vigencia actual</p>
                            <h3 className="mt-2 text-3xl font-semibold text-white">{analisis.vigencia_relevancia.nivel}</h3>
                        </div>
                        <span className="rounded-full bg-white/10 px-4 py-2 text-2xl font-bold text-white">
                            {analisis.vigencia_relevancia.puntuacion}/10
                        </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/85">{analisis.vigencia_relevancia.razones}</p>
                    <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream">Temas vigentes</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {analisis.vigencia_relevancia.temas_vigentes.map((theme) => (
                                <span key={theme} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
                                    {theme}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Movimiento literario</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.movimiento_literario.subversion_innovacion}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Género</p>
                            <p className="mt-1 text-lg font-semibold text-teal-dark">{analisis.movimiento_literario.genero_literario}</p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Subgéneros</p>
                            <p className="mt-1 text-lg font-semibold text-teal-dark">{analisis.movimiento_literario.subgeneros.join(" + ")}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {[...analisis.movimiento_literario.principales, ...analisis.movimiento_literario.caracteristicas_presentes].map((item) => (
                            <span key={item} className="rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                                {item}
                            </span>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Influencias</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {analisis.influencias.literarias.map((influence) => (
                            <div key={influence.name} className="rounded-xl bg-cream p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{normalizeLabel(influence.tipo)}</p>
                                <h4 className="mt-1 text-lg font-semibold text-teal-dark">{influence.name}</h4>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{influence.descripcion}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Políticas</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {analisis.influencias.politicas.map((item) => (
                                    <span key={item} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal shadow-sm">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Filosóficas</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {analisis.influencias.filosoficas.map((item) => (
                                    <span key={item} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal shadow-sm">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">{analisis.influencias.personales}</p>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Legado e impacto</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.legado_impacto.evolucion_recepcion}</p>
                    <div className="mt-5">
                        <ScoreBar label="Influencia cultural" value={analisis.legado_impacto.influencia_cultural} />
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {analisis.legado_impacto.adaptaciones.map((adaptation) => (
                            <div key={`${adaptation.titulo}-${adaptation.año}`} className="rounded-xl bg-cream p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{normalizeLabel(adaptation.medio)}</p>
                                <h4 className="mt-1 text-lg font-semibold text-teal-dark">{adaptation.titulo}</h4>
                                <p className="mt-1 text-sm text-grey">{adaptation.año}</p>
                            </div>
                        ))}
                        <div className="rounded-xl bg-cream p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Estatus actual</p>
                            <p className="mt-2 text-sm leading-relaxed text-grey">{analisis.legado_impacto.estatus_actual}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {analisis.legado_impacto.conceptos_popularizados.map((concept) => (
                            <span key={concept} className="rounded-full bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                                {concept}
                            </span>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-semibold text-teal">Significado histórico-literario</h3>
                    <div className="mt-5">
                        <ScoreBar label="Importancia" value={analisis.significado_historico_literario.puntuacion_importancia} />
                    </div>
                    <div className="mt-5 space-y-4">
                        <p className="text-sm leading-relaxed text-grey">{analisis.significado_historico_literario.lugar_canon}</p>
                        <p className="text-sm leading-relaxed text-grey">{analisis.significado_historico_literario.importancia_tematica}</p>
                        <p className="text-sm leading-relaxed text-grey">{analisis.significado_historico_literario.posicion_carrera_autor}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Innovaciones técnicas</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {analisis.significado_historico_literario.innovaciones_tecnicas.map((item) => (
                                <span key={item} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-teal">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function NarrativeStructureTab({ chromosome }: { chromosome: NarrativeChromosome }) {
    const { analisis, visualizacion } = chromosome;

    return (
        <div className="space-y-6">
            <div>
                <Card className="bg-offwhite">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Rasgos destacados</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {visualizacion.caracteristicas_destacadas.map((item) => (
                            <div key={item} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-teal">
                                {item}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                    icon={Route}
                    label="Tipo de estructura"
                    value={formatKey(analisis.tipo_estructura.principal)}
                    detail={`Secundaria: ${analisis.tipo_estructura.secundarios.map(formatKey).join(", ")}`}
                />
                <MetricCard
                    icon={BookOpen}
                    label="Perspectiva"
                    value={formatKey(analisis.perspectiva_narrativa.principal)}
                    detail={analisis.perspectiva_narrativa.narrador_confiable ? "Narrador confiable" : "Narrador no confiable"}
                />
                <MetricCard
                    icon={Layers3}
                    label="Líneas argumentales"
                    value={`${analisis.lineas_argumentales.principales} principal + ${analisis.lineas_argumentales.secundarias} secundarias`}
                    detail={`Entrelazamiento ${analisis.lineas_argumentales.nivel_entrelazamiento}/10`}
                />
                <MetricCard
                    icon={Brain}
                    label="Complejidad"
                    value={formatKey(analisis.complejidad_estructural.nivel)}
                    detail={`${analisis.complejidad_estructural.puntuacion}/10`}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                    <Card>
                        <div className="mb-5 flex items-center gap-3">
                            <Clock3 className="h-5 w-5 text-coral" aria-hidden="true" />
                            <h3 className="text-xl font-semibold text-teal">Ritmo narrativo</h3>
                        </div>
                        <div className="space-y-4">
                            <ScoreBar label="Velocidad general" value={analisis.ritmo_narrativo.velocidad_general} />
                            <ScoreBar label="Variación de ritmo" value={analisis.ritmo_narrativo.variacion_ritmo} />
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="rounded-xl bg-cream p-3">
                                <p className="font-semibold text-teal-dark">{formatKey(analisis.ritmo_narrativo.inicio)}</p>
                                <p className="mt-1 text-xs text-grey">Inicio</p>
                            </div>
                            <div className="rounded-xl bg-cream p-3">
                                <p className="font-semibold text-teal-dark">{formatKey(analisis.ritmo_narrativo.desarrollo)}</p>
                                <p className="mt-1 text-xs text-grey">Desarrollo</p>
                            </div>
                            <div className="rounded-xl bg-cream p-3">
                                <p className="font-semibold text-teal-dark">{formatKey(analisis.ritmo_narrativo.resolucion)}</p>
                                <p className="mt-1 text-xs text-grey">Resolución</p>
                            </div>
                        </div>
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-semibold text-teal-dark">Ubicación del clímax</span>
                                <span className="font-bold text-coral">{analisis.ritmo_narrativo.ubicacion_climax}%</span>
                            </div>
                            <div className="relative h-3 rounded-full bg-teal/10">
                                <div className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-coral" style={{ left: `${analisis.ritmo_narrativo.ubicacion_climax}%` }} />
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-relaxed text-grey">{analisis.ritmo_narrativo.descripcion}</p>
                    </Card>

                    <Card>
                        <div className="mb-4 flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-coral" aria-hidden="true" />
                            <h3 className="text-xl font-semibold text-teal">División formal</h3>
                        </div>
                        <dl className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-cream p-3">
                                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Partes</dt>
                                <dd className="mt-1 text-lg font-semibold text-teal-dark">{analisis.division_formal.partes_principales}</dd>
                            </div>
                            <div className="rounded-xl bg-cream p-3">
                                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Capítulos</dt>
                                <dd className="mt-1 text-lg font-semibold text-teal-dark">{analisis.division_formal.capitulos}</dd>
                            </div>
                            <div className="col-span-2 rounded-xl bg-cream p-3">
                                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Longitud</dt>
                                <dd className="mt-1 text-lg font-semibold text-teal-dark">{formatKey(analisis.division_formal.longitud_capitulos)}</dd>
                            </div>
                        </dl>
                        <p className="mt-4 text-sm leading-relaxed text-grey">{analisis.division_formal.patrones_estructurales}</p>
                    </Card>
                </div>

                <Card>
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <GitBranch className="h-5 w-5 text-coral" aria-hidden="true" />
                            <h3 className="text-xl font-semibold text-teal">Puntos de giro</h3>
                        </div>
                        <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">
                            {analisis.puntos_giro.length} momentos clave
                        </span>
                    </div>
                    <div className="space-y-4">
                        {analisis.puntos_giro.map((point) => (
                            <div key={point.numero} className="grid gap-3 rounded-xl border border-teal/10 bg-offwhite p-4 md:grid-cols-[88px_1fr]">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{point.ubicacion.porcentaje}%</p>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal/10">
                                        <div className="h-full rounded-full bg-teal" style={{ width: `${point.ubicacion.porcentaje}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <h4 className="text-lg font-semibold text-teal-dark">{point.titulo}</h4>
                                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal">
                                            Importancia {point.importancia}/10
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-grey">{point.descripcion}</p>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-grey/70">{formatKey(point.tipo)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Tramas y entrelazamiento</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey">{analisis.lineas_argumentales.descripcion_tramas}</p>
                    <div className="mt-5">
                        <ScoreBar label="Nivel de entrelazamiento" value={analisis.lineas_argumentales.nivel_entrelazamiento} />
                    </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-semibold text-teal">Factores de complejidad</h3>
                    <ul className="mt-4 space-y-3">
                        {analisis.complejidad_estructural.factores.map((factor) => (
                            <li key={factor} className="flex gap-3 text-sm leading-relaxed text-grey">
                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-coral" />
                                {factor}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
}

function EmptyChromosomeTab({ label, chromosomeKey }: { label: string; chromosomeKey: ChromosomeKey }) {
    return (
        <Card className="bg-offwhite">
            <div className="flex flex-col gap-4 text-center md:items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
                    <LockKeyhole className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                    <h2 className="text-3xl text-teal">{label}</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-grey">
                        Esta pestaña está preparada para renderizar el JSON de{" "}
                        <span className="font-semibold text-teal">{chromosomeKey}</span> cuando exista en
                        `book_literary_chromosomes.chromosome_data`.
                    </p>
                </div>
            </div>
        </Card>
    );
}

function getBookHeader(chromosomes: GenomeChromosomes, fallbackBook?: GenomeBookHeader): GenomeBookHeader {
    const firstChromosome = chromosomeTabs
        .map((tab) => chromosomes[tab.key])
        .find((chromosome): chromosome is { libro?: Partial<GenomeBookHeader> } => Boolean(chromosome) && typeof chromosome === "object");
    const book = firstChromosome?.libro || {};

    return {
        titulo: fallbackBook?.titulo || book.titulo || "Genoma literario",
        autor: fallbackBook?.autor || book.autor || "Autor desconocido",
        año: fallbackBook?.año ?? book.año ?? null,
    };
}

export function DemoAdnClient({
    chromosomes = demoChromosomes,
    book: fallbackBook,
    badgeLabel = "ADN demo",
}: {
    chromosomes?: GenomeChromosomes;
    book?: GenomeBookHeader;
    badgeLabel?: string;
}) {
    const [activeTab, setActiveTab] = useState<ChromosomeKey>("narrative_structure");
    const book = getBookHeader(chromosomes, fallbackBook);
    const activeCard = getActiveCard(activeTab, chromosomes);

    return (
        <section className="relative overflow-hidden pt-8 md:pt-10">
            <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,#FBF7F1_0%,#FFFAEF_100%)]" />
            <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:px-8">
                <div className="mb-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
                    <div className="pb-4">
                        <div className="mb-5 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 bg-teal px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                                <Dna className="h-3.5 w-3.5" aria-hidden="true" />
                                {badgeLabel}
                            </span>
                            <span className="inline-flex items-center gap-2 border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-coral">
                                <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                                Recurso premium
                            </span>
                        </div>

                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">
                            Wordelia · Genoma literario
                        </p>
                        <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] text-teal md:text-7xl">
                            {book.titulo}
                        </h1>
                        <p className="mt-4 text-xl font-medium text-teal-dark">
                            {book.autor}{book.año ? ` · ${book.año}` : ""}
                        </p>
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                            {chromosomeIntro[activeTab]}
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm md:p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-coral" aria-hidden="true" />
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">
                                Cromosoma activo
                            </p>
                        </div>
                        <h2 className="text-3xl leading-tight text-teal">{activeCard.title}</h2>
                        <p className="mt-4 text-base leading-relaxed text-grey">{activeCard.description}</p>
                        {activeCard.score && (
                            <div className="mt-6 max-w-48 rounded-xl bg-offwhite p-4">
                                <p className="text-3xl font-bold text-teal">{activeCard.score}/10</p>
                                <p className="mt-1 text-sm text-grey">Puntuación global</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="mb-0 flex flex-row gap-2 overflow-x-auto border-b-0 lg:flex-col lg:items-stretch lg:overflow-visible">
                        {chromosomeTabs.map((tab, index) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative whitespace-nowrap rounded-xl border border-teal/10 bg-white px-4 py-3 text-left text-sm font-medium shadow-sm transition-colors lg:w-full ${
                                    activeTab === tab.key ? "text-teal" : "text-grey/60 hover:text-teal/80"
                                }`}
                            >
                                <span className="mr-2 text-xs font-bold text-coral">{index + 1}</span>
                                {tab.label}
                                {activeTab === tab.key && (
                                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-teal" />
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="min-w-0 animate-fade-in">
                    <ChromosomePanel activeTab={activeTab} chromosomes={chromosomes} />
                </div>
                </div>
            </div>
        </section>
    );
}

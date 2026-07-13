"use client";

import { AlertTriangle, Clock3, MessageCircle, Quote, Route, Sparkles, Users } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/Tabs";
import { ScrollNav } from "@/components/ui/ScrollNav";
import type { DiscussionGuide } from "./guide-data";

type DemoGuiaClientProps = {
    guide: DiscussionGuide;
};

// The `ficha_rapida_sesion` payload comes in two shapes depending on how the
// guide was generated. We normalize both into a common { tiempo, label, text }
// row so the session table always renders.
type RawSessionRow = {
    // Structure A
    tiempo?: string;
    actividad?: string;
    // Structure B
    momento?: string;
    duracion?: string;
    objetivo?: string;
    dinamica?: string;
    // Structure C
    etapa?: string;
};

type SessionRow = {
    tiempo: string;
    label: string;
    text: string;
};

// "00:20 - 00:50" -> "30 min" (the real duration of the activity).
function realMinutesFromRange(range: string): string {
    const match = range.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
    if (!match) return range.trim();
    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = Number(match[3]) * 60 + Number(match[4]);
    const diff = end - start;
    if (!Number.isFinite(diff) || diff <= 0) return range.trim();
    return `${diff} min`;
}

// "10 minutos" / "10 min" -> "10 min" (uniform format across structures).
function normalizeDuration(value?: string): string {
    if (!value) return "";
    const match = value.match(/\d+/);
    return match ? `${match[0]} min` : value.trim();
}

function normalizeSessionRow(item: RawSessionRow): SessionRow {
    // Structure A: { tiempo (range), actividad }
    if (item.tiempo != null || item.actividad != null) {
        return {
            tiempo: item.tiempo ? realMinutesFromRange(item.tiempo) : "",
            label: "",
            text: item.actividad ?? "",
        };
    }

    // Structure C: { etapa, duracion }
    if (item.etapa != null) {
        return {
            tiempo: normalizeDuration(item.duracion),
            label: "",
            text: item.etapa,
        };
    }

    // Structure B: { momento, duracion, objetivo, dinamica }
    return {
        tiempo: normalizeDuration(item.duracion),
        label: item.momento ?? "",
        text: item.dinamica ?? "",
    };
}

const tabItems = [
    { value: "sesion", label: "Sesión" },
    { value: "contexto", label: "Obra y contexto" },
    { value: "rutas", label: "Rutas" },
    { value: "preguntas", label: "Preguntas" },
    { value: "personajes", label: "Personajes" },
    { value: "simbolos", label: "Símbolos" },
    { value: "final", label: "Final" },
    { value: "actualidad", label: "Actualidad" },
    { value: "actividades", label: "Actividades" },
    { value: "moderador", label: "Moderador" },
];

// `arquitectura_narrativa` arrives either as a single string or split across
// object fields ({ recursos, estructura } / { estructura, tecnicas_narrativas }).
// Return the parts as an array so each renders as its own paragraph.
function normalizeArquitectura(value: unknown): string[] {
    if (typeof value === "string") return value.trim() ? [value] : [];
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.values(value as Record<string, unknown>).filter(
            (part): part is string => typeof part === "string" && part.trim().length > 0
        );
    }
    return [];
}

// Each `tres_lecturas_final` entry uses different keys depending on the guide
// ({ enfoque, explicacion } / { prisma, analisis } / { lectura, analisis }).
type RawLecturaFinal = {
    enfoque?: string;
    explicacion?: string;
    prisma?: string;
    lectura?: string;
    analisis?: string;
};

function normalizeLecturaFinal(item: RawLecturaFinal): { title: string; body: string } {
    return {
        title: item.enfoque ?? item.prisma ?? item.lectura ?? "",
        body: item.explicacion ?? item.analisis ?? "",
    };
}

// The closing quote ("frase de salida") normally lives at
// cierre_discusion.frase_salida, but some guides place it elsewhere. Resolve
// the canonical location first, then fall back to a frase_salida found anywhere.
type FraseSalida = { texto: string; fuente: string };

function coerceFrase(value: unknown): FraseSalida | null {
    if (typeof value === "string") {
        return value.trim() ? { texto: value, fuente: "" } : null;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        const pick = (keys: string[]) => {
            for (const key of keys) {
                if (typeof obj[key] === "string" && (obj[key] as string).trim()) return obj[key] as string;
            }
            return "";
        };
        // Primary key names, with a fallback to the first string value present.
        let texto = pick(["texto", "frase", "cita", "contenido", "text", "quote"]);
        const fuente = pick(["fuente", "autor", "author", "source"]);
        if (!texto) {
            const firstString = Object.entries(obj).find(
                ([key, val]) => typeof val === "string" && val.trim() && val !== fuente && key !== "fuente"
            );
            texto = firstString ? (firstString[1] as string) : "";
        }
        return texto.trim() ? { texto, fuente } : null;
    }
    return null;
}

function findFraseSalida(value: unknown, depth = 0): FraseSalida | null {
    if (depth > 6 || !value || typeof value !== "object") return null;

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findFraseSalida(item, depth + 1);
            if (found) return found;
        }
        return null;
    }

    const obj = value as Record<string, unknown>;
    if ("frase_salida" in obj) {
        const frase = coerceFrase(obj.frase_salida);
        if (frase) return frase;
    }

    for (const nested of Object.values(obj)) {
        const found = findFraseSalida(nested, depth + 1);
        if (found) return found;
    }

    return null;
}

function resolveFraseSalida(guide: DiscussionGuide): FraseSalida | null {
    return coerceFrase(guide.cierre_discusion?.frase_salida) ?? findFraseSalida(guide);
}

function InlineMarkdown({ text }: { text: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
                }

                if (part.startsWith("*") && part.endsWith("*")) {
                    return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
                }

                return <span key={`${part}-${index}`}>{part}</span>;
            })}
        </>
    );
}

function TextBlock({ text, className = "" }: { text?: string | null; className?: string }) {
    const safeText = typeof text === "string" ? text : "";
    if (!safeText.trim()) return null;

    const quote = safeText.trim().startsWith(">");
    const cleanText = quote ? safeText.trim().replace(/^>\s?/, "") : safeText;

    if (quote) {
        return (
            <blockquote className={`border-l-4 border-coral bg-white/80 px-5 py-4 text-lg leading-relaxed text-teal-dark shadow-sm ${className}`}>
                <InlineMarkdown text={cleanText} />
            </blockquote>
        );
    }

    return (
        <p className={`text-sm leading-relaxed text-grey md:text-base ${className}`}>
            <InlineMarkdown text={cleanText} />
        </p>
    );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">{eyebrow}</p>
            <h2 className="mt-2 text-3xl leading-tight text-teal md:text-4xl">{title}</h2>
        </div>
    );
}

function GuideCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function DemoGuiaClient({ guide }: DemoGuiaClientProps) {
    const fraseSalida = resolveFraseSalida(guide);
    return (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:px-8">
            <div className="mb-8 grid gap-4 md:grid-cols-4">
                <GuideCard className="md:col-span-2">
                    <div className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-coral" aria-hidden="true" />
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Duracion sugerida</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-teal-dark">{guide.como_usar_guia.duracion_sugerida}</p>
                    <p className="mt-1 text-sm text-grey">{guide.como_usar_guia.formato}</p>
                </GuideCard>
                <GuideCard>
                    <div className="flex items-center gap-3">
                        <Route className="h-5 w-5 text-coral" aria-hidden="true" />
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Rutas</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-teal-dark">{guide.mapa_discusion_rutas.length} ejes</p>
                    <p className="mt-1 text-sm text-grey">Mapa de conversacion</p>
                </GuideCard>
                <GuideCard>
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-coral" aria-hidden="true" />
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Personajes</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-teal-dark">{guide.personajes_tarjetas.length} tarjetas</p>
                    <p className="mt-1 text-sm text-grey">Análisis listo para debate</p>
                </GuideCard>
            </div>

            <Tabs defaultValue="sesion" className="space-y-6">
                <div className="min-w-0">
                    <ScrollNav className="mb-0">
                        {tabItems.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="shrink-0 rounded-xl border border-teal/10 bg-white px-4 py-3 text-left shadow-sm"
                            >
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </ScrollNav>
                </div>

                <div className="min-w-0">
                    <TabsContent value="sesion">
                        <SectionTitle eyebrow="Cómo usar la guía" title="Agenda, tono y marco de seguridad" />
                        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                            <GuideCard>
                                <div className="mb-4 flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-coral" aria-hidden="true" />
                                    <h3 className="text-xl font-semibold text-teal">Antes de empezar</h3>
                                </div>
                                <ul className="space-y-3">
                                    {guide.como_usar_guia.antes_de_empezar.temas_sensibles.map((tema, index) => (
                                        <li key={`tema-${index}-${tema || "vacio"}`} className="border-b border-teal/10 pb-3 text-sm text-grey last:border-0 last:pb-0">
                                            {tema}
                                        </li>
                                    ))}
                                </ul>
                                <TextBlock text={guide.como_usar_guia.antes_de_empezar.norma_conversacion} className="mt-5" />
                            </GuideCard>

                            <div className="overflow-hidden border border-teal/10 bg-white shadow-sm">
                                <div className="grid grid-cols-[90px_1fr] border-b border-teal/10 bg-offwhite px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-teal sm:grid-cols-[110px_1fr]">
                                    <span>Tiempo</span>
                                    <span>Dinámica</span>
                                </div>
                                {guide.como_usar_guia.ficha_rapida_sesion.map((item, index) => {
                                    const row = normalizeSessionRow(item as RawSessionRow);
                                    return (
                                        <div key={`sesion-${index}`} className="grid grid-cols-[90px_1fr] gap-4 border-b border-teal/10 px-4 py-4 last:border-0 sm:grid-cols-[110px_1fr]">
                                            <p className="text-sm font-semibold text-coral">{row.tiempo}</p>
                                            <p className="text-sm leading-relaxed text-grey">
                                                {row.label && <span className="font-semibold text-teal-dark">{row.label}: </span>}
                                                {row.text}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contexto">
                        <SectionTitle eyebrow="Obra y contexto" title="La entrada al túnel mental de Castel" />
                        <div className="space-y-5">
                            <GuideCard>
                                <h3 className="mb-4 text-xl font-semibold text-teal">Resumen analítico</h3>
                                <div className="space-y-4">
                                    {guide.obra_y_contexto.resumen_analitico.map((paragraph, index) => (
                                        <TextBlock key={`resumen-${index}-${paragraph || "vacio"}`} text={paragraph} />
                                    ))}
                                </div>
                            </GuideCard>
                            <GuideCard className="bg-offwhite">
                                <h3 className="mb-3 text-xl font-semibold text-teal">Clave de lectura</h3>
                                <TextBlock text={guide.obra_y_contexto.clave_de_lectura} />
                            </GuideCard>
                            <div className="grid gap-4 md:grid-cols-2">
                                {guide.obra_y_contexto.contexto_creacion_ecos_historicos.map((item, index) => (
                                    <GuideCard key={`contexto-${index}-${item || "vacio"}`}>
                                        <TextBlock text={item} />
                                    </GuideCard>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="rutas">
                        <SectionTitle eyebrow="Mapa de discusión" title="Cinco rutas para profundizar" />
                        <div className="grid gap-4">
                            {guide.mapa_discusion_rutas.map((ruta, index) => (
                                <GuideCard key={`ruta-${index}-${ruta.eje_numero || ruta.titulo || "eje"}`}>
                                    <div className="flex flex-col gap-4 md:flex-row">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-teal text-lg font-bold text-white">
                                            {ruta.eje_numero}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-2xl font-semibold leading-tight text-teal">{ruta.titulo}</h3>
                                            <TextBlock text={ruta.linea_conceptual} className="mt-2" />
                                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                {ruta.preguntas_analiticas.map((pregunta, questionIndex) => (
                                                    <div key={`ruta-${index}-pregunta-${questionIndex}-${pregunta || "vacia"}`} className="border-l-2 border-coral bg-offwhite px-4 py-3 text-sm leading-relaxed text-grey">
                                                        {pregunta}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </GuideCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="preguntas">
                        <SectionTitle eyebrow="Preguntas poderosas" title="Bloques temáticos para abrir la conversación" />
                        <div className="grid gap-5 md:grid-cols-2">
                            {Object.entries(guide.preguntas_poderosas).map(([key, block]) => (
                                <GuideCard key={key}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <MessageCircle className="h-5 w-5 text-coral" aria-hidden="true" />
                                        <h3 className="text-xl font-semibold text-teal">{block.titulo_bloque}</h3>
                                    </div>
                                    <div className="space-y-3">
                                    {block.preguntas.map((pregunta, index) => (
                                            <p key={`${key}-pregunta-${index}-${pregunta || "vacia"}`} className="border-b border-teal/10 pb-3 text-sm leading-relaxed text-grey last:border-0 last:pb-0">
                                                {pregunta}
                                            </p>
                                        ))}
                                    </div>
                                </GuideCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="personajes">
                        <SectionTitle eyebrow="Tarjetas de personajes" title="Perfiles para discutir motivaciones" />
                        <div className="grid gap-4 md:grid-cols-2">
                            {guide.personajes_tarjetas.map((personaje, index) => (
                                <GuideCard key={`personaje-${index}-${personaje.nombre || "sin-nombre"}`}>
                                    <h3 className="text-2xl font-semibold text-teal">{personaje.nombre}</h3>
                                    <TextBlock text={personaje.analisis} className="mt-3" />
                                    <div className="mt-5 bg-teal/5 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">Pregunta de discusión</p>
                                        <p className="mt-2 text-sm leading-relaxed text-teal-dark">{personaje.pregunta_discusion}</p>
                                    </div>
                                </GuideCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="simbolos">
                        <SectionTitle eyebrow="Símbolos y motivos" title="Lecturas posibles para sostener el análisis" />
                        <div className="grid gap-4 md:grid-cols-2">
                            {guide.simbolos_y_motivos.map((simbolo, index) => (
                                <GuideCard key={`simbolo-${index}-${simbolo.simbolo || "sin-simbolo"}`}>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">Símbolo</p>
                                    <h3 className="mt-2 text-2xl font-semibold text-teal">{simbolo.simbolo}</h3>
                                    <TextBlock text={simbolo.lectura_posible} className="mt-3" />
                                </GuideCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="final">
                        <SectionTitle eyebrow="Estructura y cierre" title="Tres lecturas del desenlace" />
                        <GuideCard className="mb-5">
                            <h3 className="mb-3 text-xl font-semibold text-teal">Arquitectura narrativa</h3>
                            {normalizeArquitectura(guide.estructura_y_final.arquitectura_narrativa).map((part, index) => (
                                <TextBlock key={`arquitectura-${index}`} text={part} className={index > 0 ? "mt-3" : ""} />
                            ))}
                        </GuideCard>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {guide.estructura_y_final.tres_lecturas_final.map((item, index) => {
                                const lectura = normalizeLecturaFinal(item as RawLecturaFinal);
                                return (
                                    <GuideCard key={`lectura-final-${index}`}>
                                        <h3 className="text-xl font-semibold leading-tight text-teal">{lectura.title}</h3>
                                        <TextBlock text={lectura.body} className="mt-3" />
                                    </GuideCard>
                                );
                            })}
                        </div>
                        {fraseSalida && (
                            <div className="mt-5 overflow-hidden rounded-xl border border-teal/10 bg-teal p-5 shadow-sm">
                                <Quote className="mb-4 h-7 w-7 text-coral" aria-hidden="true" />
                                <p className="font-serif text-2xl leading-relaxed text-white">{fraseSalida.texto}</p>
                                {fraseSalida.fuente && (
                                    <p className="mt-4 text-sm font-semibold text-white/70">{fraseSalida.fuente}</p>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="actualidad">
                        <SectionTitle eyebrow="Conexiones actuales" title="Por que sigue incomodando hoy" />
                        <div className="grid gap-4">
                            {guide.conexiones_mundo_actual.map((conexion, index) => (
                                <GuideCard key={`conexion-${index}-${conexion || "vacia"}`}>
                                    <div className="flex gap-4">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-coral text-sm font-bold text-white">
                                            {index + 1}
                                        </span>
                                        <TextBlock text={conexion} />
                                    </div>
                                </GuideCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="actividades">
                        <SectionTitle eyebrow="Dinamizacion" title="Actividades para activar al club" />
                        <div className="grid gap-5 md:grid-cols-2">
                            {guide.actividades_dinamizar.map((actividad, index) => (
                                <GuideCard key={`actividad-${index}-${actividad.nombre_actividad || "sin-nombre"}`}>
                                    <Sparkles className="mb-4 h-6 w-6 text-coral" aria-hidden="true" />
                                    <h3 className="text-2xl font-semibold text-teal">{actividad.nombre_actividad}</h3>
                                    <TextBlock text={actividad.descripcion_detallada} className="mt-3" />
                                </GuideCard>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="moderador">
                        <SectionTitle eyebrow="Notas del moderador" title="Salvavidas para reconducir la sesion" />
                        <div className="space-y-4">
                            {guide.notas_moderador_salvavidas.map((nota, index) => (
                                <GuideCard key={`nota-${index}-${nota.situacion || "sin-situacion"}`}>
                                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-coral">{nota.situacion}</p>
                                    <p className="mt-3 text-lg leading-relaxed text-teal-dark">{nota.intervencion_sugerida}</p>
                                </GuideCard>
                            ))}
                        </div>
                        <GuideCard className="mt-5 bg-offwhite">
                            <h3 className="text-xl font-semibold text-teal">Cierre de discusión</h3>
                            <div className="mt-4 space-y-3 text-sm leading-relaxed text-grey">
                                <TextBlock text={guide.cierre_discusion.pregunta_sintesis} />
                                <TextBlock text={guide.cierre_discusion.pregunta_vigencia} />
                                <TextBlock text={guide.cierre_discusion.evaluacion_relevancia} />
                            </div>
                        </GuideCard>
                    </TabsContent>
                </div>
            </Tabs>
        </section>
    );
}

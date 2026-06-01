"use client";

import { AlertTriangle, Clock3, MessageCircle, Quote, Route, Sparkles, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { DiscussionGuide } from "./guide-data";

type DemoGuiaClientProps = {
    guide: DiscussionGuide;
};

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

function TextBlock({ text, className = "" }: { text: string; className?: string }) {
    const quote = text.trim().startsWith(">");
    const cleanText = quote ? text.trim().replace(/^>\s?/, "") : text;

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

            <Tabs defaultValue="sesion" className="grid gap-8 lg:grid-cols-[270px_1fr]">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <TabsList className="mb-0 flex flex-row gap-2 overflow-x-auto border-b-0 lg:flex-col lg:items-stretch lg:overflow-visible">
                        {tabItems.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="rounded-xl border border-teal/10 bg-white px-4 py-3 text-left shadow-sm lg:w-full"
                            >
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </aside>

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
                                    {guide.como_usar_guia.antes_de_empezar.temas_sensibles.map((tema) => (
                                        <li key={tema} className="border-b border-teal/10 pb-3 text-sm text-grey last:border-0 last:pb-0">
                                            {tema}
                                        </li>
                                    ))}
                                </ul>
                                <TextBlock text={guide.como_usar_guia.antes_de_empezar.norma_conversacion} className="mt-5" />
                            </GuideCard>

                            <div className="overflow-hidden border border-teal/10 bg-white shadow-sm">
                                <div className="grid grid-cols-[96px_1fr] border-b border-teal/10 bg-offwhite px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-teal sm:grid-cols-[130px_90px_1fr]">
                                    <span>Momento</span>
                                    <span className="hidden sm:block">Tiempo</span>
                                    <span>Dinámica</span>
                                </div>
                                {guide.como_usar_guia.ficha_rapida_sesion.map((item) => (
                                    <div key={item.momento} className="grid grid-cols-[96px_1fr] gap-4 border-b border-teal/10 px-4 py-4 last:border-0 sm:grid-cols-[130px_90px_1fr]">
                                        <div>
                                            <p className="font-semibold text-teal-dark">{item.momento}</p>
                                            <p className="mt-1 text-xs text-coral sm:hidden">{item.duracion}</p>
                                        </div>
                                        <p className="hidden text-sm font-semibold text-coral sm:block">{item.duracion}</p>
                                        <div>
                                            <p className="text-sm font-semibold text-teal">{item.objetivo}</p>
                                            <p className="mt-1 text-sm leading-relaxed text-grey">{item.dinamica}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contexto">
                        <SectionTitle eyebrow="Obra y contexto" title="La entrada al túnel mental de Castel" />
                        <div className="space-y-5">
                            <GuideCard>
                                <h3 className="mb-4 text-xl font-semibold text-teal">Resumen analítico</h3>
                                <div className="space-y-4">
                                    {guide.obra_y_contexto.resumen_analitico.map((paragraph) => (
                                        <TextBlock key={paragraph} text={paragraph} />
                                    ))}
                                </div>
                            </GuideCard>
                            <GuideCard className="bg-offwhite">
                                <h3 className="mb-3 text-xl font-semibold text-teal">Clave de lectura</h3>
                                <TextBlock text={guide.obra_y_contexto.clave_de_lectura} />
                            </GuideCard>
                            <div className="grid gap-4 md:grid-cols-2">
                                {guide.obra_y_contexto.contexto_creacion_ecos_historicos.map((item) => (
                                    <GuideCard key={item}>
                                        <TextBlock text={item} />
                                    </GuideCard>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="rutas">
                        <SectionTitle eyebrow="Mapa de discusión" title="Cinco rutas para profundizar" />
                        <div className="grid gap-4">
                            {guide.mapa_discusion_rutas.map((ruta) => (
                                <GuideCard key={ruta.eje_numero}>
                                    <div className="flex flex-col gap-4 md:flex-row">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-teal text-lg font-bold text-white">
                                            {ruta.eje_numero}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-2xl font-semibold leading-tight text-teal">{ruta.titulo}</h3>
                                            <TextBlock text={ruta.linea_conceptual} className="mt-2" />
                                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                {ruta.preguntas_analiticas.map((pregunta) => (
                                                    <div key={pregunta} className="border-l-2 border-coral bg-offwhite px-4 py-3 text-sm leading-relaxed text-grey">
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
                        <div className="grid gap-5 lg:grid-cols-2">
                            {Object.entries(guide.preguntas_poderosas).map(([key, block]) => (
                                <GuideCard key={key}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <MessageCircle className="h-5 w-5 text-coral" aria-hidden="true" />
                                        <h3 className="text-xl font-semibold text-teal">{block.titulo_bloque}</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {block.preguntas.map((pregunta) => (
                                            <p key={pregunta} className="border-b border-teal/10 pb-3 text-sm leading-relaxed text-grey last:border-0 last:pb-0">
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
                            {guide.personajes_tarjetas.map((personaje) => (
                                <GuideCard key={personaje.nombre}>
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
                            {guide.simbolos_y_motivos.map((simbolo) => (
                                <GuideCard key={simbolo.simbolo}>
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
                            <TextBlock text={guide.estructura_y_final.arquitectura_narrativa} />
                        </GuideCard>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {guide.estructura_y_final.tres_lecturas_final.map((lectura) => (
                                <GuideCard key={lectura.enfoque}>
                                    <h3 className="text-xl font-semibold leading-tight text-teal">{lectura.enfoque}</h3>
                                    <TextBlock text={lectura.explicacion} className="mt-3" />
                                </GuideCard>
                            ))}
                        </div>
                        <div className="mt-5 overflow-hidden rounded-xl border border-teal/10 bg-teal p-5 shadow-sm">
                            <Quote className="mb-4 h-7 w-7 text-coral" aria-hidden="true" />
                            <p className="font-serif text-2xl leading-relaxed text-white">{guide.cierre_discusion.frase_salida.texto}</p>
                            <p className="mt-4 text-sm font-semibold text-white/70">{guide.cierre_discusion.frase_salida.fuente}</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="actualidad">
                        <SectionTitle eyebrow="Conexiones actuales" title="Por que sigue incomodando hoy" />
                        <div className="grid gap-4">
                            {guide.conexiones_mundo_actual.map((conexion, index) => (
                                <GuideCard key={conexion}>
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
                            {guide.actividades_dinamizar.map((actividad) => (
                                <GuideCard key={actividad.nombre_actividad}>
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
                            {guide.notas_moderador_salvavidas.map((nota) => (
                                <GuideCard key={nota.situacion}>
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

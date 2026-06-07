import Link from "next/link";
import { ArrowLeft, BookOpenCheck, BookOpenText, Dna, Lock, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ResourceAccessState, ResourceDetail, ResourceKind, ResourceListItem } from "./actions";
import { DemoAdnClient } from "@/app/demo-adn/DemoAdnClient";
import { DemoGuiaClient } from "@/app/demo-guia/DemoGuiaClient";
import type { DiscussionGuide } from "@/app/demo-guia/guide-data";
import { ResourceListPager } from "./ResourceListPager";

function titleForKind(kind: ResourceKind) {
    return kind === "guide" ? "Guia de discusion" : "Genoma literario";
}

function pluralTitleForKind(kind: ResourceKind) {
    return kind === "guide" ? "Guias disponibles" : "Genomas disponibles";
}

function IconForKind({ kind, className }: { kind: ResourceKind; className?: string }) {
    const Icon = kind === "guide" ? BookOpenText : Dna;
    return <Icon className={className} aria-hidden="true" />;
}

function accessLabel(access: ResourceAccessState) {
    if (access === "admin") return "Admin";
    if (access === "granted") return "Acceso activo";
    if (access === "requires_plan") return "Plan o compra";
    return "Bloqueado";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDiscussionGuide(value: unknown): value is DiscussionGuide {
    return (
        isPlainObject(value) &&
        isPlainObject(value.metadata) &&
        isPlainObject(value.cabecera) &&
        isPlainObject(value.como_usar_guia)
    );
}

function parseJsonString(value: unknown): unknown {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;

    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
}

function findDiscussionGuide(value: unknown, depth = 0): DiscussionGuide | null {
    if (depth > 4) return null;

    const parsed = parseJsonString(value);
    if (isDiscussionGuide(parsed)) return parsed;

    if (Array.isArray(parsed)) {
        for (const item of parsed) {
            const guide = findDiscussionGuide(item, depth + 1);
            if (guide) return guide;
        }
        return null;
    }

    if (!isPlainObject(parsed)) return null;

    const preferredKeys = [
        "guide_data",
        "guide",
        "discussion_guide",
        "discussionGuide",
        "content",
        "data",
        "payload",
        "source_payload",
        "raw_payload",
    ];

    for (const key of preferredKeys) {
        if (key in parsed) {
            const guide = findDiscussionGuide(parsed[key], depth + 1);
            if (guide) return guide;
        }
    }

    for (const value of Object.values(parsed)) {
        const guide = findDiscussionGuide(value, depth + 1);
        if (guide) return guide;
    }

    return null;
}

function toArray<T>(value: T[] | T | Record<string, T> | null | undefined): T[] {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (isPlainObject(value)) return Object.values(value) as T[];
    return [value as T];
}

function safeObject<T extends Record<string, unknown>>(value: T | null | undefined): T {
    return (isPlainObject(value) ? value : {}) as T;
}

function safeString(value: unknown, fallback = "") {
    return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeDiscussionGuide(guide: DiscussionGuide): DiscussionGuide {
    const cabecera = safeObject(guide.cabecera);
    const comoUsar = safeObject(guide.como_usar_guia);
    const antesDeEmpezar = safeObject(comoUsar.antes_de_empezar);
    const obraContexto = safeObject(guide.obra_y_contexto);
    const estructuraFinal = safeObject(guide.estructura_y_final);
    const cierreDiscusion = safeObject(guide.cierre_discusion);

    return {
        ...guide,
        cabecera: {
            ...cabecera,
            titulo_libro: safeString(cabecera.titulo_libro, "Guia de discusion"),
            autor: safeString(cabecera.autor, "Autor desconocido"),
            ano_publicacion: safeString(cabecera.ano_publicacion, ""),
            idea_central_apertura: safeString(cabecera.idea_central_apertura, ""),
            conceptos_clave: toArray(cabecera.conceptos_clave),
        },
        como_usar_guia: {
            ...comoUsar,
            antes_de_empezar: {
                ...antesDeEmpezar,
                temas_sensibles: toArray(antesDeEmpezar.temas_sensibles),
                norma_conversacion: safeString(antesDeEmpezar.norma_conversacion),
            },
            duracion_sugerida: safeString(comoUsar.duracion_sugerida, "Sin duracion definida"),
            formato: safeString(comoUsar.formato, "Guia de lectura"),
            ficha_rapida_sesion: toArray(comoUsar.ficha_rapida_sesion),
        },
        obra_y_contexto: {
            ...obraContexto,
            resumen_analitico: toArray(obraContexto.resumen_analitico),
            clave_de_lectura: safeString(obraContexto.clave_de_lectura),
            contexto_creacion_ecos_historicos: toArray(obraContexto.contexto_creacion_ecos_historicos),
        },
        mapa_discusion_rutas: toArray(guide.mapa_discusion_rutas),
        preguntas_poderosas: safeObject(guide.preguntas_poderosas),
        personajes_tarjetas: toArray(guide.personajes_tarjetas),
        simbolos_y_motivos: toArray(guide.simbolos_y_motivos),
        estructura_y_final: {
            ...estructuraFinal,
            arquitectura_narrativa: safeString(estructuraFinal.arquitectura_narrativa),
            tres_lecturas_final: toArray(estructuraFinal.tres_lecturas_final),
        },
        conexiones_mundo_actual: toArray(guide.conexiones_mundo_actual),
        actividades_dinamizar: toArray(guide.actividades_dinamizar),
        notas_moderador_salvavidas: toArray(guide.notas_moderador_salvavidas),
        cierre_discusion: {
            ...cierreDiscusion,
            pregunta_sintesis: safeString(cierreDiscusion.pregunta_sintesis),
            pregunta_vigencia: safeString(cierreDiscusion.pregunta_vigencia),
            evaluacion_relevancia: safeString(cierreDiscusion.evaluacion_relevancia),
            frase_salida: isPlainObject(cierreDiscusion.frase_salida)
                ? cierreDiscusion.frase_salida
                : { texto: "", fuente: "" },
        },
    };
}

function humanizeKey(value: string) {
    return value
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PrimitiveValue({ value }: { value: unknown }) {
    if (value === null || value === undefined) return null;

    if (typeof value === "string") {
        return (
            <div className="space-y-3">
                {value.split(/\n{2,}/).map((paragraph) => (
                    <p key={paragraph.slice(0, 60)} className="text-sm leading-relaxed text-grey md:text-base">
                        {paragraph}
                    </p>
                ))}
            </div>
        );
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return <p className="text-sm leading-relaxed text-grey md:text-base">{String(value)}</p>;
    }

    return <pre className="overflow-auto rounded-lg bg-teal-dark p-4 text-xs leading-relaxed text-white">{JSON.stringify(value, null, 2)}</pre>;
}

function ResourceValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
    if (Array.isArray(value)) {
        if (value.length === 0) return null;

        return (
            <div className="space-y-3">
                {value.map((item, index) => (
                    <div key={index} className={isPlainObject(item) ? "rounded-lg border border-teal/10 bg-offwhite p-4" : "border-l-2 border-coral bg-offwhite px-4 py-3"}>
                        <ResourceValue value={item} depth={depth + 1} />
                    </div>
                ))}
            </div>
        );
    }

    if (isPlainObject(value)) {
        const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== null && entryValue !== undefined);
        if (entries.length === 0) return null;

        return (
            <div className="space-y-4">
                {entries.map(([key, entryValue]) => (
                    <section key={key} className={depth === 0 ? "rounded-xl border border-teal/10 bg-white p-5 shadow-sm" : ""}>
                        <h3 className={`${depth === 0 ? "text-xl" : "text-base"} mb-3 font-semibold text-teal`}>
                            {humanizeKey(key)}
                        </h3>
                        <ResourceValue value={entryValue} depth={depth + 1} />
                    </section>
                ))}
            </div>
        );
    }

    return <PrimitiveValue value={value} />;
}

export function ResourceDetailView({ detail }: { detail: ResourceDetail }) {
    return (
        <div className="space-y-6">
            <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver a mi lectura
            </Link>

            <section className="rounded-2xl border border-teal/10 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-coral">
                            <IconForKind kind={detail.kind} className="h-4 w-4" />
                            {titleForKind(detail.kind)}
                        </p>
                        <h1 className="mt-3 text-3xl leading-tight text-teal md:text-5xl">{detail.book.title}</h1>
                        <p className="mt-2 text-base font-semibold text-coral">{detail.book.author || "Autor desconocido"}</p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-teal/10 bg-teal/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-teal">
                        {detail.access === "admin" ? <ShieldCheck className="h-4 w-4" /> : null}
                        {accessLabel(detail.access)}
                    </span>
                </div>
            </section>

            <ResourceValue value={detail.payload} />
        </div>
    );
}

export function ResourceGuideView({ detail }: { detail: ResourceDetail }) {
    const rawGuide = findDiscussionGuide(detail.payload) || findDiscussionGuide(detail.row);

    if (!rawGuide) {
        return <ResourceDetailView detail={detail} />;
    }

    const guide = normalizeDiscussionGuide(rawGuide);

    return (
        <div className="-mx-4 -my-6 bg-cream sm:-mx-6 md:-mx-8">
            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 md:px-8">
                <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Volver
                </Link>
            </div>

            <section className="relative overflow-hidden pt-10 md:pt-14">
                <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,#FBF7F1_0%,#FFFAEF_100%)]" />
                <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 md:px-8">
                    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
                        <div className="pb-4">
                            <div className="mb-5 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 bg-teal px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                                    <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    Guia
                                </span>
                                <span className="inline-flex items-center gap-2 border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-coral">
                                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                                    Recurso premium
                                </span>
                            </div>

                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">
                                {guide.metadata.marca} · Guia de discusion
                            </p>
                            <h1 className="mt-4 max-w-4xl text-5xl leading-[0.95] text-teal md:text-7xl">
                                {guide.cabecera.titulo_libro}
                            </h1>
                            <p className="mt-4 text-xl font-medium text-teal-dark">
                                {guide.cabecera.autor} · {guide.cabecera.ano_publicacion}
                            </p>
                            <p className="mt-5 max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                                Una guia preparada para moderar una conversacion literaria exigente, con rutas,
                                preguntas, actividades y notas de apoyo organizadas en pestanas.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-teal/10 bg-white p-5 shadow-sm md:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-coral" aria-hidden="true" />
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Idea central</p>
                            </div>
                            <blockquote className="border-l-4 border-coral pl-5 text-lg leading-relaxed text-teal-dark">
                                {guide.cabecera.idea_central_apertura.replace(/^>\s?/, "")}
                            </blockquote>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {guide.cabecera.conceptos_clave.map((concept) => (
                                    <span key={concept} className="bg-offwhite px-3 py-1.5 text-sm font-semibold text-teal">
                                        {concept}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <DemoGuiaClient guide={guide} />
        </div>
    );
}

export function ResourceGenomeView({ detail }: { detail: ResourceDetail }) {
    const year = detail.book.firstPublicationYear ? String(detail.book.firstPublicationYear) : null;

    return (
        <div className="-mx-4 -my-6 bg-cream sm:-mx-6 md:-mx-8">
            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 md:px-8">
                <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Volver
                </Link>
            </div>
            <DemoAdnClient
                chromosomes={isPlainObject(detail.payload) ? detail.payload : undefined}
                book={{
                    titulo: detail.book.title,
                    autor: detail.book.author || "Autor desconocido",
                    año: year,
                }}
                badgeLabel="ADN"
            />
        </div>
    );
}

export function ResourceLockedView({ detail }: { detail: ResourceDetail }) {
    const resource = detail.kind === "guide" ? "esta guia" : "este genoma";

    return (
        <div className="space-y-6">
            <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver a mi lectura
            </Link>
            <Card className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
                    <Lock className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">{titleForKind(detail.kind)}</p>
                <h1 className="mt-3 text-3xl text-teal">Desbloquea {resource}</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-grey">
                    {detail.book.title} tiene este recurso disponible. Puedes acceder con un plan compatible o adquiriendo el recurso concreto.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href={`/app/recursos/desbloquear?resource=${detail.kind}&book=${detail.book.id}`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852]">
                        Ver opciones
                    </Link>
                    <Link href="/planes" className="inline-flex h-11 items-center justify-center rounded-2xl border border-teal/20 px-6 font-semibold text-teal transition-colors hover:bg-teal/5">
                        Ver planes
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export function ResourceListView({ kind, items, isAdmin }: { kind: ResourceKind; items: ResourceListItem[]; isAdmin: boolean }) {
    return (
        <div className="space-y-6">
            <Link href="/app/mi-lectura" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver a mi lectura
            </Link>

            <section>
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-coral">
                    <IconForKind kind={kind} className="h-4 w-4" />
                    Recursos
                </p>
                <h1 className="mt-3 text-3xl text-teal md:text-5xl">{pluralTitleForKind(kind)}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-grey md:text-base">
                    {isAdmin
                        ? "Como administrador puedes visualizar cualquier recurso publicado."
                        : "Aqui aparecen los recursos a los que tienes acceso por compra o plan."}
                </p>
            </section>

            {items.length > 0 ? (
                <ResourceListPager kind={kind} items={items} />
            ) : (
                <Card>
                    <p className="text-sm text-grey">No hay recursos disponibles para mostrar.</p>
                </Card>
            )}
        </div>
    );
}

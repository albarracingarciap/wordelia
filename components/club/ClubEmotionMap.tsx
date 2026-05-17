"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { BarChart3, HeartPulse, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
    getClubCheckpointEmotionMap,
    saveCheckpointEmotion,
} from "@/app/app/clubs/[id]/actions";

export type EmotionValue =
    | "asombro"
    | "tristeza"
    | "enojo"
    | "miedo"
    | "alegria"
    | "disgusto"
    | "empatia"
    | "confusion"
    | "esperanza";

interface CheckpointInfo {
    title: string;
    start: string;
    end: string;
    date?: string;
}

interface EmotionContext {
    clubBookId?: string | null;
    bookId?: string | null;
    bookTitle?: string | null;
    bookAuthor?: string | null;
    checkpoint: CheckpointInfo;
    checkpointIndex: number;
    checkpoints?: CheckpointInfo[];
}

interface EmotionRecord {
    id: string;
    emotion: EmotionValue;
    intensity: number;
    note: string | null;
    isMine: boolean;
    user: {
        name: string;
        username: string | null;
        avatarUrl: string | null;
    };
}

interface EmotionDistribution {
    emotion: EmotionValue;
    count: number;
    percentage: number;
    averageIntensity: number;
}

interface EmotionCheckpointSummary {
    checkpointIndex: number;
    total: number;
    averageIntensity: number;
    dominantEmotion: EmotionValue | null;
    distribution: EmotionDistribution[];
    records: EmotionRecord[];
}

interface EmotionMapData {
    byCheckpoint: Record<number, EmotionCheckpointSummary>;
    myEmotions: Record<number, {
        id: string;
        emotion: EmotionValue;
        intensity: number;
        note: string;
        isNotePublic: boolean;
    }>;
}

const EMOTIONS: Array<{
    value: EmotionValue;
    label: string;
    icon: string;
    tone: string;
}> = [
    { value: "asombro", label: "Asombro", icon: "😲", tone: "bg-purple-50 text-purple-700 border-purple-100" },
    { value: "tristeza", label: "Tristeza", icon: "🥺", tone: "bg-blue-50 text-blue-700 border-blue-100" },
    { value: "enojo", label: "Enojo", icon: "😠", tone: "bg-red-50 text-red-700 border-red-100" },
    { value: "miedo", label: "Miedo", icon: "😨", tone: "bg-slate-50 text-slate-700 border-slate-100" },
    { value: "alegria", label: "Alegria", icon: "😄", tone: "bg-amber-50 text-amber-700 border-amber-100" },
    { value: "disgusto", label: "Disgusto", icon: "😖", tone: "bg-lime-50 text-lime-700 border-lime-100" },
    { value: "empatia", label: "Empatia", icon: "🤝", tone: "bg-pink-50 text-pink-700 border-pink-100" },
    { value: "confusion", label: "Confusion", icon: "🤔", tone: "bg-orange-50 text-orange-700 border-orange-100" },
    { value: "esperanza", label: "Esperanza", icon: "✨", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
];

const EMOTION_BY_VALUE = Object.fromEntries(EMOTIONS.map((emotion) => [emotion.value, emotion])) as Record<EmotionValue, typeof EMOTIONS[number]>;

function getCheckpointLabel(checkpoint: CheckpointInfo, index: number) {
    return `Checkpoint ${index}: ${checkpoint.title}`;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function normalizeEmotionMap(raw: unknown): EmotionMapData {
    const fallback: EmotionMapData = { byCheckpoint: {}, myEmotions: {} };
    if (!raw || typeof raw !== "object") return fallback;
    const data = raw as EmotionMapData;
    return {
        byCheckpoint: data.byCheckpoint || {},
        myEmotions: data.myEmotions || {},
    };
}

function useEmotionMap(clubId: string, clubBookId?: string | null) {
    const [data, setData] = React.useState<EmotionMapData>({ byCheckpoint: {}, myEmotions: {} });
    const [isLoading, setIsLoading] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!clubId || !clubBookId) return;
        setIsLoading(true);
        try {
            const nextData = await getClubCheckpointEmotionMap(clubId, clubBookId);
            setData(normalizeEmotionMap(nextData));
        } finally {
            setIsLoading(false);
        }
    }, [clubBookId, clubId]);

    React.useEffect(() => {
        load();
    }, [load]);

    return { data, isLoading, reload: load };
}

function EmotionBadge({ emotion, compact = false }: { emotion: EmotionValue; compact?: boolean }) {
    const meta = EMOTION_BY_VALUE[emotion];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.tone}`}>
            <span aria-hidden>{meta.icon}</span>
            {!compact && meta.label}
        </span>
    );
}

function getEmotionRoute(checkpoints: CheckpointInfo[], data: EmotionMapData) {
    return checkpoints.map((checkpoint, index) => {
        const checkpointIndex = index + 1;
        const summary = data.byCheckpoint[checkpointIndex];
        const dominant = summary?.dominantEmotion ? EMOTION_BY_VALUE[summary.dominantEmotion] : null;

        return {
            checkpoint,
            checkpointIndex,
            summary,
            dominant,
        };
    });
}

function EmotionRegistrationModal({
    isOpen,
    onClose,
    onSaved,
    context,
    existing,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    context: EmotionContext;
    existing?: EmotionMapData["myEmotions"][number];
}) {
    const params = useParams();
    const clubId = params.id as string;
    const [emotion, setEmotion] = React.useState<EmotionValue | null>(existing?.emotion || null);
    const [intensity, setIntensity] = React.useState(existing?.intensity || 3);
    const [note, setNote] = React.useState(existing?.note || "");
    const [isNotePublic, setIsNotePublic] = React.useState(existing?.isNotePublic ?? true);
    const [error, setError] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
        if (!isOpen) return;
        setEmotion(existing?.emotion || null);
        setIntensity(existing?.intensity || 3);
        setNote(existing?.note || "");
        setIsNotePublic(existing?.isNotePublic ?? true);
        setError(null);
    }, [existing, isOpen]);

    const handleSave = () => {
        if (!emotion) {
            setError("Elige una emocion para guardar tu registro.");
            return;
        }

        startTransition(async () => {
            const result = await saveCheckpointEmotion(clubId, {
                clubBookId: context.clubBookId,
                bookId: context.bookId,
                checkpointIndex: context.checkpointIndex,
                emotion,
                intensity,
                note,
                isNotePublic,
            });

            if (result?.error) {
                setError(result.error);
                return;
            }

            onSaved();
            onClose();
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Registrar emocion">
            <div className="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-bold text-teal-dark">{context.bookTitle || "Lectura del club"}</p>
                        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                            Checkpoint {context.checkpointIndex}
                        </span>
                    </div>
                    {context.bookAuthor && <p className="mt-1 text-sm text-grey/65">{context.bookAuthor}</p>}
                    <div className="mt-4 rounded-2xl bg-cream/70 p-4">
                        <h3 className="text-base font-bold text-teal-dark">{context.checkpoint.title}</h3>
                        <p className="mt-1 text-sm text-grey/65">
                            p. {context.checkpoint.start} - {context.checkpoint.end}
                        </p>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">
                        Que emociones sentiste al llegar a este punto?
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-grey/65">
                        Selecciona la emocion principal. Despues podras verla junto al pulso del club.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {EMOTIONS.map((item) => {
                            const selected = item.value === emotion;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setEmotion(item.value)}
                                    className={`rounded-2xl border px-3 py-4 text-center transition ${selected
                                        ? "border-teal bg-teal text-white shadow-sm"
                                        : "border-grey/15 bg-white text-grey-dark hover:border-teal/30"
                                        }`}
                                >
                                    <span className="block text-2xl" aria-hidden>{item.icon}</span>
                                    <span className="mt-2 block text-sm font-bold">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <label htmlFor="emotion-intensity" className="text-sm font-bold text-teal-dark">
                            Intensidad
                        </label>
                        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                            {intensity}/5
                        </span>
                    </div>
                    <input
                        id="emotion-intensity"
                        type="range"
                        min={1}
                        max={5}
                        value={intensity}
                        onChange={(event) => setIntensity(Number(event.target.value))}
                        className="mt-4 w-full accent-teal"
                    />
                    <div className="mt-1 flex justify-between text-[11px] font-medium text-grey/55">
                        <span>Leve</span>
                        <span>Moderada</span>
                        <span>Intensa</span>
                    </div>
                </div>

                <div>
                    <label htmlFor="emotion-note" className="text-sm font-bold text-teal-dark">
                        Nota adicional
                    </label>
                    <textarea
                        id="emotion-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        placeholder="Que escena o fragmento te hizo sentir asi?"
                        className="mt-2 w-full rounded-2xl border border-grey/15 bg-white px-4 py-3 text-sm text-grey-dark outline-none transition focus:border-teal"
                    />
                    <label className="mt-3 flex items-center gap-3 text-sm font-medium text-grey/70">
                        <input
                            type="checkbox"
                            checked={isNotePublic}
                            onChange={(event) => setIsNotePublic(event.target.checked)}
                            className="h-5 w-5 rounded border-grey/20 accent-teal"
                        />
                        Compartir mi nota con el club
                    </label>
                </div>

                {error && (
                    <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
                        {error}
                    </p>
                )}

                <div className="grid gap-3 border-t border-grey/10 pt-4 sm:grid-cols-[1fr_1.4fr]">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} isLoading={isPending} disabled={!emotion || isPending}>
                        Guardar registro
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function EmotionMapModal({
    isOpen,
    onClose,
    context,
    data,
    onOpenRegister,
}: {
    isOpen: boolean;
    onClose: () => void;
    context: EmotionContext;
    data: EmotionMapData;
    onOpenRegister: (checkpointIndex: number) => void;
}) {
    const [selectedCheckpointIndex, setSelectedCheckpointIndex] = React.useState(context.checkpointIndex);
    const [view, setView] = React.useState<"route" | "cards" | "summary">("route");
    const checkpoints = React.useMemo(
        () => context.checkpoints?.length ? context.checkpoints : [context.checkpoint],
        [context.checkpoint, context.checkpoints]
    );
    const selectedCheckpoint = checkpoints[selectedCheckpointIndex - 1] || context.checkpoint;
    const summary = data.byCheckpoint[selectedCheckpointIndex];
    const route = React.useMemo(() => getEmotionRoute(checkpoints, data), [checkpoints, data]);
    const registeredCheckpoints = route.filter((item) => item.summary?.total);
    const mostIntense = registeredCheckpoints
        .slice()
        .sort((a, b) => (b.summary?.averageIntensity || 0) - (a.summary?.averageIntensity || 0))[0];
    const mostParticipated = registeredCheckpoints
        .slice()
        .sort((a, b) => (b.summary?.total || 0) - (a.summary?.total || 0))[0];

    React.useEffect(() => {
        if (isOpen) setSelectedCheckpointIndex(context.checkpointIndex);
    }, [context.checkpointIndex, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Mapa emocional">
            <div className="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-2xl font-bold text-teal-dark">{context.bookTitle || "Lectura del club"}</p>
                        {context.bookAuthor && <p className="text-sm text-grey/65">{context.bookAuthor}</p>}
                    </div>
                    <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                        {summary?.total || 0} registros
                    </span>
                </div>

                <div className="grid rounded-2xl bg-grey/5 p-1 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => setView("route")}
                        className={`h-10 rounded-xl text-sm font-bold transition ${view === "route" ? "bg-teal text-white shadow-sm" : "text-grey/65"}`}
                    >
                        Recorrido
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("cards")}
                        className={`h-10 rounded-xl text-sm font-bold transition ${view === "cards" ? "bg-teal text-white shadow-sm" : "text-grey/65"}`}
                    >
                        Tarjetas
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("summary")}
                        className={`h-10 rounded-xl text-sm font-bold transition ${view === "summary" ? "bg-teal text-white shadow-sm" : "text-grey/65"}`}
                    >
                        Resumen
                    </button>
                </div>

                {view !== "route" && (
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                            Selecciona un checkpoint
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {checkpoints.map((checkpoint, index) => {
                                const checkpointIndex = index + 1;
                                const selected = selectedCheckpointIndex === checkpointIndex;

                                return (
                                    <button
                                        key={`${checkpoint.title}-${checkpointIndex}`}
                                        type="button"
                                        onClick={() => setSelectedCheckpointIndex(checkpointIndex)}
                                        className={`rounded-2xl border px-4 py-3 text-left transition ${selected
                                            ? "border-teal bg-teal/10 text-teal-dark"
                                            : "border-grey/15 bg-white text-grey-dark"
                                            }`}
                                    >
                                        <span className="block text-sm font-bold">{getCheckpointLabel(checkpoint, checkpointIndex)}</span>
                                        <span className="mt-0.5 block text-xs text-grey/55">
                                            p. {checkpoint.start} - {checkpoint.end}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {view === "route" ? (
                    <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-cream/70 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Punto mas intenso</p>
                                {mostIntense?.summary?.dominantEmotion ? (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-sm font-bold text-teal-dark">{getCheckpointLabel(mostIntense.checkpoint, mostIntense.checkpointIndex)}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <EmotionBadge emotion={mostIntense.summary.dominantEmotion} />
                                            <span className="text-xs font-bold text-grey/55">{mostIntense.summary.averageIntensity}/5</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm leading-6 text-grey/60">Aun no hay intensidad suficiente para leer el pulso.</p>
                                )}
                            </div>

                            <div className="rounded-2xl bg-cream/70 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Mas participacion</p>
                                {mostParticipated?.summary?.total ? (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-sm font-bold text-teal-dark">{getCheckpointLabel(mostParticipated.checkpoint, mostParticipated.checkpointIndex)}</p>
                                        <p className="text-xs font-bold text-grey/55">{mostParticipated.summary.total} registros del club</p>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm leading-6 text-grey/60">El recorrido se llenara cuando el club registre emociones.</p>
                                )}
                            </div>
                        </div>

                        <div className="relative space-y-3">
                            <div className="absolute bottom-8 left-5 top-8 w-px bg-teal/15" />
                            {route.map((item) => {
                                const isCurrent = item.checkpointIndex === context.checkpointIndex;
                                const hasData = !!item.summary?.total;

                                return (
                                    <button
                                        key={`${item.checkpoint.title}-${item.checkpointIndex}`}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCheckpointIndex(item.checkpointIndex);
                                            setView(hasData ? "summary" : "cards");
                                        }}
                                        className={`relative grid w-full grid-cols-[2.5rem_1fr] gap-3 rounded-2xl border p-3 text-left transition ${isCurrent
                                            ? "border-teal/30 bg-teal/5"
                                            : "border-grey/10 bg-white hover:border-teal/20"
                                            }`}
                                    >
                                        <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-sm ${hasData ? "border-white bg-white" : "border-grey/10 bg-grey/5 text-grey/40"}`}>
                                            {item.dominant?.icon || item.checkpointIndex}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-bold text-teal-dark">{getCheckpointLabel(item.checkpoint, item.checkpointIndex)}</p>
                                                {isCurrent && (
                                                    <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                                                        Actual
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-grey/55">
                                                p. {item.checkpoint.start} - {item.checkpoint.end}
                                            </p>
                                            {hasData && item.summary ? (
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {item.summary.dominantEmotion && <EmotionBadge emotion={item.summary.dominantEmotion} />}
                                                        <span className="text-xs font-bold text-grey/55">
                                                            {item.summary.total} registros - {item.summary.averageIntensity}/5
                                                        </span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-grey/10">
                                                        <div
                                                            className="h-full rounded-full bg-teal"
                                                            style={{ width: `${Math.min(100, Math.max(8, item.summary.averageIntensity * 20))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-grey/5 px-3 py-1 text-xs font-bold text-grey/45">
                                                        Sin registros
                                                    </span>
                                                    <span className="text-xs text-grey/45">Toca para registrar o revisar el tramo.</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : !summary?.total ? (
                    <div className="rounded-3xl border border-dashed border-grey/15 bg-cream/60 p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                            {EMOTION_BY_VALUE.asombro.icon}
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-teal-dark">Aun no hay registros</h4>
                        <p className="mt-2 text-sm leading-6 text-grey/65">
                            Cuando el club registre emociones para este tramo, apareceran aqui.
                        </p>
                        <Button type="button" className="mt-4" onClick={() => onOpenRegister(selectedCheckpointIndex)}>
                            Registrar mi emocion
                        </Button>
                    </div>
                ) : view === "cards" ? (
                    <div className="space-y-3">
                        {summary.records.map((record) => (
                            <div key={record.id} className="rounded-2xl border border-grey/10 bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-bold text-teal">
                                        {getInitials(record.user.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-bold text-teal-dark">{record.user.name}</p>
                                            {record.isMine && (
                                                <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                                                    Tu registro
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <EmotionBadge emotion={record.emotion} />
                                            <span className="text-xs font-bold text-grey/55">Intensidad {record.intensity}/5</span>
                                        </div>
                                        {record.note && (
                                            <p className="mt-3 text-sm leading-6 text-grey/70">{record.note}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-2xl bg-cream/70 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                                {getCheckpointLabel(selectedCheckpoint, selectedCheckpointIndex)}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <p className="text-lg font-bold text-teal-dark">
                                    Intensidad media {summary.averageIntensity}/5
                                </p>
                                {summary.dominantEmotion && <EmotionBadge emotion={summary.dominantEmotion} />}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {summary.distribution.map((item) => {
                                const meta = EMOTION_BY_VALUE[item.emotion];

                                return (
                                    <div key={item.emotion}>
                                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                            <span className="font-bold text-grey-dark">
                                                <span className="mr-1" aria-hidden>{meta.icon}</span>
                                                {meta.label}
                                            </span>
                                            <span className="text-xs font-bold text-grey/55">
                                                {item.count} - {item.percentage}%
                                            </span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-grey/10">
                                            <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(6, item.percentage)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!!summary?.total && (
                    <div className="border-t border-grey/10 pt-4">
                        <Button type="button" fullWidth onClick={() => onOpenRegister(selectedCheckpointIndex)}>
                            Registrar mi emocion
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function CheckpointEmotionActions({ context }: { context: EmotionContext }) {
    const params = useParams();
    const clubId = params.id as string;
    const { data, reload } = useEmotionMap(clubId, context.clubBookId);
    const [registerIndex, setRegisterIndex] = React.useState<number | null>(null);
    const [isMapOpen, setIsMapOpen] = React.useState(false);
    const activeContext = registerIndex && context.checkpoints?.[registerIndex - 1]
        ? { ...context, checkpointIndex: registerIndex, checkpoint: context.checkpoints[registerIndex - 1] }
        : context;

    return (
        <>
            <div className="rounded-2xl border border-teal/10 bg-teal/5 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                        <HeartPulse size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-teal-dark">Mapa emocional</h3>
                        <p className="mt-1 text-sm leading-6 text-grey/65">
                            Registra como te ha dejado este tramo y mira el pulso colectivo del club.
                        </p>
                    </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button type="button" size="sm" onClick={() => setRegisterIndex(context.checkpointIndex)}>
                        <SmilePlus size={16} className="mr-2" />
                        Registrar emocion
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsMapOpen(true)}>
                        <BarChart3 size={16} className="mr-2" />
                        Ver mapa
                    </Button>
                </div>
            </div>

            <EmotionRegistrationModal
                isOpen={registerIndex !== null}
                onClose={() => setRegisterIndex(null)}
                onSaved={reload}
                context={activeContext}
                existing={data.myEmotions[activeContext.checkpointIndex]}
            />
            <EmotionMapModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                context={context}
                data={data}
                onOpenRegister={(checkpointIndex) => {
                    setIsMapOpen(false);
                    setRegisterIndex(checkpointIndex);
                }}
            />
        </>
    );
}

export function EmotionPulseCard({ context }: { context: EmotionContext }) {
    const params = useParams();
    const clubId = params.id as string;
    const { data, isLoading, reload } = useEmotionMap(clubId, context.clubBookId);
    const [registerIndex, setRegisterIndex] = React.useState<number | null>(null);
    const [isMapOpen, setIsMapOpen] = React.useState(false);
    const summary = data.byCheckpoint[context.checkpointIndex];
    const dominant = summary?.dominantEmotion ? EMOTION_BY_VALUE[summary.dominantEmotion] : null;
    const myEmotion = data.myEmotions[context.checkpointIndex];
    const activeContext = registerIndex && context.checkpoints?.[registerIndex - 1]
        ? { ...context, checkpointIndex: registerIndex, checkpoint: context.checkpoints[registerIndex - 1] }
        : context;

    return (
        <>
            <Card className="rounded-2xl border-pink-100 bg-pink-50/40 shadow-none">
                <div className="flex h-full flex-col justify-between gap-4">
                    <div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pink-700 shadow-sm">
                            <HeartPulse size={18} />
                        </div>
                        <h3 className="mt-3 text-base font-bold text-teal-dark">Mapa emocional</h3>
                        <p className="mt-1 text-sm leading-6 text-grey/65">
                            {isLoading
                                ? "Cargando pulso del club..."
                                : dominant
                                    ? `El tramo se siente sobre todo como ${dominant.label.toLowerCase()}.`
                                    : "Registra como te esta haciendo sentir este checkpoint."}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {dominant ? (
                                <EmotionBadge emotion={dominant.value} />
                            ) : (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-grey/55">
                                    Sin registros aun
                                </span>
                            )}
                            {!!summary?.total && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-grey/55">
                                    {summary.total} lectores
                                </span>
                            )}
                            {myEmotion && (
                                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                                    Tu: {EMOTION_BY_VALUE[myEmotion.emotion].label}
                                </span>
                            )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <Button type="button" size="sm" onClick={() => setRegisterIndex(context.checkpointIndex)}>
                                Registrar
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setIsMapOpen(true)}>
                                Ver mapa
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <EmotionRegistrationModal
                isOpen={registerIndex !== null}
                onClose={() => setRegisterIndex(null)}
                onSaved={reload}
                context={activeContext}
                existing={data.myEmotions[activeContext.checkpointIndex]}
            />
            <EmotionMapModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                context={context}
                data={data}
                onOpenRegister={(checkpointIndex) => {
                    setIsMapOpen(false);
                    setRegisterIndex(checkpointIndex);
                }}
            />
        </>
    );
}

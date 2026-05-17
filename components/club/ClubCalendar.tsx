"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
    CalendarCheck,
    CalendarDays,
    Flag,
    MapPin,
    Megaphone,
    MessageSquare,
    Plus,
    Timer,
    Trash2,
    Trophy,
    Video,
    Vote,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
    createClubCalendarEvent,
    deleteClubCalendarEvent,
    getClubCalendarEvents,
} from "@/app/app/clubs/[id]/actions";

type CalendarEventType =
    | "checkpoint"
    | "discussion"
    | "vote_deadline"
    | "silent_session"
    | "final_meeting"
    | "announcement"
    | "other";

type CalendarFormat = "online" | "presencial" | "mixto";

interface ClubCalendarEvent {
    id: string;
    source: "calendar" | "announcement" | "checkpoint";
    title: string;
    description?: string | null;
    type: CalendarEventType;
    startsAt?: string | null;
    endsAt?: string | null;
    format?: CalendarFormat | null;
    location?: string | null;
    checkpointIndex?: number | null;
    createdAt?: string | null;
    canDelete?: boolean;
}

const EVENT_TYPES: Array<{
    value: CalendarEventType;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    className: string;
}> = [
    { value: "discussion", label: "Debate", shortLabel: "Debate", icon: MessageSquare, className: "bg-teal/10 text-teal" },
    { value: "silent_session", label: "Sesión silenciosa", shortLabel: "Sesión", icon: Timer, className: "bg-blue-50 text-blue-600" },
    { value: "checkpoint", label: "Cierre de checkpoint", shortLabel: "Checkpoint", icon: Flag, className: "bg-amber-50 text-amber-700" },
    { value: "vote_deadline", label: "Cierre de votación", shortLabel: "Votación", icon: Vote, className: "bg-coral/10 text-coral" },
    { value: "final_meeting", label: "Encuentro final", shortLabel: "Final", icon: Trophy, className: "bg-purple-50 text-purple-600" },
    { value: "announcement", label: "Aviso", shortLabel: "Aviso", icon: Megaphone, className: "bg-grey/10 text-grey/70" },
    { value: "other", label: "Otro evento", shortLabel: "Otro", icon: CalendarDays, className: "bg-grey/10 text-grey/70" },
];

const FILTERS: Array<{ value: "all" | CalendarEventType; label: string }> = [
    { value: "all", label: "Todo" },
    { value: "checkpoint", label: "Checkpoints" },
    { value: "discussion", label: "Debates" },
    { value: "silent_session", label: "Sesiones" },
    { value: "vote_deadline", label: "Votaciones" },
    { value: "announcement", label: "Avisos" },
];

function getTypeMeta(type: CalendarEventType) {
    return EVENT_TYPES.find((item) => item.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
}

function formatDay(date: string) {
    return new Date(date).toLocaleDateString("es-ES", { day: "numeric" });
}

function formatMonth(date: string) {
    return new Date(date).toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase();
}

function formatFullDate(date: string) {
    return new Date(date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function buildCalendarUrl(event: ClubCalendarEvent) {
    if (!event.startsAt) return "#";
    const start = new Date(event.startsAt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = event.endsAt ? new Date(event.endsAt) : new Date(event.startsAt);
    if (!event.endsAt) endDate.setMinutes(endDate.getMinutes() + 60);
    const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const text = encodeURIComponent(event.title);
    const details = event.description ? `&details=${encodeURIComponent(event.description)}` : "";
    const location = event.location ? `&location=${encodeURIComponent(event.location)}` : "";
    return `https://calendar.google.com/calendar/r/eventedit?text=${text}&dates=${start}/${end}${details}${location}`;
}

function localDateTimeToIso(date: string, time: string) {
    return new Date(`${date}T${time || "00:00"}:00`).toISOString();
}

function addMinutes(dateIso: string, minutes: number) {
    const end = new Date(dateIso);
    end.setMinutes(end.getMinutes() + minutes);
    return end.toISOString();
}

function EventCard({
    event,
    canManage,
    onDelete,
    nowMs,
}: {
    event: ClubCalendarEvent;
    canManage: boolean;
    onDelete: (event: ClubCalendarEvent) => void;
    nowMs: number;
}) {
    const meta = getTypeMeta(event.type);
    const Icon = meta.icon;
    const startsAt = event.startsAt || "";
    const isPast = !!startsAt && nowMs > 0 && new Date(startsAt).getTime() < nowMs;

    return (
        <Card className={`rounded-3xl ${isPast ? "bg-white/70" : "bg-white"}`}>
            <div className="flex gap-4">
                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-cream text-teal-dark">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-grey/45">{formatMonth(startsAt)}</span>
                    <span className="text-2xl font-bold leading-none">{formatDay(startsAt)}</span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
                            <Icon size={12} />
                            {meta.shortLabel}
                        </span>
                        {isPast && (
                            <span className="rounded-full bg-grey/10 px-2.5 py-1 text-[11px] font-bold text-grey/50">
                                Pasado
                            </span>
                        )}
                    </div>

                    <h3 className="mt-2 text-lg font-bold leading-tight text-teal-dark">{event.title}</h3>
                    {event.description && (
                        <p className="mt-1 text-sm leading-6 text-grey/65">{event.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-grey/55">
                        {event.startsAt && (
                            <>
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays size={14} />
                                    {formatFullDate(event.startsAt)}
                                </span>
                                <span>{formatTime(event.startsAt)}</span>
                            </>
                        )}
                        {event.format && (
                            <span className="inline-flex items-center gap-1.5">
                                {event.format === "online" ? <Video size={14} /> : <MapPin size={14} />}
                                {event.format === "online" ? "Online" : event.format === "presencial" ? "Presencial" : "Mixto"}
                            </span>
                        )}
                        {event.location && (
                            <span className="min-w-0 truncate">{event.location}</span>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        {event.startsAt && (
                            <a
                                href={buildCalendarUrl(event)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-teal transition hover:text-teal-dark"
                            >
                                Añadir a mi calendario
                            </a>
                        )}
                        {canManage && event.canDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(event)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-grey/45 transition hover:text-coral"
                            >
                                <Trash2 size={13} />
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

function NoticeCard({ event }: { event: ClubCalendarEvent }) {
    return (
        <Card className="rounded-3xl bg-white">
            <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-grey/10 text-teal">
                    <Megaphone size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-grey/10 px-2.5 py-1 text-[11px] font-bold text-grey/60">
                            Aviso sin fecha
                        </span>
                        {event.createdAt && (
                            <span className="text-xs font-medium text-grey/45">
                                {new Date(event.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-grey/70">{event.description || event.title}</p>
                </div>
            </div>
        </Card>
    );
}

function EventForm({
    isOpen,
    onClose,
    onSaved,
    clubId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    clubId: string;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [title, setTitle] = React.useState("");
    const [type, setType] = React.useState<CalendarEventType>("discussion");
    const [date, setDate] = React.useState(today);
    const [time, setTime] = React.useState("19:00");
    const [duration, setDuration] = React.useState("60");
    const [format, setFormat] = React.useState<CalendarFormat | "">("");
    const [location, setLocation] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) return;
        setTitle("");
        setType("discussion");
        setDate(today);
        setTime("19:00");
        setDuration("60");
        setFormat("");
        setLocation("");
        setDescription("");
        setErrorMessage("");
    }, [isOpen, today]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!title.trim() || !date || isSaving) return;

        setIsSaving(true);
        setErrorMessage("");

        const startsAt = localDateTimeToIso(date, time);
        const durationMinutes = Number.parseInt(duration, 10);
        const endsAt = Number.isFinite(durationMinutes) && durationMinutes > 0
            ? addMinutes(startsAt, durationMinutes)
            : null;

        const result = await createClubCalendarEvent(clubId, {
            title,
            description,
            type,
            startsAt,
            endsAt,
            format: format || null,
            location,
        });

        setIsSaving(false);

        if (result?.error) {
            setErrorMessage(result.error);
            return;
        }

        onSaved();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo evento" size="md" className="-translate-y-6 sm:translate-y-0">
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Título</span>
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ej. Debate del checkpoint 2"
                        className="h-12 w-full rounded-2xl border border-grey/10 px-4 text-sm outline-none focus:border-teal"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Tipo</span>
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value as CalendarEventType)}
                        className="h-12 w-full rounded-2xl border border-grey/10 bg-white px-4 text-sm font-bold text-grey-dark outline-none focus:border-teal"
                    >
                        {EVENT_TYPES.filter((item) => item.value !== "announcement").map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Fecha</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-grey/10 px-3 text-sm outline-none focus:border-teal"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Hora</span>
                        <input
                            type="time"
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-grey/10 px-3 text-sm outline-none focus:border-teal"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Duración</span>
                        <input
                            value={duration}
                            onChange={(event) => setDuration(event.target.value)}
                            inputMode="numeric"
                            placeholder="60"
                            className="h-12 w-full rounded-2xl border border-grey/10 px-4 text-sm outline-none focus:border-teal"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Formato</span>
                        <select
                            value={format}
                            onChange={(event) => setFormat(event.target.value as CalendarFormat | "")}
                            className="h-12 w-full rounded-2xl border border-grey/10 bg-white px-3 text-sm outline-none focus:border-teal"
                        >
                            <option value="">Sin definir</option>
                            <option value="online">Online</option>
                            <option value="presencial">Presencial</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Lugar o enlace</span>
                    <input
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Meet, Zoom, biblioteca..."
                        className="h-12 w-full rounded-2xl border border-grey/10 px-4 text-sm outline-none focus:border-teal"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Notas</span>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={3}
                        placeholder="Contexto para el club..."
                        className="w-full resize-none rounded-2xl border border-grey/10 px-4 py-3 text-sm outline-none focus:border-teal"
                    />
                </label>

                {errorMessage && (
                    <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{errorMessage}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={!title.trim() || !date || isSaving} className="w-full">
                        {isSaving ? "Guardando..." : "Crear evento"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export function ClubCalendar({ canManage = false }: { canManage?: boolean }) {
    const params = useParams();
    const clubId = params.id as string;
    const [events, setEvents] = React.useState<ClubCalendarEvent[]>([]);
    const [filter, setFilter] = React.useState<"all" | CalendarEventType>("all");
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [eventToDelete, setEventToDelete] = React.useState<ClubCalendarEvent | null>(null);
    const [deleteError, setDeleteError] = React.useState("");
    const [nowMs, setNowMs] = React.useState(0);

    const loadEvents = React.useCallback(async () => {
        setIsLoading(true);
        const result = await getClubCalendarEvents(clubId);
        setEvents(result as ClubCalendarEvent[]);
        setIsLoading(false);
    }, [clubId]);

    React.useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    React.useEffect(() => {
        setNowMs(Date.now());
    }, []);

    const filteredEvents = filter === "all"
        ? events
        : events.filter((event) => event.type === filter);
    const datedEvents = filteredEvents.filter((event) => !!event.startsAt);
    const notices = filteredEvents.filter((event) => event.type === "announcement" && !event.startsAt);
    const upcoming = datedEvents.filter((event) => !nowMs || new Date(event.startsAt as string).getTime() >= nowMs);
    const past = datedEvents.filter((event) => nowMs > 0 && new Date(event.startsAt as string).getTime() < nowMs).reverse();
    const nextEvent = events.find((event) => event.startsAt && (!nowMs || new Date(event.startsAt).getTime() >= nowMs));

    const handleDelete = async () => {
        if (!eventToDelete) return;
        setDeleteError("");
        const result = await deleteClubCalendarEvent(clubId, eventToDelete.id);
        if (result?.error) {
            setDeleteError(result.error);
            return;
        }
        setEventToDelete(null);
        loadEvents();
    };

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-grey/45">Cargando calendario...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-3xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-grey/40">Calendario del club</p>
                        <h2 className="mt-2 text-3xl font-bold leading-tight text-teal-dark">Agenda de lectura</h2>
                        <p className="mt-2 text-sm leading-6 text-grey/65">
                            Checkpoints, debates, sesiones y avisos importantes en un solo lugar.
                        </p>
                    </div>
                    {canManage && (
                        <Button type="button" onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                            <Plus size={17} className="mr-2" />
                            Nuevo evento
                        </Button>
                    )}
                </div>

                {nextEvent ? (
                    <div className="mt-5 rounded-2xl bg-teal/5 px-4 py-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                                <CalendarCheck size={20} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-grey/45">Próximo en agenda</p>
                                <p className="truncate text-sm font-bold text-teal-dark">{nextEvent.title}</p>
                                <p className="text-xs text-grey/55">{formatFullDate(nextEvent.startsAt as string)} · {formatTime(nextEvent.startsAt as string)}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-teal/15 px-4 py-5 text-sm text-grey/55">
                        Todavía no hay eventos futuros. Puedes programar el siguiente debate o sesión del club.
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {FILTERS.map((item) => {
                    const active = filter === item.value;
                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setFilter(item.value)}
                            className={`h-11 rounded-2xl border px-3 text-sm font-bold transition ${active
                                ? "border-teal bg-teal text-white shadow-sm"
                                : "border-grey/10 bg-white text-grey/60 hover:border-teal/30 hover:text-teal"
                                }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {upcoming.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">Próximos eventos</h3>
                    {upcoming.map((event) => (
                        <EventCard key={event.id} event={event} canManage={canManage} onDelete={setEventToDelete} nowMs={nowMs} />
                    ))}
                </section>
            )}

            {past.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">Histórico reciente</h3>
                    {past.slice(0, 6).map((event) => (
                        <EventCard key={event.id} event={event} canManage={canManage} onDelete={setEventToDelete} nowMs={nowMs} />
                    ))}
                </section>
            )}

            {notices.length > 0 && (
                <section className="space-y-3">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">Avisos del club</h3>
                        <p className="mt-1 text-sm text-grey/55">Mensajes importantes sin fecha concreta.</p>
                    </div>
                    {notices.map((event) => (
                        <NoticeCard key={event.id} event={event} />
                    ))}
                </section>
            )}

            {filteredEvents.length === 0 && (
                <div className="rounded-3xl border border-dashed border-teal/15 bg-white/60 px-5 py-10 text-center">
                    <CalendarDays className="mx-auto text-teal/35" size={34} />
                    <p className="mt-4 text-sm font-bold text-teal-dark">No hay eventos con este filtro</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey/55">
                        Cambia el filtro o crea el primer evento del calendario.
                    </p>
                </div>
            )}

            <EventForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSaved={loadEvents}
                clubId={clubId}
            />

            <Modal
                isOpen={!!eventToDelete}
                onClose={() => setEventToDelete(null)}
                title="Eliminar evento"
                size="sm"
            >
                <div className="space-y-5">
                    <p className="text-sm leading-6 text-grey/65">
                        Este evento se quitará del calendario del club. Los checkpoints y avisos generados automáticamente no se eliminan desde aquí.
                    </p>
                    {deleteError && (
                        <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{deleteError}</p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                        <Button type="button" variant="ghost" onClick={() => setEventToDelete(null)}>
                            <X size={16} className="mr-2" />
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

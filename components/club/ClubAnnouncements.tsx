"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
    getClubAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteClubPost,
} from "@/app/app/clubs/[id]/actions";
import { CalendarDays, Pencil, Trash2, Plus, Check, X, Megaphone, MapPin, Video } from "lucide-react";

interface Announcement {
    id: string;
    content: string;
    event_date: string | null;
    event_duration_minutes: number | null;
    event_format: 'online' | 'presencial' | null;
    event_location: string | null;
    created_at: string;
    updated_at?: string | null;
    author: { full_name: string; avatar_url: string | null; username: string | null } | null;
}

function formatEventDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
}

function formatEventDateShort(dateStr: string) {
    const d = new Date(dateStr);
    return { day: d.getDate(), month: d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() };
}

function getEventTime(dateStr: string) {
    const d = new Date(dateStr);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const t = `${h}:${m}`;
    return t !== '00:00' ? t : null;
}

function calendarUrl(ann: Announcement) {
    if (!ann.event_date) return '#';
    const iso = ann.event_date.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(ann.content.slice(0, 60));
    const location = ann.event_location ? `&location=${encodeURIComponent(ann.event_location)}` : '';
    return `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${iso}/${iso}${location}`;
}

function EventMeta({ ann }: { ann: Announcement }) {
    const time = ann.event_date ? getEventTime(ann.event_date) : null;
    const items: React.ReactNode[] = [];
    if (time) items.push(<span key="time">{time}h</span>);
    if (ann.event_duration_minutes) items.push(<span key="dur">{ann.event_duration_minutes} min</span>);
    if (ann.event_format) items.push(
        <span key="fmt" className="flex items-center gap-1">
            {ann.event_format === 'online'
                ? <><Video size={11} /> Online</>
                : <><MapPin size={11} /> Presencial</>
            }
        </span>
    );
    if (ann.event_location) items.push(
        ann.event_format === 'online'
            ? <a key="loc" href={ann.event_location} target="_blank" rel="noopener noreferrer" className="underline hover:text-teal truncate max-w-[180px]">{ann.event_location}</a>
            : <span key="loc" className="truncate max-w-[200px]">{ann.event_location}</span>
    );
    if (items.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-grey/60 mt-1">
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className="text-grey/30">·</span>}
                    {item}
                </React.Fragment>
            ))}
        </div>
    );
}

interface AnnouncementFormData {
    content: string;
    event_date?: string | null;
    event_duration_minutes?: number | null;
    event_format?: 'online' | 'presencial' | null;
    event_location?: string | null;
}

interface AnnouncementFormProps {
    initial?: AnnouncementFormData;
    onSave: (data: AnnouncementFormData) => Promise<void>;
    onCancel: () => void;
}

function AnnouncementForm({ initial, onSave, onCancel }: AnnouncementFormProps) {
    const [content, setContent] = React.useState(initial?.content || "");
    const [eventDate, setEventDate] = React.useState(initial?.event_date ? initial.event_date.slice(0, 10) : "");
    const [eventTime, setEventTime] = React.useState(() => {
        if (initial?.event_date) {
            const d = new Date(initial.event_date);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return "19:00";
    });
    const [duration, setDuration] = React.useState(initial?.event_duration_minutes?.toString() || "");
    const [format, setFormat] = React.useState<'online' | 'presencial' | ''>(initial?.event_format || "");
    const [location, setLocation] = React.useState(initial?.event_location || "");
    const [saving, setSaving] = React.useState(false);

    const isEvent = Boolean(eventDate);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setSaving(true);
        let isoDatetime: string | undefined;
        if (eventDate) {
            // Build datetime string with local timezone offset to avoid UTC conversion
            const localStr = `${eventDate}T${eventTime || "00:00"}:00`;
            const d = new Date(localStr);
            const offsetMin = d.getTimezoneOffset();
            const sign = offsetMin <= 0 ? '+' : '-';
            const absMin = Math.abs(offsetMin);
            const tzH = String(Math.floor(absMin / 60)).padStart(2, '0');
            const tzM = String(absMin % 60).padStart(2, '0');
            isoDatetime = `${localStr}${sign}${tzH}:${tzM}`;
        }
        await onSave({
            content: content.trim(),
            event_date: isoDatetime || null,
            event_duration_minutes: duration ? parseInt(duration) : null,
            event_format: (isEvent && format) ? format : null,
            event_location: (isEvent && location.trim()) ? location.trim() : null,
        });
        setSaving(false);
    };

    return (
        <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 space-y-4">
            {/* Content */}
            <div>
                <label className="block text-xs font-bold text-grey-dark mb-1">Mensaje</label>
                <textarea
                    className="w-full rounded-xl border border-grey/20 bg-white px-4 py-3 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 min-h-[80px] resize-none"
                    placeholder="Escribe el anuncio..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Date + Time */}
            <div>
                <label className="block text-xs font-bold text-grey-dark mb-1">
                    Fecha del evento <span className="text-grey/40 font-normal">(opcional)</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        className="flex-1 rounded-xl border border-grey/20 bg-white px-4 py-2.5 text-sm text-grey-dark focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                    />
                    <input
                        type="time"
                        value={eventTime}
                        onChange={e => setEventTime(e.target.value)}
                        disabled={!eventDate}
                        className="w-28 rounded-xl border border-grey/20 bg-white px-3 py-2.5 text-sm text-grey-dark focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20 disabled:opacity-40"
                    />
                </div>
            </div>

            {/* Event-only fields — visible only when date is set */}
            {isEvent && (
                <>
                    {/* Duration + Format */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-grey-dark mb-1">Duración (min)</label>
                            <input
                                type="number"
                                min="5"
                                step="5"
                                placeholder="60"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full rounded-xl border border-grey/20 bg-white px-4 py-2.5 text-sm text-grey-dark focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-grey-dark mb-1">Formato</label>
                            <select
                                value={format}
                                onChange={e => setFormat(e.target.value as 'online' | 'presencial' | '')}
                                className="w-full rounded-xl border border-grey/20 bg-white px-3 py-2.5 text-sm text-grey-dark focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                            >
                                <option value="">Sin especificar</option>
                                <option value="online">Online</option>
                                <option value="presencial">Presencial</option>
                            </select>
                        </div>
                    </div>

                    {/* Location / Link */}
                    <div>
                        <label className="block text-xs font-bold text-grey-dark mb-1">
                            {format === 'online' ? 'Enlace (Zoom, Meet, Teams…)' : format === 'presencial' ? 'Ubicación' : 'Ubicación o enlace'}
                        </label>
                        <input
                            type={format === 'online' ? 'url' : 'text'}
                            placeholder={format === 'online' ? 'https://zoom.us/j/…' : format === 'presencial' ? 'Calle, ciudad…' : 'Enlace o dirección'}
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full rounded-xl border border-grey/20 bg-white px-4 py-2.5 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                        />
                    </div>
                </>
            )}

            <div className="flex gap-2 pt-1">
                <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving || !content.trim()}>
                    <Check size={14} className="mr-1" /> {saving ? "Publicando..." : "Publicar"}
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    <X size={14} className="mr-1" /> Cancelar
                </Button>
            </div>
        </div>
    );
}

export function ClubAnnouncements({ club }: { club?: any }) {
    const params = useParams();
    const clubId = params.id as string;

    const isAdminOrMod = club?.userRole === 'admin' || club?.userRole === 'moderator';

    const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);

    const reload = async () => {
        setLoading(true);
        const data = await getClubAnnouncements(clubId);
        setAnnouncements(data as unknown as Announcement[]);
        setLoading(false);
    };

    React.useEffect(() => { reload(); }, [clubId]);

    const handleCreate = async (data: AnnouncementFormData) => {
        await createAnnouncement(
            clubId,
            data.content,
            data.event_date || undefined,
            data.event_duration_minutes || undefined,
            data.event_format || undefined,
            data.event_location || undefined
        );
        setShowForm(false);
        await reload();
    };

    const handleUpdate = async (id: string, data: AnnouncementFormData) => {
        await updateAnnouncement(
            id, clubId,
            data.content,
            data.event_date || undefined,
            data.event_duration_minutes || undefined,
            data.event_format || undefined,
            data.event_location || undefined
        );
        setEditingId(null);
        await reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este anuncio?")) return;
        await deleteClubPost(id, clubId);
        await reload();
    };

    const now = new Date();
    const upcoming = announcements.filter(a => a.event_date && new Date(a.event_date) >= now);
    const past = announcements.filter(a => !a.event_date || new Date(a.event_date) < now);

    if (loading) return <div className="py-12 text-center text-sm text-grey/40">Cargando anuncios...</div>;

    return (
        <div className="space-y-6">
            {isAdminOrMod && (
                <div className="flex justify-end">
                    <Button variant="primary" size="sm" className="whitespace-nowrap" onClick={() => { setShowForm(true); setEditingId(null); }}>
                        <Plus size={14} className="mr-1" /> Nuevo anuncio
                    </Button>
                </div>
            )}

            {showForm && (
                <AnnouncementForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
            )}

            {/* Upcoming events */}
            {upcoming.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-grey/40 uppercase tracking-widest pl-1">Próximos eventos</h4>
                    {upcoming.map(ann => {
                        const { day, month } = formatEventDateShort(ann.event_date!);
                        return editingId === ann.id ? (
                            <AnnouncementForm
                                key={ann.id}
                                initial={ann}
                                onSave={(d) => handleUpdate(ann.id, d)}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <Card key={ann.id} className="border-teal/15 bg-teal/5">
                                <div className="flex gap-4">
                                    <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-teal/10 border border-teal/20 text-teal-dark">
                                        <span className="text-[10px] font-bold uppercase">{month}</span>
                                        <span className="text-2xl font-bold leading-none">{day}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-teal font-bold mb-0.5">{formatEventDate(ann.event_date!)}</p>
                                        <p className="text-sm text-grey-dark leading-relaxed">{ann.content}</p>
                                        <EventMeta ann={ann} />
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => window.open(calendarUrl(ann), '_blank')}
                                                className="text-xs text-teal/70 hover:text-teal flex items-center gap-1 transition-colors"
                                            >
                                                <CalendarDays size={12} /> Añadir al calendario
                                            </button>
                                            {isAdminOrMod && (
                                                <div className="flex gap-2 ml-auto">
                                                    <button onClick={() => { setEditingId(ann.id); setShowForm(false); }} className="text-grey/40 hover:text-teal transition-colors"><Pencil size={13} /></button>
                                                    <button onClick={() => handleDelete(ann.id)} className="text-grey/40 hover:text-coral transition-colors"><Trash2 size={13} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* General / past announcements */}
            {past.length > 0 && (
                <div className="space-y-3">
                    {upcoming.length > 0 && (
                        <h4 className="text-xs font-bold text-grey/40 uppercase tracking-widest pl-1">Avisos generales</h4>
                    )}
                    {past.map(ann => (
                        editingId === ann.id ? (
                            <AnnouncementForm
                                key={ann.id}
                                initial={ann}
                                onSave={(d) => handleUpdate(ann.id, d)}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <Card key={ann.id} className="group">
                                <div className="flex gap-3">
                                    <div className="shrink-0 w-9 h-9 rounded-full bg-grey/10 flex items-center justify-center text-grey/40">
                                        <Megaphone size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-grey-dark">{ann.author?.full_name || "Moderador"}</span>
                                            <span className="text-[10px] text-grey/40">
                                                {new Date(ann.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                {ann.updated_at && ann.updated_at !== ann.created_at ? " · editado" : ""}
                                            </span>
                                        </div>
                                        <p className="text-sm text-grey-dark leading-relaxed">{ann.content}</p>
                                        <EventMeta ann={ann} />
                                        {ann.event_date && new Date(ann.event_date) < now && (
                                            <p className="text-[11px] text-grey/40 mt-1">
                                                📅 {formatEventDate(ann.event_date)} (pasado)
                                            </p>
                                        )}
                                    </div>
                                    {isAdminOrMod && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => { setEditingId(ann.id); setShowForm(false); }} className="text-grey/40 hover:text-teal transition-colors"><Pencil size={13} /></button>
                                            <button onClick={() => handleDelete(ann.id)} className="text-grey/40 hover:text-coral transition-colors"><Trash2 size={13} /></button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    ))}
                </div>
            )}

            {announcements.length === 0 && !showForm && (
                <div className="py-12 text-center space-y-2 border-2 border-dashed border-grey/10 rounded-xl">
                    <Megaphone className="w-8 h-8 text-grey/20 mx-auto" />
                    <p className="text-sm text-grey/50">El tablón está vacío.</p>
                    {isAdminOrMod && <p className="text-xs text-grey/40">Publica el primer anuncio con el botón de arriba.</p>}
                </div>
            )}
        </div>
    );
}

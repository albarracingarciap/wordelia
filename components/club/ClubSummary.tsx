import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { CheckpointDetailModal } from "./CheckpointDetailModal";
import { TabsContext } from "../ui/Tabs";
import { getClubAnnouncements, getClubStats } from "@/app/app/clubs/[id]/actions";
import { CalendarDays, Megaphone, Users, MessageSquare, Clock, CheckCircle2 } from "lucide-react";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string; // deadline ISO string e.g. "2026-02-23"
}

function getActiveCheckpoint(checkpoints: Checkpoint[]): { checkpoint: Checkpoint; index: number } | null {
    if (!checkpoints || checkpoints.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the first checkpoint whose deadline hasn't passed yet
    for (let i = 0; i < checkpoints.length; i++) {
        const chk = checkpoints[i];
        if (!chk.date) return { checkpoint: chk, index: i }; // No deadline → treat as active
        const deadline = new Date(chk.date);
        deadline.setHours(23, 59, 59, 999);
        if (deadline >= today) return { checkpoint: chk, index: i };
    }

    // All deadlines passed → show last one
    return { checkpoint: checkpoints[checkpoints.length - 1], index: checkpoints.length - 1 };
}

function formatDeadline(dateStr?: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `Vence: ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}`;
}

function StatCard({ icon, label, value, sub, color = 'teal', onClick }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    color?: 'teal' | 'coral' | 'amber';
    onClick?: () => void;
}) {
    const colors = {
        teal: 'bg-teal/5 text-teal border-teal/10',
        coral: 'bg-coral/5 text-coral border-coral/10',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`w-full text-left p-3 rounded-xl border ${colors[color]} ${onClick ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} transition-opacity`}
        >
            <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-[10px] uppercase font-bold tracking-wide">{label}</span></div>
            <p className="text-xl font-bold leading-none">{value}</p>
            {sub && <p className="text-[10px] mt-0.5 opacity-70">{sub}</p>}
        </button>
    );
}

export function ClubSummary({ club }: { club?: any }) {
    const params = useParams();
    const clubId = params.id as string;
    const [isCheckpointModalOpen, setIsCheckpointModalOpen] = React.useState(false);
    const [nextAnnouncement, setNextAnnouncement] = React.useState<any | null>(null);
    const [stats, setStats] = React.useState<any | null>(null);
    const tabsContext = React.useContext(TabsContext);
    const isAdminOrMod = club?.userRole === 'admin' || club?.userRole === 'moderator';

    const handleViewFullPlan = () => {
        if (tabsContext) tabsContext.onChange("checkpoints");
    };

    React.useEffect(() => {
        if (!clubId) return;
        getClubAnnouncements(clubId).then((all: any[]) => {
            const now = new Date();
            const upcoming = all
                .filter((a: any) => a.event_date && new Date(a.event_date) >= now)
                .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
            setNextAnnouncement(upcoming[0] || null);
        });
        getClubStats(clubId).then(setStats);
    }, [clubId]);

    // Compute active checkpoint from real data
    const checkpoints: Checkpoint[] = club?.currentBook?.checkpoints || [];
    const unitLabel = club?.currentBook?.pace_unit || "p.";
    const activeResult = getActiveCheckpoint(checkpoints);
    const activeCheckpoint = activeResult?.checkpoint || null;
    const activeIndex = activeResult?.index ?? 0;

    // Progress: e.g. start=1, end=45, unit is pages. Show range.
    const progressStart = activeCheckpoint?.start || "1";
    const progressEnd = activeCheckpoint?.end || "?";
    // We calculate progress as position in the checkpoint list (e.g. 1 of 5 = 20%)
    const progressPercent = checkpoints.length > 1
        ? Math.round(((activeIndex) / (checkpoints.length - 1)) * 100)
        : 50;

    const hasCheckpoints = checkpoints.length > 0;

    return (
        <div className="space-y-6">
            {/* Progress Card */}
            <Card className="border-l-4 border-l-teal">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-serif text-lg text-teal-dark font-bold">Dónde estamos</h3>
                        {hasCheckpoints ? (
                            <p className="text-sm text-grey/60">
                                Checkpoint {activeIndex + 1}: {activeCheckpoint?.title}
                            </p>
                        ) : (
                            <p className="text-sm text-grey/40 italic">Sin checkpoints definidos</p>
                        )}
                    </div>
                    {activeCheckpoint?.date && (
                        <span className="text-[10px] uppercase font-bold text-coral bg-coral/5 px-2 py-1 rounded">
                            {formatDeadline(activeCheckpoint.date)}
                        </span>
                    )}
                </div>

                {hasCheckpoints && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-grey mb-1">
                            <span>{unitLabel} {progressStart}</span>
                            <span className="font-bold text-teal">{unitLabel} {progressEnd}</span>
                        </div>
                        <div className="h-2 bg-grey/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(5, progressPercent)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-grey/40 mt-1 text-right">
                            Checkpoint {activeIndex + 1} de {checkpoints.length}
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    {hasCheckpoints && (
                        <Button size="sm" variant="primary" className="text-xs" onClick={() => setIsCheckpointModalOpen(true)}>
                            Ir al checkpoint
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs" onClick={handleViewFullPlan}>
                        Ver plan completo
                    </Button>
                </div>
            </Card>

            {activeCheckpoint && (
                <CheckpointDetailModal
                    isOpen={isCheckpointModalOpen}
                    onClose={() => setIsCheckpointModalOpen(false)}
                    checkpoint={{
                        title: `Checkpoint ${activeIndex + 1}: ${activeCheckpoint.title}`,
                        range: `${unitLabel} ${progressStart} - ${progressEnd}`,
                        deadline: activeCheckpoint.date
                            ? new Date(activeCheckpoint.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                            : undefined
                    }}
                />
            )}

            {/* ── Metrics section ── */}
            {stats && (
                <div>
                    <p className="text-[10px] font-bold text-grey/40 uppercase tracking-widest mb-3 pl-1">
                        {isAdminOrMod ? 'Salud del club' : 'Tu actividad'}
                    </p>
                    {isAdminOrMod ? (
                        // Admin view: club health
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={<Users size={15} />} label="Miembros" value={stats.memberCount} color="teal" />
                            <StatCard icon={<MessageSquare size={15} />} label="Posts esta semana" value={stats.postsThisWeek} color="teal" />
                            <StatCard
                                icon={<CheckCircle2 size={15} />}
                                label="Activos esta semana"
                                value={`${stats.activeThisWeek} / ${stats.memberCount}`}
                                sub={stats.memberCount > 0 ? `${Math.round((stats.activeThisWeek / stats.memberCount) * 100)}%` : '-'}
                                color="teal"
                            />
                            {stats.pendingCount > 0 && (
                                <StatCard
                                    icon={<Clock size={15} />}
                                    label="Solicitudes pendientes"
                                    value={stats.pendingCount}
                                    color="amber"
                                    onClick={() => tabsContext?.onChange('manage')}
                                />
                            )}
                        </div>
                    ) : (
                        // Member view: personal stats
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={<MessageSquare size={15} />} label="Mis posts esta semana" value={stats.myPostsThisWeek} color="teal" />
                            {activeCheckpoint?.date && (() => {
                                const days = Math.ceil((new Date(activeCheckpoint.date).getTime() - Date.now()) / 86400000);
                                const onTrack = stats.myPostsThisWeek > 0;
                                return (
                                    <StatCard
                                        icon={<Clock size={15} />}
                                        label="Días hasta el deadline"
                                        value={days > 0 ? `${days}d` : 'Vencido'}
                                        sub={onTrack ? '✓ Al día' : '⚠ Sin posts'}
                                        color={days <= 2 ? 'coral' : 'teal'}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {nextAnnouncement ? (
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100/50 text-orange-800 flex flex-col items-center justify-center border border-orange-200 shrink-0">
                            <span className="text-[9px] font-bold uppercase">
                                {new Date(nextAnnouncement.event_date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                            </span>
                            <span className="text-lg font-bold leading-none">
                                {new Date(nextAnnouncement.event_date).getDate()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-grey-dark text-sm">
                                {new Date(nextAnnouncement.event_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {(() => {
                                    const d = new Date(nextAnnouncement.event_date);
                                    const h = String(d.getHours()).padStart(2, '0');
                                    const m = String(d.getMinutes()).padStart(2, '0');
                                    const t = `${h}:${m}`;
                                    return t !== '00:00' ? ` · ${t}h` : '';
                                })()}
                            </h4>
                            <p className="text-xs text-grey/60 line-clamp-2">{nextAnnouncement.content}</p>
                            {/* Event meta */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-grey/50 mt-1">
                                {nextAnnouncement.event_duration_minutes && (
                                    <span>{nextAnnouncement.event_duration_minutes} min</span>
                                )}
                                {nextAnnouncement.event_format && (
                                    <span className="flex items-center gap-0.5">
                                        {nextAnnouncement.event_format === 'online' ? '💻 Online' : '📍 Presencial'}
                                    </span>
                                )}
                                {nextAnnouncement.event_location && (
                                    nextAnnouncement.event_format === 'online'
                                        ? <a href={nextAnnouncement.event_location} target="_blank" rel="noopener" className="underline hover:text-teal truncate max-w-[140px]">{nextAnnouncement.event_location}</a>
                                        : <span className="truncate max-w-[140px]">{nextAnnouncement.event_location}</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const iso = nextAnnouncement.event_date.replace(/[-:]/g, '').split('.')[0] + 'Z';
                                const title = encodeURIComponent(nextAnnouncement.content.slice(0, 60));
                                const loc = nextAnnouncement.event_location ? `&location=${encodeURIComponent(nextAnnouncement.event_location)}` : '';
                                window.open(`https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${iso}/${iso}${loc}`, '_blank');
                            }}
                            className="shrink-0 p-1.5 text-grey/30 hover:text-teal transition-colors"
                            title="Añadir al calendario"
                        >
                            <CalendarDays size={16} />
                        </button>
                    </div>
                </Card>
            ) : (
                <Card className="border-dashed border-grey/10">
                    <div className="flex items-center gap-3 text-grey/40">
                        <div className="w-10 h-10 rounded-xl bg-grey/5 flex items-center justify-center shrink-0">
                            <Megaphone size={16} />
                        </div>
                        <p className="text-sm italic">No hay eventos próximos anunciados.</p>
                    </div>
                </Card>
            )}

            {/* AI Tools */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-grey/40 uppercase tracking-widest pl-1">Recursos</h4>

                {[
                    { title: "ADN del libro", desc: "Temas, símbolos y voz narrativa.", color: "bg-purple-50 text-purple-700" },
                    { title: "Guía de discusión", desc: "Preguntas sugeridas para este tramo.", color: "bg-blue-50 text-blue-700" },
                    { title: "Mapa emocional", desc: "Visualiza la tensión y el ritmo.", color: "bg-pink-50 text-pink-700" },
                ].map((tool, i) => (
                    <button key={i} className="w-full flex items-center justify-between p-3 bg-white border border-black/5 rounded-xl hover:border-teal/30 hover:shadow-sm transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <div className="font-bold text-sm text-grey-dark">{tool.title}</div>
                                <div className="text-xs text-grey/60">{tool.desc}</div>
                            </div>
                        </div>
                        <svg className="w-4 h-4 text-grey/30 group-hover:text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                ))}
            </div>
        </div>
    );
}

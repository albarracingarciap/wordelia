import { useParams } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { CheckpointDetailModal } from "./CheckpointDetailModal";
import { TabsContext } from "../ui/Tabs";
import { getClubAnnouncements, getClubStats, getMyClubBookProgress, markCheckpointCompleted, markCheckpointPending } from "@/app/app/clubs/[id]/actions";
import { Activity, AlertTriangle, CalendarDays, Clock, HeartPulse, Megaphone, MessageSquare, ShieldAlert, Users, Dna, BookOpenText, ChevronRight } from "lucide-react";
import { bookAuthorName, bookAuthorLabel } from "@/lib/book-author";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string; // deadline ISO string e.g. "2026-02-23"
    questions?: string[];
}

interface ClubSummaryData {
    userRole?: string | null;
    currentBook?: {
        id?: string | null;
        pace_unit?: string | null;
        checkpoints?: Checkpoint[] | null;
        book?: {
            id?: string | null;
            title?: string | null;
            author?: { name?: string | null } | null;
            authors?: { name?: string | null } | null;
        } | null;
    } | null;
}

interface ClubAnnouncement {
    content: string;
    event_date?: string | null;
    event_duration_minutes?: number | null;
    event_format?: "online" | "presencial" | string | null;
    event_location?: string | null;
}

interface ClubStats {
    memberCount: number;
    postsThisWeek: number;
    repliesThisWeek: number;
    activeThisWeek: number;
    pendingCount: number;
    myPostsThisWeek: number;
    openReports: number;
    upcomingEvents: number;
    openPolls: number;
    emotionsThisWeek: number;
    emotionParticipantsThisWeek: number;
    currentCheckpointEmotionCount: number;
    activeCheckpointIndex: number | null;
    activeRate: number;
    emotionCoverage: number;
    healthScore: number;
    alerts: string[];
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

function HealthMetric({ icon, label, value, sub, tone = "teal", onClick }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    tone?: "teal" | "coral" | "amber" | "neutral";
    onClick?: () => void;
}) {
    const tones = {
        teal: "border-teal/10 bg-teal/5 text-teal",
        coral: "border-coral/15 bg-coral/5 text-coral",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        neutral: "border-grey/10 bg-grey/5 text-grey-dark",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={`rounded-2xl border p-3 text-left transition ${tones[tone]} ${onClick ? "hover:shadow-sm" : "cursor-default"}`}
        >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">
                {icon}
                {label}
            </div>
            <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
            {sub && <p className="mt-1 text-xs leading-5 opacity-70">{sub}</p>}
        </button>
    );
}

function ClubHealthPanel({
    stats,
    onManageMembers,
    onManageReports,
    onCalendar,
    onFeed,
}: {
    stats: ClubStats;
    onManageMembers: () => void;
    onManageReports: () => void;
    onCalendar: () => void;
    onFeed: () => void;
}) {
    const scoreTone = stats.healthScore >= 75 ? "teal" : stats.healthScore >= 50 ? "amber" : "coral";
    const scoreLabel = stats.healthScore >= 75 ? "Club sano" : stats.healthScore >= 50 ? "Necesita atencion" : "Riesgo de parada";
    const totalConversation = stats.postsThisWeek + stats.repliesThisWeek;

    return (
        <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-grey/45">Salud del club</p>
                    <h3 className="mt-1 text-xl font-bold text-teal-dark">{scoreLabel}</h3>
                    <p className="mt-1 text-sm leading-6 text-grey/65">
                        Lectura de actividad, participacion emocional, calendario y moderacion.
                    </p>
                </div>
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-lg font-bold ${scoreTone === "teal"
                    ? "border-teal/20 bg-teal/10 text-teal"
                    : scoreTone === "amber"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-coral/20 bg-coral/10 text-coral"
                    }`}
                >
                    {stats.healthScore}
                </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-grey/10">
                <div
                    className={`h-full rounded-full ${scoreTone === "teal" ? "bg-teal" : scoreTone === "amber" ? "bg-amber-500" : "bg-coral"}`}
                    style={{ width: `${stats.healthScore}%` }}
                />
            </div>

            {stats.alerts.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-amber-50 p-3 text-amber-800">
                    {stats.alerts.slice(0, 3).map((alert) => (
                        <div key={alert} className="flex items-start gap-2 text-sm font-medium leading-5">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                            <span>{alert}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <HealthMetric
                    icon={<Activity size={14} />}
                    label="Activos"
                    value={`${stats.activeThisWeek}/${stats.memberCount}`}
                    sub={`${stats.activeRate}% esta semana`}
                    tone={stats.activeRate >= 50 ? "teal" : "amber"}
                    onClick={onFeed}
                />
                <HealthMetric
                    icon={<MessageSquare size={14} />}
                    label="Conversacion"
                    value={totalConversation}
                    sub={`${stats.postsThisWeek} posts, ${stats.repliesThisWeek} respuestas`}
                    tone={totalConversation > 0 ? "teal" : "amber"}
                    onClick={onFeed}
                />
                <HealthMetric
                    icon={<HeartPulse size={14} />}
                    label="Emociones"
                    value={`${stats.currentCheckpointEmotionCount}/${stats.memberCount}`}
                    sub={stats.activeCheckpointIndex ? `Checkpoint ${stats.activeCheckpointIndex} - ${stats.emotionCoverage}%` : "Sin checkpoint activo"}
                    tone={stats.emotionCoverage >= 40 ? "teal" : "neutral"}
                />
                <HealthMetric
                    icon={<CalendarDays size={14} />}
                    label="Agenda"
                    value={stats.upcomingEvents}
                    sub="eventos proximos"
                    tone={stats.upcomingEvents > 0 ? "teal" : "neutral"}
                    onClick={onCalendar}
                />
                <HealthMetric
                    icon={<ShieldAlert size={14} />}
                    label="Reportes"
                    value={stats.openReports}
                    sub="abiertos o en revision"
                    tone={stats.openReports > 0 ? "coral" : "teal"}
                    onClick={stats.openReports > 0 ? onManageReports : undefined}
                />
                <HealthMetric
                    icon={<Users size={14} />}
                    label="Solicitudes"
                    value={stats.pendingCount}
                    sub={stats.openPolls > 0 ? `${stats.openPolls} votacion activa` : "miembros pendientes"}
                    tone={stats.pendingCount > 0 || stats.openPolls > 0 ? "amber" : "teal"}
                    onClick={stats.pendingCount > 0 ? onManageMembers : undefined}
                />
            </div>
        </Card>
    );
}

export function ClubSummary({ club }: { club?: ClubSummaryData }) {
    const params = useParams();
    const clubId = params.id as string;
    const [isCheckpointModalOpen, setIsCheckpointModalOpen] = React.useState(false);
    const [nextAnnouncement, setNextAnnouncement] = React.useState<ClubAnnouncement | null>(null);
    const [stats, setStats] = React.useState<ClubStats | null>(null);
    const [currentPage, setCurrentPage] = React.useState(0);
    const [now] = React.useState(() => Date.now());
    const tabsContext = React.useContext(TabsContext);
    const isAdminOrMod = club?.userRole === 'admin' || club?.userRole === 'moderator';
    // Libro actual del catálogo → recursos (guía/genoma). El acceso se controla en destino.
    const resourceBookId = club?.currentBook?.book?.id ?? null;

    const handleViewFullPlan = () => {
        if (tabsContext) tabsContext.onChange("checkpoints");
    };

    React.useEffect(() => {
        if (!clubId) return;
        getClubAnnouncements(clubId).then((all) => {
            const now = new Date();
            const upcoming = all
                .filter((announcement) => announcement.event_date && new Date(announcement.event_date) >= now)
                .sort((a, b) => new Date(a.event_date || "").getTime() - new Date(b.event_date || "").getTime());
            setNextAnnouncement(upcoming[0] || null);
        });
        getClubStats(clubId).then(setStats);
    }, [clubId]);

    // Compute active checkpoint from real data
    const checkpoints: Checkpoint[] = club?.currentBook?.checkpoints || [];
    const unitLabel = club?.currentBook?.pace_unit || "p.";
    const book = club?.currentBook?.book;
    const bookAuthor = bookAuthorName(book);
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

    React.useEffect(() => {
        if (!book?.id) {
            setCurrentPage(0);
            return;
        }

        let mounted = true;
        getMyClubBookProgress(book.id).then((progress) => {
            if (mounted) setCurrentPage(progress?.currentPage || 0);
        });

        return () => {
            mounted = false;
        };
    }, [book?.id]);

    const activeCheckpointEnd = Number.parseInt(String(activeCheckpoint?.end || ""), 10) || 0;
    const previousCheckpointEnd = activeIndex > 0
        ? Number.parseInt(String(checkpoints[activeIndex - 1]?.end || ""), 10) || 0
        : Math.max(0, (Number.parseInt(String(activeCheckpoint?.start || ""), 10) || 1) - 1);

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
                    onGoToConversation={() => tabsContext?.onChange("feed")}
                    isCompleted={activeCheckpointEnd > 0 && currentPage >= activeCheckpointEnd}
                    onComplete={async () => {
                        if (!book?.id || !activeCheckpointEnd) return { error: "No se ha encontrado la lectura activa." };
                        const result = await markCheckpointCompleted(clubId, book.id, activeCheckpointEnd);
                        if (result.success && typeof result.currentPage === "number") setCurrentPage(result.currentPage);
                        return result;
                    }}
                    onRevert={async () => {
                        if (!book?.id) return { error: "No se ha encontrado la lectura activa." };
                        const result = await markCheckpointPending(clubId, book.id, previousCheckpointEnd);
                        if (result.success && typeof result.currentPage === "number") setCurrentPage(result.currentPage);
                        return result;
                    }}
                    checkpoint={{
                        title: `Checkpoint ${activeIndex + 1}: ${activeCheckpoint.title}`,
                        range: `${unitLabel} ${progressStart} - ${progressEnd}`,
                        deadline: activeCheckpoint.date
                            ? new Date(activeCheckpoint.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                            : undefined,
                        questions: activeCheckpoint.questions || []
                    }}
                    emotionContext={club?.currentBook?.id && book?.id ? {
                        clubBookId: club.currentBook.id,
                        bookId: book.id,
                        bookTitle: book.title,
                        bookAuthor,
                        checkpoint: activeCheckpoint,
                        checkpointIndex: activeIndex + 1,
                        checkpoints,
                    } : undefined}
                />
            )}

            {/* ── Metrics section ── */}
            {stats && (
                <div>
                    <p className="text-[10px] font-bold text-grey/40 uppercase tracking-widest mb-3 pl-1">
                        {isAdminOrMod ? 'Salud del club' : 'Tu actividad'}
                    </p>
                    {isAdminOrMod ? (
                        <ClubHealthPanel
                            stats={stats}
                            onManageMembers={() => tabsContext?.onChange('manage')}
                            onManageReports={() => tabsContext?.onChange('manage')}
                            onCalendar={() => tabsContext?.onChange('announcements')}
                            onFeed={() => tabsContext?.onChange('feed')}
                        />
                    ) : (
                        // Member view: personal stats
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={<MessageSquare size={15} />} label="Mis posts esta semana" value={stats.myPostsThisWeek} color="teal" />
                            {activeCheckpoint?.date && (() => {
                                const days = Math.ceil((new Date(activeCheckpoint.date).getTime() - now) / 86400000);
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

            {nextAnnouncement?.event_date ? (
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
                                const iso = nextAnnouncement.event_date!.replace(/[-:]/g, '').split('.')[0] + 'Z';
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

            {/* Recursos del libro actual — enlaces reales (el acceso se controla en destino). */}
            {resourceBookId && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-grey/40 uppercase tracking-widest pl-1">Recursos del libro</h4>
                    {[
                        { title: "ADN del libro", desc: "Genoma literario: temas, símbolos y voz narrativa.", href: `/app/recursos/genomas/${resourceBookId}`, Icon: Dna, color: "bg-purple-50 text-purple-700" },
                        { title: "Guía de discusión", desc: "Preguntas para dinamizar la conversación.", href: `/app/recursos/guias/${resourceBookId}`, Icon: BookOpenText, color: "bg-blue-50 text-blue-700" },
                    ].map((tool) => (
                        <Link key={tool.href} href={tool.href} className="w-full flex items-center justify-between p-3 bg-white border border-black/5 rounded-xl hover:border-teal/30 hover:shadow-sm transition-all text-left group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                    <tool.Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-grey-dark">{tool.title}</div>
                                    <div className="text-xs text-grey/60">{tool.desc}</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-grey/30 group-hover:text-teal" />
                        </Link>
                    ))}
                    <p className="pl-1 text-xs text-grey/40">El mapa emocional lo tienes arriba, en esta misma sala.</p>
                </div>
            )}
        </div>
    );
}

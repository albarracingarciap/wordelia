"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
    Bell,
    CalendarDays,
    CheckCircle2,
    MessageSquare,
    Sparkles,
    Star,
    Trophy,
    Users,
} from "lucide-react";
import { getClubWeeklyDigest } from "@/app/app/clubs/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TabsContext } from "@/components/ui/Tabs";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string;
    questions?: string[];
}

interface ClubWeeklyDigestProps {
    currentBook?: {
        pace_unit?: string | null;
        checkpoints?: Checkpoint[] | null;
        book?: {
            title?: string | null;
        } | null;
    } | null;
}

interface WeeklyDigest {
    range: {
        from: string;
        to: string;
    };
    stats: {
        posts: number;
        replies: number;
        announcements: number;
        activeMembers: number;
        memberCount: number;
        reviews: number;
        closedPolls: number;
    };
    topContributors: Array<{
        userId: string;
        name: string;
        avatarUrl: string | null;
        contributions: number;
    }>;
    recentPosts: Array<{
        id: string;
        content: string;
        checkpointIndex?: number | null;
        createdAt: string;
        author: {
            name: string;
            avatarUrl: string | null;
        };
    }>;
    upcomingAnnouncements: Array<{
        id: string;
        content: string;
        eventDate?: string | null;
        format?: string | null;
        location?: string | null;
    }>;
    closedPolls: Array<{
        id: string;
        question: string;
        endedAt: string;
        totalVotes: number;
        winner: {
            text: string;
            votes: number;
        } | null;
    }>;
    recentReviews: Array<{
        id: string;
        rating: number;
        conclusion: string;
        highlight: string;
        createdAt: string;
        author: {
            name: string;
            avatarUrl: string | null;
        };
    }>;
}

function getActiveCheckpoint(checkpoints: Checkpoint[]) {
    if (!checkpoints.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let index = 0; index < checkpoints.length; index++) {
        const checkpoint = checkpoints[index];
        if (!checkpoint.date) return { checkpoint, index };

        const deadline = new Date(checkpoint.date);
        deadline.setHours(23, 59, 59, 999);
        if (deadline >= today) return { checkpoint, index };
    }

    return { checkpoint: checkpoints[checkpoints.length - 1], index: checkpoints.length - 1 };
}

function formatDigestRange(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return `${fromDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${toDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
}

function formatShortDate(date?: string | null) {
    if (!date) return "Sin fecha";
    return new Date(date).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "L";
}

function trimContent(content: string, max = 110) {
    const clean = content.replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-teal/10 bg-cream/70 p-3">
            <div className="flex items-center gap-2 text-teal">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold leading-none text-teal-dark">{value}</p>
        </div>
    );
}

export function ClubWeeklyDigest({ currentBook }: ClubWeeklyDigestProps) {
    const params = useParams();
    const clubId = params.id as string;
    const tabsContext = React.useContext(TabsContext);
    const [digest, setDigest] = React.useState<WeeklyDigest | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        if (!clubId) return;

        setIsLoading(true);
        getClubWeeklyDigest(clubId).then((data) => {
            if (!isMounted) return;
            setDigest(data as WeeklyDigest | null);
            setIsLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, [clubId]);

    const checkpoints = currentBook?.checkpoints || [];
    const active = getActiveCheckpoint(checkpoints);
    const activeCheckpoint = active?.checkpoint;
    const activityRatio = digest?.stats.memberCount
        ? Math.round((digest.stats.activeMembers / digest.stats.memberCount) * 100)
        : 0;
    const hasActivity = !!digest && (
        digest.stats.posts > 0 ||
        digest.stats.replies > 0 ||
        digest.stats.announcements > 0 ||
        digest.stats.reviews > 0 ||
        digest.stats.closedPolls > 0
    );

    return (
        <Card className="rounded-3xl border-teal/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-grey/45">Resumen semanal</p>
                    <h3 className="mt-1 text-2xl font-bold text-teal-dark">Pulso de la semana</h3>
                    <p className="mt-1 text-sm leading-6 text-grey/65">
                        Actividad, avances y próximos pasos del club en una sola vista.
                    </p>
                </div>
                {digest && (
                    <span className="rounded-full bg-teal/5 px-3 py-1 text-xs font-bold text-teal">
                        {formatDigestRange(digest.range.from, digest.range.to)}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="h-20 animate-pulse rounded-2xl bg-grey/10" />
                    ))}
                </div>
            ) : digest ? (
                <>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Metric icon={<MessageSquare size={16} />} label="Mensajes" value={digest.stats.posts + digest.stats.replies} />
                        <Metric icon={<Users size={16} />} label="Activos" value={`${digest.stats.activeMembers}/${digest.stats.memberCount}`} />
                        <Metric icon={<Bell size={16} />} label="Avisos" value={digest.stats.announcements} />
                        <Metric icon={<Star size={16} />} label="Reseñas" value={digest.stats.reviews} />
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                        <div className="rounded-2xl border border-teal/10 bg-teal/5 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                                    <Sparkles size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-teal-dark">Próximo paso</h4>
                                    {activeCheckpoint ? (
                                        <p className="mt-1 text-sm leading-6 text-grey/65">
                                            Seguir con <strong className="text-teal-dark">{activeCheckpoint.title}</strong>
                                            {" "}({currentBook?.pace_unit || "p."} {activeCheckpoint.start} - {activeCheckpoint.end}).
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm leading-6 text-grey/65">
                                            Definir o revisar el plan de lectura para que el grupo tenga una referencia clara.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="w-full bg-coral text-white hover:bg-coral/90"
                                    onClick={() => tabsContext?.onChange("feed")}
                                >
                                    Ir a conversación
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => tabsContext?.onChange("checkpoints")}
                                >
                                    Ver checkpoints
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-teal/10 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-bold text-teal-dark">Participación</h4>
                                <span className="text-xs font-bold text-teal">{activityRatio}% activos</span>
                            </div>
                            {digest.topContributors.length > 0 ? (
                                <div className="mt-3 space-y-2">
                                    {digest.topContributors.map((contributor) => (
                                        <div key={contributor.userId} className="flex items-center justify-between gap-3 rounded-xl bg-cream/70 px-3 py-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-bold text-teal">
                                                    {getInitials(contributor.name)}
                                                </div>
                                                <span className="truncate text-sm font-bold text-grey-dark">{contributor.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-grey/55">{contributor.contributions}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 text-sm leading-6 text-grey/55">
                                    Aún no hay actividad esta semana.
                                </p>
                            )}
                        </div>
                    </div>

                    {(digest.upcomingAnnouncements.length > 0 || digest.closedPolls.length > 0 || digest.recentPosts.length > 0 || !hasActivity) && (
                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                            <div className="rounded-2xl border border-grey/10 p-4">
                                <div className="flex items-center gap-2 text-teal-dark">
                                    <CalendarDays size={16} />
                                    <h4 className="font-bold">Agenda</h4>
                                </div>
                                {digest.upcomingAnnouncements.length > 0 ? (
                                    <div className="mt-3 space-y-3">
                                        {digest.upcomingAnnouncements.map((announcement) => (
                                            <div key={announcement.id}>
                                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">
                                                    {formatShortDate(announcement.eventDate)}
                                                </p>
                                                <p className="mt-1 text-sm leading-5 text-grey/70">{trimContent(announcement.content, 80)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm leading-6 text-grey/55">Sin avisos próximos.</p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-grey/10 p-4">
                                <div className="flex items-center gap-2 text-teal-dark">
                                    <Trophy size={16} />
                                    <h4 className="font-bold">Decisiones</h4>
                                </div>
                                {digest.closedPolls.length > 0 ? (
                                    <div className="mt-3 space-y-3">
                                        {digest.closedPolls.map((poll) => (
                                            <div key={poll.id}>
                                                <p className="text-sm font-bold text-grey-dark">{trimContent(poll.question, 72)}</p>
                                                <p className="mt-1 text-xs text-grey/60">
                                                    Ganó: <strong>{poll.winner?.text || "Sin votos"}</strong> · {poll.totalVotes} votos
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm leading-6 text-grey/55">Sin votaciones cerradas esta semana.</p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-grey/10 p-4">
                                <div className="flex items-center gap-2 text-teal-dark">
                                    <CheckCircle2 size={16} />
                                    <h4 className="font-bold">Último movimiento</h4>
                                </div>
                                {digest.recentPosts.length > 0 ? (
                                    <div className="mt-3 space-y-3">
                                        {digest.recentPosts.map((post) => (
                                            <div key={post.id}>
                                                <p className="text-xs font-bold text-teal">{post.author.name}</p>
                                                <p className="mt-1 text-sm leading-5 text-grey/70">{trimContent(post.content, 88)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm leading-6 text-grey/55">
                                        {hasActivity ? "La actividad reciente está en respuestas o avisos." : "Esta semana aún está tranquila."}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p className="mt-5 rounded-2xl border border-grey/10 bg-cream/70 p-4 text-sm leading-6 text-grey/60">
                    No se pudo cargar el resumen semanal.
                </p>
            )}
        </Card>
    );
}

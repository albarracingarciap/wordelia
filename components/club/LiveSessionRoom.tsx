"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Send, Users, Clock, Play, Square, ChevronLeft, ChevronRight, Radio, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";
import {
    sendSessionMessage,
    setSessionStatus,
    setSessionBlock,
    saveSessionSummary,
    type LiveSession,
    type SessionMessage,
} from "@/app/app/clubs/[id]/session-actions";

interface Me { id: string; name: string | null; avatar: string | null; }
interface PresenceUser { userId: string; name: string | null; avatar: string | null; }

function initials(name: string | null) {
    if (!name) return "·";
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function Avatar({ name, avatar, size = 32 }: { name: string | null; avatar: string | null; size?: number }) {
    if (avatar) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={avatar} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
    }
    return (
        <span className="flex items-center justify-center rounded-full bg-teal/10 text-[10px] font-bold text-teal" style={{ width: size, height: size }}>
            {initials(name)}
        </span>
    );
}

function fmtElapsed(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const mm = String(m).padStart(2, "0"), ss = String(sec).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function fmtWhen(iso: string) {
    return new Date(iso).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function LiveSessionRoom({
    clubId,
    initialSession,
    isManager,
    me,
    initialMessages,
}: {
    clubId: string;
    initialSession: LiveSession;
    isManager: boolean;
    me: Me;
    initialMessages: SessionMessage[];
}) {
    const [session, setSession] = React.useState<LiveSession>(initialSession);
    const [messages, setMessages] = React.useState<SessionMessage[]>(initialMessages);
    const [presence, setPresence] = React.useState<PresenceUser[]>([]);
    const [text, setText] = React.useState("");
    const [now, setNow] = React.useState(() => Date.now());
    const [summaryText, setSummaryText] = React.useState(initialSession.summary ?? "");
    const [savingSummary, setSavingSummary] = React.useState(false);

    const seenIds = React.useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
    const profileCache = React.useRef<Map<string, { name: string | null; avatar: string | null }>>((() => {
        const m = new Map<string, { name: string | null; avatar: string | null }>();
        for (const msg of initialMessages) m.set(msg.userId, { name: msg.authorName, avatar: msg.authorAvatar });
        m.set(me.id, { name: me.name, avatar: me.avatar });
        return m;
    })());
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const supabaseRef = React.useRef<ReturnType<typeof createClient> | null>(null);

    // Reloj (para el temporizador de la sesión en vivo).
    React.useEffect(() => {
        if (session.status !== "live") return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [session.status]);

    // Autoscroll al final al llegar mensajes.
    React.useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages.length]);

    // Realtime: mensajes nuevos + cambios de la sesión + presencia.
    React.useEffect(() => {
        const supabase = createClient();
        supabaseRef.current = supabase;
        const channel = supabase.channel(`session:${initialSession.id}`, { config: { presence: { key: me.id } } });

        const resolveAuthor = async (userId: string) => {
            const cached = profileCache.current.get(userId);
            if (cached) return cached;
            const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle();
            const info = { name: (data as any)?.full_name ?? null, avatar: (data as any)?.avatar_url ?? null };
            profileCache.current.set(userId, info);
            return info;
        };

        channel
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "club_session_messages", filter: `session_id=eq.${initialSession.id}` }, async (payload: any) => {
                const row = payload.new;
                if (!row || seenIds.current.has(row.id)) return;
                seenIds.current.add(row.id);
                const author = await resolveAuthor(row.user_id);
                setMessages((prev) => [...prev, { id: row.id, userId: row.user_id, content: row.content, createdAt: row.created_at, authorName: author.name, authorAvatar: author.avatar }]);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "club_live_sessions", filter: `id=eq.${initialSession.id}` }, (payload: any) => {
                const r = payload.new;
                if (!r) return;
                setSession((prev) => ({
                    ...prev,
                    title: r.title ?? prev.title,
                    status: r.status ?? prev.status,
                    currentBlock: r.current_block ?? prev.currentBlock,
                    startedAt: r.started_at ?? prev.startedAt,
                    endedAt: r.ended_at ?? prev.endedAt,
                    summary: r.summary ?? prev.summary,
                }));
            })
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState() as Record<string, any[]>;
                const users = new Map<string, PresenceUser>();
                for (const metas of Object.values(state)) {
                    for (const meta of metas) {
                        if (meta?.userId) users.set(meta.userId, { userId: meta.userId, name: meta.name ?? null, avatar: meta.avatar ?? null });
                    }
                }
                setPresence([...users.values()]);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({ userId: me.id, name: me.name, avatar: me.avatar });
                }
            });

        return () => { supabase.removeChannel(channel); };
    }, [initialSession.id, me.id, me.name, me.avatar]);

    const send = async () => {
        const t = text.trim();
        if (!t) return;
        setText("");
        const res = await sendSessionMessage(initialSession.id, t);
        if ("error" in res && res.error) {
            // Restaurar el texto si falla (p.ej. sesión no en vivo).
            setText(t);
        }
    };

    const agenda = session.agenda ?? [];
    const currentBlock = agenda[session.currentBlock] ?? null;
    const elapsed = session.startedAt ? now - new Date(session.startedAt).getTime() : 0;

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <Link href={`/app/clubs/${clubId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-grey/50 transition-colors hover:text-teal">
                <ArrowLeft className="h-4 w-4" /> Volver al club
            </Link>

            {/* Cabecera de la sesión */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {session.status === "live" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-white" /></span>
                                En vivo
                            </span>
                        )}
                        {session.status === "scheduled" && <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal">Programada</span>}
                        {session.status === "ended" && <span className="rounded-full bg-grey/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-grey/50">Finalizada</span>}
                    </div>
                    <h1 className="mt-1 font-serif text-2xl text-teal-dark md:text-3xl">{session.title}</h1>
                </div>
                {session.status === "live" && (
                    <div className="flex items-center gap-2 rounded-full border border-teal/15 bg-white px-3 py-1.5 text-sm font-semibold text-teal-dark">
                        <Clock className="h-4 w-4 text-teal" /> {fmtElapsed(elapsed)}
                    </div>
                )}
            </div>

            {/* Estado: PROGRAMADA (sala de espera) */}
            {session.status === "scheduled" && (
                <div className="rounded-2xl border border-teal/10 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal"><CalendarClock className="h-7 w-7" /></div>
                    <p className="text-sm text-grey/60">La sesión empieza</p>
                    <p className="mt-1 font-serif text-xl capitalize text-teal-dark">{fmtWhen(session.scheduledAt)}</p>
                    {agenda.length > 0 && (
                        <div className="mx-auto mt-6 max-w-md text-left">
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Agenda</p>
                            <ol className="space-y-1.5">
                                {agenda.map((b, i) => (
                                    <li key={i} className="flex items-center justify-between rounded-lg border border-teal/5 bg-cream/40 px-3 py-2 text-sm">
                                        <span className="text-teal-dark">{i + 1}. {b.title}</span>
                                        <span className="text-xs text-grey/50">{b.minutes} min</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                    <div className="mt-6">
                        {isManager ? (
                            <Button onClick={() => setSessionStatus(initialSession.id, "live")}>
                                <Play className="mr-2 h-4 w-4" /> Iniciar sesión
                            </Button>
                        ) : (
                            <p className="text-sm italic text-grey/50">Esperando a que el moderador inicie la sesión…</p>
                        )}
                    </div>
                </div>
            )}

            {/* Estado: EN VIVO */}
            {session.status === "live" && (
                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    {/* Chat */}
                    <div className="flex h-[65vh] flex-col rounded-2xl border border-teal/10 bg-white shadow-sm">
                        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                            {messages.length === 0 ? (
                                <p className="py-10 text-center text-sm text-grey/40">Abre la conversación con el primer mensaje.</p>
                            ) : messages.map((m) => {
                                const own = m.userId === me.id;
                                return (
                                    <div key={m.id} className={`flex gap-2.5 ${own ? "flex-row-reverse" : ""}`}>
                                        <Avatar name={m.authorName} avatar={m.authorAvatar} />
                                        <div className={`min-w-0 max-w-[75%] ${own ? "text-right" : ""}`}>
                                            <p className="text-[11px] text-grey/45">{own ? "Tú" : (m.authorName || "Miembro")}</p>
                                            <div className={`mt-0.5 inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${own ? "bg-teal text-white" : "bg-cream/70 text-grey-dark"}`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 border-t border-teal/10 p-3">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                                placeholder="Escribe un mensaje…"
                                className="flex-1 rounded-full border border-teal/15 bg-white px-4 py-2.5 text-sm focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15"
                            />
                            <button onClick={() => void send()} disabled={!text.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-white transition-colors hover:bg-teal-dark disabled:opacity-40">
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Lateral: presencia + agenda + controles */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-grey/40">
                                <Users className="h-3.5 w-3.5" /> En la sala ({presence.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {presence.map((p) => (
                                    <span key={p.userId} title={p.name || "Miembro"}><Avatar name={p.name} avatar={p.avatar} size={30} /></span>
                                ))}
                                {presence.length === 0 && <p className="text-xs text-grey/40">Nadie más por ahora.</p>}
                            </div>
                        </div>

                        {agenda.length > 0 && (
                            <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-grey/40"><Radio className="h-3.5 w-3.5" /> Agenda</p>
                                <ol className="space-y-1.5">
                                    {agenda.map((b, i) => (
                                        <li key={i} className={`rounded-lg px-3 py-2 text-sm ${i === session.currentBlock ? "border border-teal/30 bg-teal/5 font-semibold text-teal-dark" : "text-grey/60"}`}>
                                            <div className="flex items-center justify-between">
                                                <span>{i + 1}. {b.title}</span>
                                                <span className="text-xs text-grey/40">{b.minutes}m</span>
                                            </div>
                                            {i === session.currentBlock && currentBlock && <p className="mt-0.5 text-[11px] font-normal text-teal">Bloque actual</p>}
                                        </li>
                                    ))}
                                </ol>
                                {isManager && (
                                    <div className="mt-3 flex gap-2">
                                        <Button variant="outline" size="sm" disabled={session.currentBlock <= 0} onClick={() => setSessionBlock(initialSession.id, session.currentBlock - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                                        <Button variant="outline" size="sm" disabled={session.currentBlock >= agenda.length - 1} onClick={() => setSessionBlock(initialSession.id, session.currentBlock + 1)} className="flex-1">Siguiente bloque <ChevronRight className="ml-1 h-4 w-4" /></Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isManager && (
                            <Button variant="outline" fullWidth onClick={() => { if (confirm("¿Terminar la sesión para todos?")) void setSessionStatus(initialSession.id, "ended"); }} className="border-coral/30 text-coral hover:bg-coral/5">
                                <Square className="mr-2 h-4 w-4" /> Terminar sesión
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Estado: FINALIZADA (transcripción + resumen) */}
            {session.status === "ended" && (
                <div className="space-y-5">
                    <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
                        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-grey/40">Resumen</h2>
                        {isManager ? (
                            <div className="space-y-2">
                                <textarea
                                    value={summaryText}
                                    onChange={(e) => setSummaryText(e.target.value)}
                                    rows={4}
                                    placeholder="Escribe un resumen de la sesión: conclusiones, lo más comentado, próximos pasos…"
                                    className="w-full resize-y rounded-lg border border-teal/15 bg-white px-3 py-2 text-sm text-teal-dark focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15"
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" disabled={savingSummary} isLoading={savingSummary} onClick={async () => { setSavingSummary(true); await saveSessionSummary(initialSession.id, summaryText); setSavingSummary(false); }}>
                                        Guardar resumen
                                    </Button>
                                </div>
                            </div>
                        ) : session.summary ? (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-grey">{session.summary}</p>
                        ) : (
                            <p className="text-sm italic text-grey/40">El moderador aún no ha publicado un resumen.</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-grey/40">Transcripción ({messages.length})</h2>
                        {messages.length === 0 ? (
                            <p className="text-sm italic text-grey/40">No hubo mensajes en esta sesión.</p>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((m) => (
                                    <div key={m.id} className="flex gap-2.5">
                                        <Avatar name={m.authorName} avatar={m.authorAvatar} />
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-grey/45">{m.authorName || "Miembro"} · {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-grey-dark">{m.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen, Send, Loader2, Check, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    respondBuddyRead,
    updateBuddyProgress,
    finishBuddyRead,
    sendBuddyMessage,
    type BuddyRead,
    type BuddyMessage,
} from "@/app/app/lectura-pareja/actions";

function pct(page: number, total: number | null) {
    return total ? Math.min(100, Math.round((page / total) * 100)) : 0;
}

function Avatar({ name, avatar }: { name: string | null; avatar: string | null }) {
    if (avatar) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" />;
    }
    return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream text-[11px] font-bold text-teal-dark">{(name || "L").charAt(0).toUpperCase()}</span>;
}

export function BuddyReadRoom({ initialBuddy, initialMessages }: { initialBuddy: BuddyRead; initialMessages: BuddyMessage[] }) {
    const [buddy, setBuddy] = React.useState(initialBuddy);
    const [messages, setMessages] = React.useState(initialMessages);
    const [pageInput, setPageInput] = React.useState(String(initialBuddy.myPage || ""));
    const [text, setText] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages.length]);

    const total = buddy.book.pageCount;
    const isGuestInvite = buddy.status === "invited" && buddy.role === "guest";

    const saveProgress = async () => {
        const p = parseInt(pageInput, 10);
        if (isNaN(p)) return;
        setBuddy((b) => ({ ...b, myPage: Math.max(0, p) }));
        await updateBuddyProgress(buddy.id, p);
    };

    const respond = async (accept: boolean) => {
        setBusy(true);
        await respondBuddyRead(buddy.id, accept);
        setBusy(false);
        setBuddy((b) => ({ ...b, status: accept ? "active" : "declined" }));
    };

    const finish = async () => {
        if (!confirm("¿Marcar esta lectura como terminada?")) return;
        await finishBuddyRead(buddy.id);
        setBuddy((b) => ({ ...b, status: "finished" }));
    };

    const send = async () => {
        const t = text.trim();
        if (!t || busy) return;
        setText("");
        const res = await sendBuddyMessage(buddy.id, t);
        if ("message" in res) setMessages((m) => [...m, res.message]);
        else setText(t);
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            <Link href="/app/lectura-pareja" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-grey/50 hover:text-teal"><ArrowLeft className="h-4 w-4" /> Lecturas en pareja</Link>

            {/* Cabecera del libro */}
            <div className="flex gap-4 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-grey/10">
                    {buddy.book.coverUrl ? <Image src={buddy.book.coverUrl} alt="" fill className="object-cover" sizes="80px" /> : <div className="flex h-full w-full items-center justify-center text-grey/30"><BookOpen className="h-6 w-6" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-coral">Lectura en pareja</p>
                    <h1 className="mt-0.5 font-serif text-xl text-teal-dark">{buddy.book.title}</h1>
                    {buddy.book.author && <p className="text-sm text-grey/60">{buddy.book.author}</p>}
                    <p className="mt-2 text-sm text-grey/70">Con <span className="font-semibold text-teal-dark">{buddy.other.name || `@${buddy.other.username}`}</span></p>
                    {buddy.status === "finished" && <span className="mt-1 inline-block rounded-full bg-grey/10 px-2 py-0.5 text-[11px] font-bold text-grey/50">Terminada</span>}
                </div>
            </div>

            {/* Invitación pendiente (invitado) */}
            {isGuestInvite && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/25 bg-coral/5 p-4">
                    <p className="text-sm text-grey-dark"><b>{buddy.other.name || "Tu amigo"}</b> te invita a leer este libro juntos.</p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => respond(true)} disabled={busy}><Check className="mr-1 h-4 w-4" /> Aceptar</Button>
                        <Button size="sm" variant="ghost" onClick={() => respond(false)} disabled={busy}><X className="mr-1 h-4 w-4" /> Rechazar</Button>
                    </div>
                </div>
            )}

            {buddy.status === "invited" && buddy.role === "host" && (
                <p className="mt-4 rounded-2xl border border-teal/10 bg-cream/40 p-4 text-sm text-grey/60">Esperando a que <b>{buddy.other.name || `@${buddy.other.username}`}</b> acepte la invitación.</p>
            )}

            {/* Progreso + conversación (activa o terminada) */}
            {(buddy.status === "active" || buddy.status === "finished") && (
                <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-widest text-grey/40">Tu progreso</p>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-teal/10"><div className="h-full rounded-full bg-teal" style={{ width: `${pct(buddy.myPage, total)}%` }} /></div>
                            <div className="mt-2 flex items-center gap-2">
                                <input type="number" min={0} value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="w-24 rounded-lg border border-teal/15 bg-white px-2 py-1 text-sm focus:border-teal/40 focus:outline-none" />
                                <span className="text-xs text-grey/50">{total ? `/ ${total} págs` : "pág."}</span>
                                <button onClick={saveProgress} className="ml-auto rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal hover:bg-teal/20">Actualizar</button>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-teal/10 bg-cream/30 p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-grey/40">{buddy.other.name?.split(" ")[0] || "Tu amigo"}</p>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-teal/10"><div className="h-full rounded-full bg-coral" style={{ width: `${pct(buddy.otherPage, total)}%` }} /></div>
                            <p className="mt-2 text-xs text-grey/50">{total ? `Página ${buddy.otherPage} de ${total}` : `Página ${buddy.otherPage}`} · {pct(buddy.otherPage, total)}%</p>
                        </div>
                    </div>

                    {/* Hilo */}
                    <div className="mt-4 flex h-[50vh] flex-col rounded-2xl border border-teal/10 bg-white shadow-sm">
                        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                            {messages.length === 0 ? (
                                <p className="py-8 text-center text-sm text-grey/40">Vuestra conversación privada sobre el libro. ¡Abre tú!</p>
                            ) : messages.map((m) => {
                                const own = m.isMine;
                                return (
                                    <div key={m.id} className={`flex gap-2 ${own ? "flex-row-reverse" : ""}`}>
                                        <Avatar name={m.authorName} avatar={m.authorAvatar} />
                                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${own ? "bg-teal text-white" : "bg-cream/70 text-grey-dark"}`}>{m.content}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {buddy.status === "active" && (
                            <div className="flex items-center gap-2 border-t border-teal/10 p-3">
                                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }} placeholder="Comenta por dónde vas…" className="flex-1 rounded-full border border-teal/15 bg-white px-4 py-2.5 text-sm focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15" />
                                <button onClick={() => void send()} disabled={!text.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-white hover:bg-teal-dark disabled:opacity-40"><Send className="h-4 w-4" /></button>
                            </div>
                        )}
                    </div>

                    {buddy.status === "active" && (
                        <div className="mt-4 flex justify-center">
                            <button onClick={finish} className="inline-flex items-center gap-1.5 text-sm font-semibold text-grey/50 hover:text-coral"><Flag className="h-4 w-4" /> Marcar como terminada</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

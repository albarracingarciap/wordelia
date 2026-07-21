"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, BookOpen, Loader2, X, Check, ChevronRight, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SearchBookModal } from "@/components/club/management/SearchBookModal";
import type { BookSearchResult } from "@/lib/isbndb";
import { getMyBuddyReads, createBuddyRead, respondBuddyRead, type BuddyRead } from "@/app/app/lectura-pareja/actions";

function Cover({ url, className }: { url: string | null; className?: string }) {
    return (
        <div className={`relative shrink-0 overflow-hidden rounded-lg bg-grey/10 ${className}`}>
            {url ? <Image src={url} alt="" fill className="object-cover" sizes="48px" /> : <div className="flex h-full w-full items-center justify-center text-grey/30"><BookOpen className="h-5 w-5" /></div>}
        </div>
    );
}

export function BuddyReadsClient() {
    const [reads, setReads] = React.useState<BuddyRead[] | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [pickOpen, setPickOpen] = React.useState(false);
    const [book, setBook] = React.useState<BookSearchResult | null>(null);
    const [username, setUsername] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const refresh = React.useCallback(async () => { setReads(await getMyBuddyReads()); }, []);
    React.useEffect(() => { void refresh(); }, [refresh]);

    const submit = async () => {
        if (!book) { setError("Elige un libro."); return; }
        if (!username.trim()) { setError("Indica el @usuario del amigo."); return; }
        setBusy(true); setError(null);
        const res = await createBuddyRead(book, username);
        setBusy(false);
        if ("error" in res) { setError(res.error ?? "No se pudo crear la invitación."); return; }
        setModalOpen(false); setBook(null); setUsername("");
        await refresh();
    };

    const respond = async (id: string, accept: boolean) => {
        await respondBuddyRead(id, accept);
        await refresh();
    };

    if (reads === null) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal" /></div>;

    const invites = reads.filter((r) => r.status === "invited" && r.role === "guest");
    const sent = reads.filter((r) => r.status === "invited" && r.role === "host");
    const active = reads.filter((r) => r.status === "active");
    const finished = reads.filter((r) => r.status === "finished");

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                <Button onClick={() => { setError(null); setModalOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Nueva lectura en pareja</Button>
            </div>

            {invites.length > 0 && (
                <Section title="Invitaciones recibidas">
                    {invites.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-coral/20 bg-coral/5 p-3">
                            <Cover url={r.book.coverUrl} className="h-16 w-11" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-teal-dark">{r.book.title}</p>
                                <p className="text-xs text-grey/60"><b>{r.other.name || `@${r.other.username}`}</b> te invita a leerlo juntos</p>
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                                <button onClick={() => respond(r.id, true)} className="inline-flex items-center gap-1 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark"><Check className="h-3.5 w-3.5" /> Aceptar</button>
                                <button onClick={() => respond(r.id, false)} className="inline-flex items-center gap-1 rounded-full border border-grey/15 px-3 py-1.5 text-xs font-semibold text-grey/60 hover:text-coral"><X className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </Section>
            )}

            {active.length > 0 && (
                <Section title="En marcha">
                    {active.map((r) => <BuddyCard key={r.id} r={r} />)}
                </Section>
            )}

            {sent.length > 0 && (
                <Section title="Invitaciones enviadas">
                    {sent.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-teal/10 bg-white p-3 opacity-80">
                            <Cover url={r.book.coverUrl} className="h-16 w-11" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-teal-dark">{r.book.title}</p>
                                <p className="text-xs text-grey/50">Esperando a que <b>{r.other.name || `@${r.other.username}`}</b> acepte…</p>
                            </div>
                        </div>
                    ))}
                </Section>
            )}

            {finished.length > 0 && (
                <Section title="Terminadas">
                    {finished.map((r) => <BuddyCard key={r.id} r={r} muted />)}
                </Section>
            )}

            {reads.length === 0 && (
                <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/40"><Users className="h-6 w-6" /></div>
                    <p className="text-grey/70">Aún no tienes lecturas en pareja.</p>
                    <button onClick={() => setModalOpen(true)} className="mt-3 inline-flex text-sm font-semibold text-teal hover:text-coral">Invita a un amigo a leer contigo</button>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva lectura en pareja">
                <div className="space-y-4">
                    {book ? (
                        <div className="flex items-center gap-3 rounded-xl border border-teal/10 bg-cream/30 p-2.5">
                            <Cover url={book.cover_url} className="h-14 w-10" />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-teal-dark">{book.title}</span>
                            <button onClick={() => setBook(null)} className="text-grey/40 hover:text-coral"><X className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <button onClick={() => setPickOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-teal/25 py-4 text-sm font-semibold text-teal hover:bg-teal/5"><BookOpen className="h-4 w-4" /> Elegir libro</button>
                    )}
                    <Input label="Amigo (@usuario)" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@nombredeusuario" />
                    {error && <p className="text-sm font-medium text-coral">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={submit} disabled={busy || !book || !username.trim()} isLoading={busy}>Enviar invitación</Button>
                    </div>
                </div>
            </Modal>

            <SearchBookModal isOpen={pickOpen} onClose={() => setPickOpen(false)} onSelectBook={(b) => { setBook(b); setPickOpen(false); }} />
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-grey/40">{title}</h2>
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function BuddyCard({ r, muted }: { r: BuddyRead; muted?: boolean }) {
    const pct = (page: number) => (r.book.pageCount ? Math.min(100, Math.round((page / r.book.pageCount) * 100)) : 0);
    return (
        <Link href={`/app/lectura-pareja/${r.id}`} className={`flex items-center gap-3 rounded-2xl border border-teal/10 bg-white p-3 shadow-sm transition-colors hover:border-teal/25 ${muted ? "opacity-70" : ""}`}>
            <Cover url={r.book.coverUrl} className="h-16 w-11" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-teal-dark">{r.book.title}</p>
                <p className="text-xs text-grey/55">Con {r.other.name || `@${r.other.username}`}</p>
                {r.book.pageCount ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-grey/50">
                        <span>Tú {pct(r.myPage)}%</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-teal/10"><div className="h-full rounded-full bg-teal" style={{ width: `${pct(r.myPage)}%` }} /></div>
                        <span>· {r.other.name?.split(" ")[0] || "Amigo"} {pct(r.otherPage)}%</span>
                    </div>
                ) : null}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-grey/30" />
        </Link>
    );
}

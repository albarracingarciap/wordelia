"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Loader2, Check, CalendarClock, Users, Award, Plus, Clock, X, ChevronRight } from "lucide-react";
import { joinChallenge, type RetoItem, type MyProposal } from "./actions";
import { challengeGoalLabel } from "@/lib/challenges";
import { ProposeChallengeModal } from "@/components/retos/ProposeChallengeModal";

function formatRange(start: string | null, end: string | null) {
    const f = (d: string) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    if (start && end) return `${f(start)} – ${f(end)}`;
    if (end) return `Hasta el ${f(end)}`;
    if (start) return `Desde el ${f(start)}`;
    return "Sin fechas";
}

function RetoCard({ reto }: { reto: RetoItem }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const target = reto.goalTarget ?? 0;
    const pct = target > 0 ? Math.min(100, Math.round((reto.progress / target) * 100)) : 0;

    const join = async () => {
        setBusy(true); setError(null);
        const res = await joinChallenge(reto.id);
        setBusy(false);
        if ("error" in res && res.error) { setError(res.error); return; }
        router.refresh();
    };

    return (
        <div className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${reto.completed ? "border-teal/25" : "border-teal/10 hover:border-teal/25"}`}>
            <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${reto.completed ? "bg-teal text-white" : "bg-coral/10 text-coral"}`}>
                    <Trophy className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="font-serif text-lg font-bold leading-tight text-teal">
                                <Link href={`/app/retos/${reto.id}`} className="transition-colors hover:text-teal-dark hover:underline">{reto.title}</Link>
                            </h3>
                            <p className="mt-0.5 text-sm font-bold text-coral">{challengeGoalLabel(reto.goalType, reto.goalTarget, reto.goalGenre)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {reto.origin === "wordelia" ? (
                                <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">Wordelia</span>
                            ) : (
                                <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">Comunidad</span>
                            )}
                            {reto.completed && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2.5 py-1 text-xs font-bold text-white">
                                    <Check className="h-3.5 w-3.5" /> Completado
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {reto.description && <p className="mt-3 text-sm leading-relaxed text-grey/65 line-clamp-3">{reto.description}</p>}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-grey/50">
                <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatRange(reto.startDate, reto.endDate)}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {reto.participants} participante{reto.participants === 1 ? "" : "s"}</span>
                {reto.origin === "community" && reto.authorName && <span className="inline-flex items-center gap-1">· por {reto.authorName}</span>}
                {reto.rewardBadgeName && <span className="inline-flex items-center gap-1 font-semibold text-coral"><Award className="h-3.5 w-3.5" /> {reto.rewardBadgeName}</span>}
            </div>

            {reto.joined && !reto.completed && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-medium text-grey/55">
                        <span>Tu progreso</span>
                        <span className="font-bold text-teal">{reto.progress}/{target}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal/10">
                        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
                    </div>
                </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                {reto.completed ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal"><Trophy className="h-4 w-4" /> ¡Reto conseguido!</span>
                ) : reto.joined ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-sm font-bold text-teal"><Check className="h-4 w-4" /> Estás participando</span>
                ) : !reto.active ? (
                    <span className="text-sm text-grey/50">Reto finalizado</span>
                ) : (
                    <button
                        onClick={join}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#C25852] disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Unirme al reto
                    </button>
                )}
                <Link href={`/app/retos/${reto.id}`} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-teal transition-colors hover:text-teal-dark">
                    Ver reto <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
            {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
        </div>
    );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-3">
            <h2 className="font-serif text-xl font-bold text-teal">{title}</h2>
            {subtitle && <p className="text-sm text-grey/55">{subtitle}</p>}
        </div>
    );
}

function ProposalStatusBadge({ status }: { status: MyProposal["status"] }) {
    if (status === "approved") return <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal"><Check className="h-3.5 w-3.5" /> Aprobado</span>;
    if (status === "rejected") return <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral"><X className="h-3.5 w-3.5" /> Rechazado</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"><Clock className="h-3.5 w-3.5" /> En revisión</span>;
}

function MyProposalRow({ p }: { p: MyProposal }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal/10 bg-white px-4 py-3">
            <div className="min-w-0">
                <p className="truncate font-semibold text-teal">{p.title}</p>
                <p className="text-xs text-grey/55">{challengeGoalLabel(p.goalType, p.goalTarget, p.goalGenre)}</p>
            </div>
            <ProposalStatusBadge status={p.status} />
        </div>
    );
}

export default function RetosClient({ retos, myProposals = [] }: { retos: RetoItem[]; myProposals?: MyProposal[] }) {
    const [proposeOpen, setProposeOpen] = React.useState(false);
    const wordelia = retos.filter((r) => r.origin === "wordelia");
    const community = retos.filter((r) => r.origin === "community");
    const hasNothing = retos.length === 0 && myProposals.length === 0;

    return (
        <div className="space-y-9">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/15 bg-coral/5 px-5 py-4">
                <div>
                    <p className="font-serif text-base font-bold text-teal">¿Tienes una idea de reto?</p>
                    <p className="text-sm text-grey/60">Propón el tuyo y, si se aprueba, lo verá toda la comunidad.</p>
                </div>
                <button
                    onClick={() => setProposeOpen(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#C25852]"
                >
                    <Plus className="h-4 w-4" /> Proponer un reto
                </button>
            </div>

            {hasNothing ? (
                <div className="rounded-2xl border border-dashed border-teal/20 bg-cream/30 p-10 text-center">
                    <Trophy className="mx-auto mb-3 h-10 w-10 text-teal/30" />
                    <p className="text-sm text-muted-foreground">Todavía no hay retos activos. Vuelve pronto: iremos proponiendo nuevos retos de lectura.</p>
                </div>
            ) : (
                <>
                    {wordelia.length > 0 && (
                        <section>
                            <SectionHeader title="De Wordelia" subtitle="Retos propuestos por el equipo." />
                            <div className="grid gap-5 sm:grid-cols-2">
                                {wordelia.map((r) => <RetoCard key={r.id} reto={r} />)}
                            </div>
                        </section>
                    )}

                    {community.length > 0 && (
                        <section>
                            <SectionHeader title="De la comunidad" subtitle="Retos propuestos por otros lectores." />
                            <div className="grid gap-5 sm:grid-cols-2">
                                {community.map((r) => <RetoCard key={r.id} reto={r} />)}
                            </div>
                        </section>
                    )}

                    {myProposals.length > 0 && (
                        <section>
                            <SectionHeader title="Mis propuestas" subtitle="El estado de los retos que has enviado." />
                            <div className="space-y-2">
                                {myProposals.map((p) => <MyProposalRow key={p.id} p={p} />)}
                            </div>
                        </section>
                    )}
                </>
            )}

            <ProposeChallengeModal open={proposeOpen} onClose={() => setProposeOpen(false)} />
        </div>
    );
}

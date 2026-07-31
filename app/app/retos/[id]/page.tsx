import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, Users, CalendarClock, Award, Check, BookOpen, Target } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { challengeGoalLabel, isManualChallenge } from "@/lib/challenges";
import { getRetoDetail, type CountingBook, type ParticipantRow, type RetoItem } from "../actions";
import { JoinChallengeButton } from "@/components/retos/JoinChallengeButton";
import { ChallengeBooksManager } from "@/components/retos/ChallengeBooksManager";
import { ShareRetoButton } from "@/components/retos/ShareRetoButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Reto | Wordelia",
};

function formatRange(start: string | null, end: string | null) {
    const f = (d: string) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
    if (start && end) return `${f(start)} – ${f(end)}`;
    if (end) return `Hasta el ${f(end)}`;
    if (start) return `Desde el ${f(start)}`;
    return "Sin fechas";
}

function milestoneMessage(reto: RetoItem) {
    const target = reto.goalTarget ?? 0;
    if (reto.completed) return "¡Reto conseguido! Enhorabuena 🎉";
    if (target <= 0) return "";
    const remaining = Math.max(0, target - reto.progress);
    const pct = Math.round((reto.progress / target) * 100);
    if (reto.progress <= 0) return "Aún no has empezado. ¡Elige tu primer libro y a por ello!";
    if (pct >= 50) return `¡Ya vas por más de la mitad! Te queda${remaining === 1 ? "" : "n"} ${remaining} para completarlo.`;
    return `Buen comienzo. Te queda${remaining === 1 ? "" : "n"} ${remaining} para completar el reto.`;
}

function CountsHint({ goalType }: { goalType: string | null }) {
    const txt = goalType === "manual"
        ? "Tú eliges qué libros de tu biblioteca (de los que has leído) cuentan para este reto."
        : goalType === "pages"
            ? "Cuentan las páginas que registras en tus sesiones de lectura dentro de las fechas del reto."
            : goalType === "genre"
                ? "Cuentan los libros del género indicado que marcas como leídos dentro de las fechas del reto."
                : "Cuentan los libros que marcas como leídos dentro de las fechas del reto.";
    return <p className="text-sm text-grey/55">{txt}</p>;
}

function BookGrid({ books }: { books: CountingBook[] }) {
    return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6">
            {books.map((b) => (
                <Link
                    key={b.id}
                    href={`/app/libros/${b.id}`}
                    className="group relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-grey/10 bg-white shadow-sm transition-transform hover:-translate-y-1"
                    title={b.title}
                >
                    {b.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.coverUrl} alt={b.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="p-2 text-center">
                            <BookOpen className="mx-auto mb-2 h-7 w-7 text-teal/60" />
                            <span className="line-clamp-2 text-xs text-grey/70">{b.title}</span>
                        </div>
                    )}
                    {b.detail && (
                        <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{b.detail}</span>
                    )}
                </Link>
            ))}
        </div>
    );
}

function Leaderboard({ participants, target }: { participants: ParticipantRow[]; target: number }) {
    return (
        <ul className="divide-y divide-grey/10 rounded-2xl border border-teal/10 bg-white">
            {participants.map((p, i) => {
                const pct = target > 0 ? Math.min(100, Math.round((p.progress / target) * 100)) : 0;
                return (
                    <li key={p.userId} className={`flex items-center gap-3 px-4 py-3 ${p.isMe ? "bg-teal/5" : ""}`}>
                        <span className="w-5 shrink-0 text-center text-sm font-bold text-grey/40">{i + 1}</span>
                        <Avatar src={p.avatarUrl ?? undefined} alt={p.name} fallback={(p.name || "U").slice(0, 2)} size="sm" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-teal">{p.name}</span>
                                {p.isMe && <span className="rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal">Tú</span>}
                                {p.completed && <Check className="h-3.5 w-3.5 text-teal" />}
                            </div>
                            {target > 0 && (
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-teal/10">
                                    <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                                </div>
                            )}
                        </div>
                        <span className="shrink-0 text-sm font-bold text-teal">{p.progress}{target > 0 ? `/${target}` : ""}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default async function RetoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const detail = await getRetoDetail(id);
    if (!detail) notFound();

    const { reto, countingBooks, participants } = detail;
    const target = reto.goalTarget ?? 0;
    const pct = target > 0 ? Math.min(100, Math.round((reto.progress / target) * 100)) : 0;

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div className="flex items-center justify-between gap-3">
                <Link href="/app/retos" className="inline-flex items-center gap-1.5 text-sm font-medium text-grey/60 transition-colors hover:text-teal">
                    <ArrowLeft className="h-4 w-4" /> Volver a retos
                </Link>
                <ShareRetoButton challengeId={reto.id} />
            </div>

            {/* Cabecera */}
            <header className="rounded-2xl border border-teal/10 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${reto.completed ? "bg-teal text-white" : "bg-coral/10 text-coral"}`}>
                        <Trophy className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {reto.origin === "wordelia" ? (
                                <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">Wordelia</span>
                            ) : (
                                <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">Comunidad</span>
                            )}
                            {!reto.active && <span className="rounded-full bg-grey/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-grey/50">Finalizado</span>}
                        </div>
                        <h1 className="mt-1.5 font-serif text-2xl font-bold leading-tight text-teal">{reto.title}</h1>
                        <p className="mt-0.5 text-base font-bold text-coral">{challengeGoalLabel(reto.goalType, reto.goalTarget, reto.goalGenre)}</p>
                    </div>
                </div>

                {reto.description && <p className="mt-4 text-sm leading-relaxed text-grey/70">{reto.description}</p>}

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-grey/55">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatRange(reto.startDate, reto.endDate)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {reto.participants} participante{reto.participants === 1 ? "" : "s"}</span>
                    {reto.origin === "community" && reto.authorName && <span className="inline-flex items-center gap-1">· por {reto.authorName}</span>}
                    {reto.rewardBadgeName && <span className="inline-flex items-center gap-1 font-semibold text-coral"><Award className="h-3.5 w-3.5" /> {reto.rewardBadgeName}</span>}
                </div>
            </header>

            {/* Tu progreso */}
            <section className="rounded-2xl border border-teal/10 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-teal"><Target className="h-5 w-5" /> Tu progreso</h2>

                {reto.joined ? (
                    <>
                        <div className="mt-3 flex items-center justify-between text-sm font-medium text-grey/60">
                            <span>{reto.completed ? "Completado" : "Vas por"}</span>
                            <span className="font-bold text-teal">{reto.progress}{target > 0 ? `/${target}` : ""}</span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-teal/10">
                            <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-teal-dark">{milestoneMessage(reto)}</p>
                        {reto.completed && (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-teal"><Trophy className="h-4 w-4" /> ¡Reto conseguido!</p>
                                <ShareRetoButton challengeId={reto.id} label="Compartir logro" />
                            </div>
                        )}
                    </>
                ) : reto.active ? (
                    <div className="mt-3 space-y-3">
                        <p className="text-sm text-grey/65">Únete para seguir tu progreso desde tus lecturas{reto.rewardBadgeName ? " y ganar la insignia al completarlo" : ""}.</p>
                        <JoinChallengeButton challengeId={reto.id} />
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-grey/55">Este reto ya ha finalizado.</p>
                )}
            </section>

            {/* Tus libros que cuentan */}
            <section>
                <h2 className="font-serif text-lg font-bold text-teal">{isManualChallenge(reto.goalType) ? "Tus libros del reto" : "Tus libros que cuentan"}</h2>
                <CountsHint goalType={reto.goalType} />
                <div className="mt-4">
                    {isManualChallenge(reto.goalType) ? (
                        <ChallengeBooksManager challengeId={reto.id} target={target} initialBooks={countingBooks} />
                    ) : countingBooks.length > 0 ? (
                        <BookGrid books={countingBooks} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-teal/20 bg-cream/30 p-8 text-center">
                            <BookOpen className="mx-auto mb-2 h-8 w-8 text-teal/30" />
                            <p className="text-sm text-grey/60">Todavía no tienes lecturas que cuenten para este reto. ¡A por la primera!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Participantes */}
            <section>
                <h2 className="font-serif text-lg font-bold text-teal">Participantes</h2>
                <p className="text-sm text-grey/55">Quién más está en este reto y cómo va.</p>
                <div className="mt-4">
                    {participants.length > 0 ? (
                        <Leaderboard participants={participants} target={target} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-teal/20 bg-cream/30 p-8 text-center">
                            <Users className="mx-auto mb-2 h-8 w-8 text-teal/30" />
                            <p className="text-sm text-grey/60">Aún no hay participantes. ¡Sé el primero en unirte!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

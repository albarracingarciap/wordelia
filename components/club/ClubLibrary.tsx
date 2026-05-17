"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClubNextReadingRecommender } from "@/components/club/ClubNextReadingRecommender";

interface LibraryBook {
    id: string;
    status?: string | null;
    start_date?: string | null;
    target_date?: string | null;
    created_at?: string | null;
    book?: {
        id?: string | null;
        title?: string | null;
        cover_url?: string | null;
        author?: { name?: string | null } | null;
        authors?: { name?: string | null } | null;
    } | null;
}

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface PollHistoryItem {
    id: string;
    question: string;
    endedAt?: string | null;
    options: PollOption[];
    totalVotes: number;
    winner?: PollOption | null;
}

interface ActivePoll {
    id: string;
    question: string;
    options: PollOption[];
    totalVotes: number;
    isOpen: boolean;
}

interface ClubLibraryProps {
    books?: LibraryBook[];
    activePoll?: ActivePoll | null;
    pollHistory?: PollHistoryItem[];
    canCreatePoll?: boolean;
    onCreatePoll?: (question: string, options: string[]) => Promise<void>;
}

function getAuthor(book?: LibraryBook["book"]) {
    return book?.author?.name || book?.authors?.name || "Autor desconocido";
}

function normalizeTitle(title: string) {
    return title.trim().toLowerCase();
}

function formatDate(value?: string | null) {
    if (!value) return null;
    return new Date(value).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function BookTile({ item, label }: { item: LibraryBook; label: string }) {
    const book = item.book;
    if (!book?.title) return null;

    return (
        <article className="flex gap-4 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-grey/10">
                {book.cover_url ? (
                    <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="80px" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-grey/35">
                        <BookOpen size={24} />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1 py-1">
                <Badge variant={item.status === "current" ? "brand" : "outline"}>{label}</Badge>
                <h4 className="mt-2 text-lg font-bold leading-tight text-teal-dark">{book.title}</h4>
                <p className="mt-1 text-sm font-medium text-coral">{getAuthor(book)}</p>
                {(item.start_date || item.target_date || item.created_at) && (
                    <p className="mt-3 text-xs font-medium text-grey/45">
                        {item.status === "current" && item.start_date
                            ? `Desde ${formatDate(item.start_date)}`
                            : item.status === "planned" && item.target_date
                                ? `Objetivo ${formatDate(item.target_date)}`
                                : `Añadido ${formatDate(item.created_at)}`}
                    </p>
                )}
            </div>
        </article>
    );
}

function Section({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal/8 text-teal">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">{title}</h3>
                    <p className="text-sm text-grey/55">{subtitle}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

export function ClubLibrary({ books = [], activePoll, pollHistory = [], canCreatePoll = false, onCreatePoll }: ClubLibraryProps) {
    const activeBooks = books.filter((item) => item.status === "current");
    const readBooks = books.filter((item) => item.status === "completed" || item.status === "archived");
    const plannedBooks = books.filter((item) => item.status === "planned");
    const knownTitles = new Set(
        books
            .map((item) => item.book?.title)
            .filter(Boolean)
            .map((title) => normalizeTitle(title as string))
    );

    const activeCandidates = activePoll?.options || [];
    const historicalCandidates = pollHistory.flatMap((poll) =>
        poll.options.map((option) => ({
            ...option,
            pollQuestion: poll.question,
            totalVotes: poll.totalVotes,
            endedAt: poll.endedAt,
            isWinner: poll.winner?.id === option.id,
        }))
    );

    const votedCandidates = historicalCandidates.filter((option) => !knownTitles.has(normalizeTitle(option.text)));

    return (
        <div className="space-y-8">
            <Card className="rounded-3xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Biblioteca del club</p>
                        <h2 className="mt-2 text-2xl font-bold text-teal-dark">Memoria de lecturas</h2>
                        <p className="mt-2 text-sm leading-6 text-grey/65">
                            Libros actuales, leídos y candidatos que han pasado por las votaciones del club.
                        </p>
                    </div>
                    <div className="hidden rounded-2xl bg-cream px-4 py-3 text-center sm:block">
                        <p className="text-2xl font-bold text-teal-dark">{books.length + votedCandidates.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-grey/45">títulos</p>
                    </div>
                </div>
            </Card>

            <ClubNextReadingRecommender canCreatePoll={canCreatePoll} onCreatePoll={onCreatePoll} />

            <Section title="Actual" subtitle="La lectura que está moviendo la conversación ahora." icon={<BookOpen size={18} />}>
                {activeBooks.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {activeBooks.map((item) => <BookTile key={item.id} item={item} label="Leyendo" />)}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-dashed border-grey/15 bg-white/60 p-5 text-sm text-grey/50">
                        Todavía no hay una lectura activa.
                    </p>
                )}
            </Section>

            <Section title="Leídos" subtitle="El archivo de lecturas que el club ya ha trabajado." icon={<CheckCircle2 size={18} />}>
                {readBooks.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {readBooks.map((item) => <BookTile key={item.id} item={item} label="Leído" />)}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-dashed border-grey/15 bg-white/60 p-5 text-sm text-grey/50">
                        Aún no hay libros cerrados en el histórico.
                    </p>
                )}
            </Section>

            <Section title="Candidatos" subtitle="Opciones vivas o planificadas para próximas lecturas." icon={<Clock size={18} />}>
                <div className="grid gap-3 sm:grid-cols-2">
                    {plannedBooks.map((item) => <BookTile key={item.id} item={item} label="Candidato" />)}
                    {activeCandidates.map((option) => (
                        <article key={option.id} className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                            <Badge variant="brand">Votación abierta</Badge>
                            <h4 className="mt-3 text-lg font-bold leading-tight text-teal-dark">{option.text}</h4>
                            <p className="mt-2 text-sm text-grey/55">{option.votes} votos por ahora</p>
                        </article>
                    ))}
                    {!plannedBooks.length && !activeCandidates.length && (
                        <p className="rounded-2xl border border-dashed border-grey/15 bg-white/60 p-5 text-sm text-grey/50 sm:col-span-2">
                            No hay candidatos activos en este momento.
                        </p>
                    )}
                </div>
            </Section>

            <Section title="Votados" subtitle="Libros que estuvieron sobre la mesa aunque no sean lectura del club." icon={<Sparkles size={18} />}>
                {votedCandidates.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {votedCandidates.map((option) => {
                            const percentage = option.totalVotes > 0 ? Math.round((option.votes / option.totalVotes) * 100) : 0;

                            return (
                                <article key={`${option.id}-${option.pollQuestion}`} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <Badge variant={option.isWinner ? "brand" : "outline"}>
                                            {option.isWinner ? "Ganador" : "Votado"}
                                        </Badge>
                                        <span className="text-sm font-bold text-teal-dark">{percentage}%</span>
                                    </div>
                                    <h4 className="mt-3 text-lg font-bold leading-tight text-teal-dark">{option.text}</h4>
                                    <p className="mt-2 text-xs leading-5 text-grey/55">{option.pollQuestion}</p>
                                    <p className="mt-3 text-xs font-medium text-grey/45">
                                        {option.votes} votos {option.endedAt ? `- ${formatDate(option.endedAt)}` : ""}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-dashed border-grey/15 bg-white/60 p-5 text-sm text-grey/50">
                        Las votaciones cerradas aparecerán aquí como memoria del club.
                    </p>
                )}
            </Section>
        </div>
    );
}

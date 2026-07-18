"use client";

import Image from "next/image";
import * as React from "react";
import { BookOpen, CalendarDays, MessageSquare, Route, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TabsContext } from "@/components/ui/Tabs";
import { ClubSummary } from "@/components/club/ClubSummary";
import { ClubCollectiveReview } from "@/components/club/ClubCollectiveReview";
import { ClubWeeklyDigest } from "@/components/club/ClubWeeklyDigest";
import { EmotionPulseCard } from "@/components/club/ClubEmotionMap";
import { bookAuthorName, bookAuthorLabel } from "@/lib/book-author";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string;
    questions?: string[];
}

interface ClubReadingRoomProps {
    club?: {
        name?: string;
        userRole?: string | null;
        currentBook?: {
            id?: string | null;
            pace_unit?: string | null;
            cover_url?: string | null;
            checkpoints?: Checkpoint[] | null;
            book?: {
                id?: string | null;
                title?: string | null;
                cover_url?: string | null;
                page_count?: number | null;
                author?: { name?: string | null } | null;
                authors?: { name?: string | null } | null;
            } | null;
        } | null;
    };
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

function formatDate(date?: string) {
    if (!date) return "Sin fecha límite";
    return new Date(date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "short",
    });
}

export function ClubReadingRoom({ club }: ClubReadingRoomProps) {
    const tabsContext = React.useContext(TabsContext);
    const currentBook = club?.currentBook;
    const book = currentBook?.book;
    const cover = currentBook?.cover_url || book?.cover_url || null;
    const checkpoints = currentBook?.checkpoints || [];
    const active = getActiveCheckpoint(checkpoints);
    const unitLabel = currentBook?.pace_unit || "p.";
    const author = bookAuthorLabel(book);
    const progressPercent = checkpoints.length > 0 && active
        ? Math.max(8, Math.round(((active.index + 1) / checkpoints.length) * 100))
        : 0;

    if (!book) {
        return <ClubSummary club={club} />;
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-sm">
                <div className="relative bg-teal-dark px-5 py-7 text-white sm:px-7">
                    {cover && (
                        <Image
                            src={cover}
                            alt=""
                            fill
                            className="object-cover opacity-20 blur-xl"
                            sizes="(max-width: 768px) 100vw, 720px"
                        />
                    )}
                    <div className="absolute inset-0 bg-teal-dark/75" />

                    <div className="relative grid gap-6 sm:grid-cols-[8rem_1fr] sm:items-end">
                        <div className="mx-auto h-44 w-28 overflow-hidden rounded-2xl bg-white/10 shadow-2xl sm:mx-0 sm:h-48 sm:w-32">
                            {cover ? (
                                <Image
                                    src={cover}
                                    alt={book.title || "Portada"}
                                    width={160}
                                    height={240}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-white/50">
                                    <BookOpen size={34} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 text-center sm:text-left">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                Sala de lectura
                            </p>
                            <h2 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
                                {book.title}
                            </h2>
                            <p className="mt-2 text-base font-medium text-white/70">{author}</p>

                            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                                <Button
                                    type="button"
                                    onClick={() => tabsContext?.onChange("feed")}
                                    className="w-full bg-coral text-white hover:bg-coral/90 sm:w-auto"
                                >
                                    <MessageSquare size={17} className="mr-2" />
                                    Conversar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => tabsContext?.onChange("checkpoints")}
                                    className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
                                >
                                    <Route size={17} className="mr-2" />
                                    Ver plan
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 px-5 py-5 sm:px-7 md:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-2xl bg-cream/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">
                                    Ahora estamos en
                                </p>
                                <h3 className="mt-1 text-xl font-bold text-teal-dark">
                                    {active ? active.checkpoint.title : "Plan pendiente"}
                                </h3>
                            </div>
                            {active && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal shadow-sm">
                                    {active.index + 1}/{checkpoints.length}
                                </span>
                            )}
                        </div>

                        {active ? (
                            <>
                                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-grey/65">
                                    <span className="inline-flex items-center gap-1.5">
                                        <BookOpen size={15} />
                                        {unitLabel} {active.checkpoint.start} - {active.checkpoint.end}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays size={15} />
                                        {formatDate(active.checkpoint.date)}
                                    </span>
                                </div>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                                    <div className="h-full rounded-full bg-teal" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </>
                        ) : (
                            <p className="mt-3 text-sm leading-6 text-grey/65">
                                El club todavía no ha definido checkpoints para esta lectura.
                            </p>
                        )}
                    </div>

                    <Card className="rounded-2xl border-teal/10 bg-teal/5 shadow-none">
                        <div className="flex h-full flex-col justify-between gap-4">
                            <div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="mt-3 text-base font-bold text-teal-dark">Pulso del club</h3>
                                <p className="mt-1 text-sm leading-6 text-grey/65">
                                    Entra en la conversación, revisa el tramo actual y sigue el ritmo común sin perder el hilo.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => tabsContext?.onChange("announcements")}
                                className="justify-start px-0 text-teal"
                            >
                                Ver calendario
                            </Button>
                        </div>
                    </Card>

                    {active && currentBook?.id && book.id && (
                        <EmotionPulseCard
                            context={{
                                clubBookId: currentBook.id,
                                bookId: book.id,
                                bookTitle: book.title,
                                bookAuthor: author,
                                checkpoint: active.checkpoint,
                                checkpointIndex: active.index + 1,
                                checkpoints,
                            }}
                        />
                    )}
                </div>
            </section>

            <ClubCollectiveReview
                clubBookId={currentBook?.id}
                bookId={book.id}
                bookTitle={book.title}
            />

            <ClubWeeklyDigest currentBook={currentBook} />

            <ClubSummary club={club} />
        </div>
    );
}

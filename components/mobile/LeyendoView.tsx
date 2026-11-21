"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Flame, Monitor, Play, ScanLine, Search, Trophy, Users } from "lucide-react";
import type { CurrentBook } from "@/app/app/mi-lectura/actions";
import type { ReadingChallenge } from "@/app/app/mi-lectura/challenge-actions";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { QuickLogSheet } from "./QuickLogSheet";
import { formatElapsed, useReadingTimer } from "./ReadingTimerProvider";

interface LeyendoViewProps {
    books: CurrentBook[];
    streak: number;
    challenge: ReadingChallenge | null;
}

const ADD_SCAN_HREF = "/app/mi-lectura/nuevo?scan=1&from=/m";
const ADD_SEARCH_HREF = "/app/mi-lectura/nuevo?from=/m";

export function LeyendoView({ books, streak, challenge }: LeyendoViewProps) {
    const router = useRouter();
    const { timer, elapsedMs, start, pendingLog, clearPendingLog } = useReadingTimer();
    const [logging, setLogging] = React.useState<{ book: CurrentBook; minutes?: number } | null>(null);

    // Al parar el cronómetro, abrir el registro con los minutos ya puestos.
    React.useEffect(() => {
        if (!pendingLog) return;
        const book = books.find((b) => b.id === pendingLog.bookId);
        if (book) {
            setLogging({ book, minutes: pendingLog.minutes });
        } else {
            toast.error(`«${pendingLog.bookTitle}» ya no está en tus lecturas en curso.`);
        }
        clearPendingLog();
    }, [pendingLog, books, clearPendingLog]);

    const handleStartTimer = async (book: CurrentBook) => {
        if (timer && timer.bookId === book.id) return;
        if (timer) {
            const ok = await confirmDialog({
                title: "Ya hay una sesión en marcha",
                message: `Estás cronometrando «${timer.bookTitle}». Si empiezas con «${book.title}», se descartará sin registrar.`,
                confirmLabel: "Empezar de nuevo",
                tone: "danger",
            });
            if (!ok) return;
        }
        start({ bookId: book.id, bookTitle: book.title });
    };

    return (
        <div className="space-y-6">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold text-teal">Leyendo</h1>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal-dark shadow-sm ring-1 ring-teal/10">
                        <Flame className={`h-4 w-4 ${streak > 0 ? "text-coral" : "text-grey/35"}`} />
                        {streak > 0 ? `${streak} ${streak === 1 ? "día" : "días"} seguidos` : "Empieza tu racha hoy"}
                    </span>
                    <Link
                        href="/app/retos"
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal-dark shadow-sm ring-1 ring-teal/10"
                    >
                        <Trophy className="h-4 w-4 text-teal" />
                        {challenge?.target
                            ? `${challenge.booksRead}/${challenge.target} libros en ${challenge.year}`
                            : "Fija tu reto del año"}
                    </Link>
                </div>
            </header>

            {books.length === 0 ? (
                <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-teal/10">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-teal/40" />
                    <p className="text-lg font-bold text-teal-dark">No estás leyendo nada ahora mismo</p>
                    <p className="mt-1 text-sm text-grey/60">Escanea el código de barras del libro o búscalo por título.</p>
                    <div className="mt-5 grid grid-cols-1 gap-2">
                        <Link href={ADD_SCAN_HREF} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white">
                            <ScanLine className="h-5 w-5" /> Escanear libro
                        </Link>
                        <Link href={ADD_SEARCH_HREF} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-teal/15 font-semibold text-teal">
                            <Search className="h-5 w-5" /> Buscar libro
                        </Link>
                        <Link href="/app/mi-lectura/estanterias" className="mt-1 text-sm font-medium text-grey/60 underline-offset-2 active:underline">
                            Elegir de mi lista «Quiero leer»
                        </Link>
                    </div>
                </section>
            ) : (
                <section aria-label="Leyendo ahora">
                    <div className={books.length > 1 ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" : ""}>
                        {books.map((book) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                inCarousel={books.length > 1}
                                timerActive={timer?.bookId === book.id}
                                timerLabel={timer?.bookId === book.id ? formatElapsed(elapsedMs) : null}
                                onLog={() => setLogging({ book })}
                                onStartTimer={() => handleStartTimer(book)}
                            />
                        ))}
                    </div>
                    {books.length > 1 && (
                        <p className="mt-1 text-center text-xs text-grey/45">Desliza para ver tus {books.length} lecturas</p>
                    )}
                </section>
            )}

            {books.length > 0 && (
                <section className="grid grid-cols-2 gap-2">
                    <Link href={ADD_SCAN_HREF} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-teal shadow-sm ring-1 ring-teal/10">
                        <ScanLine className="h-5 w-5" /> Escanear
                    </Link>
                    <Link href={ADD_SEARCH_HREF} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-teal shadow-sm ring-1 ring-teal/10">
                        <Search className="h-5 w-5" /> Buscar libro
                    </Link>
                </section>
            )}

            <footer className="pt-2 text-center">
                <Link href="/app/mi-lectura" className="inline-flex items-center gap-1.5 text-sm font-medium text-grey/55">
                    <Monitor className="h-4 w-4" /> Ver versión completa
                </Link>
            </footer>

            {logging && (
                <QuickLogSheet
                    key={logging.book.id + (logging.minutes ?? "")}
                    book={logging.book}
                    initialMinutes={logging.minutes}
                    onClose={() => setLogging(null)}
                    onSaved={() => router.refresh()}
                />
            )}
        </div>
    );
}

interface BookCardProps {
    book: CurrentBook;
    inCarousel: boolean;
    timerActive: boolean;
    timerLabel: string | null;
    onLog: () => void;
    onStartTimer: () => void;
}

function BookCard({ book, inCarousel, timerActive, timerLabel, onLog, onStartTimer }: BookCardProps) {
    const percent = Math.max(0, Math.min(100, Math.round(book.progress.percent ?? 0)));

    return (
        <article className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-teal/10 ${inCarousel ? "w-[86%] shrink-0 snap-center" : ""}`}>
            <Link href={`/app/libros/${book.id}`} className="flex gap-4">
                <div className="relative h-28 w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-cream shadow-sm">
                    {book.coverUrl ? (
                        <Image src={book.coverUrl} alt="" fill className="object-cover" sizes="76px" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-teal/30">
                            <BookOpen className="h-7 w-7" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-lg font-bold leading-snug text-teal-dark">{book.title}</h2>
                    <p className="truncate text-sm text-coral">{book.author}</p>
                    {book.club && (
                        <p className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-teal/5 px-2 py-0.5 text-xs font-medium text-teal">
                            <Users className="h-3 w-3 shrink-0" />
                            <span className="truncate">{book.club.name}</span>
                        </p>
                    )}
                </div>
            </Link>

            <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-grey/70">{book.progress.label}</span>
                    <span className="font-bold text-teal">{percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-teal/10">
                    <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${percent}%` }} />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onLog}
                    className="h-12 rounded-2xl bg-teal font-bold text-white active:opacity-90"
                >
                    Registrar
                </button>
                <button
                    type="button"
                    onClick={onStartTimer}
                    disabled={timerActive}
                    className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl font-semibold ${timerActive ? "bg-coral/10 text-coral" : "border border-teal/15 text-teal active:bg-teal/5"}`}
                >
                    {timerActive ? (
                        <span className="font-mono tabular-nums">{timerLabel}</span>
                    ) : (
                        <>
                            <Play className="h-4 w-4 fill-current" /> Leer
                        </>
                    )}
                </button>
            </div>
        </article>
    );
}

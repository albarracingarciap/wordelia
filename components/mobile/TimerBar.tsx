"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Pause, Play, Square, X } from "lucide-react";
import { confirmDialog } from "@/components/ui/confirm";
import { formatElapsed, useReadingTimer } from "./ReadingTimerProvider";

// Barra fija sobre las pestañas mientras hay un cronómetro de lectura activo
// (o pausado). Visible en todas las pantallas de /m.
export function TimerBar() {
    const { timer, elapsedMs, pause, resume, stop, discard } = useReadingTimer();
    const router = useRouter();
    const pathname = usePathname();

    if (!timer) return null;

    const handleStop = () => {
        stop();
        // El registro se abre en Leyendo; si estamos en otra pestaña, vamos allí.
        if (pathname !== "/m") router.push("/m");
    };

    const handleDiscard = async () => {
        const ok = await confirmDialog({
            title: "¿Descartar esta sesión?",
            message: "Se perderá el tiempo cronometrado y no se registrará nada.",
            confirmLabel: "Descartar",
            tone: "danger",
        });
        if (ok) discard();
    };

    return (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-3 pb-2">
            <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-teal-dark px-4 py-2.5 text-white shadow-lg">
                <button
                    type="button"
                    onClick={handleDiscard}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-70 active:bg-white/15"
                    aria-label="Descartar sesión"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-xs opacity-75">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{timer.running ? "Leyendo" : "En pausa"} · {timer.bookTitle}</span>
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums leading-tight">{formatElapsed(elapsedMs)}</p>
                </div>
                <button
                    type="button"
                    onClick={timer.running ? pause : resume}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
                    aria-label={timer.running ? "Pausar" : "Reanudar"}
                >
                    {timer.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                    type="button"
                    onClick={handleStop}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-coral px-4 text-sm font-bold active:opacity-90"
                >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Parar
                </button>
            </div>
        </div>
    );
}

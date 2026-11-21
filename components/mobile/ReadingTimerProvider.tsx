"use client";

import * as React from "react";

// Cronómetro de lectura del shell móvil /m.
//
// A diferencia de ReadingTimerModal (que cuenta ticks con setInterval y se pierde
// si el navegador congela la pestaña), aquí guardamos MARCAS DE TIEMPO en
// localStorage: el tiempo transcurrido se calcula con Date.now(), así que sigue
// siendo correcto aunque el usuario bloquee el móvil, cambie de app o cierre la
// PWA mientras lee. El intervalo solo refresca lo que se pinta.

const STORAGE_KEY = "wordelia-reading-timer";

export interface TimerBook {
    bookId: string;
    bookTitle: string;
}

interface TimerState extends TimerBook {
    /** Momento (ms) en que arrancó el tramo actual; solo relevante si running. */
    segmentStartedAt: number;
    /** Tiempo acumulado (ms) de tramos anteriores (antes de cada pausa). */
    accumulatedMs: number;
    running: boolean;
}

/** Sesión que hay que registrar tras parar el cronómetro (la consume Leyendo). */
export interface PendingLog extends TimerBook {
    minutes: number;
}

interface ReadingTimerContextValue {
    timer: TimerState | null;
    elapsedMs: number;
    start: (book: TimerBook) => void;
    pause: () => void;
    resume: () => void;
    /** Para el cronómetro y deja la sesión pendiente de registrar. */
    stop: () => void;
    /** Descarta el cronómetro sin registrar nada. */
    discard: () => void;
    pendingLog: PendingLog | null;
    clearPendingLog: () => void;
}

const ReadingTimerContext = React.createContext<ReadingTimerContextValue | null>(null);

function readStored(): TimerState | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as TimerState;
        if (!parsed?.bookId || typeof parsed.accumulatedMs !== "number") return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeStored(state: TimerState | null) {
    try {
        if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* almacenamiento no disponible (modo privado): el cronómetro funciona en memoria */
    }
}

function computeElapsed(state: TimerState | null, now: number): number {
    if (!state) return 0;
    return state.accumulatedMs + (state.running ? Math.max(0, now - state.segmentStartedAt) : 0);
}

export function ReadingTimerProvider({ children }: { children: React.ReactNode }) {
    const [timer, setTimerState] = React.useState<TimerState | null>(null);
    const [now, setNow] = React.useState(() => Date.now());
    const [pendingLog, setPendingLog] = React.useState<PendingLog | null>(null);

    const setTimer = React.useCallback((next: TimerState | null) => {
        setTimerState(next);
        writeStored(next);
    }, []);

    // Restaurar al montar + sincronizar entre pestañas.
    React.useEffect(() => {
        setTimerState(readStored());
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) setTimerState(readStored());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Refresco visual cada segundo mientras corre, y al volver a primer plano.
    React.useEffect(() => {
        if (!timer?.running) return;
        setNow(Date.now());
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        const onVisible = () => {
            if (document.visibilityState === "visible") setNow(Date.now());
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [timer?.running]);

    const start = React.useCallback((book: TimerBook) => {
        setTimer({ ...book, segmentStartedAt: Date.now(), accumulatedMs: 0, running: true });
        setNow(Date.now());
    }, [setTimer]);

    const pause = React.useCallback(() => {
        setTimerState((current) => {
            if (!current || !current.running) return current;
            const next = { ...current, accumulatedMs: computeElapsed(current, Date.now()), running: false };
            writeStored(next);
            return next;
        });
    }, []);

    const resume = React.useCallback(() => {
        setTimerState((current) => {
            if (!current || current.running) return current;
            const next = { ...current, segmentStartedAt: Date.now(), running: true };
            writeStored(next);
            return next;
        });
        setNow(Date.now());
    }, []);

    const stop = React.useCallback(() => {
        const current = timer ?? readStored();
        if (!current) return;
        const minutes = Math.max(1, Math.round(computeElapsed(current, Date.now()) / 60000));
        setTimer(null);
        setPendingLog({ bookId: current.bookId, bookTitle: current.bookTitle, minutes });
    }, [timer, setTimer]);

    const discard = React.useCallback(() => setTimer(null), [setTimer]);
    const clearPendingLog = React.useCallback(() => setPendingLog(null), []);

    const value = React.useMemo<ReadingTimerContextValue>(() => ({
        timer,
        elapsedMs: computeElapsed(timer, now),
        start,
        pause,
        resume,
        stop,
        discard,
        pendingLog,
        clearPendingLog,
    }), [timer, now, start, pause, resume, stop, discard, pendingLog, clearPendingLog]);

    return <ReadingTimerContext.Provider value={value}>{children}</ReadingTimerContext.Provider>;
}

export function useReadingTimer(): ReadingTimerContextValue {
    const ctx = React.useContext(ReadingTimerContext);
    if (!ctx) throw new Error("useReadingTimer debe usarse dentro de <ReadingTimerProvider>");
    return ctx;
}

export function formatElapsed(ms: number): string {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

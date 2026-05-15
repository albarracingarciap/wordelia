"use client";

import * as React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Button } from "../ui/Button";

interface ReadingTimerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFinish: (durationMinutes: number) => void;
    bookTitle: string;
    initialDuration?: number;
}

const SESSION_DURATIONS = [
    { label: "Sin límite", value: 0 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
    { label: "20 min", value: 20 },
    { label: "25 min", value: 25 },
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "60 min", value: 60 },
];

function playSessionAlarm() {
    try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const now = audioContext.currentTime;

        [0, 0.28, 0.56].forEach((offset) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, now + offset);
            gain.gain.setValueAtTime(0.0001, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(now + offset);
            oscillator.stop(now + offset + 0.2);
        });
    } catch (error) {
        console.warn("No se pudo reproducir la alarma de lectura.", error);
    }
}

export function ReadingTimerModal({ isOpen, onClose, onFinish, bookTitle }: ReadingTimerModalProps) {
    const [seconds, setSeconds] = React.useState(0);
    const [isActive, setIsActive] = React.useState(false);
    const [hasStarted, setHasStarted] = React.useState(false);
    const [selectedMinutes, setSelectedMinutes] = React.useState(25);
    const [hasProgramFinished, setHasProgramFinished] = React.useState(false);
    const alarmShownRef = React.useRef(false);

    const targetSeconds = selectedMinutes > 0 ? selectedMinutes * 60 : 0;
    const remainingSeconds = targetSeconds > 0 ? Math.max(targetSeconds - seconds, 0) : null;
    const progress = targetSeconds > 0 ? Math.min((seconds / targetSeconds) * 100, 100) : 0;

    React.useEffect(() => {
        if (!isOpen || !isActive) return;

        const interval = window.setInterval(() => {
            setSeconds((currentSeconds) => currentSeconds + 1);
        }, 1000);

        return () => window.clearInterval(interval);
    }, [isOpen, isActive]);

    React.useEffect(() => {
        if (!isOpen) return;

        setSeconds(0);
        setIsActive(false);
        setHasStarted(false);
        setHasProgramFinished(false);
        alarmShownRef.current = false;
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen || targetSeconds === 0 || seconds < targetSeconds || alarmShownRef.current) return;

        alarmShownRef.current = true;
        setIsActive(false);
        setHasProgramFinished(true);
        playSessionAlarm();
        window.alert("La sesión programada de lectura ha terminado");
    }, [isOpen, seconds, targetSeconds]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleStart = () => {
        setHasStarted(true);
        setHasProgramFinished(false);
        setIsActive(true);
    };

    const handleDurationChange = (value: number) => {
        setSelectedMinutes(value);
        setHasProgramFinished(false);
        alarmShownRef.current = false;
    };

    const handleFinish = () => {
        const durationMinutes = Math.max(1, Math.ceil(seconds / 60));
        setIsActive(false);
        onFinish(durationMinutes);
    };

    const handleCancel = () => {
        setIsActive(false);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={handleCancel}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-teal-dark/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-t-[1.75rem] border border-teal/10 bg-white p-6 text-left align-middle shadow-xl transition-all sm:rounded-2xl sm:p-8">
                                <div className="text-center">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">
                                        Leyendo ahora
                                    </p>
                                    <Dialog.Title as="h3" className="mb-5 text-2xl font-bold text-teal">
                                        {bookTitle}
                                    </Dialog.Title>

                                    <div className="mb-5 rounded-2xl border border-teal/10 bg-cream/30 p-3 text-left">
                                        <label htmlFor="session-duration" className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">
                                            Duración programada
                                        </label>
                                        <select
                                            id="session-duration"
                                            value={selectedMinutes}
                                            onChange={(event) => handleDurationChange(Number(event.target.value))}
                                            disabled={isActive}
                                            className="h-11 w-full rounded-xl border border-teal/10 bg-white px-4 text-sm font-medium text-teal-dark outline-none transition-all focus:border-teal/30 focus:ring-2 focus:ring-teal/10 disabled:opacity-60"
                                        >
                                            {SESSION_DURATIONS.map((duration) => (
                                                <option key={duration.value} value={duration.value}>
                                                    {duration.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-4 font-mono text-6xl font-medium tracking-tight text-teal-dark tabular-nums">
                                        {formatTime(seconds)}
                                    </div>

                                    {remainingSeconds !== null && (
                                        <div className="mb-6 space-y-2">
                                            <div className="h-2 overflow-hidden rounded-full bg-teal/10">
                                                <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} />
                                            </div>
                                            <p className="text-xs font-medium text-grey/60">
                                                {hasProgramFinished ? "Tiempo cumplido" : `Quedan ${formatTime(remainingSeconds)}`}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mb-5 flex justify-center gap-3">
                                        {!hasStarted ? (
                                            <Button type="button" className="h-12 min-w-36 px-8 text-base" onClick={handleStart}>
                                                Iniciar
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="h-12 min-w-36 justify-center px-8 text-base"
                                                onClick={() => setIsActive((current) => !current)}
                                            >
                                                {isActive ? "Pausar" : "Reanudar"}
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        fullWidth
                                        size="lg"
                                        className="shadow-coral/20"
                                        onClick={handleFinish}
                                        disabled={!hasStarted || seconds === 0}
                                    >
                                        Terminar sesión
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="mt-4 text-sm font-medium text-grey transition-colors hover:text-coral"
                                    >
                                        Cancelar (no guardar)
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

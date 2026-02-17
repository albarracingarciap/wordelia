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

export function ReadingTimerModal({ isOpen, onClose, onFinish, bookTitle }: ReadingTimerModalProps) {
    const [seconds, setSeconds] = React.useState(0);
    const [isActive, setIsActive] = React.useState(true);

    React.useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isOpen && isActive) {
            interval = setInterval(() => {
                setSeconds(seconds => seconds + 1);
            }, 1000);
        } else if (!isActive && interval) {
            clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, isActive]);

    // Reset timer when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSeconds(0);
            setIsActive(true);
        }
    }, [isOpen]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinish = () => {
        // Ensure at least 1 minute is recorded, even for short sessions
        const durationMinutes = Math.max(1, Math.ceil(seconds / 60));
        onFinish(durationMinutes);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all border border-teal/10 relative">
                                <div className="text-center">
                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2">
                                        Leyendo ahora
                                    </h3>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-serif text-teal font-bold mb-8"
                                    >
                                        {bookTitle}
                                    </Dialog.Title>

                                    {/* Timer Display */}
                                    <div className="text-6xl font-mono text-teal-dark font-medium mb-10 tabular-nums tracking-tight">
                                        {formatTime(seconds)}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex justify-center gap-4 mb-8">
                                        <Button
                                            variant="secondary"
                                            className="w-32 justify-center"
                                            onClick={() => setIsActive(!isActive)}
                                        >
                                            {isActive ? "Pausar" : "Reanudar"}
                                        </Button>
                                    </div>

                                    <Button
                                        fullWidth
                                        size="lg"
                                        className="shadow-coral/20"
                                        onClick={handleFinish}
                                    >
                                        Terminar sesión
                                    </Button>

                                    <button
                                        onClick={onClose}
                                        className="mt-4 text-xs text-grey hover:text-coral hover:underline transition-colors"
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

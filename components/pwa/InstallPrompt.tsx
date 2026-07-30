"use client";

import * as React from "react";
import Image from "next/image";
import { Download, Share, SquarePlus, X } from "lucide-react";

// Evento no estándar de Chrome/Android para instalar la PWA.
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "wordelia-install-dismissed";
const DISMISS_DAYS = 30;

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

/**
 * Banner de instalación de la PWA (Fase 0.2). Solo en /app (montado en AppShell).
 *  - Android/Chrome: captura `beforeinstallprompt` y ofrece un botón "Instalar".
 *  - iOS/Safari: no existe ese evento → muestra instrucciones (Compartir → Añadir).
 *  - Oculto si ya está instalada (standalone) o si se descartó hace < 30 días.
 */
export function InstallPrompt() {
    const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
    const [mode, setMode] = React.useState<"android" | "ios" | null>(null);
    const [visible, setVisible] = React.useState(false);

    const dismiss = React.useCallback(() => {
        setVisible(false);
        try {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
            /* almacenamiento no disponible: no pasa nada */
        }
    }, []);

    React.useEffect(() => {
        if (isStandalone()) return;

        try {
            const raw = localStorage.getItem(DISMISS_KEY);
            if (raw && Date.now() - Number(raw) < DISMISS_DAYS * 86_400_000) return;
        } catch {
            /* ignore */
        }

        const onBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // evita el mini-infobar por defecto; lo mostramos nosotros
            setDeferred(e as BeforeInstallPromptEvent);
            setMode("android");
            setVisible(true);
        };
        const onInstalled = () => dismiss();

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onInstalled);

        // iOS Safari: sin beforeinstallprompt. Mostramos instrucciones tras un pequeño
        // retraso para no aparecer en el primer instante de carga.
        const ua = window.navigator.userAgent;
        const isIOS = /iphone|ipad|ipod/i.test(ua);
        const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
        let iosTimer: ReturnType<typeof setTimeout> | undefined;
        if (isIOS && isSafari) {
            iosTimer = setTimeout(() => {
                setMode("ios");
                setVisible(true);
            }, 1500);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onInstalled);
            if (iosTimer) clearTimeout(iosTimer);
        };
    }, [dismiss]);

    const install = async () => {
        if (!deferred) return;
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        setDeferred(null);
        if (outcome === "accepted") setVisible(false);
        else dismiss();
    };

    if (!visible || !mode) return null;

    return (
        <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-2xl border border-teal/15 bg-white p-4 shadow-xl animate-fade-in-up lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-96 safe-area-bottom">
            <button
                onClick={dismiss}
                className="absolute right-2 top-2 rounded-full p-1.5 text-grey/40 transition-colors hover:text-coral"
                aria-label="Cerrar"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-teal/10">
                    <Image src="/icons/icon-192.png" alt="" fill sizes="44px" className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                    {mode === "android" ? (
                        <>
                            <p className="text-sm font-bold text-teal-dark">Instala Wordelia</p>
                            <p className="mt-0.5 text-xs text-grey/70">
                                Añádela a tu pantalla de inicio y ábrela como una app, con acceso directo a tu lectura.
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={install}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-dark"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Instalar
                                </button>
                                <button
                                    onClick={dismiss}
                                    className="rounded-full px-3 py-2 text-xs font-medium text-grey/60 hover:text-teal"
                                >
                                    Ahora no
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-teal-dark">Instala Wordelia en tu iPhone</p>
                            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-grey/70">
                                Toca
                                <Share className="mx-0.5 inline h-3.5 w-3.5 text-teal" aria-label="Compartir" />
                                y luego
                                <span className="inline-flex items-center gap-1 font-semibold text-teal-dark">
                                    <SquarePlus className="h-3.5 w-3.5" />
                                    Añadir a pantalla de inicio
                                </span>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

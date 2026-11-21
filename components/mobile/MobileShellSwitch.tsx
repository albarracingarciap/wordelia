"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Smartphone, X } from "lucide-react";
import { toMobilePath } from "@/lib/mobile-routing";
import { getUiMode, setUiMode } from "./ui-mode";

const DISMISS_KEY = "wordelia-shell-switch-dismissed";

type SwitchState = "hidden" | "back" | "try";

// Fuera de render: lee navegador/cookie/sessionStorage. En servidor siempre "hidden".
function readState(): SwitchState {
    const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
    const mobile = nav.userAgentData?.mobile ?? /Mobi|iPhone|iPod/i.test(navigator.userAgent);
    if (!mobile || sessionStorage.getItem(DISMISS_KEY) === "1") return "hidden";
    return getUiMode() === "full" ? "try" : "back";
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

// Interruptor hacia el shell móvil dentro de /app (solo móviles):
// - venías de /m ("Ver versión completa") → "Volver a la app"
// - elegiste la versión completa (cookie full) → "Probar la versión móvil"
export function MobileShellSwitch() {
    const router = useRouter();
    const pathname = usePathname() || "/app";
    const state = React.useSyncExternalStore(subscribe, readState, () => "hidden" as SwitchState);

    if (state === "hidden") return null;

    function go() {
        setUiMode("mobile");
        const target = toMobilePath(pathname, new URLSearchParams(window.location.search)) ?? "/m";
        router.push(target);
    }

    function dismiss() {
        sessionStorage.setItem(DISMISS_KEY, "1");
        listeners.forEach((l) => l());
    }

    return (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-teal px-4 py-2.5 text-white shadow-sm md:hidden">
            <Smartphone className="h-5 w-5 shrink-0 opacity-80" />
            <p className="min-w-0 flex-1 text-sm leading-snug">
                {state === "back" ? "Estás en la versión completa." : "Prueba la versión móvil: más rápida para el día a día."}
            </p>
            <button type="button" onClick={go} className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-teal">
                {state === "back" ? "Volver a la app" : "Probar"}
            </button>
            <button type="button" onClick={dismiss} aria-label="Ocultar" className="-mr-1 shrink-0 p-1 opacity-70">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

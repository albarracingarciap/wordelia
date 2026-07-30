"use client";

import { useEffect } from "react";

/**
 * Registra el service worker de la PWA (Fase 0). Solo en producción: en `next dev`
 * un SW activo provoca cachés obsoletas y confunde el desarrollo. Para probar la
 * instalabilidad en local: `npm run build && npm start`.
 */
export function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        const register = () => {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.error("SW registration failed:", err);
            });
        };

        // Registrar tras la carga para no competir con el arranque de la página.
        if (document.readyState === "complete") register();
        else window.addEventListener("load", register, { once: true });
    }, []);

    return null;
}

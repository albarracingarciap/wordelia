"use client";

import * as React from "react";
import { Bell, Loader2 } from "lucide-react";
import { getPushState, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { sendTestPush } from "@/app/app/perfil/push-actions";

/** Toggle de notificaciones push (PWA Fase 0.3). Pensado para /app/perfil. */
export function PushToggle() {
    const [supported, setSupported] = React.useState<boolean | null>(null);
    const [subscribed, setSubscribed] = React.useState(false);
    const [permission, setPermission] = React.useState<NotificationPermission>("default");
    const [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState("");

    React.useEffect(() => {
        getPushState()
            .then((s) => {
                setSupported(s.supported);
                setSubscribed(s.subscribed);
                setPermission(s.permission);
            })
            .catch(() => setSupported(false));
    }, []);

    const enable = async () => {
        setBusy(true);
        setMessage("");
        const res = await subscribeToPush();
        if (res.ok) {
            setSubscribed(true);
            setPermission("granted");
            const test = await sendTestPush();
            setMessage(
                test.error
                    ? `Activadas, pero el envío de prueba falló: ${test.error}`
                    : "¡Listo! Te hemos enviado una notificación de prueba.",
            );
        } else {
            setMessage(res.error || "No hemos podido activar las notificaciones.");
        }
        setBusy(false);
    };

    const disable = async () => {
        setBusy(true);
        setMessage("");
        await unsubscribeFromPush();
        setSubscribed(false);
        setMessage("Notificaciones desactivadas.");
        setBusy(false);
    };

    if (supported === null) return null; // cargando

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-4">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <Bell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-teal-dark">Notificaciones</p>
                    <p className="mt-0.5 text-xs text-grey/70">
                        Avisos de la actividad de tus clubs, retos y librerías. Puedes desactivarlas cuando quieras.
                    </p>

                    {supported === false ? (
                        <p className="mt-3 text-xs text-grey/60">
                            Tu navegador no soporta notificaciones push. En iPhone, primero instala la app en tu pantalla
                            de inicio (Compartir → Añadir a pantalla de inicio).
                        </p>
                    ) : permission === "denied" ? (
                        <p className="mt-3 text-xs text-coral">
                            Has bloqueado las notificaciones. Actívalas desde los ajustes del navegador para este sitio.
                        </p>
                    ) : (
                        <button
                            onClick={subscribed ? disable : enable}
                            disabled={busy}
                            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                                subscribed
                                    ? "border border-teal/20 text-teal hover:bg-teal/5"
                                    : "bg-teal text-white hover:bg-teal-dark"
                            }`}
                        >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                            {subscribed ? "Desactivar" : "Activar notificaciones"}
                        </button>
                    )}

                    {message && <p className="mt-2 text-xs text-grey/60">{message}</p>}
                </div>
            </div>
        </div>
    );
}

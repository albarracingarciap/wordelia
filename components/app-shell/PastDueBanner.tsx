"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const DISMISS_KEY = "wordelia_pastdue_dismissed";

/**
 * Aviso de impago (dunning). Se muestra cuando la suscripción del usuario está en
 * past_due (un cobro de renovación ha fallado y PayPal está reintentando). Se lee
 * del cliente (RLS del dueño). Descartable por sesión.
 */
export function PastDueBanner() {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.sessionStorage.getItem(DISMISS_KEY)) return;

        let active = true;
        const supabase = createClient();
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: sub } = await supabase
                .from("user_subscriptions")
                .select("status")
                .eq("user_id", user.id)
                .maybeSingle();
            if (active && sub?.status === "past_due") setShow(true);
        })();

        return () => {
            active = false;
        };
    }, []);

    if (!show) return null;

    const dismiss = () => {
        window.sessionStorage.setItem(DISMISS_KEY, "1");
        setShow(false);
    };

    return (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm text-teal-dark">
                No hemos podido cobrar tu suscripción. Revisa tu método de pago para no perder el acceso.
            </p>
            <Link
                href="/app/perfil/suscripcion"
                className="shrink-0 rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-coral/90"
            >
                Revisar
            </Link>
            <button
                type="button"
                onClick={dismiss}
                aria-label="Descartar aviso"
                className="shrink-0 rounded-full p-1 text-grey/50 transition-colors hover:bg-grey/10 hover:text-grey"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { PLANS } from "@/lib/plans";
import { isSubscriptionActive } from "@/lib/subscription-access";

const DISMISS_KEY = "wordelia_pending_sub_dismissed";

/**
 * Rescate de pago abandonado. Se muestra cuando el usuario eligió un plan de pago
 * al registrarse (founder_membership.requested_plan = voraz|ai) pero NO tiene una
 * suscripción activa: le ofrece volver a /planes a completar el pago. Los datos se
 * leen del cliente (RLS permite al dueño leer su suscripción y su founder membership).
 */
export function PendingSubscriptionBanner() {
    const [pending, setPending] = React.useState<{ plan: string; billing: string } | null>(null);

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY)) return;

        let active = true;
        const supabase = createClient();

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [{ data: sub }, { data: founder }] = await Promise.all([
                supabase
                    .from("user_subscriptions")
                    .select("status, current_period_end")
                    .eq("user_id", user.id)
                    .maybeSingle(),
                supabase
                    .from("founder_memberships")
                    .select("requested_plan, billing_period")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .maybeSingle(),
            ]);

            const hasActiveSub = isSubscriptionActive(sub?.status, sub?.current_period_end);
            const plan = founder?.requested_plan;

            if (active && !hasActiveSub && (plan === "voraz" || plan === "ai")) {
                setPending({ plan, billing: founder?.billing_period === "annual" ? "annual" : "monthly" });
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    if (!pending) return null;

    const planName = PLANS.find((plan) => plan.id === pending.plan)?.name ?? "tu plan";

    const dismiss = () => {
        window.localStorage.setItem(DISMISS_KEY, "1");
        setPending(null);
    };

    return (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-coral/25 bg-coral/5 px-4 py-3">
            <p className="min-w-0 flex-1 text-sm text-teal-dark">
                Tienes el plan <span className="font-semibold">{planName}</span> sin activar. Completa tu suscripción para desbloquear todo.
            </p>
            <Link
                href={`/planes?plan=${pending.plan}&billing=${pending.billing}`}
                className="shrink-0 rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-coral/90"
            >
                Completar suscripción
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

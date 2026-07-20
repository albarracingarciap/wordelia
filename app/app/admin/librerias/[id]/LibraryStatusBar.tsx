"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, Crown, Loader2 } from "lucide-react";
import { setLibraryVerifiedAction, setLibraryActiveAction, setOrganizationTier } from "../actions";

export function LibraryStatusBar({
    orgId,
    verified,
    isActive,
    tier,
}: {
    orgId: string;
    verified: boolean;
    isActive: boolean;
    tier: string;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const run = (fn: () => Promise<{ success: true } | { error: string }>) => {
        startTransition(async () => {
            const res = await fn();
            if (!("error" in res)) router.refresh();
            else alert(res.error);
        });
    };

    const isPro = tier === "pro";

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                disabled={pending}
                onClick={() => run(() => setLibraryVerifiedAction(orgId, !verified))}
                className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 ${
                    verified ? "bg-teal/15 text-teal-dark" : "border border-input hover:bg-muted"
                }`}
            >
                {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                {verified ? "Verificada" : "Verificar"}
            </button>

            <button
                disabled={pending}
                onClick={() => run(() => setOrganizationTier(orgId, isPro ? "free" : "pro"))}
                className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 ${
                    isPro ? "bg-teal/15 text-teal-dark" : "border border-input hover:bg-muted"
                }`}
            >
                <Crown className="w-3.5 h-3.5" />
                {isPro ? "Pro activo" : "Activar Pro"}
            </button>

            <button
                disabled={pending}
                onClick={() => {
                    const msg = isActive ? "¿Suspender esta librería?" : "¿Reactivar esta librería?";
                    if (confirm(msg)) run(() => setLibraryActiveAction(orgId, !isActive));
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 ${
                    isActive ? "border border-coral/40 text-coral hover:bg-coral/5" : "bg-coral text-white hover:bg-coral/90"
                }`}
            >
                <Ban className="w-3.5 h-3.5" />
                {isActive ? "Suspender" : "Reactivar"}
            </button>
        </div>
    );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { joinChallenge } from "@/app/app/retos/actions";

export function JoinChallengeButton({ challengeId, className = "" }: { challengeId: string; className?: string }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const join = async () => {
        setBusy(true);
        setError(null);
        const res = await joinChallenge(challengeId);
        setBusy(false);
        if (res && "error" in res && res.error) { setError(res.error); return; }
        router.refresh();
    };

    return (
        <div>
            <button
                onClick={join}
                disabled={busy}
                className={`inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#C25852] disabled:opacity-50 ${className}`}
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Unirme al reto
            </button>
            {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
        </div>
    );
}

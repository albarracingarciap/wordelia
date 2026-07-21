"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toggleFollowAction } from "@/app/app/perfil/follow-actions";

export function FollowButton({ targetId, initialFollowing }: { targetId: string; initialFollowing: boolean }) {
    const router = useRouter();
    const [following, setFollowing] = React.useState(initialFollowing);
    const [busy, setBusy] = React.useState(false);

    const toggle = async () => {
        setBusy(true);
        const prev = following;
        setFollowing(!prev); // optimista
        const res = await toggleFollowAction(targetId);
        setBusy(false);
        if ("error" in res) {
            setFollowing(prev);
        } else {
            setFollowing(res.following);
            router.refresh(); // sincroniza contadores del servidor
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                following
                    ? "border border-teal/30 bg-white text-teal hover:border-coral/40 hover:text-coral"
                    : "bg-teal text-white hover:bg-teal-dark"
            }`}
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {following ? "Siguiendo" : "Seguir"}
        </button>
    );
}

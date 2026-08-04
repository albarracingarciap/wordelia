"use client";

import { toast } from "@/components/ui/toast";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2 } from "lucide-react";
import { enterOfficialClubManagement } from "@/app/app/admin/clubes/actions";

// Botón "Gestionar" de la lista de Clubes Originals: asegura la membresía de
// admin del club oficial y abre su dashboard de gestión.
export function ManageOfficialButton({ clubId }: { clubId: string }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);

    const go = async () => {
        setBusy(true);
        const res = await enterOfficialClubManagement(clubId);
        if (res?.error) { toast.error(res.error); setBusy(false); return; }
        router.push(`/app/clubs/${clubId}?from=admin&tab=manage`);
    };

    return (
        <button
            onClick={go}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-3 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal/10 disabled:opacity-50"
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            Gestionar
        </button>
    );
}

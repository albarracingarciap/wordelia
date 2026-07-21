"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { getFollowListAction, type Person } from "@/app/app/perfil/follow-actions";
import { PersonRow } from "./PersonRow";

type Kind = "followers" | "following";

export function FollowCounts({ userId, followers, following }: { userId: string; followers: number; following: number }) {
    const [kind, setKind] = React.useState<Kind | null>(null);
    const [people, setPeople] = React.useState<Person[]>([]);
    const [loading, setLoading] = React.useState(false);

    const open = async (k: Kind) => {
        setKind(k);
        setLoading(true);
        setPeople([]);
        try {
            setPeople(await getFollowListAction(userId, k));
        } finally {
            setLoading(false);
        }
    };

    const countClass = "text-sm text-grey/60 transition-colors hover:text-teal-dark";

    return (
        <>
            <button type="button" onClick={() => open("followers")} className={countClass}>
                <b className="text-teal-dark">{followers}</b> seguidores
            </button>
            <button type="button" onClick={() => open("following")} className={countClass}>
                <b className="text-teal-dark">{following}</b> siguiendo
            </button>

            <Modal isOpen={kind !== null} onClose={() => setKind(null)} title={kind === "followers" ? "Seguidores" : "Siguiendo"}>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-teal" />
                    </div>
                ) : people.length === 0 ? (
                    <p className="py-8 text-center text-sm text-grey/50">
                        {kind === "followers" ? "Todavía no tiene seguidores." : "Todavía no sigue a nadie."}
                    </p>
                ) : (
                    <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                        {people.map((p) => (
                            <PersonRow key={p.id} person={p} />
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
}

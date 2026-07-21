"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, UserPlus, Check, Loader2 } from "lucide-react";
import { getSimilarReaders, toggleFollowAction, type SimilarReader } from "@/app/app/perfil/follow-actions";

function Avatar({ name, avatar }: { name: string | null; avatar: string | null }) {
    if (avatar) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />;
    }
    return <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 font-serif text-teal-dark">{(name || "L").charAt(0).toUpperCase()}</span>;
}

export function SimilarReaders() {
    const [readers, setReaders] = React.useState<SimilarReader[] | null>(null);
    const [followed, setFollowed] = React.useState<Set<string>>(new Set());
    const [pending, setPending] = React.useState<string | null>(null);

    React.useEffect(() => {
        let alive = true;
        getSimilarReaders(6).then((r) => { if (alive) setReaders(r); }).catch(() => { if (alive) setReaders([]); });
        return () => { alive = false; };
    }, []);

    const follow = async (id: string) => {
        setPending(id);
        const res = await toggleFollowAction(id);
        setPending(null);
        if (!("error" in res)) setFollowed((prev) => new Set(prev).add(id));
    };

    if (readers === null) return null; // aún cargando: no ocupamos espacio

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40">
                <Sparkles className="h-4 w-4 text-coral" /> Lectores afines
            </h3>
            {readers.length === 0 ? (
                <p className="py-2 text-sm text-grey/50">
                    Aún no encontramos lectores afines. Añade libros a tu biblioteca y aquí aparecerá gente con gustos parecidos.
                </p>
            ) : (
            <>
            <p className="mb-3 -mt-1 text-xs text-grey/50">Tenéis libros en común en la biblioteca.</p>
            <div className="space-y-3">
                {readers.map((r) => {
                    const isFollowed = followed.has(r.id);
                    return (
                        <div key={r.id} className="flex items-center gap-3">
                            <Link href={r.username ? `/lector/${r.username}` : "#"} className="shrink-0"><Avatar name={r.name} avatar={r.avatarUrl} /></Link>
                            <div className="min-w-0 flex-1">
                                <Link href={r.username ? `/app/perfil/${r.username}` : "#"} className="block truncate text-sm font-semibold text-teal-dark hover:text-teal">{r.name || (r.username ? `@${r.username}` : "Lector")}</Link>
                                <p className="text-xs text-grey/50">{r.sharedCount} {r.sharedCount === 1 ? "libro" : "libros"} en común</p>
                            </div>
                            <button
                                onClick={() => follow(r.id)}
                                disabled={isFollowed || pending === r.id}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${isFollowed ? "bg-teal/10 text-teal" : "bg-teal text-white hover:bg-teal-dark"}`}
                            >
                                {pending === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isFollowed ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                                {isFollowed ? "Siguiendo" : "Seguir"}
                            </button>
                        </div>
                    );
                })}
            </div>
            </>
            )}
        </div>
    );
}

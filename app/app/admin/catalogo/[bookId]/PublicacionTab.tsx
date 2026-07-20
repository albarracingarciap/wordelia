"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import type { BookWorkspace } from "../data";
import { listCollectionsAction } from "../actions";
import { setPublished, setBookCollection } from "../../colecciones/actions";

export function PublicacionTab({
    bookId,
    guide,
    genome,
    collectionId,
    isAdmin,
}: {
    bookId: string;
    guide: BookWorkspace["guide"];
    genome: BookWorkspace["genome"];
    collectionId: string | null;
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
    const [collection, setCollection] = useState<string>(collectionId ?? "");

    const published = guide.status === "published";
    const canPublish = guide.exists && genome.chromosomes > 0;

    useEffect(() => {
        (async () => {
            const { collections } = await listCollectionsAction();
            if (collections) setCollections(collections);
        })();
    }, []);

    const run = (fn: () => Promise<{ success: true } | { success: false; error: string }>, okMsg: string) => {
        setFeedback(null);
        startTransition(async () => {
            const res = await fn();
            if (res.success) {
                setFeedback({ ok: true, msg: okMsg });
                router.refresh();
            } else {
                setFeedback({ ok: false, msg: res.error });
            }
        });
    };

    if (!isAdmin) {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20 max-w-2xl">
                <h3 className="font-semibold">Solo administradores</h3>
                <p className="mt-1 text-sm">La publicación en /explorar y la curación de colecciones son solo-admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Estado y publicación */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-teal" />
                    <h3 className="font-semibold">Publicación en /explorar</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-muted-foreground text-xs">Guía</p>
                        <p className="font-medium">{guide.exists ? guide.status : "No existe"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-muted-foreground text-xs">Genoma</p>
                        <p className="font-medium">
                            {genome.chromosomes > 0 ? `${genome.chromosomes} cromosomas` : "No existe"}
                        </p>
                    </div>
                </div>

                {!canPublish ? (
                    <div className="flex items-start gap-2 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Para publicar, el libro necesita <b>guía y genoma</b>. Impórtalos primero (F2).</span>
                    </div>
                ) : (
                    <button
                        disabled={pending}
                        onClick={() =>
                            run(
                                () => setPublished(bookId, !published),
                                published ? "Retirado de /explorar." : "Publicado en /explorar.",
                            )
                        }
                        className={`inline-flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 ${
                            published
                                ? "border border-coral text-coral hover:bg-coral/5"
                                : "bg-teal text-white hover:bg-teal-dark"
                        }`}
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {published ? "Retirar de /explorar" : "Publicar en /explorar"}
                    </button>
                )}
                <p className="text-xs text-muted-foreground mt-2">Guía y genoma se publican y retiran juntos.</p>
            </div>

            {/* Colección */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-teal" />
                    <h3 className="font-semibold">Colección de /explorar</h3>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                        disabled={pending}
                        className="bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
                    >
                        <option value="">Sin colección</option>
                        {collections.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button
                        disabled={pending || collection === (collectionId ?? "")}
                        onClick={() => run(() => setBookCollection(bookId, collection || null), "Colección actualizada.")}
                        className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                    >
                        Guardar
                    </button>
                </div>
            </div>

            {feedback && (
                <div
                    className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
                        feedback.ok
                            ? "bg-teal/10 text-teal-dark border border-teal/20"
                            : "bg-coral/10 text-coral border border-coral/20"
                    }`}
                >
                    {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}
        </div>
    );
}

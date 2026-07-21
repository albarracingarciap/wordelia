"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Star, MessageSquare, Quote, BookOpen, User, Bookmark, Loader2 } from "lucide-react";
import { getSavedItems, toggleSaved, type SavedEntry, type SavedBucket } from "./actions";

const TABS: { key: SavedBucket; label: string }[] = [
    { key: "reseñas", label: "Reseñas" },
    { key: "citas", label: "Citas destacadas" },
    { key: "debates", label: "Debates de Clubs" },
    { key: "libros", label: "Libros" },
];

function iconFor(bucket: SavedBucket) {
    switch (bucket) {
        case "reseñas": return { Icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" };
        case "debates": return { Icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" };
        case "libros": return { Icon: BookOpen, color: "text-teal", bg: "bg-teal/10" };
        default: return { Icon: Quote, color: "text-purple-500", bg: "bg-purple-500/10" };
    }
}

const EMPTY: Record<SavedBucket, { title: string; text: string; href: string; cta: string }> = {
    reseñas: { title: "Aún no has guardado ninguna reseña", text: "Guarda desde la Comunidad los análisis que te hagan pensar.", href: "/app/comunidad", cta: "Ir a la Comunidad" },
    debates: { title: "Tus hilos de debate favoritos", text: "Guarda los mejores mensajes de club que veas en la Comunidad.", href: "/app/comunidad", cta: "Ir a la Comunidad" },
    citas: { title: "Colecciona frases que inspiran", text: "Guarda citas desde la Comunidad o desde la página de una cita compartida.", href: "/app/comunidad", cta: "Ir a la Comunidad" },
    libros: { title: "Guarda libros para más tarde", text: "Desde la ficha de un libro pulsa «Guardar» y aparecerá aquí.", href: "/app/explorar", cta: "Explorar libros" },
};

export default function GuardadosClient() {
    const [items, setItems] = React.useState<SavedEntry[] | null>(null);
    const [activeTab, setActiveTab] = React.useState<SavedBucket>("reseñas");

    React.useEffect(() => {
        let alive = true;
        getSavedItems().then((r) => { if (alive) setItems(r); }).catch(() => { if (alive) setItems([]); });
        return () => { alive = false; };
    }, []);

    const remove = async (entry: SavedEntry) => {
        setItems((prev) => (prev ? prev.filter((i) => i.key !== entry.key) : prev));
        await toggleSaved(entry.itemType, entry.itemId);
    };

    const countFor = (b: SavedBucket) => (items ?? []).filter((i) => i.bucket === b).length;
    const visible = (items ?? []).filter((i) => i.bucket === activeTab);

    if (items === null) {
        return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal" /></div>;
    }

    const empty = EMPTY[activeTab];
    const { Icon: EmptyIcon } = iconFor(activeTab);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-2 overflow-x-auto border-b border-teal/10 pb-4 hide-scrollbar">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === t.key ? "bg-teal text-white shadow-sm" : "bg-teal/5 text-teal hover:bg-teal/10"}`}
                    >
                        {t.label} ({countFor(t.key)})
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-teal/5 bg-white/50 p-8 py-20 text-center animate-fade-in">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/5 text-teal/40"><EmptyIcon size={32} /></div>
                        <h3 className="mb-2 font-serif text-xl text-teal md:text-2xl">{empty.title}</h3>
                        <p className="mb-8 max-w-md leading-relaxed text-grey/80">{empty.text}</p>
                        <Link href={empty.href}><Button className="bg-teal hover:bg-teal-dark">{empty.cta}</Button></Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map((item) => {
                            const { Icon, color, bg } = iconFor(item.bucket);
                            const body = (
                                <div className="flex flex-1 gap-3">
                                    {item.coverUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.coverUrl} alt="" className="h-16 w-11 shrink-0 rounded object-cover shadow-sm" />
                                    ) : (
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {item.authorName ? (
                                            <p className="text-sm leading-tight text-grey-dark">
                                                <span className="inline-flex items-center gap-1 font-semibold text-teal-dark">
                                                    {item.authorAvatar ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.authorAvatar} alt="" className="h-4 w-4 rounded-full" />
                                                    ) : (
                                                        <User className="h-3 w-3 opacity-50" />
                                                    )}
                                                    {item.authorName}
                                                </span>{" "}
                                                {item.title && <span className="text-grey/70">{item.title}</span>}
                                            </p>
                                        ) : item.title ? (
                                            <p className="text-sm font-semibold text-teal-dark">
                                                {item.title}{item.subtitle ? <span className="font-normal text-grey/60"> · {item.subtitle}</span> : null}
                                            </p>
                                        ) : null}
                                        {item.snippet && (
                                            <p className="mt-1.5 border-l-2 border-teal/20 pl-2 text-xs italic text-grey line-clamp-3">{item.snippet}</p>
                                        )}
                                        <span className="mt-2 block text-[10px] text-grey/40">{item.time}</span>
                                    </div>
                                </div>
                            );
                            return (
                                <div key={item.key} className="flex items-start gap-2 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                                    {item.href ? <Link href={item.href} className="flex flex-1 hover:opacity-90">{body}</Link> : body}
                                    <button onClick={() => remove(item)} title="Quitar de guardados" className="shrink-0 rounded-full p-1.5 text-teal transition-colors hover:bg-coral/5 hover:text-coral">
                                        <Bookmark className="h-4 w-4 fill-current" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

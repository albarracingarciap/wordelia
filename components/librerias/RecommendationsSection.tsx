"use client";

import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import { Sparkles, Plus, Trash2, Pencil, BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SearchBookModal } from "@/components/club/management/SearchBookModal";
import type { BookSearchResult } from "@/lib/isbndb";
import {
    getRecommendationLists,
    createRecommendationList,
    updateRecommendationList,
    deleteRecommendationList,
    addRecommendationItem,
    updateRecommendationItem,
    deleteRecommendationItem,
    type RecommendationList,
} from "@/app/app/librerias/recommendation-actions";

export function RecommendationsSection({ orgId }: { orgId: string }) {
    const [lists, setLists] = React.useState<RecommendationList[] | null>(null);
    const [busy, setBusy] = React.useState(false);

    const refresh = React.useCallback(async () => {
        setLists(await getRecommendationLists(orgId));
    }, [orgId]);

    React.useEffect(() => { void refresh(); }, [refresh]);

    // Modal de crear/editar lista.
    const [listModal, setListModal] = React.useState<{ id?: string; title: string; description: string } | null>(null);
    // Selector de libro (para saber a qué lista añadir).
    const [pickForList, setPickForList] = React.useState<string | null>(null);
    // Modal de nota: libro elegido + lista destino, o edición de un ítem existente.
    const [noteModal, setNoteModal] = React.useState<{ listId: string; book: BookSearchResult | null; itemId?: string; note: string; label: string } | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const run = async (fn: () => Promise<{ error?: string; success?: boolean }>, after?: () => void) => {
        setBusy(true);
        setError(null);
        const res = await fn();
        setBusy(false);
        if (res?.error) { setError(res.error); return; }
        after?.();
        await refresh();
    };

    const saveList = () => {
        if (!listModal) return;
        const payload = { title: listModal.title, description: listModal.description };
        void run(
            () => listModal.id ? updateRecommendationList(listModal.id, payload) : createRecommendationList(orgId, payload),
            () => setListModal(null),
        );
    };

    const onPickBook = (book: BookSearchResult) => {
        const listId = pickForList!;
        setPickForList(null);
        setNoteModal({ listId, book, note: "", label: book.title });
    };

    const saveNote = () => {
        if (!noteModal) return;
        if (noteModal.itemId) {
            void run(() => updateRecommendationItem(noteModal.itemId!, { note: noteModal.note }), () => setNoteModal(null));
        } else if (noteModal.book) {
            const b = noteModal.book;
            const input = { title: b.title, author: b.authors?.[0] ?? null, coverUrl: b.cover_url ?? null, isbn: b.isbn13 ?? b.isbn ?? null };
            void run(() => addRecommendationItem(noteModal.listId, input, noteModal.note), () => setNoteModal(null));
        }
    };

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40 lg:text-sm">
                    <Sparkles className="h-4 w-4" aria-hidden="true" /> Recomendaciones
                </h2>
                <button onClick={() => setListModal({ title: "", description: "" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-coral">
                    <Plus className="h-4 w-4" aria-hidden="true" /> Nueva estantería
                </button>
            </div>

            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-grey/60">
                Estanterías temáticas montadas por ti, con una nota personal por libro. Es tu voz de librero: lo que
                lees y defiendes. Solo se muestran en tu ficha pública las que publiques.
            </p>

            {lists === null ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-teal" /></div>
            ) : lists.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-10 text-center text-sm text-grey/60">
                    Aún no has creado ninguna estantería de recomendaciones.
                </div>
            ) : (
                <div className="space-y-5">
                    {lists.map((list) => (
                        <div key={list.id} className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-serif text-lg text-teal">{list.title}</h3>
                                        {list.isPublished ? (
                                            <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal">Publicada</span>
                                        ) : (
                                            <span className="rounded-full bg-grey/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-grey/50">Borrador</span>
                                        )}
                                    </div>
                                    {list.description && <p className="mt-1 text-sm text-grey/70">{list.description}</p>}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        title={list.isPublished ? "Despublicar" : "Publicar"}
                                        onClick={() => run(() => updateRecommendationList(list.id, { isPublished: !list.isPublished }))}
                                        className="rounded-lg p-2 text-grey/50 transition-colors hover:bg-teal/5 hover:text-teal"
                                    >
                                        {list.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                    <button
                                        title="Editar"
                                        onClick={() => setListModal({ id: list.id, title: list.title, description: list.description ?? "" })}
                                        className="rounded-lg p-2 text-grey/50 transition-colors hover:bg-teal/5 hover:text-teal"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        title="Eliminar estantería"
                                        onClick={async () => { if (await confirmDialog({ title: "Eliminar lista", message: `¿Eliminar «${list.title}» y sus recomendaciones?`, confirmLabel: "Eliminar", tone: "danger" })) void run(() => deleteRecommendationList(list.id)); }}
                                        className="rounded-lg p-2 text-grey/50 transition-colors hover:bg-coral/5 hover:text-coral"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {list.items.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {list.items.map((it) => (
                                        <div key={it.id} className="flex gap-3 rounded-xl border border-teal/5 bg-cream/40 p-3">
                                            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-grey/10">
                                                {it.coverUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={it.coverUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-grey/30"><BookOpen className="h-4 w-4" /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-teal-dark">{it.title}</p>
                                                {it.author && <p className="truncate text-xs text-grey/55">{it.author}</p>}
                                                {it.note ? (
                                                    <p className="mt-1 text-xs italic leading-relaxed text-grey/70">“{it.note}”</p>
                                                ) : (
                                                    <p className="mt-1 text-xs text-grey/40">Sin nota — añade tu recomendación.</p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 flex-col gap-1">
                                                <button
                                                    title="Editar nota"
                                                    onClick={() => setNoteModal({ listId: list.id, book: null, itemId: it.id, note: it.note ?? "", label: it.title })}
                                                    className="rounded-lg p-1.5 text-grey/50 transition-colors hover:bg-teal/5 hover:text-teal"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    title="Quitar libro"
                                                    onClick={async () => { if (await confirmDialog({ title: "Quitar recomendación", message: `¿Quitar «${it.title}» de la estantería?`, confirmLabel: "Quitar", tone: "danger" })) void run(() => deleteRecommendationItem(it.id)); }}
                                                    className="rounded-lg p-1.5 text-grey/50 transition-colors hover:bg-coral/5 hover:text-coral"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setPickForList(list.id)}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-coral"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" /> Añadir libro
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="mt-3 text-sm font-medium text-coral">{error}</p>}

            {/* Crear / editar estantería */}
            <Modal isOpen={!!listModal} onClose={() => setListModal(null)} title={listModal?.id ? "Editar estantería" : "Nueva estantería"}>
                {listModal && (
                    <div className="space-y-4">
                        <Input label="Título" value={listModal.title} onChange={(e) => setListModal({ ...listModal, title: e.target.value })} placeholder="Ej. Nuestra mesa de novedades" autoFocus />
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-grey/60">Descripción (opcional)</label>
                            <textarea
                                value={listModal.description}
                                onChange={(e) => setListModal({ ...listModal, description: e.target.value })}
                                rows={2}
                                placeholder="Una línea que explique la estantería"
                                className="w-full resize-none rounded-lg border border-teal/15 bg-white px-3 py-2 text-sm text-teal-dark focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setListModal(null)}>Cancelar</Button>
                            <Button onClick={saveList} disabled={busy || !listModal.title.trim()} isLoading={busy}>Guardar</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Nota del librero */}
            <Modal isOpen={!!noteModal} onClose={() => setNoteModal(null)} title="Tu nota de recomendación">
                {noteModal && (
                    <div className="space-y-4">
                        <p className="text-sm text-grey/70">Sobre <span className="font-semibold text-teal-dark">{noteModal.label}</span></p>
                        <textarea
                            value={noteModal.note}
                            onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                            rows={4}
                            placeholder="¿Por qué lo recomiendas? Habla como en tienda, sin corsé."
                            autoFocus
                            className="w-full resize-none rounded-lg border border-teal/15 bg-white px-3 py-2 text-sm text-teal-dark focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setNoteModal(null)}>Cancelar</Button>
                            <Button onClick={saveNote} disabled={busy} isLoading={busy}>{noteModal.itemId ? "Guardar nota" : "Añadir a la estantería"}</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Selector de libro */}
            <SearchBookModal isOpen={!!pickForList} onClose={() => setPickForList(null)} onSelectBook={onPickBook} />
        </section>
    );
}

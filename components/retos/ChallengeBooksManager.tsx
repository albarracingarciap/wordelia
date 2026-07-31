"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { Plus, X, BookOpen, Loader2, Check, Search } from "lucide-react";
import { attributeBookToChallenge, removeBookFromChallenge, getChallengeBookPicker, type CountingBook, type PickerBook } from "@/app/app/retos/actions";

function Cover({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={title} className={`object-cover ${className}`} />;
    }
    return (
        <div className={`flex items-center justify-center bg-teal/5 ${className}`}>
            <BookOpen className="h-5 w-5 text-teal/40" />
        </div>
    );
}

function PickerModal({ challengeId, open, onClose, onChanged }: {
    challengeId: string;
    open: boolean;
    onClose: () => void;
    onChanged: (book: PickerBook, attributed: boolean) => void;
}) {
    const [books, setBooks] = React.useState<PickerBook[] | null>(null);
    const [q, setQ] = React.useState("");
    const [busyId, setBusyId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setBooks(null); setQ(""); setError(null);
            getChallengeBookPicker(challengeId).then(setBooks);
        }
    }, [open, challengeId]);

    const toggle = async (b: PickerBook) => {
        setBusyId(b.id); setError(null);
        const res = b.attributed ? await removeBookFromChallenge(challengeId, b.id) : await attributeBookToChallenge(challengeId, b.id);
        setBusyId(null);
        if (res.error) { setError(res.error); return; }
        const now = !b.attributed;
        setBooks((prev) => (prev ? prev.map((x) => (x.id === b.id ? { ...x, attributed: now } : x)) : prev));
        onChanged(b, now);
    };

    const needle = q.trim().toLowerCase();
    const filtered = (books ?? []).filter((b) => !needle || b.title.toLowerCase().includes(needle) || (b.author ?? "").toLowerCase().includes(needle));

    return (
        <Transition appear show={open}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-end justify-center p-0 sm:items-center sm:p-4">
                    <DialogPanel className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
                        <div className="border-b border-grey/10 p-4">
                            <div className="flex items-center justify-between">
                                <DialogTitle as="h3" className="font-serif text-lg font-bold text-teal">Añadir libros al reto</DialogTitle>
                                <button onClick={onClose} className="rounded-full p-1 text-grey/50 hover:bg-grey/10"><X className="h-5 w-5" /></button>
                            </div>
                            <p className="mt-0.5 text-xs text-grey/55">Elige de tus libros leídos los que cuentan para este reto.</p>
                            <div className="relative mt-3">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/40" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar en tus libros…"
                                    className="w-full rounded-lg border border-grey/20 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal/40"
                                />
                            </div>
                            {error && <p className="mt-2 text-xs font-medium text-coral">{error}</p>}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {books === null ? (
                                <div className="flex items-center justify-center py-10 text-grey/50"><Loader2 className="h-5 w-5 animate-spin" /></div>
                            ) : filtered.length === 0 ? (
                                <p className="px-3 py-10 text-center text-sm text-grey/55">
                                    {books.length === 0 ? "Aún no tienes libros marcados como leídos." : "No hay resultados para tu búsqueda."}
                                </p>
                            ) : (
                                <ul className="divide-y divide-grey/5">
                                    {filtered.map((b) => (
                                        <li key={b.id}>
                                            <button
                                                onClick={() => toggle(b)}
                                                disabled={busyId === b.id}
                                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-cream/50 disabled:opacity-60"
                                            >
                                                <Cover src={b.coverUrl} title={b.title} className="h-12 w-8 shrink-0 rounded" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-grey-dark">{b.title}</p>
                                                    {b.author && <p className="truncate text-xs text-grey/55">{b.author}</p>}
                                                </div>
                                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${b.attributed ? "border-teal bg-teal text-white" : "border-grey/25 text-transparent"}`}>
                                                    {busyId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-teal" /> : <Check className="h-3.5 w-3.5" />}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-t border-grey/10 p-3">
                            <button onClick={onClose} className="h-10 w-full rounded-full bg-teal text-sm font-bold text-white hover:bg-teal-dark">Hecho</button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}

export function ChallengeBooksManager({ challengeId, target, initialBooks }: {
    challengeId: string;
    target: number;
    initialBooks: CountingBook[];
}) {
    const router = useRouter();
    const [attributed, setAttributed] = React.useState<CountingBook[]>(initialBooks);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const [removing, setRemoving] = React.useState<string | null>(null);

    const onChanged = (book: PickerBook, isAttributed: boolean) => {
        setAttributed((prev) => {
            if (isAttributed) {
                if (prev.some((b) => b.id === book.id)) return prev;
                return [{ id: book.id, title: book.title, author: book.author, coverUrl: book.coverUrl, detail: null }, ...prev];
            }
            return prev.filter((b) => b.id !== book.id);
        });
    };

    const removeOne = async (id: string) => {
        const prev = attributed;
        setRemoving(id);
        setAttributed(prev.filter((b) => b.id !== id));
        const res = await removeBookFromChallenge(challengeId, id);
        setRemoving(null);
        if (res.error) { setAttributed(prev); return; }
        router.refresh(); // refresca progreso y clasificación
    };

    const closePicker = () => {
        setPickerOpen(false);
        router.refresh(); // refresca progreso y clasificación
    };

    const remaining = Math.max(0, target - attributed.length);

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-grey/55">
                    {target > 0
                        ? remaining > 0
                            ? `Has elegido ${attributed.length} de ${target}. Te queda${remaining === 1 ? "" : "n"} ${remaining}.`
                            : `¡Has elegido ${attributed.length}! Objetivo cumplido.`
                        : `Has elegido ${attributed.length} libro${attributed.length === 1 ? "" : "s"}.`}
                </p>
                <button
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3.5 py-1.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#C25852]"
                >
                    <Plus className="h-4 w-4" /> Añadir libro
                </button>
            </div>

            {attributed.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6">
                    {attributed.map((b) => (
                        <div key={b.id} className="group relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-grey/10 bg-white shadow-sm">
                            <Cover src={b.coverUrl} title={b.title} className="h-full w-full" />
                            {!b.coverUrl && <span className="absolute inset-0 flex items-end p-1.5 text-center"><span className="line-clamp-2 text-xs text-grey/70">{b.title}</span></span>}
                            <button
                                onClick={() => removeOne(b.id)}
                                disabled={removing === b.id}
                                title="Quitar del reto"
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-coral group-hover:opacity-100 disabled:opacity-100"
                            >
                                {removing === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-teal/20 bg-cream/30 p-8 text-center">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-teal/30" />
                    <p className="text-sm text-grey/60">Aún no has elegido libros para este reto. Pulsa “Añadir libro”.</p>
                </div>
            )}

            <PickerModal challengeId={challengeId} open={pickerOpen} onClose={closePicker} onChanged={onChanged} />
        </div>
    );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { updateBookMetadataAction } from "../actions";
import type { BookWorkspace } from "../data";

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

const inputCls =
    "w-full bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal";

export function DatosTab({ bookId, book }: { bookId: string; book: BookWorkspace["book"] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const [title, setTitle] = useState(book.title ?? "");
    const [author, setAuthor] = useState(book.author ?? "");
    const [genre, setGenre] = useState(book.genre ?? "");
    const [description, setDescription] = useState(book.description ?? "");
    const [year, setYear] = useState(book.first_publication_year?.toString() ?? "");
    const [originalTitle, setOriginalTitle] = useState(book.original_title ?? "");
    const [originalLanguage, setOriginalLanguage] = useState(book.original_language ?? "");

    const save = () => {
        setFeedback(null);
        startTransition(async () => {
            const res = await updateBookMetadataAction(bookId, {
                title,
                author,
                genre,
                description,
                first_publication_year: year.trim() ? Number(year) || null : null,
                original_title: originalTitle,
                original_language: originalLanguage,
            });
            if ("error" in res) {
                setFeedback({ ok: false, msg: res.error });
            } else {
                setFeedback({ ok: true, msg: "Cambios guardados." });
                router.refresh();
            }
        });
    };

    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5 md:p-6 max-w-3xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Field label="Título">
                        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Field>
                </div>
                <Field label="Autor">
                    <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} />
                </Field>
                <Field label="Género">
                    <input className={inputCls} value={genre} onChange={(e) => setGenre(e.target.value)} />
                </Field>
                <Field label="Año de primera publicación">
                    <input
                        type="number"
                        className={inputCls}
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Ej. 1948"
                    />
                </Field>
                <Field label="Idioma original">
                    <input
                        className={inputCls}
                        value={originalLanguage}
                        onChange={(e) => setOriginalLanguage(e.target.value)}
                        placeholder="Ej. es, en…"
                    />
                </Field>
                <div className="md:col-span-2">
                    <Field label="Título original">
                        <input
                            className={inputCls}
                            value={originalTitle}
                            onChange={(e) => setOriginalTitle(e.target.value)}
                        />
                    </Field>
                </div>
                <div className="md:col-span-2">
                    <Field label="Descripción / sinopsis">
                        <textarea
                            className={`${inputCls} min-h-[120px] resize-y`}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Field>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={save}
                    disabled={pending}
                    className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-5 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-50"
                >
                    {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                </button>
                {feedback && (
                    <span className={`inline-flex items-center gap-1.5 text-sm ${feedback.ok ? "text-teal-dark" : "text-coral"}`}>
                        {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {feedback.msg}
                    </span>
                )}
            </div>
        </div>
    );
}

"use client";

import * as React from "react";
import Image from "next/image";
import { MessageSquare, Sparkles, HelpCircle, BookOpen, ImagePlus, X, Loader2, Send, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SearchBookModal } from "@/components/club/management/SearchBookModal";
import type { BookSearchResult } from "@/lib/isbndb";
import { createCommunityPost, type PostSubtype } from "@/app/app/comunidad/actions";

const SUBTYPES: { key: PostSubtype; label: string; Icon: any }[] = [
    { key: "comentario", label: "Comentario", Icon: MessageSquare },
    { key: "recomendacion", label: "Recomendación", Icon: Sparkles },
    { key: "pregunta", label: "Pregunta", Icon: HelpCircle },
    { key: "leyendo", label: "Leyendo", Icon: BookOpen },
];

const MAX_IMAGE = 5 * 1024 * 1024;

export function CommunityComposer({ onPosted, prompt, onClearPrompt }: { onPosted?: () => void; prompt?: { id: string; question: string } | null; onClearPrompt?: () => void }) {
    const [content, setContent] = React.useState("");
    const [subtype, setSubtype] = React.useState<PostSubtype>("comentario");
    const [book, setBook] = React.useState<{ title: string; coverUrl: string | null; isbn: string | null } | null>(null);
    const [pickOpen, setPickOpen] = React.useState(false);
    const [spoiler, setSpoiler] = React.useState(false);
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string>("");
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

    const onPickBook = (b: BookSearchResult) => {
        setBook({ title: b.title, coverUrl: b.cover_url ?? null, isbn: b.isbn13 ?? b.isbn ?? null });
        setPickOpen(false);
        if (subtype === "comentario") setSubtype("recomendacion");
    };

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) { setError("Selecciona una imagen."); return; }
        if (f.size > MAX_IMAGE) { setError("La imagen no puede superar 5 MB."); return; }
        setError(null);
        setImageFile(f);
        setImagePreview(URL.createObjectURL(f));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const reset = () => { setContent(""); setSubtype("comentario"); setBook(null); clearImage(); setSpoiler(false); setError(null); };

    const submit = async () => {
        if (!content.trim() && !imageFile) { setError("Escribe algo o añade una foto."); return; }
        setBusy(true);
        setError(null);
        try {
            let imageUrl: string | null = null;
            if (imageFile) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setError("Inicia sesión para publicar."); setBusy(false); return; }
                const ext = imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
                const path = `${user.id}/${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage.from("community-posts").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
                if (upErr) { setError("No se pudo subir la foto."); setBusy(false); return; }
                imageUrl = supabase.storage.from("community-posts").getPublicUrl(path).data.publicUrl;
            }
            const res = await createCommunityPost({ content, subtype, imageUrl, book, spoiler, promptId: prompt?.id ?? null });
            if ("error" in res && res.error) { setError(res.error); setBusy(false); return; }
            reset();
            onPosted?.();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
            {prompt && (
                <div className="mb-3 flex items-start justify-between gap-2 rounded-xl border border-coral/20 bg-coral/5 px-3 py-2">
                    <p className="text-sm text-teal-dark"><span className="font-semibold text-coral">Respondiendo: </span>{prompt.question}</p>
                    {onClearPrompt && <button onClick={onClearPrompt} className="shrink-0 text-grey/40 hover:text-coral"><X className="h-4 w-4" /></button>}
                </div>
            )}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="¿Qué estás leyendo o pensando? Comparte con la comunidad…"
                className="w-full resize-none rounded-xl border border-teal/10 bg-cream/30 px-3 py-2.5 text-sm text-grey-dark placeholder:text-grey/40 focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/10"
            />

            {/* Libro adjunto */}
            {book && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-teal/10 bg-cream/30 p-2.5">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-grey/10">
                        {book.coverUrl ? <Image src={book.coverUrl} alt="" fill className="object-cover" sizes="40px" /> : <div className="flex h-full w-full items-center justify-center text-grey/30"><BookOpen className="h-4 w-4" /></div>}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-teal-dark">{book.title}</span>
                    <button onClick={() => setBook(null)} className="text-grey/40 hover:text-coral"><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Foto adjunta */}
            {imagePreview && (
                <div className="relative mt-3 overflow-hidden rounded-xl border border-teal/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="" className="max-h-64 w-full object-cover" />
                    <button onClick={clearImage} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-grey shadow-sm hover:text-coral"><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Tipos */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {SUBTYPES.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        onClick={() => setSubtype(key)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${subtype === key ? "border-teal bg-teal/5 text-teal" : "border-teal/15 bg-white text-grey/60 hover:text-teal"}`}
                    >
                        <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                ))}
                <button
                    onClick={() => setSpoiler((v) => !v)}
                    title="Marca si tu post desvela algo de la trama"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${spoiler ? "border-coral bg-coral/5 text-coral" : "border-teal/15 bg-white text-grey/60 hover:text-coral"}`}
                >
                    <EyeOff className="h-3.5 w-3.5" /> Spoiler
                </button>
            </div>

            {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-teal/5 pt-3">
                <div className="flex items-center gap-1">
                    <button onClick={() => fileRef.current?.click()} title="Añadir foto" className="flex h-9 w-9 items-center justify-center rounded-full text-grey/50 transition-colors hover:bg-teal/5 hover:text-teal">
                        <ImagePlus className="h-5 w-5" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} />
                    <button onClick={() => setPickOpen(true)} title="Adjuntar libro" className="flex h-9 w-9 items-center justify-center rounded-full text-grey/50 transition-colors hover:bg-teal/5 hover:text-teal">
                        <BookOpen className="h-5 w-5" />
                    </button>
                </div>
                <button
                    onClick={submit}
                    disabled={busy || (!content.trim() && !imageFile)}
                    className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-40"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar
                </button>
            </div>

            <SearchBookModal isOpen={pickOpen} onClose={() => setPickOpen(false)} onSelectBook={onPickBook} />
        </div>
    );
}

"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Subida de imagen de cabecera → bucket público (por defecto "club-headers")
// bajo "<user_id>/...". Devuelve la URL pública vía onChange. Reutilizable en el
// alta/ajustes del club y en el perfil (pasando otro bucket/label/hint).
export function ClubHeaderUpload({
    value,
    onChange,
    bucket = "club-headers",
    label = "Imagen de cabecera",
    hint = "Opcional. Se muestra como banner del club. Puedes cambiarla luego.",
    ctaLabel = "Añadir imagen de cabecera",
}: {
    value?: string | null;
    onChange: (url: string | null) => void;
    bucket?: string;
    label?: string;
    hint?: string;
    ctaLabel?: string;
}) {
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setError(null);
        if (!file.type.startsWith("image/")) { setError("El archivo debe ser una imagen."); return; }
        if (file.size > MAX_BYTES) { setError("La imagen no puede superar 5 MB."); return; }

        setBusy(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("Debes iniciar sesión."); return; }

            const ext = file.name.split(".").pop() || "jpg";
            const path = `${user.id}/${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from(bucket)
                .upload(path, file, { contentType: file.type, upsert: false });
            if (upErr) { setError("No se pudo subir la imagen."); console.error(upErr); return; }

            const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
            onChange(url);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <label className="mb-1.5 block text-sm font-bold text-grey-dark">{label}</label>

            {value ? (
                <div className="relative overflow-hidden rounded-2xl border border-grey/15">
                    <div className="relative h-40 w-full bg-teal/5">
                        <Image src={value} alt="Cabecera del club" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
                    >
                        <X className="h-3.5 w-3.5" /> Quitar
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                    className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-grey/20 bg-white text-grey/50 transition-colors hover:border-teal/40 hover:text-teal disabled:opacity-60"
                >
                    {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                    <span className="text-sm font-medium">{busy ? "Subiendo…" : ctaLabel}</span>
                    <span className="text-xs text-grey/40">JPG o PNG, hasta 5 MB</span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
            />
            <p className="mt-1 text-xs text-grey/50">{hint}</p>
            {error && <p className="mt-1 text-xs font-medium text-coral">{error}</p>}
        </div>
    );
}

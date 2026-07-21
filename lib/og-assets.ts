// Assets compartidos para imágenes next/og (logo + fuente de marca), cacheados.
// Los usan lib/quote-image.tsx (citas) y lib/challenge-image.tsx (retos).
import { readFileSync } from "fs";
import { join } from "path";

function cached<T>(box: { v?: T | null }, load: () => T): T | null {
    if (box.v !== undefined) return box.v;
    try {
        box.v = load();
    } catch (e) {
        console.error("og-assets:", e);
        box.v = null;
    }
    return box.v;
}

const logoBox: { v?: string | null } = {};
/** Logo wordmark como data URI (next/og no lee assets por ruta). null si falla. */
export function ogLogo(): string | null {
    return cached(logoBox, () => {
        const buf = readFileSync(join(process.cwd(), "public/assets/images/logo_wordelia.png"));
        return `data:image/png;base64,${buf.toString("base64")}`;
    });
}

const fontBox: { v?: Buffer | null } = {};
/** Playfair Display (TTF) para pasar en `fonts` de ImageResponse. null si falla. */
export function ogFont(): Buffer | null {
    return cached(fontBox, () => readFileSync(join(process.cwd(), "public/fonts/PlayfairDisplay.ttf")));
}

/** Descarga una imagen remota (p. ej. portada) y la devuelve como data URI. null si falla (nunca rompe el PNG). */
export async function ogRemoteImage(url: string | null): Promise<string | null> {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const ct = res.headers.get("content-type") || "";
        if (!ct.startsWith("image/")) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        return `data:${ct};base64,${buf.toString("base64")}`;
    } catch {
        return null;
    }
}

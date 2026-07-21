// Render compartido de la imagen de una cita con next/og (ImageResponse).
// Lo usan opengraph-image.tsx (previews) y la ruta /image (descarga).
// Restricciones next/og: estilos inline + flexbox (todo div con >1 hijo lleva
// display:flex). Paleta de app/globals.css. Fuente de marca Playfair Display.
import { ImageResponse } from "next/og";
import type { SharedQuote } from "./shared-quote";
import { ogLogo, ogFont } from "./og-assets";

const TEAL = "#336871";
const TEAL_DARK = "#234A4E";
const CORAL = "#D56962";
const CREAM = "#FFFAEF";

export type QuoteImageFormat = "landscape" | "square";

const FORMATS: Record<QuoteImageFormat, { width: number; height: number }> = {
    landscape: { width: 1200, height: 630 },
    square: { width: 1080, height: 1080 },
};

/** Descarga la portada y la devuelve como data URI, o null si falla (nunca rompe). */
async function fetchCover(url: string | null): Promise<string | null> {
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

// --- Render -----------------------------------------------------------------

export async function quoteImageResponse(
    quote: SharedQuote,
    opts: { format?: QuoteImageFormat } = {},
) {
    const format = opts.format ?? "landscape";
    const size = FORMATS[format];
    const sq = format === "square";

    const reader = quote.reader.name || (quote.reader.username ? `@${quote.reader.username}` : null);
    const raw = quote.content.replace(/\s+/g, " ").trim();
    const max = sq ? 260 : 300;
    const text = raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
    const fontSize = (text.length > 200 ? 34 : text.length > 120 ? 42 : 50) + (sq ? 6 : 0);

    const logo = ogLogo();
    const font = ogFont();
    const cover = await fetchCover(quote.book.coverUrl);
    const serif = "'Playfair Display', Georgia, serif";

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: CREAM,
                    padding: sq ? 60 : 56,
                    fontFamily: serif,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        background: "#ffffff",
                        borderRadius: 32,
                        overflow: "hidden",
                        boxShadow: "0 20px 60px rgba(35,74,78,0.10)",
                    }}
                >
                    <div style={{ height: 12, background: `linear-gradient(90deg, ${TEAL}, ${CORAL})` }} />

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: sq ? "64px 72px" : "56px 68px" }}>
                        <div style={{ fontSize: sq ? 170 : 150, lineHeight: 1, color: TEAL, opacity: 0.22 }}>“</div>

                        <div style={{ display: "flex", fontSize, lineHeight: 1.35, color: TEAL_DARK, marginTop: -34 }}>{text}</div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: sq ? 56 : 48 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 18, maxWidth: 760 }}>
                                {cover && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={cover} width={sq ? 92 : 78} height={sq ? 138 : 117} alt="" style={{ borderRadius: 8, objectFit: "cover" }} />
                                )}
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div style={{ fontSize: 30, fontWeight: 700, color: TEAL_DARK }}>{quote.book.title}</div>
                                    {quote.book.author && <div style={{ fontSize: 24, color: "#6b7280", marginTop: 4, fontFamily: "sans-serif" }}>{quote.book.author}</div>}
                                    {reader && <div style={{ fontSize: 18, color: "#9ca3af", marginTop: 10, fontFamily: "sans-serif" }}>Compartido por {reader}</div>}
                                </div>
                            </div>
                            {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} width={sq ? 300 : 332} height={sq ? 38 : 42} alt="Wordelia" />
                            ) : (
                                <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: TEAL }}>Wordelia</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: size.width,
            height: size.height,
            fonts: font ? [{ name: "Playfair Display", data: font, weight: 700 as const, style: "normal" as const }] : undefined,
        },
    );
}

// Imagen compartible de "Tu año en lectura" (next/og). Usada por opengraph-image
// y la ruta /image. Mismas restricciones y assets que lib/challenge-image.tsx.
import { ImageResponse } from "next/og";
import type { SharedWrapped } from "./shared-wrapped";
import { ogLogo, ogFont } from "./og-assets";

const TEAL = "#336871";
const TEAL_DARK = "#234A4E";
const CORAL = "#D56962";
const CREAM = "#FFFAEF";

export type WrappedImageFormat = "landscape" | "square";

const FORMATS: Record<WrappedImageFormat, { width: number; height: number }> = {
    landscape: { width: 1200, height: 630 },
    square: { width: 1080, height: 1080 },
};

export function wrappedImageResponse(w: SharedWrapped, opts: { format?: WrappedImageFormat } = {}) {
    const format = opts.format ?? "landscape";
    const size = FORMATS[format];
    const sq = format === "square";

    const reader = w.reader.name || (w.reader.username ? `@${w.reader.username}` : null);
    const logo = ogLogo();
    const font = ogFont();
    const serif = "'Playfair Display', Georgia, serif";

    // Celdas destacadas (se omiten las vacías).
    const cells = [
        { value: String(w.pages), label: "páginas" },
        { value: `${w.hours}h`, label: "leídas" },
        { value: String(w.daysRead), label: "días con lectura" },
        w.avgRating !== null ? { value: `${w.avgRating}★`, label: "media" } : null,
        w.topGenre ? { value: w.topGenre, label: "género top" } : null,
        w.bestMonth ? { value: cap(w.bestMonth), label: "tu mejor mes" } : null,
    ].filter(Boolean).slice(0, 4) as { value: string; label: string }[];

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", background: CREAM, padding: sq ? 60 : 56, fontFamily: serif }}>
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

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: sq ? "60px 74px" : "48px 72px" }}>
                        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: TEAL, fontFamily: "sans-serif", fontWeight: 700 }}>
                            Tu año en lectura {w.year}
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", marginTop: sq ? 20 : 12 }}>
                            <div style={{ fontSize: sq ? 150 : 128, fontWeight: 700, color: TEAL_DARK, lineHeight: 1 }}>{w.booksRead}</div>
                            <div style={{ fontSize: sq ? 52 : 46, color: "#6b7280", marginLeft: 20 }}>{w.booksRead === 1 ? "libro" : "libros"}</div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: sq ? 20 : 16, marginTop: sq ? 44 : 30 }}>
                            {cells.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        background: "rgba(51,104,113,0.06)",
                                        borderRadius: 20,
                                        padding: sq ? "22px 28px" : "18px 24px",
                                        minWidth: sq ? 210 : 224,
                                    }}
                                >
                                    <div style={{ display: "flex", fontSize: sq ? 44 : 40, fontWeight: 700, color: TEAL }}>{c.value}</div>
                                    <div style={{ display: "flex", fontSize: 22, color: "#9ca3af", marginTop: 6, fontFamily: "sans-serif" }}>{c.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: sq ? 48 : 34 }}>
                            {reader
                                ? <div style={{ display: "flex", fontSize: 24, color: "#9ca3af", fontFamily: "sans-serif" }}>{reader}</div>
                                : <div style={{ display: "flex" }} />}
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

function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Imagen compartible del reto de lectura (next/og). Usado por opengraph-image y
// la ruta /image. Mismas restricciones y assets que lib/quote-image.tsx.
import { ImageResponse } from "next/og";
import type { SharedChallenge } from "./shared-challenge";
import { ogLogo, ogFont } from "./og-assets";

const TEAL = "#336871";
const TEAL_DARK = "#234A4E";
const CORAL = "#D56962";
const CREAM = "#FFFAEF";

export type ChallengeImageFormat = "landscape" | "square";

const FORMATS: Record<ChallengeImageFormat, { width: number; height: number }> = {
    landscape: { width: 1200, height: 630 },
    square: { width: 1080, height: 1080 },
};

export function challengeImageResponse(ch: SharedChallenge, opts: { format?: ChallengeImageFormat } = {}) {
    const format = opts.format ?? "landscape";
    const size = FORMATS[format];
    const sq = format === "square";

    const pct = ch.target ? Math.min(100, Math.round((ch.booksRead / ch.target) * 100)) : 0;
    const achieved = ch.booksRead >= ch.target;
    const reader = ch.reader.name || (ch.reader.username ? `@${ch.reader.username}` : null);
    const barColor = achieved ? CORAL : TEAL;

    const logo = ogLogo();
    const font = ogFont();
    const serif = "'Playfair Display', Georgia, serif";

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

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: sq ? "64px 74px" : "56px 72px" }}>
                        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: TEAL, fontFamily: "sans-serif", fontWeight: 700 }}>
                            Reto de lectura {ch.year}
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", marginTop: sq ? 24 : 16 }}>
                            <div style={{ fontSize: sq ? 150 : 130, fontWeight: 700, color: TEAL_DARK, lineHeight: 1 }}>{ch.booksRead}</div>
                            <div style={{ fontSize: sq ? 52 : 46, color: "#6b7280", marginLeft: 20 }}>de {ch.target} libros</div>
                        </div>

                        <div style={{ display: "flex", width: "100%", height: 24, background: "rgba(51,104,113,0.12)", borderRadius: 999, marginTop: sq ? 44 : 34, overflow: "hidden" }}>
                            <div style={{ display: "flex", width: `${pct}%`, height: "100%", background: barColor, borderRadius: 999 }} />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: sq ? 48 : 40 }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: achieved ? CORAL : TEAL }}>
                                    {achieved ? "¡Reto conseguido!" : `${pct}%`}
                                </div>
                                {reader && <div style={{ display: "flex", fontSize: 22, color: "#9ca3af", marginTop: 8, fontFamily: "sans-serif" }}>{reader}</div>}
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

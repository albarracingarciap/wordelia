// Imagen compartible del "ADN lector" (next/og). Mismas restricciones/assets que
// lib/challenge-image.tsx (flex + inline styles, fuente y logo vía og-assets).
import { ImageResponse } from "next/og";
import type { ReaderDna } from "./reader-dna";
import { ogLogo, ogFont } from "./og-assets";

const TEAL = "#336871";
const TEAL_DARK = "#234A4E";
const CORAL = "#D56962";
const CREAM = "#FFFAEF";

export function readerDnaImageResponse(dna: ReaderDna) {
    const logo = ogLogo();
    const font = ogFont();
    const serif = "'Playfair Display', Georgia, serif";
    const genres = dna.topGenres.slice(0, 4);

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", background: CREAM, padding: 56, fontFamily: serif }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 60px rgba(35,74,78,0.10)" }}>
                    <div style={{ height: 12, background: `linear-gradient(90deg, ${TEAL}, ${CORAL})` }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 72px" }}>
                        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: CORAL, fontFamily: "sans-serif", fontWeight: 700 }}>
                            ADN lector
                        </div>
                        <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: TEAL_DARK, marginTop: 10, lineHeight: 1.05 }}>{dna.name}</div>
                        <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: TEAL, marginTop: 18 }}>{dna.personality.label}</div>

                        {genres.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 30 }}>
                                {genres.map((g) => (
                                    <div key={g.genre} style={{ display: "flex", background: "rgba(51,104,113,0.08)", color: TEAL, fontFamily: "sans-serif", fontSize: 24, fontWeight: 600, padding: "10px 20px", borderRadius: 999, marginRight: 12, marginBottom: 12 }}>
                                        {g.genre}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
                            <div style={{ display: "flex", fontSize: 26, color: "#6b7280", fontFamily: "sans-serif" }}>
                                {dna.booksRead} {dna.booksRead === 1 ? "libro leído" : "libros leídos"}
                                {dna.avgRating ? ` · ${dna.avgRating}★ de media` : ""}
                            </div>
                            {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} width={300} height={38} alt="Wordelia" />
                            ) : (
                                <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: TEAL }}>Wordelia</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: font ? [{ name: "Playfair Display", data: font, weight: 700 as const, style: "normal" as const }] : undefined,
        },
    );
}

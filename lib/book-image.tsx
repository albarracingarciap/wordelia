// Imagen OG de la ficha pública de libro (/libro/[id]): portada + título + rating.
import { ImageResponse } from "next/og";
import type { PublicBook } from "./public-book";
import { ogLogo, ogFont, ogRemoteImage } from "./og-assets";

const TEAL = "#336871";
const TEAL_DARK = "#234A4E";
const CORAL = "#D56962";
const CREAM = "#FFFAEF";

export async function bookImageResponse(book: PublicBook) {
    const cover = await ogRemoteImage(book.coverUrl);
    const logo = ogLogo();
    const font = ogFont();
    const serif = "'Playfair Display', Georgia, serif";
    const hasReviews = book.rating.count > 0;

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", background: CREAM, padding: 56, fontFamily: serif }}>
                <div style={{ flex: 1, display: "flex", background: "#ffffff", borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 60px rgba(35,74,78,0.10)" }}>
                    <div style={{ width: 14, background: `linear-gradient(180deg, ${TEAL}, ${CORAL})` }} />

                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 44, padding: "48px 56px" }}>
                        {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} width={300} height={450} alt="" style={{ borderRadius: 12, objectFit: "cover", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }} />
                        ) : (
                            <div style={{ display: "flex", width: 300, height: 450, borderRadius: 12, background: "rgba(51,104,113,0.1)" }} />
                        )}

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: TEAL, fontFamily: "sans-serif", fontWeight: 700 }}>
                                Reseñas en Wordelia
                            </div>

                            <div style={{ display: "flex", fontSize: book.title.length > 42 ? 48 : 60, fontWeight: 700, color: TEAL_DARK, lineHeight: 1.1, marginTop: 18 }}>
                                {book.title.length > 90 ? `${book.title.slice(0, 89)}…` : book.title}
                            </div>

                            {book.author && (
                                <div style={{ display: "flex", fontSize: 30, color: "#6b7280", marginTop: 12, fontFamily: "sans-serif" }}>{book.author}</div>
                            )}

                            <div style={{ display: "flex", alignItems: "baseline", marginTop: 28 }}>
                                {hasReviews ? (
                                    <>
                                        <div style={{ fontSize: 56, fontWeight: 700, color: CORAL }}>{book.rating.average}</div>
                                        <div style={{ fontSize: 28, color: "#9ca3af", marginLeft: 12, fontFamily: "sans-serif" }}>
                                            / 5 · {book.rating.count} reseña{book.rating.count === 1 ? "" : "s"}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: 30, color: "#9ca3af", fontFamily: "sans-serif" }}>Descúbrelo en profundidad</div>
                                )}
                            </div>

                            <div style={{ display: "flex", marginTop: 40 }}>
                                {logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logo} width={300} height={38} alt="Wordelia" />
                                ) : (
                                    <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: TEAL }}>Wordelia</div>
                                )}
                            </div>
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

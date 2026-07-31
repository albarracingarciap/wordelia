// Imagen compartible de un reto de comunidad (next/og). Usada por opengraph-image
// y la ruta /image de /reto-comunidad/[id]. Mismos assets que lib/challenge-image.tsx.
import { ImageResponse } from "next/og";
import type { SharedCommunityChallenge } from "./shared-community-challenge";
import { challengeGoalLabel } from "./challenges";
import { ogLogo, ogFont } from "./og-assets";

const TEAL = "#336871";
const TEAL_DARK = "#234A4E";
const CORAL = "#D56962";
const CREAM = "#FFFAEF";

export type CommunityChallengeImageFormat = "landscape" | "square";

const FORMATS: Record<CommunityChallengeImageFormat, { width: number; height: number }> = {
    landscape: { width: 1200, height: 630 },
    square: { width: 1080, height: 1080 },
};

export function communityChallengeImageResponse(ch: SharedCommunityChallenge, opts: { format?: CommunityChallengeImageFormat } = {}) {
    const format = opts.format ?? "landscape";
    const size = FORMATS[format];
    const sq = format === "square";

    const goal = challengeGoalLabel(ch.goalType, ch.goalTarget, ch.goalGenre);
    const originLabel = ch.origin === "community" ? "Reto de la comunidad" : "Reto de Wordelia";
    const titleSize = ch.title.length > 46 ? (sq ? 72 : 60) : ch.title.length > 26 ? (sq ? 92 : 78) : (sq ? 112 : 96);

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
                            {originLabel}
                        </div>

                        <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, color: TEAL_DARK, lineHeight: 1.05, marginTop: sq ? 28 : 20 }}>
                            {ch.title}
                        </div>

                        <div style={{ display: "flex", fontSize: sq ? 46 : 40, fontWeight: 700, color: CORAL, marginTop: sq ? 28 : 22 }}>
                            {goal}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: sq ? 48 : 40 }}>
                            <div style={{ display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
                                <div style={{ display: "flex", fontSize: 30, color: TEAL, fontWeight: 700 }}>
                                    {ch.participants} {ch.participants === 1 ? "participante" : "participantes"}
                                </div>
                                {ch.rewardBadgeName && (
                                    <div style={{ display: "flex", fontSize: 22, color: "#9ca3af", marginTop: 8 }}>Insignia: {ch.rewardBadgeName}</div>
                                )}
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

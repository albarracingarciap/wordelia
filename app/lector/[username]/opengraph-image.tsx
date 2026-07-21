import { ImageResponse } from "next/og";
import { getReaderDna } from "@/lib/reader-dna";
import { readerDnaImageResponse } from "@/lib/reader-dna-image";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const dna = await getReaderDna(username);

    if (!dna) {
        return new ImageResponse(
            (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFAEF", color: "#336871", fontSize: 64, fontWeight: 700, fontFamily: "Georgia, serif" }}>
                    Wordelia
                </div>
            ),
            { ...size },
        );
    }

    return readerDnaImageResponse(dna);
}

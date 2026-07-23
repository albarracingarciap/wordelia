import { ImageResponse } from "next/og";
import { fetchSharedWrapped } from "@/lib/shared-wrapped";
import { wrappedImageResponse } from "@/lib/wrapped-image";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const year = new Date().getFullYear();
    const w = await fetchSharedWrapped(username, year);

    if (!w) {
        return new ImageResponse(
            (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFAEF", color: "#336871", fontSize: 64, fontWeight: 700, fontFamily: "Georgia, serif" }}>
                    Wordelia
                </div>
            ),
            { ...size },
        );
    }

    return wrappedImageResponse(w);
}

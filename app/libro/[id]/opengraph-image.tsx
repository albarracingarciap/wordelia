import { ImageResponse } from "next/og";
import { fetchPublicBook } from "@/lib/public-book";
import { bookImageResponse } from "@/lib/book-image";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const book = await fetchPublicBook(id);

    if (!book) {
        return new ImageResponse(
            (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFAEF", color: "#336871", fontSize: 64, fontWeight: 700, fontFamily: "Georgia, serif" }}>
                    Wordelia
                </div>
            ),
            { ...size },
        );
    }

    return await bookImageResponse(book);
}

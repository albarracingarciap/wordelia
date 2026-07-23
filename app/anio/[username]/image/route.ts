import { fetchSharedWrapped } from "@/lib/shared-wrapped";
import { wrappedImageResponse } from "@/lib/wrapped-image";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const url = new URL(req.url);
    const now = new Date().getFullYear();
    const yearRaw = url.searchParams.get("year");
    const yearNum = yearRaw ? parseInt(yearRaw, 10) : now;
    const year = Number.isFinite(yearNum) && yearNum >= 2000 && yearNum <= now ? yearNum : now;

    const w = await fetchSharedWrapped(username, year);
    if (!w) return new Response("No encontrado", { status: 404 });

    const format = url.searchParams.get("format") === "square" ? "square" : "landscape";
    return wrappedImageResponse(w, { format });
}

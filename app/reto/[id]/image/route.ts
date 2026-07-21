import { fetchSharedChallenge } from "@/lib/shared-challenge";
import { challengeImageResponse } from "@/lib/challenge-image";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const ch = await fetchSharedChallenge(id);
    if (!ch) return new Response("No encontrado", { status: 404 });
    const format = new URL(req.url).searchParams.get("format") === "square" ? "square" : "landscape";
    return challengeImageResponse(ch, { format });
}

import { fetchSharedQuote } from "@/lib/shared-quote";
import { quoteImageResponse } from "@/lib/quote-image";

export const dynamic = "force-dynamic";

// PNG descargable de la cita (usado por el botón "Descargar imagen"). Reutiliza
// el mismo render que el opengraph-image.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const quote = await fetchSharedQuote(id);
    if (!quote) return new Response("No encontrada", { status: 404 });
    const format = new URL(req.url).searchParams.get("format") === "square" ? "square" : "landscape";
    return quoteImageResponse(quote, { format });
}

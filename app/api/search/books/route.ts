import { NextRequest, NextResponse } from "next/server";

import { searchBooks } from "@/lib/book-search";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const ALLOWED_LANGS = new Set(["spa", "cat", "es", "ca"]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;

    const query = (params.get("q") ?? "").trim();
    const langParam = (params.get("lang") ?? "").trim().toLowerCase();
    const page = clampInt(params.get("page"), 1, 1, 100);
    const requestedLimit = clampInt(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);

    if (!query) {
        return NextResponse.json(
            { error: "missing_query", message: "Parámetro `q` requerido." },
            { status: 400 },
        );
    }

    const languages = langParam && ALLOWED_LANGS.has(langParam)
        ? [normalizeLang(langParam)]
        : ["spa", "cat"];

    // Pedimos `requestedLimit * page` y recortamos manualmente.
    // searchBooks ya dedupe internamente, así que la paginación es estable.
    const offset = (page - 1) * requestedLimit;
    const fetched = await searchBooks({
        query,
        limit: offset + requestedLimit,
        languages,
    });

    const items = fetched.slice(offset, offset + requestedLimit);

    return NextResponse.json({
        query,
        page,
        limit: requestedLimit,
        count: items.length,
        hasMore: fetched.length > offset + requestedLimit,
        items,
    });
}

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
    if (!value) return fallback;
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function normalizeLang(lang: string): "spa" | "cat" {
    if (lang === "es" || lang === "spa") return "spa";
    return "cat";
}

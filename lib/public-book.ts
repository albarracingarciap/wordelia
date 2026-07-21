// Datos públicos de un libro para /libro/[id] (sin login). Server-only, service
// role: capa pública de reseñas. Solo libros del catálogo (UUID).
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };

export interface PublicReview {
    id: string;
    rating: number | null;
    content: string | null;
    type: string | null;
    containsSpoilers: boolean;
    emotionalTone: string | null;
    pace: string | null;
    recommendedFor: string | null;
    tags: string[];
    createdAt: string;
    helpfulCount: number;
    reader: { name: string | null; username: string | null; avatarUrl: string | null };
}

export interface PublicBook {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    year: number | null;
    coverUrl: string | null;
    preferredEditionId: string | null;
    rating: { average: number; count: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> };
    reviews: PublicReview[];
}

export async function fetchPublicBook(id: string): Promise<PublicBook | null> {
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: book } = await admin
        .from("books")
        .select("id, title, author, description, first_publication_year, preferred_edition_id")
        .eq("id", id)
        .maybeSingle();
    if (!book) return null;

    let coverUrl: string | null = null;
    if (book.preferred_edition_id) {
        const { data: ed } = await admin.from("editions").select("cover_url").eq("id", book.preferred_edition_id).maybeSingle();
        coverUrl = ed?.cover_url ?? null;
    }

    const { data: reviewRows } = await admin
        .from("reviews")
        .select("id, user_id, rating, content, type, contains_spoilers, emotional_tone, pace, recommended_for, tags, created_at")
        .eq("book_id", id)
        .order("created_at", { ascending: false })
        .limit(40);

    const rows = (reviewRows ?? []) as any[];

    // Reactores útiles + autores.
    const reviewIds = rows.map((r) => r.id);
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

    const [{ data: reactions }, { data: profiles }] = await Promise.all([
        reviewIds.length
            ? admin.from("review_reactions").select("review_id").eq("reaction_type", "helpful").in("review_id", reviewIds)
            : Promise.resolve({ data: [] }),
        userIds.length
            ? admin.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds)
            : Promise.resolve({ data: [] }),
    ]);

    const helpfulByReview = new Map<string, number>();
    for (const r of (reactions ?? []) as any[]) helpfulByReview.set(r.review_id, (helpfulByReview.get(r.review_id) ?? 0) + 1);
    const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let count = 0;
    for (const r of rows) {
        if (r.rating >= 1 && r.rating <= 5) {
            distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
            sum += r.rating;
            count += 1;
        }
    }

    const reviews: PublicReview[] = rows.map((r) => {
        const p = profileById.get(r.user_id);
        return {
            id: r.id,
            rating: r.rating ?? null,
            content: r.content ?? null,
            type: r.type ?? null,
            containsSpoilers: Boolean(r.contains_spoilers),
            emotionalTone: r.emotional_tone ?? null,
            pace: r.pace ?? null,
            recommendedFor: r.recommended_for ?? null,
            tags: Array.isArray(r.tags) ? r.tags : [],
            createdAt: r.created_at,
            helpfulCount: helpfulByReview.get(r.id) ?? 0,
            reader: {
                name: p?.full_name ?? null,
                username: p?.username ?? null,
                avatarUrl: p?.avatar_url ?? null,
            },
        };
    });

    return {
        id: book.id,
        title: book.title,
        author: book.author ?? null,
        description: book.description ?? null,
        year: book.first_publication_year ?? null,
        coverUrl,
        preferredEditionId: book.preferred_edition_id ?? null,
        rating: { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution },
        reviews,
    };
}

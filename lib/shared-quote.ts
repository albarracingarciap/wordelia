// Lectura de una cita compartible (book_notes pública). Server-only, service role:
// la página /cita/[id] es pública (sin login), pero SOLO sirve notas con
// is_private === false — las privadas nunca se filtran. Sin tabla ni flag nuevo.
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };

// El content de book_notes lleva el tipo como prefijo "[Cita] …" y las etiquetas
// al final ("\n\nTags: a, b"). Para mostrar la cita limpia hay que quitarlos.
export function cleanQuoteText(raw: string): string {
    return raw
        .replace(/^\s*\[[^\]]*\]\s*/, "")
        .replace(/\n\nTags:[\s\S]*$/, "")
        .trim();
}

export interface SharedQuote {
    id: string;
    content: string;
    chapter: string | null;
    pageNumber: number | null;
    createdAt: string;
    book: { id: string; title: string; author: string | null; coverUrl: string | null };
    reader: { name: string | null; username: string | null; avatarUrl: string | null };
}

export async function fetchSharedQuote(id: string): Promise<SharedQuote | null> {
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: note } = await admin
        .from("book_notes")
        .select("id, content, chapter, page_number, is_private, created_at, book_id, user_id")
        .eq("id", id)
        .maybeSingle();

    // Solo notas explícitamente públicas (Citas). null/true → no se sirve.
    if (!note || note.is_private !== false || !note.content) return null;

    const [{ data: book }, { data: reader }] = await Promise.all([
        admin.from("books").select("id, title, author, preferred_edition_id").eq("id", note.book_id).maybeSingle(),
        admin.from("profiles").select("full_name, username, avatar_url").eq("id", note.user_id).maybeSingle(),
    ]);

    let coverUrl: string | null = null;
    if (book?.preferred_edition_id) {
        const { data: ed } = await admin.from("editions").select("cover_url").eq("id", book.preferred_edition_id).maybeSingle();
        coverUrl = ed?.cover_url ?? null;
    }

    return {
        id: note.id,
        content: cleanQuoteText(note.content),
        chapter: note.chapter ?? null,
        pageNumber: note.page_number ?? null,
        createdAt: note.created_at,
        book: {
            id: book?.id ?? note.book_id,
            title: book?.title ?? "",
            author: book?.author ?? null,
            coverUrl,
        },
        reader: {
            name: reader?.full_name ?? null,
            username: reader?.username ?? null,
            avatarUrl: reader?.avatar_url ?? null,
        },
    };
}

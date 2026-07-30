"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { searchISBNdb } from "@/lib/isbndb";
import type { BookSearchResult } from "@/lib/isbndb";
import { attachEditionToBook } from "@/lib/editions";

export type QueueBook = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    coverUrl: string | null;
    collectionId: string | null;
    collectionName: string | null;
    published: boolean;
};

export type Collection = { id: string; name: string; slug: string };

type Result<T = undefined> = { success: true; data?: T } | { success: false; error: string };

// Las tablas de recursos y storage no están en los tipos generados; el cliente
// admin sí lo está, de ahí el cast puntual.
type LooseClient = {
    from: (table: string) => any;
    storage: { from: (bucket: string) => any };
};

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "admin") throw new Error("No autorizado");
}

function admin(): LooseClient {
    return createAdminClient() as unknown as LooseClient;
}

/**
 * Lee filas por lista de ids en lotes. PostgREST filtra con `.in()` vía query
 * string GET, así que una lista larga de UUIDs desborda el límite de longitud
 * de URL del proxy (HTTP 414). Troceamos para que la URL siempre quepa.
 * Además NO tragamos el error: si una query falla, se lanza (en vez de devolver
 * una lista vacía silenciosa que parece "0 libros").
 */
async function selectByIdChunks<T = any>(
    table: string,
    columns: string,
    ids: string[],
    chunkSize = 60,
): Promise<T[]> {
    if (ids.length === 0) return [];
    const db = admin();
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));

    const results = await Promise.all(
        chunks.map((chunk) => db.from(table).select(columns).in("id", chunk)),
    );

    const rows: T[] = [];
    for (const r of results) {
        if (r.error) throw new Error(`Error leyendo ${table}: ${r.error.message}`);
        rows.push(...((r.data ?? []) as T[]));
    }
    return rows;
}

/**
 * Cola de curación: los libros que tienen guía Y genoma, con lo que les falta.
 * Es el conjunto que puede aparecer en /explorar.
 */
export async function getCurationQueue(): Promise<{ books: QueueBook[]; collections: Collection[] }> {
    await assertAdmin();
    const db = admin();

    const [{ data: guides }, { data: chromos }] = await Promise.all([
        db.from("book_guides").select("book_id, status"),
        db.from("book_literary_chromosomes").select("book_id"),
    ]);

    const guideByBook = new Map<string, string>();
    for (const g of guides ?? []) if (g.book_id) guideByBook.set(g.book_id, g.status);

    const withGenome = new Set((chromos ?? []).map((c: any) => c.book_id).filter(Boolean));
    const bookIds = [...guideByBook.keys()].filter((id) => withGenome.has(id));

    if (bookIds.length === 0) return { books: [], collections: await listCollections() };

    const [books, { data: links }, collections] = await Promise.all([
        selectByIdChunks<any>("books", "id, title, author, genre, preferred_edition_id", bookIds),
        db.from("curated_collection_books")
            .select("book_id, collection_id, collection:curated_collections(id, name)")
            .not("book_id", "is", null),
        listCollections(),
    ]);

    const editionIds = books.map((b: any) => b.preferred_edition_id).filter(Boolean);
    const editions = await selectByIdChunks<any>("editions", "id, cover_url", editionIds);

    const coverByEdition = new Map<string, string | null>(
        editions.map((e: any) => [e.id, e.cover_url]),
    );
    const linkByBook = new Map<string, any>((links ?? []).map((l: any) => [l.book_id, l]));

    const queue: QueueBook[] = books.map((b: any) => {
        const link = linkByBook.get(b.id);
        return {
            id: b.id,
            title: b.title,
            author: b.author ?? null,
            genre: b.genre ?? null,
            coverUrl: b.preferred_edition_id ? coverByEdition.get(b.preferred_edition_id) ?? null : null,
            collectionId: link?.collection_id ?? null,
            collectionName: link?.collection?.name ?? null,
            published: guideByBook.get(b.id) === "published",
        };
    });

    queue.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "es"));
    return { books: queue, collections };
}

async function listCollections(): Promise<Collection[]> {
    const { data } = await admin()
        .from("curated_collections")
        .select("id, name, slug")
        .order("display_order", { ascending: true });
    return (data ?? []) as Collection[];
}

/** Busca ediciones en ISBNdb para que el administrador elija cuál usar. */
export async function searchEditions(query: string): Promise<Result<BookSearchResult[]>> {
    try {
        await assertAdmin();
        if (!query.trim()) return { success: true, data: [] };

        const results = await searchISBNdb(query.trim(), 1, 12);
        return { success: true, data: results };
    } catch (error) {
        console.error("searchEditions:", error);
        return { success: false, error: "No hemos podido buscar en ISBNdb." };
    }
}

/**
 * Asocia una edición de ISBNdb al libro y la marca como preferida. La lógica
 * (portada + upsert por ISBN) vive en lib/editions.ts, compartida con el
 * workspace de catálogo.
 */
export async function attachEdition(bookId: string, edition: BookSearchResult): Promise<Result> {
    try {
        await assertAdmin();
        await attachEditionToBook(admin(), bookId, edition, { setPreferred: true });
        revalidatePath("/app/admin/colecciones");
        return { success: true };
    } catch (error: any) {
        console.error("attachEdition:", error);
        return { success: false, error: error?.message || "No hemos podido guardar la edición." };
    }
}

/** Asigna (o quita) la colección del libro. Un libro, una colección. */
export async function setBookCollection(bookId: string, collectionId: string | null): Promise<Result> {
    try {
        await assertAdmin();
        const db = admin();

        const { error: delError } = await db.from("curated_collection_books")
            .delete().eq("book_id", bookId);
        if (delError) throw delError;

        if (collectionId) {
            const { error } = await db.from("curated_collection_books")
                .insert({ book_id: bookId, collection_id: collectionId, display_order: 0 });
            if (error) throw error;
        }

        revalidatePath("/app/admin/colecciones");
        return { success: true };
    } catch (error: any) {
        console.error("setBookCollection:", error);
        return { success: false, error: error?.message || "No hemos podido asignar la colección." };
    }
}

/**
 * Publica o retira guía y genoma a la vez: van juntos por definición del
 * conjunto que alimenta /explorar.
 */
export async function setPublished(bookId: string, published: boolean): Promise<Result> {
    try {
        await assertAdmin();
        const db = admin();

        const status = published ? "published" : "draft";
        // book_guides no tiene published_at; los cromosomas sí.
        const publishedAt = published ? new Date().toISOString() : null;

        const [{ error: gError }, { error: cError }] = await Promise.all([
            db.from("book_guides").update({ status }).eq("book_id", bookId),
            db.from("book_literary_chromosomes")
                .update({ status, published_at: publishedAt })
                .eq("book_id", bookId),
        ]);
        if (gError) throw gError;
        if (cError) throw cError;

        revalidatePath("/app/admin/colecciones");
        return { success: true };
    } catch (error: any) {
        console.error("setPublished:", error);
        return { success: false, error: error?.message || "No hemos podido cambiar el estado." };
    }
}

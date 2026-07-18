"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { searchISBNdb } from "@/lib/isbndb";
import type { BookSearchResult } from "@/lib/isbndb";

const COVERS_BUCKET = "book-covers";

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

    const [{ data: books }, { data: links }, collections] = await Promise.all([
        db.from("books").select("id, title, author, genre, preferred_edition_id").in("id", bookIds),
        db.from("curated_collection_books")
            .select("book_id, collection_id, collection:curated_collections(id, name)")
            .not("book_id", "is", null),
        listCollections(),
    ]);

    const editionIds = (books ?? []).map((b: any) => b.preferred_edition_id).filter(Boolean);
    const { data: editions } = editionIds.length
        ? await db.from("editions").select("id, cover_url").in("id", editionIds)
        : { data: [] };

    const coverByEdition = new Map<string, string | null>(
        (editions ?? []).map((e: any) => [e.id, e.cover_url]),
    );
    const linkByBook = new Map<string, any>((links ?? []).map((l: any) => [l.book_id, l]));

    const queue: QueueBook[] = (books ?? []).map((b: any) => {
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

    queue.sort((a, b) => a.title.localeCompare(b.title, "es"));
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
 * Descarga la portada al bucket propio. Devuelve la URL pública, o null si
 * falla: preferimos una edición sin portada a no crear la edición.
 */
async function storeCover(bookId: string, remoteUrl: string | null): Promise<string | null> {
    if (!remoteUrl) return null;

    try {
        const res = await fetch(remoteUrl);
        if (!res.ok) {
            console.warn(`storeCover: descarga fallida ${res.status} para ${remoteUrl}`);
            return null;
        }

        const contentType = res.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const buffer = Buffer.from(await res.arrayBuffer());
        const path = `${bookId}.${ext}`;

        const { error } = await admin().storage.from(COVERS_BUCKET)
            .upload(path, buffer, { contentType, upsert: true });

        if (error) {
            console.error("storeCover: subida fallida", error);
            return null;
        }

        const { data } = admin().storage.from(COVERS_BUCKET).getPublicUrl(path);
        return data?.publicUrl ?? null;
    } catch (error) {
        console.error("storeCover:", error);
        return null;
    }
}

/**
 * Asocia una edición de ISBNdb al libro: guarda la portada en el bucket, crea
 * (o actualiza) la fila en `editions` y la marca como edición preferida.
 */
export async function attachEdition(bookId: string, edition: BookSearchResult): Promise<Result> {
    try {
        await assertAdmin();
        const db = admin();

        const coverUrl = await storeCover(bookId, edition.cover_url);

        const payload = {
            book_id: bookId,
            isbn: edition.isbn ?? null,
            isbn13: edition.isbn13 ?? null,
            title: edition.title,
            cover_url: coverUrl ?? edition.cover_url ?? null,
            page_count: edition.page_count ?? null,
            published_date: edition.published_date ?? null,
            publication_year: edition.published_date
                ? Number(edition.published_date.slice(0, 4)) || null
                : null,
            language: edition.language ?? null,
            publisher: edition.publisher ?? null,
            source: "isbndb",
            source_id: edition.id ?? null,
        };

        // editions tiene índices únicos sobre isbn e isbn13: si ya existe esa
        // edición se actualiza en lugar de intentar duplicarla.
        const isbnKey = edition.isbn13 || edition.isbn;
        let editionId: string | null = null;

        if (isbnKey) {
            const { data: existing } = await db.from("editions")
                .select("id").or(`isbn13.eq.${isbnKey},isbn.eq.${isbnKey}`).maybeSingle();
            editionId = existing?.id ?? null;
        }

        if (editionId) {
            const { error } = await db.from("editions").update(payload).eq("id", editionId);
            if (error) throw error;
        } else {
            const { data, error } = await db.from("editions").insert(payload).select("id").single();
            if (error) throw error;
            editionId = data.id;
        }

        const { error: bookError } = await db.from("books")
            .update({ preferred_edition_id: editionId }).eq("id", bookId);
        if (bookError) throw bookError;

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

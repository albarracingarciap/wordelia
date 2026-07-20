"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getBookByISBN, searchISBNdb } from "@/lib/isbndb";
import type { BookSearchResult } from "@/lib/isbndb";
import { searchBooks as searchBooksCascade } from "@/lib/book-search";
import { matchAndPersistEdition } from "@/lib/edition-matching";
import { attachEditionToBook } from "@/lib/editions";
import { normalizeGenomeImport, unwrapGuidePayload, GUIDE_SECTIONS, CHROMOSOME_KEYS } from "@/lib/resources-schema";
import type { Json } from "@/types/supabase";
import { fetchBooksList, type BookListRow } from "./data";

type LooseClient = { from: (table: string) => any; storage: { from: (b: string) => any } };
function adminLoose(): LooseClient {
    return createAdminClient() as unknown as LooseClient;
}

export async function searchBooksAction(query: string) {
    if (!query || query.length < 3) return [];
    try {
        return await searchBooksCascade({ query, limit: 20 });
    } catch (error) {
        console.error("Search error:", error);
        throw new Error("Failed to search books");
    }
}

export async function getBookDetailsAction(isbn: string) {
    if (!isbn) return null;
    try {
        return await getBookByISBN(isbn);
    } catch (error) {
        console.error("Error fetching book details:", error);
        throw new Error("Failed to fetch book details");
    }
}

/**
 * Comprueba si un ISBN ya está en el catálogo. Ahora consulta `editions`
 * (donde viven los ISBN), no `books` (que ya no tiene columna isbn).
 */
export async function checkBookExistsAction(isbn: string) {
    const supabase = await createClient();
    const normalized = normalizeISBN(isbn) || isbn;
    const { data } = await supabase
        .from("editions")
        .select("id")
        .or(`isbn13.eq.${normalized},isbn.eq.${normalized}`)
        .maybeSingle();
    return !!data;
}

/**
 * Importa un libro al catálogo desde el panel de admin.
 * Delega en EditionMatchingService con bypassQuality:true (admin sabe lo que hace).
 * El campo `genome_data` se aplica directamente al `book` tras la creación si llega.
 */
export async function importBookAction(data: {
    title: string;
    description: string;
    cover_url: string;
    isbn: string;
    page_count: number;
    published_date: string;
    author_name: string;
    genome_data: Json;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return { error: "Permisos insuficientes" };
    }

    try {
        const normalizedIsbn = normalizeISBN(data.isbn);
        const isbn10 = normalizedIsbn && normalizedIsbn.length === 10 ? normalizedIsbn : null;
        const isbn13 = normalizedIsbn && normalizedIsbn.length === 13 ? normalizedIsbn : null;

        const outcome = await matchAndPersistEdition(
            {
                title: data.title,
                authorName: data.author_name || "Autor desconocido",
                description: data.description || null,
                coverUrl: data.cover_url || null,
                isbn: isbn10 || (isbn13 ? null : data.isbn || null),
                isbn13,
                language: null,
                publisher: null,
                publishedDate: data.published_date || null,
                pageCount: data.page_count || null,
                isAbridged: false,
                source: "manual",
                sourceId: null,
            },
            { bypassQuality: true },
        );

        let bookId: string | null;
        switch (outcome.kind) {
            case "matched":
            case "created":
            case "duplicate":
                bookId = outcome.bookId;
                break;
            case "queued":
                return { error: "El libro tiene varias coincidencias y necesita revisión manual." };
            case "rejected":
                return { error: `No se pudo importar: ${outcome.reasons.join(", ")}` };
        }

        if (!bookId) {
            return { error: "No se pudo resolver el book_id del libro importado." };
        }

        // Nota: el genoma NO es un campo del book. Vive en book_literary_chromosomes
        // y se importa desde el workspace del libro (importGenomeAction). El param
        // genome_data quedó obsoleto (books.genome_data no existe) y se ignora.

        revalidatePath("/app/admin/catalogo");
        return { success: true, bookId };
    } catch (e: unknown) {
        console.error("importBook Exception:", e);
        return { error: e instanceof Error ? e.message : "Unknown error occurred" };
    }
}

function normalizeISBN(value: string) {
    const normalized = value.replace(/[^0-9Xx]/g, "").toUpperCase();
    return normalized.length === 10 || normalized.length === 13 ? normalized : null;
}

// El Catálogo lo gestionan admin y editor (colaborador de contenido).
async function requireStaff() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
    if (profile?.role !== "admin" && profile?.role !== "editor") {
        throw new Error("Permisos insuficientes");
    }
}

// Búsqueda en vivo de la lista de libros internos (no ISBNdb).
export async function listBooksAction(query: string): Promise<{ books?: BookListRow[]; error?: string }> {
    try {
        await requireStaff();
        const books = await fetchBooksList(query);
        return { books };
    } catch (e) {
        console.error("listBooksAction:", e);
        return { error: "No se pudo cargar el catálogo." };
    }
}

export type BookMetadataInput = {
    title: string;
    author: string | null;
    genre: string | null;
    description: string | null;
    first_publication_year: number | null;
    original_title: string | null;
    original_language: string | null;
};

/** Edita los metadatos de la obra (tabla books) desde el workspace del libro. */
export async function updateBookMetadataAction(
    bookId: string,
    input: BookMetadataInput,
): Promise<{ success: true } | { error: string }> {
    try {
        await requireStaff();

        const title = input.title?.trim();
        if (!title) return { error: "El título no puede estar vacío." };

        const supabase = await createClient();
        const { error } = await supabase
            .from("books")
            .update({
                title,
                author: input.author?.trim() || null,
                genre: input.genre?.trim() || null,
                description: input.description?.trim() || null,
                first_publication_year: input.first_publication_year ?? null,
                original_title: input.original_title?.trim() || null,
                original_language: input.original_language?.trim() || null,
            })
            .eq("id", bookId);

        if (error) {
            console.error("updateBookMetadataAction:", error);
            return { error: "No se pudieron guardar los cambios." };
        }

        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true };
    } catch (e) {
        console.error("updateBookMetadataAction:", e);
        return { error: "No autorizado." };
    }
}

// ---------------------------------------------------------------------------
// Ediciones (workspace de libro)
// ---------------------------------------------------------------------------

type EditionResult = { success: true } | { error: string };

/** Busca ediciones en ISBNdb para añadir al libro. */
export async function searchEditionsAction(query: string): Promise<{ results?: BookSearchResult[]; error?: string }> {
    try {
        await requireStaff();
        const q = query.trim();
        if (!q) return { results: [] };
        const results = await searchISBNdb(q, 1, 12);
        return { results };
    } catch (e) {
        console.error("searchEditionsAction:", e);
        return { error: "No se pudo buscar en ISBNdb." };
    }
}

/** Añade una edición de ISBNdb al libro. La marca preferida si el libro no tenía. */
export async function addEditionAction(bookId: string, edition: BookSearchResult): Promise<EditionResult> {
    try {
        await requireStaff();
        const admin = adminLoose();
        const { data: book } = await admin.from("books").select("preferred_edition_id").eq("id", bookId).maybeSingle();
        await attachEditionToBook(admin, bookId, edition, { setPreferred: !book?.preferred_edition_id });
        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true };
    } catch (e: any) {
        console.error("addEditionAction:", e);
        return { error: e?.message || "No se pudo añadir la edición." };
    }
}

export async function setPreferredEditionAction(bookId: string, editionId: string): Promise<EditionResult> {
    try {
        await requireStaff();
        const admin = adminLoose();
        // Verifica que la edición pertenece al libro.
        const { data: ed } = await admin.from("editions").select("id").eq("id", editionId).eq("book_id", bookId).maybeSingle();
        if (!ed) return { error: "La edición no pertenece a este libro." };

        const { error } = await admin.from("books").update({ preferred_edition_id: editionId }).eq("id", bookId);
        if (error) throw error;
        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true };
    } catch (e: any) {
        console.error("setPreferredEditionAction:", e);
        return { error: e?.message || "No se pudo marcar como preferida." };
    }
}

export async function deleteEditionAction(bookId: string, editionId: string): Promise<EditionResult> {
    try {
        await requireStaff();
        const admin = adminLoose();

        // Si es la preferida, reasigna a otra (o null) antes de borrar.
        const { data: book } = await admin.from("books").select("preferred_edition_id").eq("id", bookId).maybeSingle();
        if (book?.preferred_edition_id === editionId) {
            const { data: others } = await admin
                .from("editions").select("id").eq("book_id", bookId).neq("id", editionId).limit(1);
            const fallback = others?.[0]?.id ?? null;
            await admin.from("books").update({ preferred_edition_id: fallback }).eq("id", bookId);
        }

        const { error } = await admin.from("editions").delete().eq("id", editionId).eq("book_id", bookId);
        if (error) {
            console.error("deleteEditionAction:", error);
            return { error: "No se pudo borrar: la edición puede estar en uso (clubs, lecturas)." };
        }
        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true };
    } catch (e: any) {
        console.error("deleteEditionAction:", e);
        return { error: e?.message || "No se pudo borrar la edición." };
    }
}

export type EditionFieldsInput = {
    title: string | null;
    publisher: string | null;
    language: string | null;
    page_count: number | null;
    publication_year: number | null;
    format: string | null;
    cover_url: string | null;
};

export async function updateEditionAction(
    bookId: string,
    editionId: string,
    fields: EditionFieldsInput,
): Promise<EditionResult> {
    try {
        await requireStaff();
        const admin = adminLoose();
        const { error } = await admin
            .from("editions")
            .update({
                title: fields.title?.trim() || null,
                publisher: fields.publisher?.trim() || null,
                language: fields.language?.trim() || null,
                page_count: fields.page_count ?? null,
                publication_year: fields.publication_year ?? null,
                format: fields.format?.trim() || null,
                cover_url: fields.cover_url?.trim() || null,
            })
            .eq("id", editionId)
            .eq("book_id", bookId);
        if (error) throw error;
        revalidatePath(`/app/admin/catalogo/${bookId}`);
        return { success: true };
    } catch (e: any) {
        console.error("updateEditionAction:", e);
        return { error: e?.message || "No se pudo actualizar la edición." };
    }
}

/** Colecciones curadas disponibles (para la pestaña Publicación). */
export async function listCollectionsAction(): Promise<{ collections?: { id: string; name: string }[]; error?: string }> {
    try {
        await requireStaff();
        const admin = adminLoose();
        const { data } = await admin
            .from("curated_collections")
            .select("id, name")
            .order("display_order", { ascending: true });
        return { collections: (data ?? []) as { id: string; name: string }[] };
    } catch (e) {
        console.error("listCollectionsAction:", e);
        return { error: "No se pudieron cargar las colecciones." };
    }
}

// ---------------------------------------------------------------------------
// Import de guía y genoma (JSON del script externo)
// ---------------------------------------------------------------------------

function parseJson(raw: string): { ok: true; value: any } | { ok: false; error: string } {
    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch {
        return { ok: false, error: "El JSON no es válido. Revisa la sintaxis." };
    }
}

export type ImportGuideResult =
    | { success: true; sections: string[]; extraKeys: string[] }
    | { error: string };

/** Importa/actualiza la guía de discusión de un libro desde JSON. Conserva el estado. */
export async function importGuideAction(bookId: string, raw: string): Promise<ImportGuideResult> {
    try {
        await requireStaff();

        const parsed = parseJson(raw);
        if (!parsed.ok) return { error: parsed.error };

        const guide = unwrapGuidePayload(parsed.value);
        if (!guide || typeof guide !== "object" || Array.isArray(guide)) {
            return { error: "La guía debe ser un objeto JSON con sus secciones." };
        }

        const keys = Object.keys(guide);
        if (keys.length === 0) return { error: "La guía está vacía." };

        const admin = adminLoose();
        const { data: existing } = await admin
            .from("book_guides")
            .select("id")
            .eq("book_id", bookId)
            .maybeSingle();

        if (existing) {
            const { error } = await admin
                .from("book_guides")
                .update({ discussion_guide: guide, updated_at: new Date().toISOString() })
                .eq("book_id", bookId);
            if (error) throw error;
        } else {
            const { error } = await admin
                .from("book_guides")
                .insert({ book_id: bookId, discussion_guide: guide, status: "draft" });
            if (error) throw error;
        }

        const known = new Set(GUIDE_SECTIONS.map((s) => s.key));
        const sections = keys.filter((k) => known.has(k));
        const extraKeys = keys.filter((k) => !known.has(k));

        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true, sections, extraKeys };
    } catch (e: any) {
        console.error("importGuideAction:", e);
        return { error: e?.message || "No se pudo importar la guía." };
    }
}

/** Guarda la guía completa desde el editor estructurado. Conserva el estado. */
export async function saveGuideAction(bookId: string, guide: unknown): Promise<{ success: true } | { error: string }> {
    try {
        await requireStaff();
        if (!guide || typeof guide !== "object" || Array.isArray(guide)) {
            return { error: "La guía debe ser un objeto." };
        }

        const admin = adminLoose();
        const { data: existing } = await admin
            .from("book_guides")
            .select("id")
            .eq("book_id", bookId)
            .maybeSingle();

        if (existing) {
            const { error } = await admin
                .from("book_guides")
                .update({ discussion_guide: guide, updated_at: new Date().toISOString() })
                .eq("book_id", bookId);
            if (error) throw error;
        } else {
            const { error } = await admin
                .from("book_guides")
                .insert({ book_id: bookId, discussion_guide: guide, status: "draft" });
            if (error) throw error;
        }

        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true };
    } catch (e: any) {
        console.error("saveGuideAction:", e);
        return { error: e?.message || "No se pudo guardar la guía." };
    }
}

export type ImportGenomeResult =
    | { success: true; imported: string[]; unknownKeys: string[] }
    | { error: string };

/** Importa/actualiza el genoma (8 cromosomas) de un libro desde JSON. Conserva el estado por cromosoma. */
export async function importGenomeAction(bookId: string, raw: string): Promise<ImportGenomeResult> {
    try {
        await requireStaff();

        const parsed = parseJson(raw);
        if (!parsed.ok) return { error: parsed.error };

        const { rows, unknownKeys } = normalizeGenomeImport(parsed.value);
        if (rows.length === 0) {
            return { error: "No se reconoció ningún cromosoma. Esperado: objeto {clave_cromosoma: datos} o array." };
        }

        const admin = adminLoose();
        const { data: existingRows } = await admin
            .from("book_literary_chromosomes")
            .select("chromosome_key")
            .eq("book_id", bookId);
        const existingKeys = new Set((existingRows ?? []).map((r: any) => r.chromosome_key));

        const now = new Date().toISOString();
        for (const row of rows) {
            if (existingKeys.has(row.chromosome_key)) {
                // Conserva status/version; solo refresca el contenido.
                const { error } = await admin
                    .from("book_literary_chromosomes")
                    .update({ chromosome_data: row.chromosome_data, updated_at: now })
                    .eq("book_id", bookId)
                    .eq("chromosome_key", row.chromosome_key);
                if (error) throw error;
            } else {
                const { error } = await admin.from("book_literary_chromosomes").insert({
                    book_id: bookId,
                    chromosome_key: row.chromosome_key,
                    chromosome_data: row.chromosome_data,
                    status: "draft",
                    generated_at: now,
                });
                if (error) throw error;
            }
        }

        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true, imported: rows.map((r) => r.chromosome_key), unknownKeys };
    } catch (e: any) {
        console.error("importGenomeAction:", e);
        return { error: e?.message || "No se pudo importar el genoma." };
    }
}

/** Guarda el chromosome_data completo de un cromosoma. Conserva estado/versión. */
export async function saveChromosomeAction(
    bookId: string,
    chromosomeKey: string,
    chromosomeData: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        await requireStaff();
        if (!(CHROMOSOME_KEYS as readonly string[]).includes(chromosomeKey)) {
            return { error: "Cromosoma no válido." };
        }
        if (!chromosomeData || typeof chromosomeData !== "object" || Array.isArray(chromosomeData)) {
            return { error: "El cromosoma debe ser un objeto." };
        }

        const admin = adminLoose();
        const { data: existing } = await admin
            .from("book_literary_chromosomes")
            .select("id")
            .eq("book_id", bookId)
            .eq("chromosome_key", chromosomeKey)
            .maybeSingle();

        if (existing) {
            const { error } = await admin
                .from("book_literary_chromosomes")
                .update({ chromosome_data: chromosomeData, updated_at: new Date().toISOString() })
                .eq("book_id", bookId)
                .eq("chromosome_key", chromosomeKey);
            if (error) throw error;
        } else {
            const { error } = await admin.from("book_literary_chromosomes").insert({
                book_id: bookId,
                chromosome_key: chromosomeKey,
                chromosome_data: chromosomeData,
                status: "draft",
                generated_at: new Date().toISOString(),
            });
            if (error) throw error;
        }

        revalidatePath(`/app/admin/catalogo/${bookId}`);
        revalidatePath("/app/admin/catalogo");
        return { success: true };
    } catch (e: any) {
        console.error("saveChromosomeAction:", e);
        return { error: e?.message || "No se pudo guardar el cromosoma." };
    }
}

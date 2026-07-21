"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { matchAndPersistEdition } from "@/lib/edition-matching";
import {
    IMPORT_BATCH_SIZE,
    RESERVED_SHELF_NAMES,
    type ParsedBook,
    type ImportBatchResult,
    type ImportOptions,
} from "@/lib/reading-import";

const MAX_FAILURES_REPORTED = 50;

/**
 * Importa un lote de registros a `user_books`: empareja/crea cada libro con
 * matchAndPersistEdition (solo BD, sin API externa) y lo añade a la estantería
 * del usuario. No pisa libros que ya tenga.
 */
export async function importReadingBatchAction(
    records: ParsedBook[],
    opts?: Partial<ImportOptions>,
): Promise<{ result?: ImportBatchResult; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (!Array.isArray(records)) return { error: "Datos inválidos" };

    const mode = opts?.mode === "update" ? "update" : "skip";
    const withShelves = opts?.withShelves === true;

    const batch = records.slice(0, IMPORT_BATCH_SIZE);
    const result: ImportBatchResult = { imported: 0, updated: 0, skippedExisting: 0, failed: 0, failures: [] };

    const fail = (title: string, reason: string) => {
        result.failed++;
        if (result.failures.length < MAX_FAILURES_REPORTED) result.failures.push({ title, reason });
    };

    // Colecciones (lists) del usuario: nombre(lower) → id. Se carga perezosamente
    // una vez por llamada; incluye las creadas en lotes anteriores, así no duplica.
    let shelfMap: Map<string, string> | null = null;
    const ensureShelf = async (name: string): Promise<string | null> => {
        if (!shelfMap) {
            const { data } = await supabase.from("lists").select("id, name").eq("user_id", user.id);
            shelfMap = new Map((data ?? []).map((l: any) => [String(l.name).toLowerCase(), l.id]));
        }
        const key = name.toLowerCase();
        const found = shelfMap.get(key);
        if (found) return found;
        const { data, error } = await supabase
            .from("lists")
            .insert({ user_id: user.id, name, is_public: false })
            .select("id")
            .single();
        if (error || !data) return null;
        shelfMap.set(key, data.id);
        return data.id;
    };

    const assignShelves = async (bookId: string, shelves: string[]) => {
        for (const raw of shelves) {
            const name = raw.trim();
            if (!name || RESERVED_SHELF_NAMES.has(name.toLowerCase())) continue;
            const listId = await ensureShelf(name);
            if (!listId) continue;
            const { error } = await supabase.from("list_items").insert({ list_id: listId, book_id: bookId });
            if (error && error.code !== "23505") {
                // 23505 = ya estaba en la colección; cualquier otro error se ignora
                // en silencio para no tumbar el libro por un fallo de colección.
                console.warn("assignShelves:", error.message);
            }
        }
    };

    for (const rec of batch) {
        try {
            if (!rec?.title) {
                fail(rec?.title ?? "(sin título)", "sin título");
                continue;
            }

            const outcome = await matchAndPersistEdition(
                {
                    title: rec.title,
                    authorName: rec.author || "Autor desconocido",
                    description: null,
                    coverUrl: null,
                    isbn: rec.isbn,
                    isbn13: rec.isbn13,
                    language: null,
                    publisher: null,
                    publishedDate: null,
                    pageCount: null,
                    isAbridged: false,
                    source: "manual",
                    sourceId: null,
                },
                { bypassQuality: true },
            );

            const bookId = "bookId" in outcome ? outcome.bookId : null;
            if (outcome.kind === "rejected" || !bookId) {
                fail(rec.title, outcome.kind === "rejected" ? outcome.reasons.join(", ") : `no emparejado (${outcome.kind})`);
                continue;
            }
            const editionId = "editionId" in outcome ? outcome.editionId : null;
            const rating = rec.rating != null ? Math.round(rec.rating) : null;

            const { data: existing } = await supabase
                .from("user_books")
                .select("id")
                .eq("user_id", user.id)
                .eq("book_id", bookId)
                .maybeSingle();

            if (existing) {
                if (mode === "update") {
                    const { error } = await supabase
                        .from("user_books")
                        .update({
                            status: rec.status,
                            rating,
                            review: rec.review,
                            start_date: rec.dateAdded,
                            finish_date: rec.dateRead,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", existing.id);
                    if (error) {
                        fail(rec.title, error.message);
                        continue;
                    }
                    result.updated++;
                } else {
                    result.skippedExisting++;
                }
            } else {
                const { error } = await supabase.from("user_books").insert({
                    user_id: user.id,
                    book_id: bookId,
                    edition_id: editionId,
                    status: rec.status,
                    rating,
                    review: rec.review,
                    start_date: rec.dateAdded,
                    finish_date: rec.dateRead,
                });
                if (error) {
                    fail(rec.title, error.message);
                    continue;
                }
                result.imported++;
            }

            if (withShelves && rec.shelves.length > 0) await assignShelves(bookId, rec.shelves);
        } catch (e: any) {
            fail(rec?.title ?? "(fila)", e?.message || "error");
        }
    }

    revalidatePath("/app/mi-lectura");
    return { result };
}

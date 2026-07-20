// Helpers compartidos para adjuntar ediciones de ISBNdb a un libro y guardar su
// portada en el bucket propio. Los usan tanto la curación (admin/colecciones)
// como el workspace de libro (admin/catalogo). Reciben el cliente admin (service
// role) ya creado; NO comprueban rol: eso lo hace cada llamante.
import type { BookSearchResult } from "@/lib/isbndb";

export const COVERS_BUCKET = "book-covers";

type LooseClient = {
    from: (table: string) => any;
    storage: { from: (bucket: string) => any };
};

/**
 * Descarga la portada al bucket propio y devuelve la URL pública, o null si
 * falla: preferimos una edición sin portada a no crearla.
 */
export async function storeCoverToBucket(
    admin: LooseClient,
    bookId: string,
    remoteUrl: string | null,
): Promise<string | null> {
    if (!remoteUrl) return null;

    try {
        const res = await fetch(remoteUrl);
        if (!res.ok) {
            console.warn(`storeCoverToBucket: descarga fallida ${res.status} para ${remoteUrl}`);
            return null;
        }

        const contentType = res.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const buffer = Buffer.from(await res.arrayBuffer());
        const path = `${bookId}.${ext}`;

        const { error } = await admin.storage
            .from(COVERS_BUCKET)
            .upload(path, buffer, { contentType, upsert: true });
        if (error) {
            console.error("storeCoverToBucket: subida fallida", error);
            return null;
        }

        const { data } = admin.storage.from(COVERS_BUCKET).getPublicUrl(path);
        return data?.publicUrl ?? null;
    } catch (error) {
        console.error("storeCoverToBucket:", error);
        return null;
    }
}

/**
 * Asocia una edición de ISBNdb a un libro: guarda la portada, crea (o actualiza
 * si el ISBN ya existe) la fila en `editions`, y opcionalmente la marca como
 * edición preferida del libro. Devuelve el id de la edición.
 */
export async function attachEditionToBook(
    admin: LooseClient,
    bookId: string,
    edition: BookSearchResult,
    opts: { setPreferred?: boolean } = {},
): Promise<string> {
    const coverUrl = await storeCoverToBucket(admin, bookId, edition.cover_url);

    const payload = {
        book_id: bookId,
        isbn: edition.isbn ?? null,
        isbn13: edition.isbn13 ?? null,
        title: edition.title,
        cover_url: coverUrl ?? edition.cover_url ?? null,
        page_count: edition.page_count ?? null,
        published_date: edition.published_date ?? null,
        publication_year: edition.published_date ? Number(edition.published_date.slice(0, 4)) || null : null,
        language: edition.language ?? null,
        publisher: edition.publisher ?? null,
        source: "isbndb",
        source_id: edition.id ?? null,
    };

    // editions tiene índices únicos sobre isbn e isbn13: si ya existe, se actualiza.
    const isbnKey = edition.isbn13 || edition.isbn;
    let editionId: string | null = null;

    if (isbnKey) {
        const { data: existing } = await admin
            .from("editions")
            .select("id")
            .or(`isbn13.eq.${isbnKey},isbn.eq.${isbnKey}`)
            .maybeSingle();
        editionId = existing?.id ?? null;
    }

    if (editionId) {
        const { error } = await admin.from("editions").update(payload).eq("id", editionId);
        if (error) throw error;
    } else {
        const { data, error } = await admin.from("editions").insert(payload).select("id").single();
        if (error) throw error;
        editionId = data.id;
    }

    if (opts.setPreferred) {
        const { error } = await admin.from("books").update({ preferred_edition_id: editionId }).eq("id", bookId);
        if (error) throw error;
    }

    return editionId as string;
}

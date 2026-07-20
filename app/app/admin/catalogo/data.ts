// Capa de datos del panel de gestión de libros (F0+). Server-only, service role:
// cruza books + editions + book_guides + book_literary_chromosomes +
// curated_collection_books, que no conceden SELECT global por RLS. Varias de esas
// tablas de recursos no están en los tipos generados, de ahí el cliente "loose".
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };
function db(): LooseClient {
    return createAdminClient() as unknown as LooseClient;
}

export interface BookListRow {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    year: number | null;
    coverUrl: string | null;
    guideStatus: "none" | "draft" | "published";
    genomeChromosomes: number;
    genomePublished: boolean;
    collectionName: string | null;
}

/** Lista de libros internos (máx. 60) con el estado de sus recursos. */
export async function fetchBooksList(query = ""): Promise<BookListRow[]> {
    const admin = db();

    let booksQuery = admin
        .from("books")
        .select("id, title, author, genre, first_publication_year, preferred_edition_id")
        .order("title", { ascending: true })
        .limit(60);

    const safe = query.replace(/[%,()]/g, " ").trim();
    if (safe) booksQuery = booksQuery.or(`title.ilike.%${safe}%,author.ilike.%${safe}%`);

    const { data: books, error } = await booksQuery;
    if (error || !books) {
        console.error("fetchBooksList: error", error);
        return [];
    }

    const ids = books.map((b: any) => b.id);
    if (ids.length === 0) return [];

    const editionIds = books.map((b: any) => b.preferred_edition_id).filter(Boolean);

    const [{ data: editions }, { data: guides }, { data: chromos }, { data: links }] = await Promise.all([
        editionIds.length
            ? admin.from("editions").select("id, cover_url").in("id", editionIds)
            : Promise.resolve({ data: [] }),
        admin.from("book_guides").select("book_id, status").in("book_id", ids),
        admin.from("book_literary_chromosomes").select("book_id, status").in("book_id", ids),
        admin
            .from("curated_collection_books")
            .select("book_id, collection:curated_collections(name)")
            .in("book_id", ids),
    ]);

    const coverByEdition = new Map<string, string | null>((editions ?? []).map((e: any) => [e.id, e.cover_url]));
    const guideByBook = new Map<string, string>((guides ?? []).map((g: any) => [g.book_id, g.status]));
    const collectionByBook = new Map<string, string | null>(
        (links ?? []).map((l: any) => [l.book_id, l.collection?.name ?? null]),
    );

    // Cromosomas: cuenta por libro + si alguno está publicado.
    const chromoCount = new Map<string, number>();
    const chromoPublished = new Set<string>();
    for (const c of (chromos ?? []) as any[]) {
        chromoCount.set(c.book_id, (chromoCount.get(c.book_id) ?? 0) + 1);
        if (c.status === "published") chromoPublished.add(c.book_id);
    }

    return books.map((b: any) => {
        const gStatus = guideByBook.get(b.id);
        return {
            id: b.id,
            title: b.title,
            author: b.author ?? null,
            genre: b.genre ?? null,
            year: b.first_publication_year ?? null,
            coverUrl: b.preferred_edition_id ? coverByEdition.get(b.preferred_edition_id) ?? null : null,
            guideStatus: gStatus === "published" ? "published" : gStatus ? "draft" : "none",
            genomeChromosomes: chromoCount.get(b.id) ?? 0,
            genomePublished: chromoPublished.has(b.id),
            collectionName: collectionByBook.get(b.id) ?? null,
        };
    });
}

export interface BookEdition {
    id: string;
    isbn: string | null;
    isbn13: string | null;
    title: string | null;
    cover_url: string | null;
    publisher: string | null;
    language: string | null;
    page_count: number | null;
    publication_year: number | null;
    format: string | null;
    source: string;
    isPreferred: boolean;
}

export interface BookWorkspace {
    book: {
        id: string;
        title: string;
        author: string | null;
        genre: string | null;
        description: string | null;
        first_publication_year: number | null;
        original_title: string | null;
        original_language: string | null;
        preferred_edition_id: string | null;
    };
    editions: BookEdition[];
    guide: { exists: boolean; status: string | null; updatedAt: string | null };
    genome: { chromosomes: number; published: boolean };
    collectionId: string | null;
}

/** Ficha completa de un libro para el workspace de gestión. */
export async function fetchBookWorkspace(bookId: string): Promise<BookWorkspace | null> {
    const admin = db();

    const { data: book } = await admin
        .from("books")
        .select("id, title, author, genre, description, first_publication_year, original_title, original_language, preferred_edition_id")
        .eq("id", bookId)
        .maybeSingle();

    if (!book) return null;

    const [{ data: editions }, { data: guide }, { data: chromos }, { data: link }] = await Promise.all([
        admin
            .from("editions")
            .select("id, isbn, isbn13, title, cover_url, publisher, language, page_count, publication_year, format, source")
            .eq("book_id", bookId)
            .order("created_at", { ascending: true }),
        admin.from("book_guides").select("status, updated_at").eq("book_id", bookId).maybeSingle(),
        admin.from("book_literary_chromosomes").select("status").eq("book_id", bookId),
        admin.from("curated_collection_books").select("collection_id").eq("book_id", bookId).maybeSingle(),
    ]);

    const chromoRows = (chromos ?? []) as any[];

    return {
        book,
        editions: (editions ?? []).map((e: any) => ({
            ...e,
            isPreferred: e.id === book.preferred_edition_id,
        })),
        guide: {
            exists: Boolean(guide),
            status: guide?.status ?? null,
            updatedAt: guide?.updated_at ?? null,
        },
        genome: {
            chromosomes: chromoRows.length,
            published: chromoRows.some((c) => c.status === "published"),
        },
        collectionId: link?.collection_id ?? null,
    };
}

export interface GuideContent {
    discussion_guide: any | null;
    status: string | null;
    updatedAt: string | null;
}

/** Contenido completo de la guía de un libro (para preview/edición). */
export async function fetchGuideContent(bookId: string): Promise<GuideContent | null> {
    const { data } = await db()
        .from("book_guides")
        .select("discussion_guide, status, updated_at")
        .eq("book_id", bookId)
        .maybeSingle();
    if (!data) return null;
    return {
        discussion_guide: data.discussion_guide ?? null,
        status: data.status ?? null,
        updatedAt: data.updated_at ?? null,
    };
}

export interface GenomeRow {
    chromosome_key: string;
    status: string | null;
    version: number | null;
    updatedAt: string | null;
    chromosome_data: any;
}

/** Filas completas del genoma (con chromosome_data) para checklist + edición. */
export async function fetchGenomeRows(bookId: string): Promise<GenomeRow[]> {
    const { data } = await db()
        .from("book_literary_chromosomes")
        .select("chromosome_key, status, version, updated_at, chromosome_data")
        .eq("book_id", bookId);
    return (data ?? []).map((c: any) => ({
        chromosome_key: c.chromosome_key,
        status: c.status ?? null,
        version: c.version ?? null,
        updatedAt: c.updated_at ?? null,
        chromosome_data: c.chromosome_data ?? {},
    }));
}

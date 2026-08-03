"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription-access";
import { selectInChunks } from "@/lib/supabase-chunks";

export type ResourceKind = "guide" | "genome";
export type ResourceAccessState = "admin" | "granted" | "requires_plan" | "locked";

// ¿Existe el recurso (genoma/guía) para este libro y bajo qué book_id? Devuelve
// también el book_id que REALMENTE tiene el recurso, porque un mismo libro puede
// existir como varias fichas (duplicados): el club puede leer una ficha sin
// recursos mientras el genoma/guía vive en otra ficha con el mismo ISBN. Usamos
// service role (solo booleanos/ids, no contenido; el acceso se gatea en destino).
export async function getBookResourceAvailability(
    bookId: string,
    isbn?: string | null,
): Promise<{ hasGenome: boolean; hasGuide: boolean; genomeBookId: string | null; guideBookId: string | null }> {
    const empty = { hasGenome: false, hasGuide: false, genomeBookId: null, guideBookId: null };
    if (!bookId) return empty;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const admin = createAdminClient() as unknown as { from: (t: string) => any };

    // Candidatos: la propia ficha del club + cualquier ficha que comparta ISBN.
    const candidateIds = new Set<string>([bookId]);
    const cleanIsbn = (isbn || "").replace(/[^0-9Xx]/g, "");
    if (cleanIsbn) {
        const { data: eds } = await admin
            .from("editions")
            .select("book_id")
            .or(`isbn13.eq.${cleanIsbn},isbn.eq.${cleanIsbn}`);
        for (const e of (eds ?? []) as { book_id: string | null }[]) {
            if (e.book_id) candidateIds.add(e.book_id);
        }
    }
    const ids = [...candidateIds];

    const firstWith = async (table: string): Promise<string | null> => {
        const { data } = await admin.from(table).select("book_id").in("book_id", ids).limit(1);
        return (data as { book_id: string }[] | null)?.[0]?.book_id ?? null;
    };

    const [genomeBookId, guideBookId] = await Promise.all([
        firstWith("book_literary_chromosomes"),
        firstWith("book_guides"),
    ]);

    return {
        hasGenome: !!genomeBookId,
        hasGuide: !!guideBookId,
        genomeBookId,
        guideBookId,
    };
}

export type ResourceBook = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    firstPublicationYear: number | null;
};

export type ResourceDetail = {
    kind: ResourceKind;
    book: ResourceBook;
    access: ResourceAccessState;
    canView: boolean;
    payload: unknown;
    row: Record<string, unknown>;
};

export type ResourceListItem = {
    book: ResourceBook;
    access: ResourceAccessState;
    href: string;
};

type ProfileAccessRow = {
    role?: string | null;
};

type ResourceRow = Record<string, unknown> & {
    book_id?: string | null;
};

type ResourceGrantRow = {
    book_id: string;
    resource_kind: ResourceKind;
};

type BookRow = {
    id: string;
    title?: string | null;
    author?: string | null;
    genre?: string | null;
    first_publication_year?: number | null;
};

type MaybeSingleBuilder<T> = {
    eq: (column: string, value: string) => MaybeSingleBuilder<T>;
    maybeSingle: () => Promise<{ data: T | null; error: { code?: string; message?: string } | null }>;
};

type SelectBuilder<T> = {
    eq: (column: string, value: string) => SelectBuilder<T>;
    in: (column: string, values: string[]) => SelectBuilder<T>;
    order: (column: string, options: { ascending: boolean }) => Promise<{ data: T[] | null; error: { code?: string; message?: string } | null }>;
    maybeSingle: () => Promise<{ data: T | null; error: { code?: string; message?: string } | null }>;
};

type GenericTable<T> = {
    select: (columns: string) => SelectBuilder<T> & MaybeSingleBuilder<T>;
};

function resourceTable(kind: ResourceKind) {
    return kind === "guide" ? "book_guides" : "book_literary_chromosomes";
}

function resourcePath(kind: ResourceKind) {
    return kind === "guide" ? "guias" : "genomas";
}

function getPayload(row: Record<string, unknown>) {
    const keys = [
        "guide_data",
        "guide",
        "content",
        "chromosome_data",
        "genome_data",
        "data",
        "analysis",
        "payload",
        "source_payload",
        "raw_payload",
    ];

    for (const key of keys) {
        const value = row[key];
        if (value !== null && value !== undefined) return value;
    }

    return row;
}

function getRowKey(row: ResourceRow, index: number) {
    const candidates = [
        row.chromosome_key,
        row.chromosome,
        row.key,
        row.type,
        row.name,
        row.slug,
    ];

    const key = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    return typeof key === "string" ? key : `recurso_${index + 1}`;
}

function getResourcePayload(kind: ResourceKind, rows: ResourceRow[]) {
    if (kind === "guide") {
        return getPayload(rows[0]);
    }

    if (rows.length === 1) {
        return getPayload(rows[0]);
    }

    return rows.reduce<Record<string, unknown>>((acc, row, index) => {
        acc[getRowKey(row, index)] = getPayload(row);
        return acc;
    }, {});
}

function mapBook(book: BookRow | null | undefined): ResourceBook {
    return {
        id: book?.id || "",
        title: book?.title || "Libro",
        author: book?.author || null,
        genre: book?.genre || null,
        firstPublicationYear: book?.first_publication_year || null,
    };
}

async function getAccessContext(userId: string) {
    const supabase = await createClient();
    const [profileResult, subscriptionResult] = await Promise.all([
        supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle(),
        supabase
            .from("user_subscriptions")
            .select("plan, status, current_period_end")
            .eq("user_id", userId)
            .maybeSingle(),
    ]);

    const profile = profileResult.data as ProfileAccessRow | null;
    const subscription = subscriptionResult.data as { plan: string; status: string; current_period_end: string | null } | null;

    // El acceso a recursos por plan requiere una suscripción de pago vigente. El
    // beneficio fundador NO concede plan: solo aporta clubs gratis, cuyo acceso a
    // la guía/genoma del libro se otorga por grant (user_book_resource_access).
    // Una suscripción cancelada mantiene acceso hasta el fin del periodo pagado.
    const plan = subscription && isSubscriptionActive(subscription.status, subscription.current_period_end)
        ? subscription.plan
        : null;
    const isAdmin = profile?.role === "admin" || profile?.role === "editor";

    return {
        isAdmin,
        plan,
        hasGuidePlan: plan === "ai",
        hasGenomePlan: plan === "voraz" || plan === "ai",
    };
}

async function getGrantMap(userId: string, bookIds: string[]) {
    if (bookIds.length === 0) return new Set<string>();

    const supabase = await createClient();
    const grantTable = supabase.from("user_book_resource_access" as never) as never as GenericTable<ResourceGrantRow>;
    // Troceado: bookIds puede ser todo el catálogo con recurso → evita 414.
    const { data, error } = await selectInChunks<ResourceGrantRow, { code?: string; message?: string }>(
        bookIds,
        (chunk) => grantTable
            .select("book_id, resource_kind")
            .eq("user_id", userId)
            .in("book_id", chunk)
            .order("book_id", { ascending: true }),
    );

    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
        console.error("[Resources] Error fetching grants:", error.message);
    }

    return new Set((data || []).map((row) => `${row.book_id}:${row.resource_kind}`));
}

function resolveAccess(
    kind: ResourceKind,
    bookId: string,
    context: Awaited<ReturnType<typeof getAccessContext>>,
    grants: Set<string>,
    freeSet: Set<string> = new Set()
): ResourceAccessState {
    if (context.isAdmin) return "admin";
    // Muestra gratis: accesible para cualquier usuario registrado.
    if (freeSet.has(`${bookId}:${kind}`)) return "granted";
    if (grants.has(`${bookId}:${kind}`)) return "granted";
    if (kind === "guide" && context.hasGuidePlan) return "granted";
    if (kind === "genome" && context.hasGenomePlan) return "granted";
    return "requires_plan";
}

export async function getResourceDetail(kind: ResourceKind, bookId: string): Promise<ResourceDetail | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const table = supabase.from(resourceTable(kind) as never) as never as GenericTable<ResourceRow>;
    const { data: resourceRows, error: resourceError } = await table
        .select("*")
        .eq("book_id", bookId)
        .order("book_id", { ascending: true });

    if (resourceError) {
        if (resourceError.code !== "42P01" && resourceError.code !== "PGRST205") {
            console.error("[Resources] Error fetching resource detail:", resourceError.message);
        }
        return null;
    }

    if (!resourceRows || resourceRows.length === 0) return null;

    const booksTable = supabase.from("books" as never) as never as GenericTable<BookRow>;
    const { data: book } = await booksTable
        .select("id, title, author, genre, first_publication_year")
        .eq("id", bookId)
        .maybeSingle();

    const context = await getAccessContext(user.id);
    const grants = await getGrantMap(user.id, [bookId]);
    // Muestra gratis: el recurso mismo trae is_free (select "*").
    const isFree = (resourceRows as Array<{ is_free?: boolean }>).some((r) => r?.is_free === true);
    const freeSet = isFree ? new Set([`${bookId}:${kind}`]) : new Set<string>();
    const access = resolveAccess(kind, bookId, context, grants, freeSet);

    return {
        kind,
        book: mapBook(book),
        access,
        canView: access === "admin" || access === "granted",
        payload: getResourcePayload(kind, resourceRows),
        row: resourceRows[0],
    };
}

export async function getResourceList(kind: ResourceKind): Promise<{ isAdmin: boolean; items: ResourceListItem[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, items: [] };

    const context = await getAccessContext(user.id);
    const resourceRowsTable = supabase.from(resourceTable(kind) as never) as never as GenericTable<ResourceRow & { is_free?: boolean }>;
    const { data: resources, error } = await resourceRowsTable
        .select("book_id, is_free")
        .order("book_id", { ascending: true });

    if (error) {
        if (error.code !== "42P01" && error.code !== "PGRST205") {
            console.error("[Resources] Error fetching resources:", error.message);
        }
        return { isAdmin: context.isAdmin, items: [] };
    }

    const bookIds = Array.from(new Set((resources || []).map((row) => row.book_id).filter((id): id is string => Boolean(id))));
    if (bookIds.length === 0) return { isAdmin: context.isAdmin, items: [] };

    // Recursos marcados como muestra gratis (accesibles para cualquiera).
    const freeSet = new Set(
        (resources || [])
            .filter((row) => row.is_free === true && row.book_id)
            .map((row) => `${row.book_id}:${kind}`)
    );

    const [grants, booksResult] = await Promise.all([
        getGrantMap(user.id, bookIds),
        // Troceado: bookIds = todo el catálogo con este recurso → evita 414.
        selectInChunks<BookRow, { code?: string; message?: string }>(
            bookIds,
            (chunk) => (supabase.from("books" as never) as never as GenericTable<BookRow>)
                .select("id, title, author, genre, first_publication_year")
                .in("id", chunk)
                .order("title", { ascending: true }),
        ),
    ]);

    const books = new Map((booksResult.data || []).map((book) => [book.id, mapBook(book)]));
    // Mostramos TODOS los recursos: los accesibles llevan al recurso; los
    // bloqueados llevan a desbloquear (comprar / plan), para que se descubran.
    const items = bookIds.map((bookId) => {
        const access = resolveAccess(kind, bookId, context, grants, freeSet);
        const accessible = access === "granted" || access === "admin";
        return {
            book: books.get(bookId) || mapBook({ id: bookId, title: "Libro" }),
            access,
            href: accessible
                ? `/app/recursos/${resourcePath(kind)}/${bookId}`
                : `/app/recursos/desbloquear?resource=${kind}&book=${bookId}`,
        };
    });

    return { isAdmin: context.isAdmin, items };
}

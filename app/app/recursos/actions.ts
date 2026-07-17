"use server";

import { createClient } from "@/utils/supabase/server";
import { isSubscriptionActive } from "@/lib/subscription-access";

export type ResourceKind = "guide" | "genome";
export type ResourceAccessState = "admin" | "granted" | "requires_plan" | "locked";

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
    const { data, error } = await grantTable
        .select("book_id, resource_kind")
        .eq("user_id", userId)
        .in("book_id", bookIds)
        .order("book_id", { ascending: true });

    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
        console.error("[Resources] Error fetching grants:", error.message);
    }

    return new Set((data || []).map((row) => `${row.book_id}:${row.resource_kind}`));
}

function resolveAccess(
    kind: ResourceKind,
    bookId: string,
    context: Awaited<ReturnType<typeof getAccessContext>>,
    grants: Set<string>
): ResourceAccessState {
    if (context.isAdmin) return "admin";
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
    const access = resolveAccess(kind, bookId, context, grants);

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
    const resourceRowsTable = supabase.from(resourceTable(kind) as never) as never as GenericTable<ResourceRow>;
    const { data: resources, error } = await resourceRowsTable
        .select("book_id")
        .order("book_id", { ascending: true });

    if (error) {
        if (error.code !== "42P01" && error.code !== "PGRST205") {
            console.error("[Resources] Error fetching resources:", error.message);
        }
        return { isAdmin: context.isAdmin, items: [] };
    }

    const bookIds = Array.from(new Set((resources || []).map((row) => row.book_id).filter((id): id is string => Boolean(id))));
    if (bookIds.length === 0) return { isAdmin: context.isAdmin, items: [] };

    const [grants, booksResult] = await Promise.all([
        getGrantMap(user.id, bookIds),
        (supabase.from("books" as never) as never as GenericTable<BookRow>)
            .select("id, title, author, genre, first_publication_year")
            .in("id", bookIds)
            .order("title", { ascending: true }),
    ]);

    const books = new Map((booksResult.data || []).map((book) => [book.id, mapBook(book)]));
    const items = bookIds
        .map((bookId) => {
            const access = resolveAccess(kind, bookId, context, grants);
            if (!context.isAdmin && access !== "granted") return null;

            return {
                book: books.get(bookId) || mapBook({ id: bookId, title: "Libro" }),
                access,
                href: `/app/recursos/${resourcePath(kind)}/${bookId}`,
            };
        })
        .filter((item): item is ResourceListItem => Boolean(item));

    return { isAdmin: context.isAdmin, items };
}

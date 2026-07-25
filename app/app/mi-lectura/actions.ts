"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isSubscriptionActive } from "@/lib/subscription-access";
import { bookAuthorName, bookAuthorLabel } from "@/lib/book-author";

// --- TYPES ---
export interface ReadingStats {
    streak: number;
    weeklyPages: number;
    activeClubs: number;
    totalSessions?: number;
    totalTime?: number;
}

export interface CurrentBook {
    id: string; // book_id
    title: string;
    author: string;
    coverUrl: string | null;
    status?: string; // e.g. 'READING', 'WANT_TO_READ'
    format?: 'paper' | 'ebook' | 'audio' | null;
    progress: {
        current: number;
        total: number | null;
        label: string;
        unit: 'PAGES' | 'PERCENT' | 'CHAPTERS' | 'TIME';
        /** Métrica canónica cross-formato (0-100). Fuente de verdad para barra y comparativas. */
        percent: number | null;
    };
    lastSession: string | null; // Date string
    club: { name: string; href: string } | null;
    shelves?: string[]; // IDs of custom lists this book belongs to
    emotionSummary?: {
        lastEmotion: string | null;
        lastIntensity: number | null;
        lastNote: string | null;
        count: number;
        dominantEmotion: string | null;
        timeline: Array<{
            id: string;
            emotion: string;
            intensity: number;
            note: string | null;
            currentPage: number | null;
            readingSessionId: string | null;
            createdAt: string;
        }>;
    };
    resources?: BookResourceAccess[];
}

export type ResourceKind = "guide" | "genome";

export type ResourceAccessState = "granted" | "admin" | "requires_purchase" | "requires_plan";

export interface BookResourceAccess {
    kind: ResourceKind;
    label: string;
    href: string;
    access: ResourceAccessState;
}

export interface ReaderResourceContext {
    isAdmin: boolean;
    plan: string | null;
    canAccessGuides: boolean;
    canAccessGenomes: boolean;
}

export interface Note {
    id: string;
    type: "Cita" | "Idea" | "Pregunta" | "Personaje" | "Subrayado" | "Nota";
    content: string;
    bookTitle: string;
    bookAuthor: string;
    location?: string;
    tags?: string[];
    isPrivate?: boolean;
    date: string;
    // Legacy/deprecated fields for backward compatibility
    bookId?: string;
    book?: string;
    snippet?: string;
}

export interface Review {
    id: string;
    bookId: string;
    userId: string;
    user: {
        name: string;
        avatarUrl: string | null;
    };
    rating: number; // 1-5
    content: string;
    type: 'STANDARD' | 'FIRST_IMPRESSIONS';
    date: string;
    isMyReview?: boolean;
    containsSpoilers?: boolean;
    emotionalTone?: string | null;
    pace?: string | null;
    recommendedFor?: string | null;
    tags?: string[];
    helpfulCount?: number;
    isHelpfulByMe?: boolean;
}

export interface ReviewQualityPayload {
    containsSpoilers?: boolean;
    emotionalTone?: string | null;
    pace?: string | null;
    recommendedFor?: string | null;
    tags?: string[];
}

export interface ReviewWithBook extends Review {
    book: {
        id: string;
        title: string;
        coverUrl: string | null;
        author: string | null;
    };
}

export interface BookReviewOverview {
    averageRating: number;
    totalReviews: number;
    finalReviewsCount: number;
    firstImpressionsCount: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
    featuredReviews: Review[];
    firstImpressions: Review[];
}

export interface RecommendedBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    addedDate: string;
}

export interface Shelf {
    id: string;
    name: string;
    count: number;
}

export interface EmotionBookGroup {
    emotion: string;
    count: number;
    books: Array<{
        id: string;
        title: string;
        author: string;
        coverUrl: string | null;
        intensity: number;
    }>;
}

const USER_BOOK_EMOTIONS = [
    "asombro",
    "tristeza",
    "enojo",
    "miedo",
    "alegria",
    "disgusto",
    "empatia",
    "confusion",
    "esperanza",
] as const;

type UserBookEmotion = typeof USER_BOOK_EMOTIONS[number];

// --- EXISTING DASHBOARD ACTIONS ---

export async function getReadingStats(): Promise<ReadingStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { streak: 0, weeklyPages: 0, activeClubs: 0 };

    // 1. Weekly Pages
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: sessions, error: sessionError } = await supabase
        .from("reading_sessions")
        .select("pages_read, start_time")
        .eq("user_id", user.id)
        .gte("start_time", oneWeekAgo.toISOString());

    if (sessionError) console.error("Error fetching sessions:", sessionError);

    const weeklyPages = sessions?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0;

    // 2. Streak Calculation (Real Logic)
    // We fetch sessions from the last 30 days to check daily continuity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSessions } = await supabase
        .from("reading_sessions")
        .select("start_time")
        .eq("user_id", user.id)
        .gte("start_time", thirtyDaysAgo.toISOString())
        .order("start_time", { ascending: false });

    let streak = 0;
    if (recentSessions && recentSessions.length > 0) {
        // Extract unique days (YYYY-MM-DD)
        const uniqueDays = Array.from(new Set(
            recentSessions.map(s => new Date(s.start_time).toISOString().split('T')[0])
        )).sort().reverse(); // Descending order

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if streak is active (read today or yesterday)
        if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
            streak = 1;
            // Iterate backwards to find consecutive days
            let lastDate = new Date(uniqueDays[0]);

            for (let i = 1; i < uniqueDays.length; i++) {
                const currentDate = new Date(uniqueDays[i]);
                const diffTime = Math.abs(lastDate.getTime() - currentDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    streak++;
                    lastDate = currentDate;
                } else {
                    break;
                }
            }
        }
    }

    // 3. Total Stats (Sessions & Time)
    const { data: allSessions } = await supabase
        .from("reading_sessions")
        .select("duration_seconds")
        .eq("user_id", user.id);

    const totalSessions = allSessions?.length || 0;
    const totalSeconds = allSessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
    const totalMinutes = Math.round(totalSeconds / 60);

    // 4. Active Clubs
    const { count: activeClubsCount, error: activeClubsError } = await supabase
        .from("club_members")
        .select("club_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("role", "pending");

    if (activeClubsError) console.error("Error fetching active clubs:", activeClubsError);

    return {
        streak,
        weeklyPages,
        activeClubs: activeClubsCount || 0,
        totalSessions,
        totalTime: totalMinutes
    };
}

export async function getCurrentBooks(): Promise<CurrentBook[]> {
    // This function is used by the Dashboard (Home) to show "Now Reading"
    return getLibraryBooks({ status: 'READING' });
}

export async function getReaderResourceContext(): Promise<ReaderResourceContext> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            isAdmin: false,
            plan: null,
            canAccessGuides: false,
            canAccessGenomes: false,
        };
    }

    const { isAdmin, plan, hasGuidePlan, hasGenomePlan } = await getAccessContext(supabase, user.id);

    return {
        isAdmin,
        plan,
        canAccessGuides: isAdmin || hasGuidePlan,
        canAccessGenomes: isAdmin || hasGenomePlan,
    };
}

// --- NEW SMART SHELVES ACTIONS ---

type FilterOptions = {
    status?: string; // 'READING', 'WANT_TO_READ', 'READ', 'PAUSED', 'DNF', 'ALL'
    shelfId?: string; // UUID of a specific list
    query?: string;
    sort?: 'recent' | 'title' | 'author';
};

type Relation<T> = T | T[] | null | undefined;

type LibraryEditionRelation = {
    id?: string | null;
    isbn13?: string | null;
    isbn?: string | null;
    cover_url?: string | null;
    page_count?: number | null;
};

type LibraryAuthorRelation = {
    name?: string | null;
};

type LibraryBookRelation = {
    id?: string | null;
    title?: string | null;
    authors?: Relation<LibraryAuthorRelation>;
    preferred_edition?: Relation<LibraryEditionRelation>;
};

type LibraryUserBookRow = {
    book_id: string;
    edition_id?: string | null;
    status?: string | null;
    format?: string | null;
    current_page?: number | null;
    progress_percent?: number | null;
    audio_total_seconds?: number | null;
    updated_at?: string | null;
    created_at?: string | null;
    user_edition?: Relation<LibraryEditionRelation>;
    books?: Relation<LibraryBookRelation>;
};

type ShelfItemRow = {
    list_id: string;
};

type ProfileAccessRow = {
    role?: string | null;
};

type ResourceGrantRow = {
    book_id: string;
    resource_kind: ResourceKind;
};

export async function getLibraryBooks(filters: FilterOptions = {}): Promise<CurrentBook[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
        .from("user_books")
        .select(`
            book_id,
            edition_id,
            status,
            format,
            current_page,
            progress_percent,
            audio_total_seconds,
            updated_at,
            created_at,
            user_edition:editions!user_books_edition_id_fkey (id, isbn13, isbn, cover_url, page_count),
            books (
                id,
                title,
                preferred_edition:editions!books_preferred_edition_fk (id, isbn13, isbn, cover_url, page_count),
                author
            )
        `)
        .eq("user_id", user.id);

    // 1. Status Filter
    if (filters.status && filters.status !== 'ALL') {
        const statusMap: Record<string, string> = {
            'toread': 'WANT_TO_READ',
            'reading': 'READING',
            'read': 'READ',
            'paused': 'PAUSED',
            'abandoned': 'DNF',
            // Direct matches
            'WANT_TO_READ': 'WANT_TO_READ',
            'READING': 'READING',
            'READ': 'READ',
            'PAUSED': 'PAUSED',
            'DNF': 'DNF'
        };
        const dbStatus = statusMap[filters.status] || filters.status;
        query = query.eq("status", dbStatus);
    }

    // 2. Custom Shelf Filter logic requires a different query structure (join lists)
    // If shelfId is provided, we first get the book_ids from list_items
    if (filters.shelfId) {
        const { data: listItems } = await supabase
            .from("list_items")
            .select("book_id")
            .eq("list_id", filters.shelfId);

        if (listItems && listItems.length > 0) {
            const bookIds = listItems.map(i => i.book_id);
            query = query.in("book_id", bookIds);
        } else {
            return []; // Shelf is empty
        }
    }

    // Execute Base Query
    const { data: userBooks, error } = await query;

    if (error) {
        console.error("Error fetching library books:", error);
        return [];
    }
    if (!userBooks) return [];

    const userBookRows = userBooks as unknown as LibraryUserBookRow[];
    const bookIds = userBookRows.map((ub) => ub.book_id).filter(Boolean);
    const emotionSummaries: Record<string, CurrentBook["emotionSummary"]> = {};
    const resourceAccessByBook = bookIds.length > 0
        ? await getBookResourceAccessForUser(supabase, user.id, bookIds)
        : {};

    if (bookIds.length > 0) {
        const { data: emotions, error: emotionsError } = await supabase
            .from("user_book_emotions")
            .select("id, book_id, emotion, intensity, note, current_page, reading_session_id, created_at")
            .eq("user_id", user.id)
            .in("book_id", bookIds)
            .order("created_at", { ascending: false });

        if (emotionsError) {
            if (emotionsError.code !== "42P01" && emotionsError.code !== "PGRST205") {
                console.error("Error fetching book emotions:", emotionsError);
            }
        } else {
            for (const emotion of emotions || []) {
                const bookId = emotion.book_id as string;
                const current = emotionSummaries[bookId];
                const nextTimeline = [
                    ...(current?.timeline || []),
                    {
                        id: emotion.id,
                        emotion: emotion.emotion,
                        intensity: emotion.intensity,
                        note: emotion.note || null,
                        currentPage: emotion.current_page || null,
                        readingSessionId: emotion.reading_session_id || null,
                        createdAt: emotion.created_at,
                    },
                ];
                const emotionCounts = nextTimeline.reduce((acc: Record<string, number>, item) => {
                    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
                    return acc;
                }, {});
                const dominantEmotion = Object.entries(emotionCounts)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

                emotionSummaries[bookId] = {
                    lastEmotion: current?.lastEmotion || emotion.emotion,
                    lastIntensity: current?.lastIntensity || emotion.intensity,
                    lastNote: current?.lastNote || emotion.note || null,
                    count: (current?.count || 0) + 1,
                    dominantEmotion,
                    timeline: nextTimeline.slice(0, 8),
                };
            }
        }
    }

    // Client-side filtering for Search (Title/Author) 
    // Ideally we do this in DB with text search, but for <1000 books client/server filter is fine
    let filteredResults = userBookRows;
    if (filters.query) {
        const q = filters.query.toLowerCase();
        filteredResults = userBookRows.filter((ub) => {
            const book = firstRelation(ub.books);
            return (
                (book?.title || "").toLowerCase().includes(q) ||
                (bookAuthorName(book) || "").toLowerCase().includes(q)
            );
        });
    }

    // Sorting
    if (filters.sort === 'title') {
        filteredResults.sort((a, b) => (firstRelation(a.books)?.title || "").localeCompare(firstRelation(b.books)?.title || ""));
    } else if (filters.sort === 'author') {
        filteredResults.sort((a, b) => {
            const authorA = firstRelation(firstRelation(a.books)?.authors)?.name || "";
            const authorB = firstRelation(firstRelation(b.books)?.authors)?.name || "";
            return authorA.localeCompare(authorB);
        });
    } else {
        // Default: Recent (updated_at)
        filteredResults.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
    }

    // Map to CurrentBook
    const books: CurrentBook[] = await Promise.all(filteredResults.map(async (ub) => {
        // TODO: optimize creating a map of shelves for all books in one go instead of N+1
        const { data: myShelves } = await supabase
            .from("list_items")
            .select("list_id")
            .eq("book_id", ub.book_id);

        const book = firstRelation(ub.books);
        const author = firstRelation(book?.authors);
        const preferredEdition = firstRelation(book?.preferred_edition);
        const userEdition = firstRelation(ub.user_edition);
        const edition = userEdition || preferredEdition;
        const pageCount = edition?.page_count ?? null;
        const format = (ub.format as CurrentBook["format"]) ?? null;
        const progress = buildProgress(format, {
            currentPage: ub.current_page ?? null,
            pageCount,
            progressPercent: ub.progress_percent != null ? Number(ub.progress_percent) : null,
            audioTotalSeconds: ub.audio_total_seconds ?? null,
        });

        return {
            id: ub.book_id,
            title: book?.title || "Libro",
            author: bookAuthorLabel(book, "Autor Desconocido"),
            coverUrl: edition?.cover_url ?? null,
            status: ub.status || undefined,
            format,
            progress,
            lastSession: ub.updated_at ? new Date(ub.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : null,
            club: null,
            shelves: (myShelves as ShelfItemRow[] | null)?.map((s) => s.list_id) || [],
            emotionSummary: emotionSummaries[ub.book_id] || {
                lastEmotion: null,
                lastIntensity: null,
                lastNote: null,
                count: 0,
                dominantEmotion: null,
                timeline: [],
            },
            resources: resourceAccessByBook[ub.book_id] || [],
        };
    }));

    return books;
}

async function getBookResourceAccessForUser(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    bookIds: string[]
): Promise<Record<string, BookResourceAccess[]>> {
    const uniqueBookIds = Array.from(new Set(bookIds.filter(Boolean)));
    if (uniqueBookIds.length === 0) return {};

    const [accessContext, guidesResult, genomesResult, grantsResult] = await Promise.all([
        getAccessContext(supabase, userId),
        (supabase.from("book_guides" as never) as never as {
            select: (columns: string) => {
                in: (column: string, values: string[]) => Promise<{
                    data: Array<{ book_id: string }> | null;
                    error: { code?: string; message?: string } | null;
                }>;
            };
        })
            .select("book_id")
            .in("book_id", uniqueBookIds),
        (supabase.from("book_literary_chromosomes" as never) as never as {
            select: (columns: string) => {
                in: (column: string, values: string[]) => Promise<{
                    data: Array<{ book_id: string }> | null;
                    error: { code?: string; message?: string } | null;
                }>;
            };
        })
            .select("book_id")
            .in("book_id", uniqueBookIds),
        (supabase.from("user_book_resource_access" as never) as never as {
            select: (columns: string) => {
                eq: (column: string, value: string) => {
                    in: (column: string, values: string[]) => Promise<{
                        data: ResourceGrantRow[] | null;
                        error: { code?: string; message?: string } | null;
                    }>;
                };
            };
        })
            .select("book_id, resource_kind")
            .eq("user_id", userId)
            .in("book_id", uniqueBookIds),
    ]);

    if (guidesResult.error && guidesResult.error.code !== "42P01" && guidesResult.error.code !== "PGRST205") {
        console.error("[Resources] Error fetching discussion guides:", guidesResult.error.message);
    }

    if (genomesResult.error && genomesResult.error.code !== "42P01" && genomesResult.error.code !== "PGRST205") {
        console.error("[Resources] Error fetching literary genomes:", genomesResult.error.message);
    }

    if (grantsResult.error && grantsResult.error.code !== "42P01" && grantsResult.error.code !== "PGRST205") {
        console.error("[Resources] Error fetching resource grants:", grantsResult.error.message);
    }

    const { isAdmin, hasGuidePlan, hasGenomePlan } = accessContext;
    const guideBookIds = new Set((guidesResult.data || []).map((row) => row.book_id));
    const genomeBookIds = new Set((genomesResult.data || []).map((row) => row.book_id));
    const grantedResources = new Set((grantsResult.data || []).map((row) => `${row.book_id}:${row.resource_kind}`));
    const resourcesByBook: Record<string, BookResourceAccess[]> = {};

    for (const bookId of uniqueBookIds) {
        const resources: BookResourceAccess[] = [];
        const hasGuideGrant = grantedResources.has(`${bookId}:guide`);
        const hasGenomeGrant = grantedResources.has(`${bookId}:genome`);

        if (guideBookIds.has(bookId)) {
            resources.push({
                kind: "guide",
                label: "Guia de discusion",
                href: isAdmin || hasGuideGrant || hasGuidePlan ? `/app/recursos/guias/${bookId}` : `/app/recursos/desbloquear?resource=guide&book=${bookId}`,
                access: isAdmin ? "admin" : hasGuideGrant || hasGuidePlan ? "granted" : "requires_plan",
            });
        }

        if (genomeBookIds.has(bookId)) {
            resources.push({
                kind: "genome",
                label: "Genoma literario",
                href: isAdmin || hasGenomeGrant || hasGenomePlan ? `/app/recursos/genomas/${bookId}` : `/app/recursos/desbloquear?resource=genome&book=${bookId}`,
                access: isAdmin ? "admin" : hasGenomeGrant || hasGenomePlan ? "granted" : "requires_plan",
            });
        }

        if (resources.length > 0) {
            resourcesByBook[bookId] = resources;
        }
    }

    return resourcesByBook;
}

async function getAccessContext(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
): Promise<{ isAdmin: boolean; plan: string | null; hasGuidePlan: boolean; hasGenomePlan: boolean }> {
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
    const isAdmin = profile?.role === "admin" || profile?.role === "editor";

    // El acceso a recursos por plan requiere una suscripción de pago vigente. El
    // beneficio fundador NO concede plan: solo aporta clubs gratis, cuyo acceso a
    // la guía/genoma del libro se otorga por grant (user_book_resource_access).
    // Una suscripción cancelada mantiene acceso hasta el fin del periodo pagado.
    const plan = subscription && isSubscriptionActive(subscription.status, subscription.current_period_end)
        ? subscription.plan
        : null;

    return {
        isAdmin,
        plan,
        hasGuidePlan: plan === "ai",
        hasGenomePlan: plan === "voraz" || plan === "ai",
    };
}

export async function getUserShelves(): Promise<Shelf[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: lists } = await supabase
        .from("lists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

    if (!lists) return [];

    // Count items (could be optimized with a join count)
    const shelvesWithCount = await Promise.all(lists.map(async (list) => {
        const { count } = await supabase
            .from("list_items")
            .select("*", { count: 'exact', head: true })
            .eq("list_id", list.id);

        return {
            id: list.id,
            name: list.name,
            count: count || 0
        };
    }));

    return shelvesWithCount;
}

export async function createShelf(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Utenticado" };

    const { error } = await supabase
        .from("lists")
        .insert({
            user_id: user.id,
            name: name,
            is_public: false
        });

    if (error) return { error: error.message };
    revalidatePath("/app/mi-lectura");
    return { success: true };
}

export async function addBookToShelf(bookId: string, shelfId: string) {
    const supabase = await createClient();

    // Check if exists
    const { error } = await supabase
        .from("list_items")
        .insert({
            list_id: shelfId,
            book_id: bookId
        });

    if (error) {
        if (error.code === '23505') return { success: true }; // Already exists (unique constraint)
        return { error: error.message };
    }

    revalidatePath("/app/mi-lectura");
    return { success: true };
}

export async function saveUserBookEmotion(
    bookId: string,
    emotion: string,
    intensity: number,
    note?: string,
    readingSessionId?: string | null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const cleanEmotion = USER_BOOK_EMOTIONS.includes(emotion as UserBookEmotion)
        ? emotion as UserBookEmotion
        : null;

    if (!bookId || !cleanEmotion) {
        return { error: "Selecciona una emoción válida." };
    }

    const safeIntensity = Math.max(1, Math.min(5, Math.round(Number(intensity) || 3)));

    const { data: userBook } = await supabase
        .from("user_books")
        .select("id, current_page")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    const { error } = await supabase
        .from("user_book_emotions")
        .insert({
            user_id: user.id,
            book_id: bookId,
            user_book_id: userBook?.id || null,
            emotion: cleanEmotion,
            intensity: safeIntensity,
            note: note?.trim() || null,
            current_page: userBook?.current_page || null,
            reading_session_id: readingSessionId || null,
        });

    if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
            return { error: "Aplica la migración de emociones personales antes de registrar emociones." };
        }
        console.error("Error saving user book emotion:", error);
        return { error: "No hemos podido guardar la emoción." };
    }

    revalidatePath("/app/mi-lectura");
    return { success: true };
}

export async function convertBookEmotionToNote(emotionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { data: emotion, error } = await supabase
        .from("user_book_emotions")
        .select("id, book_id, emotion, intensity, note, current_page")
        .eq("id", emotionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !emotion) {
        return { error: "No hemos encontrado esa emoción." };
    }

    const label = emotion.emotion
        ? emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)
        : "Emoción";
    const content = emotion.note?.trim()
        ? `Me hizo sentir ${label.toLowerCase()} (${emotion.intensity}/5).\n\n${emotion.note.trim()}`
        : `Me hizo sentir ${label.toLowerCase()} con intensidad ${emotion.intensity}/5.`;

    return saveNote(
        emotion.book_id,
        content,
        `Emoción: ${label}`,
        emotion.current_page ? String(emotion.current_page) : undefined
    );
}

export async function getEmotionBookGroups(): Promise<EmotionBookGroup[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("user_book_emotions")
        .select(`
            book_id,
            emotion,
            intensity,
            created_at,
            books (
                title,
                author,
                preferred_edition:editions!books_preferred_edition_fk (cover_url)
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80);

    if (error) {
        if (error.code !== "42P01" && error.code !== "PGRST205") {
            console.error("Error fetching emotion book groups:", error);
        }
        return [];
    }

    const groups: Record<string, EmotionBookGroup> = {};
    const seen = new Set<string>();

    for (const row of data ?? []) {
        const key = `${row.emotion}-${row.book_id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!groups[row.emotion]) {
            groups[row.emotion] = {
                emotion: row.emotion,
                count: 0,
                books: [],
            };
        }

        // PostgREST puede devolver embeds como objeto o como array; normalizamos.
        const book = Array.isArray(row.books) ? row.books[0] : row.books;
        const edition = book?.preferred_edition
            ? (Array.isArray(book.preferred_edition) ? book.preferred_edition[0] : book.preferred_edition)
            : null;

        groups[row.emotion].count += 1;
        groups[row.emotion].books.push({
            id: row.book_id,
            title: book?.title || "Libro",
            author: bookAuthorLabel(book),
            coverUrl: edition?.cover_url || null,
            intensity: row.intensity || 3,
        });
    }

    return Object.values(groups)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
}

// --- OTHER EXISTING ACTIONS (Unchanged mostly) ---

export async function getRecentNotes(): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: notes } = await supabase
        .from("book_notes")
        .select(`id, content, created_at, book_id, books (title, author)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

    if (!notes) return [];

    return notes.map((n: any) => {
        const typeMatch = n.content.match(/^\[(.*?)\]\s/);
        const type = typeMatch ? typeMatch[1] : "Nota";
        const cleanContent = typeMatch ? n.content.replace(/^\[.*?\]\s/, "") : n.content;
        const author = bookAuthorLabel(n.books, "Autor Desconocido");

        return {
            id: n.id,
            type: type as "Cita" | "Idea" | "Pregunta" | "Personaje" | "Subrayado" | "Nota",
            content: cleanContent,
            bookTitle: n.books.title,
            bookAuthor: author,
            date: new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            // Legacy fields
            book: n.books.title,
            snippet: cleanContent,
            bookId: n.book_id
        };
    });
}

export async function getAllNotes(): Promise<Note[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: notes, error } = await supabase
        .from("book_notes")
        .select(`
            id,
            content,
            page_number,
            chapter,
            created_at,
            book_id,
            is_private,
            is_highlighted,
            resolved_at,
            books (title, author)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching notes:", error);
        return [];
    }

    if (!notes) return [];

    return notes.map((n: any) => {
        const typeMatch = n.content.match(/^\[(.*?)\]\s/);
        const type = typeMatch ? typeMatch[1] : "Nota";
        let cleanContent = typeMatch ? n.content.replace(/^\[.*?\]\s/, "") : n.content;

        // Extract Tags
        let tags: string[] = [];
        // Matches "Tags: tag1, tag2" anywhere at end
        const tagsRegex = /(?:[\r\n]+|^)Tags:\s*(.*)$/i;
        const tagsMatch = cleanContent.match(tagsRegex);

        if (tagsMatch) {
            tags = tagsMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean);
            cleanContent = cleanContent.replace(tagsRegex, "").trim();
        }

        const author = bookAuthorLabel(n.books, "Autor Desconocido");

        return {
            id: n.id,
            type: type as "Cita" | "Idea" | "Pregunta" | "Personaje" | "Subrayado" | "Nota",
            content: cleanContent,
            bookTitle: n.books.title,
            bookAuthor: author,
            location: n.page_number ? `p. ${n.page_number}` : (n.chapter || undefined),
            date: new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            isPrivate: n.is_private,
            isHighlighted: n.is_highlighted || false,
            resolvedAt: n.resolved_at || null,
            tags: tags,
            // Legacy fields for backward compatibility
            bookId: n.book_id,
            book: n.books.title,
            snippet: cleanContent
        };
    });
}

export async function deleteBook(bookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { error } = await supabase
            .from("user_books")
            .delete()
            .eq("user_id", user.id)
            .eq("book_id", bookId);

        if (error) throw error;
        revalidatePath("/app/mi-lectura");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getRecommendedBook(): Promise<RecommendedBook | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: books } = await supabase
        .from("user_books")
        .select(`
            created_at,
            book_id,
            edition_id,
            user_edition:editions!user_books_edition_id_fkey(cover_url, isbn13, isbn),
            books (
                title,
                preferred_edition:editions!books_preferred_edition_fk(cover_url, isbn13, isbn),
                author
            )
        `)
        .eq("user_id", user.id)
        .eq("status", "WANT_TO_READ")
        .limit(10);

    if (!books || books.length === 0) return null;
    const randomEntry = books[Math.floor(Math.random() * books.length)];
    const bookData = Array.isArray(randomEntry.books) ? randomEntry.books[0] : randomEntry.books;

    if (!bookData) return null;

    const authorName = bookAuthorLabel(bookData, "Autor Desconocido");
    const edition = Array.isArray(bookData.preferred_edition)
        ? bookData.preferred_edition[0]
        : bookData.preferred_edition;
    const userEdition = Array.isArray(randomEntry.user_edition)
        ? randomEntry.user_edition[0]
        : randomEntry.user_edition;
    const displayEdition = userEdition || edition;

    return {
        id: randomEntry.book_id,
        title: bookData.title,
        author: authorName,
        coverUrl: displayEdition?.cover_url ?? null,
        addedDate: new Date(randomEntry.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    };
}

export async function startReadingBook(bookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        // Fija start_date si aún no existe (habilita velocidad y días-para-terminar).
        const { data: existing } = await supabase
            .from("user_books")
            .select("start_date")
            .eq("user_id", user.id)
            .eq("book_id", bookId)
            .maybeSingle();

        const updates: Record<string, unknown> = {
            status: "READING",
            updated_at: new Date().toISOString(),
        };
        if (!existing?.start_date) {
            updates.start_date = new Date().toISOString().split("T")[0];
        }

        const { error } = await supabase
            .from("user_books")
            .update(updates)
            .eq("user_id", user.id)
            .eq("book_id", bookId);

        if (error) throw error;

        // --- ACTIVITY FEED INSERTION ---
        try {
            const { data: bookData } = await supabase
                .from('books')
                .select('title')
                .eq('id', bookId)
                .single();

            const bookTitle = bookData?.title || 'un libro';

            await supabase.from('activity_feed').insert({
                user_id: user.id,
                activity_type: 'start_reading',
                content: `Ha empezado a leer '${bookTitle}'`,
                metadata: { book_id: bookId }
            });
        } catch (activityError) {
            console.error("Error inserting activity:", activityError);
        }
        // ---------------------------------

        revalidatePath("/app/mi-lectura");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- RESTORED ACTION ---
export async function updateBookStatus(bookId: string, status: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { error } = await supabase
            .from("user_books")
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id)
            .eq("book_id", bookId);

        if (error) throw error;
        revalidatePath("/app/mi-lectura");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- NEW ACTIONS for Reading Features ---

const VALID_FORMATS = ["paper", "ebook", "audio"] as const;

/** Formatea segundos a una etiqueta corta "3h 20m" / "45m". */
function formatDurationShort(totalSeconds: number): string {
    const mins = Math.round(totalSeconds / 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    return `${m}m`;
}

function clampPercent(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

/**
 * Construye el objeto de progreso para la UI a partir de la métrica canónica
 * (progress_percent) y la unidad nativa de cada formato:
 *  - audio: tiempo (segundos escuchados vs total) reconstruido desde el %.
 *  - paper/ebook con páginas: current_page / page_count.
 *  - ebook sin páginas: % directo.
 */
function buildProgress(
    format: CurrentBook["format"],
    data: { currentPage: number | null; pageCount: number | null; progressPercent: number | null; audioTotalSeconds: number | null }
): CurrentBook["progress"] {
    const { currentPage, pageCount, progressPercent, audioTotalSeconds } = data;

    if (format === "audio") {
        const total = audioTotalSeconds ?? null;
        const percent = progressPercent;
        const current = total != null && percent != null ? Math.round((percent / 100) * total) : 0;
        return {
            current,
            total,
            percent,
            unit: "TIME",
            label: total != null
                ? `${formatDurationShort(current)} / ${formatDurationShort(total)}`
                : percent != null ? `${Math.round(percent)}%` : "Sin duración",
        };
    }

    // paper / ebook (o formato sin definir): páginas si hay total, si no porcentaje.
    const pageBasedPercent = pageCount && pageCount > 0 && currentPage != null
        ? clampPercent((currentPage / pageCount) * 100)
        : null;
    const percent = progressPercent ?? pageBasedPercent;

    if (pageCount && pageCount > 0) {
        return {
            current: currentPage || 0,
            total: pageCount,
            percent,
            unit: "PAGES",
            label: `${currentPage || 0}/${pageCount}`,
        };
    }

    // Sin paginación conocida (p.ej. ebook en modo %): mostramos porcentaje.
    return {
        current: currentPage || 0,
        total: null,
        percent,
        unit: percent != null ? "PERCENT" : "PAGES",
        label: percent != null ? `${Math.round(percent)}%` : `${currentPage || 0}/?`,
    };
}

/** Resuelve page_count desde la edición del usuario o la edición preferida del libro. */
async function resolvePageCount(
    supabase: Awaited<ReturnType<typeof createClient>>,
    bookId: string,
    editionId: string | null
): Promise<number | null> {
    if (editionId) {
        const { data } = await supabase.from("editions").select("page_count").eq("id", editionId).maybeSingle();
        if (data?.page_count) return data.page_count;
    }
    const { data: book } = await supabase.from("books").select("preferred_edition_id").eq("id", bookId).maybeSingle();
    if (book?.preferred_edition_id) {
        const { data: ed } = await supabase.from("editions").select("page_count").eq("id", book.preferred_edition_id).maybeSingle();
        return ed?.page_count ?? null;
    }
    return null;
}

/**
 * Recalcula y persiste user_books.progress_percent (métrica canónica cross-formato)
 * a partir del estado actual del libro. Lo llaman logReadingSession, updateReadingSession
 * y deleteReadingSession para mantener el porcentaje coherente tras cualquier cambio.
 *
 * Nota Fase 2: el modo ebook-% fija progress_percent directamente en logReadingSession
 * y no debe pasar por aquí (esta función lo pondría a null al no haber paginación).
 */
async function recomputeProgressPercent(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    bookId: string
): Promise<void> {
    const { data: ub } = await supabase
        .from("user_books")
        .select("current_page, format, audio_total_seconds, status, edition_id")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .single();
    if (!ub) return;

    let percent: number | null = null;

    if (ub.status === "READ") {
        percent = 100;
    } else if (ub.format === "audio") {
        if (ub.audio_total_seconds && ub.audio_total_seconds > 0) {
            const { data: sessions } = await supabase
                .from("reading_sessions")
                .select("duration_seconds")
                .eq("user_id", userId)
                .eq("book_id", bookId);
            const listened = (sessions || []).reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
            percent = clampPercent((listened / ub.audio_total_seconds) * 100);
        }
    } else {
        const pageCount = await resolvePageCount(supabase, bookId, ub.edition_id);
        if (pageCount && pageCount > 0 && ub.current_page != null) {
            percent = clampPercent((ub.current_page / pageCount) * 100);
        }
    }

    await supabase
        .from("user_books")
        .update({ progress_percent: percent })
        .eq("user_id", userId)
        .eq("book_id", bookId);
}

export interface LogReadingSessionInput {
    bookId: string;
    durationMinutes: number;
    isFinished: boolean;
    rating?: number;
    format?: string | null;
    /** Delta de páginas avanzadas en esta sesión (modo página, legacy). */
    pagesRead?: number | null;
    /** Página absoluta "voy por la X" (modo página, preferido). Tiene prioridad sobre pagesRead. */
    toPage?: number | null;
    /** Porcentaje absoluto 0-100 (ebook sin paginación). Fija progress_percent directamente. */
    toPercent?: number | null;
    /** Duración total del audiolibro en segundos; se persiste en user_books. */
    audioTotalSeconds?: number | null;
}

export async function logReadingSession(input: LogReadingSessionInput) {
    const { bookId, durationMinutes, isFinished, rating, format, audioTotalSeconds } = input;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { data: userBook } = await supabase
            .from("user_books")
            .select("current_page, edition_id, start_date, format")
            .eq("user_id", user.id)
            .eq("book_id", bookId)
            .single();

        const effFormat = format && (VALID_FORMATS as readonly string[]).includes(format)
            ? format
            : (userBook?.format ?? null);
        const isAudio = effFormat === "audio";

        // Resolver el delta de páginas de esta sesión (formatos de página).
        // toPage (absoluto "voy por la X") tiene prioridad sobre pagesRead (delta).
        let pagesDelta: number | null = null;
        let newCurrentPage: number | null = null;
        if (input.toPage != null) {
            newCurrentPage = Math.max(0, Math.round(input.toPage));
            pagesDelta = newCurrentPage - (userBook?.current_page || 0);
        } else if (input.pagesRead != null) {
            pagesDelta = input.pagesRead;
            newCurrentPage = (userBook?.current_page || 0) + input.pagesRead;
        }

        // 1. Insert Session (en audio no hay páginas; el progreso es el tiempo escuchado).
        const { data: sessionData, error: sessionError } = await supabase
            .from("reading_sessions")
            .insert({
                user_id: user.id,
                book_id: bookId,
                edition_id: userBook?.edition_id || null,
                start_time: new Date(Date.now() - durationMinutes * 60000).toISOString(), // Estimated start
                end_time: new Date().toISOString(),
                duration_seconds: durationMinutes * 60,
                pages_read: isAudio ? null : pagesDelta,
                marked_finished: isFinished
            })
            .select("id")
            .single();

        if (sessionError) throw sessionError;

        // 2. Update Book Progress
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (!isAudio && newCurrentPage != null) {
            updates.current_page = newCurrentPage;
        }

        // Formato de lectura (papel/ebook/audio): se guarda a nivel de libro.
        if (effFormat && (VALID_FORMATS as readonly string[]).includes(effFormat)) {
            updates.format = effFormat;
        }

        // Duración total del audiolibro (segundos): habilita el % de progreso en audio.
        if (audioTotalSeconds != null && audioTotalSeconds > 0) {
            updates.audio_total_seconds = Math.round(audioTotalSeconds);
        }

        // Fecha de inicio: si es la primera sesión y no hay start_date, la fijamos
        // (habilita "días para terminar" y velocidad de lectura).
        if (!userBook?.start_date) {
            updates.start_date = new Date().toISOString().split("T")[0];
        }

        if (isFinished) {
            updates.status = "READ";
            if (rating) updates.rating = rating;
            updates.finish_date = new Date().toISOString().split("T")[0];
        }

        // Modo ebook-% : el usuario fija el porcentaje directamente (sin paginación).
        const directPercent = input.toPercent != null;
        if (directPercent) {
            updates.progress_percent = clampPercent(input.toPercent as number);
        }

        const { error: updateError } = await supabase
            .from("user_books")
            .update(updates)
            .eq("user_id", user.id)
            .eq("book_id", bookId);

        if (updateError) throw updateError;

        // 3. Recalcular la métrica canónica (salvo modo ebook-% que ya la fijó).
        if (!directPercent) {
            await recomputeProgressPercent(supabase, user.id, bookId);
        }

        revalidatePath("/app/search"); // Dashboard
        revalidatePath("/app/mi-lectura");
        return { success: true, sessionId: sessionData?.id || null };

    } catch (e: any) {
        console.error("logReadingSession Error:", e);
        return { error: e.message };
    }
}

export interface LastReadingSession {
    id: string;
    pagesRead: number | null;
    durationMinutes: number;
    startTime: string;
}

export async function getLastReadingSession(bookId: string): Promise<LastReadingSession | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("reading_sessions")
        .select("id, pages_read, duration_seconds, start_time")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("getLastReadingSession Error:", error);
        return null;
    }
    if (!data) return null;

    return {
        id: data.id,
        pagesRead: data.pages_read,
        durationMinutes: Math.round((data.duration_seconds || 0) / 60),
        startTime: data.start_time,
    };
}

export async function updateReadingSession(
    sessionId: string,
    durationMinutes: number,
    pagesRead: number | null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        // 1. Read the existing session to compute the pages delta
        const { data: session, error: fetchError } = await supabase
            .from("reading_sessions")
            .select("id, book_id, pages_read")
            .eq("id", sessionId)
            .eq("user_id", user.id)
            .single();

        if (fetchError) throw fetchError;
        if (!session) return { error: "Sesión no encontrada" };

        // 2. Update the session
        const { error: updateError } = await supabase
            .from("reading_sessions")
            .update({
                duration_seconds: durationMinutes * 60,
                pages_read: pagesRead,
            })
            .eq("id", sessionId)
            .eq("user_id", user.id);

        if (updateError) throw updateError;

        // 3. Reconcile the denormalized user_books.current_page by the delta
        const delta = (pagesRead || 0) - (session.pages_read || 0);
        if (delta !== 0) {
            const { data: userBook } = await supabase
                .from("user_books")
                .select("current_page")
                .eq("user_id", user.id)
                .eq("book_id", session.book_id)
                .single();

            const newPage = Math.max(0, (userBook?.current_page || 0) + delta);
            await supabase
                .from("user_books")
                .update({ current_page: newPage, updated_at: new Date().toISOString() })
                .eq("user_id", user.id)
                .eq("book_id", session.book_id);
        }

        // Recalcular la métrica canónica: en audio depende de la duración editada,
        // en formatos de página del current_page reconciliado.
        await recomputeProgressPercent(supabase, user.id, session.book_id);

        revalidatePath("/app/search");
        revalidatePath("/app/mi-lectura");
        return { success: true };
    } catch (e: any) {
        console.error("updateReadingSession Error:", e);
        return { error: e.message };
    }
}

export async function deleteReadingSession(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        // 1. Read the session so we can roll back its page contribution
        //    and, if it was the session that finished the book, its READ status.
        const { data: session, error: fetchError } = await supabase
            .from("reading_sessions")
            .select("id, book_id, pages_read, marked_finished")
            .eq("id", sessionId)
            .eq("user_id", user.id)
            .single();

        if (fetchError) throw fetchError;
        if (!session) return { error: "Sesión no encontrada" };

        // 2. Delete the session
        const { error: deleteError } = await supabase
            .from("reading_sessions")
            .delete()
            .eq("id", sessionId)
            .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        // 3. Reconcile the denormalized user_books row: subtract the deleted
        //    pages and, if this session had marked the book as finished, undo
        //    the READ status / finish_date.
        const pages = session.pages_read || 0;
        const { data: userBook } = await supabase
            .from("user_books")
            .select("current_page, status")
            .eq("user_id", user.id)
            .eq("book_id", session.book_id)
            .single();

        const bookUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

        if (pages !== 0) {
            bookUpdates.current_page = Math.max(0, (userBook?.current_page || 0) - pages);
        }

        if (session.marked_finished && userBook?.status === "READ") {
            bookUpdates.status = "READING";
            bookUpdates.finish_date = null;
        }

        await supabase
            .from("user_books")
            .update(bookUpdates)
            .eq("user_id", user.id)
            .eq("book_id", session.book_id);

        // Recalcular la métrica canónica tras revertir páginas/estado.
        await recomputeProgressPercent(supabase, user.id, session.book_id);

        revalidatePath("/app/search");
        revalidatePath("/app/mi-lectura");
        return { success: true };
    } catch (e: any) {
        console.error("deleteReadingSession Error:", e);
        return { error: e.message };
    }
}

export async function saveNote(
    bookId: string,
    content: string,
    type: string,
    location?: string,
    isPublic?: boolean
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const pageNum = parseInt(location || "");
        const chapter = isNaN(pageNum) ? (location || null) : null;
        const finalPageNum = isNaN(pageNum) ? null : pageNum;

        // Note: Schema doesn't have 'type' column, so we prefix it to content
        // Schema: user_id, book_id, content, page_number, chapter
        const finalContent = type ? `[${type}] ${content}` : content;

        // La privacidad la controla el usuario (isPublic). Si no viene, se mantiene
        // el comportamiento previo: solo las citas eran públicas.
        const isPrivate = isPublic !== undefined ? !isPublic : type !== "Cita";

        const { error, data: noteData } = await supabase
            .from("book_notes")
            .insert({
                user_id: user.id,
                book_id: bookId,
                content: finalContent,
                page_number: finalPageNum,
                chapter: chapter,
                is_private: isPrivate
            })
            .select('id')
            .single();

        if (error) throw error;

        // --- ACTIVITY FEED INSERTION ---
        if (!isPrivate) {
            try {
                const { data: bookData } = await supabase
                    .from('books')
                    .select('title')
                    .eq('id', bookId)
                    .single();

                const bookTitle = bookData?.title || 'un libro';

                const activityTypeLabel = type === 'Cita' ? 'una cita' : 'un subrayado';

                // Clean the content for the feed (remove the [Type] prefix)
                const cleanContent = type ? finalContent.replace(/^\[.*?\]\s/, "") : finalContent;

                await supabase.from('activity_feed').insert({
                    user_id: user.id,
                    activity_type: 'note',
                    content: `Ha guardado ${activityTypeLabel} de '${bookTitle}'`,
                    subtext: `"${cleanContent}"`,
                    metadata: { book_id: bookId, note_id: noteData?.id, note_type: type }
                });
            } catch (activityError) {
                console.error("Error inserting activity:", activityError);
            }
        }
        // ---------------------------------

        revalidatePath("/app/mi-lectura");
        return { success: true };

    } catch (e: any) {
        console.error("saveNote Error:", e);
        return { error: e.message };
    }
}

export async function updateNote(
    noteId: string,
    bookId: string,
    content: string,
    type: string,
    location?: string,
    isPublic?: boolean
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const pageNum = parseInt(location || "");
        const chapter = isNaN(pageNum) ? (location || null) : null;
        const finalPageNum = isNaN(pageNum) ? null : pageNum;

        // Reconstruct content with [Type] prefix
        // Note: If tags were handled separately they would be here too, but they are appended to content in modal
        // ideally we shouldn't have to re-prefix if backend stored types, but we do what we must
        const finalContent = type ? `[${type}] ${content}` : content;

        const updatePayload: Record<string, unknown> = {
            book_id: bookId, // Allow changing book if needed
            content: finalContent,
            page_number: finalPageNum,
            chapter: chapter,
        };
        // Solo tocamos la privacidad si el usuario la indicó explícitamente.
        if (isPublic !== undefined) updatePayload.is_private = !isPublic;

        const { error } = await supabase
            .from("book_notes")
            .update(updatePayload)
            .eq("id", noteId)
            .eq("user_id", user.id);

        if (error) throw error;

        revalidatePath("/app/mi-lectura");
        return { success: true };

    } catch (e: any) {
        console.error("updateNote Error:", e);
        return { error: e.message };
    }
}

// Cambia la visibilidad de una nota (para poder compartir una cita privada).
export async function setNoteVisibilityAction(noteId: string, isPublic: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("book_notes")
        .update({ is_private: !isPublic })
        .eq("id", noteId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/app/mi-lectura");
    return { success: true };
}

export async function deleteNote(noteId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { error } = await supabase
            .from("book_notes")
            .delete()
            .eq("id", noteId)
            .eq("user_id", user.id);

        if (error) throw error;

        revalidatePath("/app/mi-lectura");
        revalidatePath("/app/mi-lectura/notas");
        return { success: true };
    } catch (e: any) {
        console.error("deleteNote Error:", e);
        return { error: e.message };
    }
}

export async function setNoteHighlighted(noteId: string, highlighted: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { error } = await supabase
            .from("book_notes")
            .update({ is_highlighted: highlighted })
            .eq("id", noteId)
            .eq("user_id", user.id);

        if (error) throw error;

        revalidatePath("/app/mi-lectura/notas");
        return { success: true };
    } catch (e: any) {
        console.error("setNoteHighlighted Error:", e);
        return { error: e.message };
    }
}

export async function setQuestionResolved(noteId: string, resolved: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { error } = await supabase
            .from("book_notes")
            .update({ resolved_at: resolved ? new Date().toISOString() : null })
            .eq("id", noteId)
            .eq("user_id", user.id);

        if (error) throw error;

        revalidatePath("/app/mi-lectura/notas");
        return { success: true };
    } catch (e: any) {
        console.error("setQuestionResolved Error:", e);
        return { error: e.message };
    }
}

// --- REVIEWS ACTIONS ---

export async function saveReview(
    bookId: string,
    rating: number,
    content: string,
    type: 'STANDARD' | 'FIRST_IMPRESSIONS',
    quality: ReviewQualityPayload = {}
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Utenticado" };

    const { error } = await supabase
        .from("reviews")
        .upsert({
            user_id: user.id,
            book_id: bookId,
            rating,
            content,
            type,
            contains_spoilers: Boolean(quality.containsSpoilers),
            emotional_tone: quality.emotionalTone || null,
            pace: quality.pace || null,
            recommended_for: quality.recommendedFor?.trim() || null,
            tags: (quality.tags || [])
                .map((tag) => tag.trim().toLowerCase())
                .filter(Boolean)
                .slice(0, 6),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, book_id' });

    if (error) return { error: error.message };

    // --- ACTIVITY FEED INSERTION ---
    try {
        const { data: bookData } = await supabase
            .from('books')
            .select('title')
            .eq('id', bookId)
            .single();

        const bookTitle = bookData?.title || 'un libro';

        const activityContent = type === 'FIRST_IMPRESSIONS'
            ? `Ha compartido sus primeras impresiones sobre '${bookTitle}'`
            : `Ha dejado ${rating} estrellas a '${bookTitle}'`;

        await supabase.from('activity_feed').insert({
            user_id: user.id,
            activity_type: 'review',
            content: activityContent,
            subtext: content.length > 150 ? content.substring(0, 150) + '...' : content,
            metadata: {
                book_id: bookId,
                rating,
                type,
                emotional_tone: quality.emotionalTone || null,
                pace: quality.pace || null,
            }
        });
    } catch (activityError) {
        console.error("Error inserting activity:", activityError);
        // We don't fail the review creation if the feed insertion fails
    }
    // ---------------------------------

    // Replaces 'revalidatePath' with potentially more specific revalidation if needed
    // Assuming book detail page is /app/libros/[id]
    revalidatePath(`/app/libros/${bookId}`);
    return { success: true };
}

export async function getBookReviews(bookId: string, page = 1, limit = 5): Promise<{ reviews: Review[], total: number }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get Reviews
    // Note: This relies on Supabase being able to join with public.profiles or similar
    // Assuming FK is set up correctly in DB to public.profiles
    const { data: reviews, count, error } = await supabase
        .from("reviews")
        .select(`
            *,
            profiles!reviews_user_id_fkey (full_name, avatar_url, username)
        `, { count: 'exact' })
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching reviews:", error);
        return { reviews: [], total: 0 };
    }

    if (!reviews) return { reviews: [], total: 0 };

    const formattedReviews = reviews.map((r: any) => ({
        id: r.id,
        bookId: r.book_id,
        userId: r.user_id,
        user: {
            name: r.profiles?.full_name || r.profiles?.username || "Usuario",
            avatarUrl: r.profiles?.avatar_url || null
        },
        rating: r.rating,
        content: r.content,
        type: r.type,
        date: new Date(r.created_at).toLocaleDateString(),
        isMyReview: user ? r.user_id === user.id : false,
        containsSpoilers: Boolean(r.contains_spoilers),
        emotionalTone: r.emotional_tone || null,
        pace: r.pace || null,
        recommendedFor: r.recommended_for || null,
        tags: r.tags || [],
    }));

    return {
        reviews: await enrichReviewsWithHelpfulState(formattedReviews, user?.id),
        total: count || 0,
    };
}

type ReviewProfileRow = {
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
};

type ReviewEditionRow = {
    cover_url?: string | null;
};
type ReviewBookRow = {
    id: string;
    title: string;
    authors?: { name?: string | null } | Array<{ name?: string | null }> | null;
    preferred_edition?: ReviewEditionRow | ReviewEditionRow[] | null;
};

type ReviewRow = {
    id: string;
    book_id: string;
    user_id: string;
    rating: number;
    content: string | null;
    type: 'STANDARD' | 'FIRST_IMPRESSIONS';
    contains_spoilers?: boolean | null;
    emotional_tone?: string | null;
    pace?: string | null;
    recommended_for?: string | null;
    tags?: string[] | null;
    created_at: string;
    profiles?: ReviewProfileRow | ReviewProfileRow[] | null;
    books?: ReviewBookRow | ReviewBookRow[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function formatReview(row: ReviewRow, currentUserId?: string | null): Review {
    const profile = firstRelation(row.profiles);

    return {
        id: row.id,
        bookId: row.book_id,
        userId: row.user_id,
        user: {
            name: profile?.full_name || profile?.username || "Usuario",
            avatarUrl: profile?.avatar_url || null,
        },
        rating: row.rating,
        content: row.content || "",
        type: row.type,
        date: new Date(row.created_at).toLocaleDateString(),
        isMyReview: currentUserId ? row.user_id === currentUserId : false,
        containsSpoilers: Boolean(row.contains_spoilers),
        emotionalTone: row.emotional_tone || null,
        pace: row.pace || null,
        recommendedFor: row.recommended_for || null,
        tags: row.tags || [],
        helpfulCount: 0,
        isHelpfulByMe: false,
    };
}

async function enrichReviewsWithHelpfulState(reviews: Review[], currentUserId?: string | null): Promise<Review[]> {
    if (reviews.length === 0) return reviews;

    const supabase = await createClient();
    const reviewIds = reviews.map((review) => review.id);
    const { data, error } = await supabase
        .from("review_reactions")
        .select("review_id, user_id")
        .in("review_id", reviewIds)
        .eq("reaction_type", "helpful");

    if (error || !data) return reviews;

    const counts = new Map<string, number>();
    const mine = new Set<string>();

    data.forEach((reaction) => {
        counts.set(reaction.review_id, (counts.get(reaction.review_id) || 0) + 1);
        if (currentUserId && reaction.user_id === currentUserId) mine.add(reaction.review_id);
    });

    return reviews.map((review) => ({
        ...review,
        helpfulCount: counts.get(review.id) || 0,
        isHelpfulByMe: mine.has(review.id),
    }));
}

export async function getBookReviewOverview(bookId: string): Promise<BookReviewOverview> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const empty: BookReviewOverview = {
        averageRating: 0,
        totalReviews: 0,
        finalReviewsCount: 0,
        firstImpressionsCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        featuredReviews: [],
        firstImpressions: [],
    };

    const { data, error } = await supabase
        .from("reviews")
        .select(`
            id,
            book_id,
            user_id,
            rating,
            content,
            type,
            contains_spoilers,
            emotional_tone,
            pace,
            recommended_for,
            tags,
            created_at,
            profiles!reviews_user_id_fkey (full_name, avatar_url, username)
        `)
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })
        .limit(60);

    if (error || !data) {
        if (error) console.error("Error fetching review overview:", error);
        return empty;
    }

    const rows = data as ReviewRow[];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    let ratingSum = 0;

    rows.forEach((row) => {
        if (row.rating >= 1 && row.rating <= 5) {
            distribution[row.rating as 1 | 2 | 3 | 4 | 5] += 1;
            ratingSum += row.rating;
        }
    });

    const finalRows = rows.filter((row) => row.type !== "FIRST_IMPRESSIONS");
    const firstRows = rows.filter((row) => row.type === "FIRST_IMPRESSIONS");
    const totalReviews = rows.length;

    const featuredReviews = await enrichReviewsWithHelpfulState(
        finalRows.slice(0, 3).map((row) => formatReview(row, user?.id)),
        user?.id
    );
    const firstImpressions = await enrichReviewsWithHelpfulState(
        firstRows.slice(0, 2).map((row) => formatReview(row, user?.id)),
        user?.id
    );

    return {
        averageRating: totalReviews ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0,
        totalReviews,
        finalReviewsCount: finalRows.length,
        firstImpressionsCount: firstRows.length,
        distribution,
        featuredReviews,
        firstImpressions,
    };
}

export async function getRecentCommunityReviews(limit = 6): Promise<ReviewWithBook[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("reviews")
        .select(`
            id,
            book_id,
            user_id,
            rating,
            content,
            type,
            contains_spoilers,
            emotional_tone,
            pace,
            recommended_for,
            tags,
            created_at,
            profiles!reviews_user_id_fkey (full_name, avatar_url, username),
            books (
                id,
                title,
                author,
                preferred_edition:editions!books_preferred_edition_fk (cover_url)
            )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error || !data) {
        if (error) console.error("Error fetching recent community reviews:", error);
        return [];
    }

    const formatted = (data as unknown as ReviewRow[]).map((row) => {
        const book = firstRelation(row.books);
        const author = firstRelation(book?.authors);
        const edition = firstRelation(book?.preferred_edition);

        return {
            ...formatReview(row, user?.id),
            book: {
                id: book?.id || row.book_id,
                title: book?.title || "Libro",
                coverUrl: edition?.cover_url || null,
                author: bookAuthorName(book),
            },
        };
    });

    return enrichReviewsWithHelpfulState(formatted, user?.id) as Promise<ReviewWithBook[]>;
}

export async function getHelpfulCommunityReviews(limit = 4): Promise<ReviewWithBook[]> {
    const supabase = await createClient();

    const { data: reactions, error: reactionsError } = await supabase
        .from("review_reactions")
        .select("review_id")
        .eq("reaction_type", "helpful")
        .limit(200);

    if (reactionsError || !reactions?.length) {
        return getRecentCommunityReviews(limit);
    }

    const rankedIds = Array.from(
        reactions.reduce((counts, reaction) => {
            counts.set(reaction.review_id, (counts.get(reaction.review_id) || 0) + 1);
            return counts;
        }, new Map<string, number>())
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([reviewId]) => reviewId);

    if (!rankedIds.length) return getRecentCommunityReviews(limit);

    const { data, error } = await supabase
        .from("reviews")
        .select(`
            id,
            book_id,
            user_id,
            rating,
            content,
            type,
            contains_spoilers,
            emotional_tone,
            pace,
            recommended_for,
            tags,
            created_at,
            profiles!reviews_user_id_fkey (full_name, avatar_url, username),
            books (
                id,
                title,
                author,
                preferred_edition:editions!books_preferred_edition_fk (cover_url)
            )
        `)
        .in("id", rankedIds);

    if (error || !data) return getRecentCommunityReviews(limit);

    const { data: { user } } = await supabase.auth.getUser();
    const rowsById = new Map((data as unknown as ReviewRow[]).map((row) => [row.id, row]));
    const formatted = rankedIds
        .map((reviewId) => rowsById.get(reviewId))
        .filter((row): row is ReviewRow => Boolean(row))
        .map((row) => {
            const book = firstRelation(row.books);
            const author = firstRelation(book?.authors);
            const edition = firstRelation(book?.preferred_edition);

            return {
                ...formatReview(row, user?.id),
                book: {
                    id: book?.id || row.book_id,
                    title: book?.title || "Libro",
                    coverUrl: edition?.cover_url || null,
                    author: bookAuthorName(book),
                },
            };
        });

    return enrichReviewsWithHelpfulState(formatted, user?.id) as Promise<ReviewWithBook[]>;
}

export async function toggleReviewHelpful(reviewId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesion" };

    const { data: existing } = await supabase
        .from("review_reactions")
        .select("review_id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .eq("reaction_type", "helpful")
        .maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from("review_reactions")
            .delete()
            .eq("review_id", reviewId)
            .eq("user_id", user.id)
            .eq("reaction_type", "helpful");

        if (error) return { error: error.message };
        return { helpful: false };
    }

    const { error } = await supabase
        .from("review_reactions")
        .insert({
            review_id: reviewId,
            user_id: user.id,
            reaction_type: "helpful",
        });

    if (error) return { error: error.message };
    return { helpful: true };
}

export async function getMyReview(bookId: string): Promise<Review | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: review } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .single();

    if (!review) return null;

    return {
        id: review.id,
        bookId: review.book_id,
        userId: review.user_id,
        user: { name: "Yo", avatarUrl: null }, // Not needed for edit state
        rating: review.rating,
        content: review.content,
        type: review.type,
        date: new Date(review.created_at).toISOString(),
        isMyReview: true,
        containsSpoilers: Boolean(review.contains_spoilers),
        emotionalTone: review.emotional_tone || null,
        pace: review.pace || null,
        recommendedFor: review.recommended_for || null,
        tags: review.tags || [],
    };
}

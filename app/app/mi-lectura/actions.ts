"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    progress: {
        current: number;
        total: number | null;
        label: string;
        unit: 'PAGES' | 'PERCENT' | 'CHAPTERS';
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

// --- NEW SMART SHELVES ACTIONS ---

type FilterOptions = {
    status?: string; // 'READING', 'WANT_TO_READ', 'READ', 'PAUSED', 'DNF', 'ALL'
    shelfId?: string; // UUID of a specific list
    query?: string;
    sort?: 'recent' | 'title' | 'author';
};

export async function getLibraryBooks(filters: FilterOptions = {}): Promise<CurrentBook[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
        .from("user_books")
        .select(`
            book_id,
            status,
            current_page,
            updated_at,
            created_at,
            books (
                id,
                title,
                cover_url,
                page_count,
                authors (name)
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

    const bookIds = userBooks.map((ub: any) => ub.book_id).filter(Boolean);
    const emotionSummaries: Record<string, CurrentBook["emotionSummary"]> = {};

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
    let filteredResults = userBooks;
    if (filters.query) {
        const q = filters.query.toLowerCase();
        filteredResults = userBooks.filter((ub: any) =>
            ub.books.title.toLowerCase().includes(q) ||
            (ub.books.authors?.name || "").toLowerCase().includes(q)
        );
    }

    // Sorting
    if (filters.sort === 'title') {
        filteredResults.sort((a: any, b: any) => a.books.title.localeCompare(b.books.title));
    } else if (filters.sort === 'author') {
        filteredResults.sort((a: any, b: any) => (a.books.authors?.name || "").localeCompare(b.books.authors?.name || ""));
    } else {
        // Default: Recent (updated_at)
        filteredResults.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    // Map to CurrentBook
    const books: CurrentBook[] = await Promise.all(filteredResults.map(async (ub: any) => {
        // TODO: optimize creating a map of shelves for all books in one go instead of N+1
        const { data: myShelves } = await supabase
            .from("list_items")
            .select("list_id")
            .eq("book_id", ub.book_id);

        return {
            id: ub.book_id,
            title: ub.books.title,
            author: ub.books.authors?.name || "Autor Desconocido",
            coverUrl: ub.books.cover_url,
            status: ub.status,
            progress: {
                current: ub.current_page || 0, // Now using real data
                total: ub.books.page_count,
                label: `${ub.current_page || 0}/${ub.books.page_count || '?'}`,
                unit: 'PAGES'
            },
            lastSession: ub.updated_at ? new Date(ub.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : null,
            club: null,
            shelves: myShelves?.map((s: any) => s.list_id) || [],
            emotionSummary: emotionSummaries[ub.book_id] || {
                lastEmotion: null,
                lastIntensity: null,
                lastNote: null,
                count: 0,
                dominantEmotion: null,
                timeline: [],
            }
        };
    }));

    return books;
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
                cover_url,
                authors (name)
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

    for (const row of (data || []) as any[]) {
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

        groups[row.emotion].count += 1;
        groups[row.emotion].books.push({
            id: row.book_id,
            title: row.books?.title || "Libro",
            author: row.books?.authors?.name || "Autor desconocido",
            coverUrl: row.books?.cover_url || null,
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
        .select(`id, content, created_at, book_id, books (title, authors(name))`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

    if (!notes) return [];

    return notes.map((n: any) => {
        const typeMatch = n.content.match(/^\[(.*?)\]\s/);
        const type = typeMatch ? typeMatch[1] : "Nota";
        const cleanContent = typeMatch ? n.content.replace(/^\[.*?\]\s/, "") : n.content;
        const author = n.books.authors?.name || (n.books.authors && n.books.authors[0]?.name) || "Autor Desconocido";

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
            books (title, authors(name))
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

        const author = n.books.authors?.name || (n.books.authors && n.books.authors[0]?.name) || "Autor Desconocido";

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
        .select(`created_at, book_id, books (title, cover_url, authors (name))`)
        .eq("user_id", user.id)
        .eq("status", "WANT_TO_READ")
        .limit(10);

    if (!books || books.length === 0) return null;
    const randomEntry = books[Math.floor(Math.random() * books.length)];
    const bookData = Array.isArray(randomEntry.books) ? randomEntry.books[0] : randomEntry.books as any;

    if (!bookData) return null;

    return {
        id: randomEntry.book_id,
        title: bookData.title,
        author: bookData.authors?.name || (bookData.authors && bookData.authors[0]?.name) || "Autor Desconocido",
        coverUrl: bookData.cover_url,
        addedDate: new Date(randomEntry.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    };
}

export async function startReadingBook(bookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        const { error } = await supabase
            .from("user_books")
            .update({
                status: "READING",
                updated_at: new Date().toISOString()
            })
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

export async function logReadingSession(
    bookId: string,
    durationMinutes: number,
    pagesRead: number | null,
    isFinished: boolean,
    rating?: number
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "User not authenticated" };

    try {
        // 1. Insert Session
        const { data: sessionData, error: sessionError } = await supabase
            .from("reading_sessions")
            .insert({
                user_id: user.id,
                book_id: bookId,
                start_time: new Date(Date.now() - durationMinutes * 60000).toISOString(), // Estimated start
                end_time: new Date().toISOString(),
                duration_seconds: durationMinutes * 60,
                pages_read: pagesRead
            })
            .select("id")
            .single();

        if (sessionError) throw sessionError;

        // 2. Update Book Progress
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (pagesRead) {
            // We need to fetch current page to increment
            const { data: currentBook } = await supabase
                .from("user_books")
                .select("current_page")
                .eq("user_id", user.id)
                .eq("book_id", bookId)
                .single();

            const newPage = (currentBook?.current_page || 0) + pagesRead;
            updates.current_page = newPage;
        }

        if (isFinished) {
            updates.status = "READ";
            if (rating) updates.rating = rating;
            updates.finished_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from("user_books")
            .update(updates)
            .eq("user_id", user.id)
            .eq("book_id", bookId);

        if (updateError) throw updateError;

        revalidatePath("/app/search"); // Dashboard
        revalidatePath("/app/mi-lectura");
        return { success: true, sessionId: sessionData?.id || null };

    } catch (e: any) {
        console.error("logReadingSession Error:", e);
        return { error: e.message };
    }
}

export async function saveNote(
    bookId: string,
    content: string,
    type: string,
    location?: string
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

        // By default, only direct quotes appear in the community feed.
        const isPrivate = type !== "Cita";

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
    location?: string
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

        const { error } = await supabase
            .from("book_notes")
            .update({
                book_id: bookId, // Allow changing book if needed
                content: finalContent,
                page_number: finalPageNum,
                chapter: chapter,
                // updated_at is auto-handled by DB usually, or we can set it
                // let's rely on DB trigger or just ignore date update for now
            })
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
            profiles (full_name, avatar_url, username)
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

type ReviewBookRow = {
    id: string;
    title: string;
    cover_url?: string | null;
    authors?: { name?: string | null } | Array<{ name?: string | null }> | null;
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
            profiles (full_name, avatar_url, username)
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
            profiles (full_name, avatar_url, username),
            books (
                id,
                title,
                cover_url,
                authors (name)
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

        return {
            ...formatReview(row, user?.id),
            book: {
                id: book?.id || row.book_id,
                title: book?.title || "Libro",
                coverUrl: book?.cover_url || null,
                author: author?.name || null,
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
            profiles (full_name, avatar_url, username),
            books (
                id,
                title,
                cover_url,
                authors (name)
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

            return {
                ...formatReview(row, user?.id),
                book: {
                    id: book?.id || row.book_id,
                    title: book?.title || "Libro",
                    coverUrl: book?.cover_url || null,
                    author: author?.name || null,
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

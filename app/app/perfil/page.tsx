
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserProfile from "./user-profile";
import { getSecondaryGoalsStatus } from "./actions";
import { bookAuthorName, bookAuthorLabel } from "@/lib/book-author";

// Force dynamic rendering as we depend on user session
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        // Handle error gracefully, maybe show a skeletal or redirect to onboarding if 404?
        // For now, let's just ensure basic structure
        return <div>Error al cargar el perfil. Por favor recarga la página.</div>;
    }

    // Fetch statistics
    // 1. Libros leídos ESTE AÑO (coherente con el reto de reading_goals: status READ
    //    + finish_date dentro del año en curso).
    const currentYear = new Date().getFullYear();
    const { count: booksRead } = await supabase
        .from("user_books")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "READ")
        .gte("finish_date", `${currentYear}-01-01`)
        .lte("finish_date", `${currentYear}-12-31`);

    // Objetivo anual desde reading_goals (fuente única, misma que Mi lectura).
    const { data: readingGoal } = await (supabase.from("reading_goals") as any)
        .select("target")
        .eq("user_id", user.id)
        .eq("year", currentYear)
        .maybeSingle();
    const goalsObj = (profile.goals && !Array.isArray(profile.goals)) ? profile.goals as Record<string, unknown> : {};
    profile.goals = { ...goalsObj, yearly_target: readingGoal?.target ?? (goalsObj.yearly_target as number) ?? 50 };

    // 2. Reading sessions for pages read (sum)
    // This is expensive if many sessions, but for MVP it's fine.
    // If we had an aggregate function it would be better.
    // Let's just fetch all sessions for this year.
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const { data: sessions } = await supabase
        .from("reading_sessions")
        .select("pages_read, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfYear);

    const pagesRead = sessions?.reduce((acc, session) => acc + (session.pages_read || 0), 0) || 0;

    // 3. Streak from reading session dates.
    const sessionDays = new Set(
        (sessions || []).map((session) => new Date(session.created_at).toISOString().slice(0, 10))
    );
    const today = new Date();
    let cursor = new Date(today);
    let streakDays = 0;

    // If the user has not read today but read yesterday, keep the streak alive.
    if (!sessionDays.has(cursor.toISOString().slice(0, 10))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (sessionDays.has(cursor.toISOString().slice(0, 10))) {
        streakDays += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    const stats = {
        booksRead: booksRead || 0,
        pagesRead,
        streakDays
    };

    // Fetch User Badges
    const { data: userBadgesData } = await supabase
        .from("user_badges")
        .select(`
            awarded_at,
            badge:badges (
                id,
                name,
                description,
                icon_name,
                category
            )
        `)
        .eq("user_id", user.id);

    // Transform for UI (Earned Badges)
    const earnedBadges = userBadgesData?.map((item: any) => ({
        ...item.badge,
        awarded_at: item.awarded_at
    })) || [];

    // 4. Fetch Recent Activity
    // Last Read (Finished)
    const { data: lastReadData } = await supabase
        .from("user_books")
        .select(`
            updated_at,
            book:books (
                title,
                author,
                preferred_edition:editions!books_preferred_edition_fk (cover_url)
            )
        `)
        .eq("user_id", user.id)
        .eq("status", "READ")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

    // Current Read
    const { data: currentReadData } = await supabase
        .from("user_books")
        .select(`
            current_page,
            book:books (
                title,
                author,
                preferred_edition:editions!books_preferred_edition_fk (cover_url, page_count)
            )
        `)
        .eq("user_id", user.id)
        .eq("status", "READING")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

    // Handle Supabase response - extract single book object from array if necessary
    const lastBookRaw = lastReadData ? (Array.isArray(lastReadData.book) && lastReadData.book.length > 0 ? lastReadData.book[0] : lastReadData.book) : null;
    const currentBookRaw = currentReadData ? (Array.isArray(currentReadData.book) && currentReadData.book.length > 0 ? currentReadData.book[0] : currentReadData.book) : null;

    type EditionPick = { cover_url: any; page_count?: any };
    type BookType = {
        title: any;
        authors: { name: any; }[] | { name: any };
        preferred_edition?: EditionPick | EditionPick[] | null;
    };
    const lastBook = lastBookRaw as BookType | null;
    const currentBook = currentBookRaw as BookType | null;

    const pickEdition = (b: BookType | null): EditionPick | null => {
        if (!b?.preferred_edition) return null;
        return Array.isArray(b.preferred_edition) ? b.preferred_edition[0] ?? null : b.preferred_edition;
    };
    const lastEdition = pickEdition(lastBook);
    const currentEdition = pickEdition(currentBook);

    const activity = {
        lastRead: lastBook && lastReadData ? {
            title: lastBook.title,
            author: bookAuthorLabel(lastBook, "Autor Desconocido"),
            timeAgo: new Date(lastReadData.updated_at).toLocaleDateString(),
            cover: lastEdition?.cover_url ?? null
        } : null,
        current: currentBook && currentReadData ? {
            title: currentBook.title,
            author: bookAuthorLabel(currentBook, "Autor Desconocido"),
            progress: currentEdition?.page_count ? Math.round((currentReadData.current_page || 0) / currentEdition.page_count * 100) : 0,
            cover: currentEdition?.cover_url ?? null
        } : null
    };

    // 5. Fetch Library Previews (Simple counts or first items)
    // We can just fetch counts for now to keep it fast, or maybe 1-2 covers?
    // Let's passed down a summary.
    // Actually, user-profile.tsx expects a list of books for the bottom section?
    // The design shows "Leídos", "Leyendo"... tabs.
    // Let's fetch the first 5 books of the active tab. 
    // Wait, `UserProfile` is a client component, it might need to fetch on tab change OR we preload data.
    // For simplicity, let's fetch counts and initial "Read" books.

    // We'll pass a prop `libraryInitialData` or similar? 
    // Or better, let's just fetch all 'READ' books as initial data since it's the default tab.

    const { data: readBooks } = await supabase
        .from("user_books")
        .select(`
            book:books (
                id,
                title,
                preferred_edition:editions!books_preferred_edition_fk (cover_url)
            )
        `)
        .eq("user_id", user.id)
        .eq("status", "READ")
        .limit(5);

    const initialLibrary = readBooks?.map((b: any) => {
        const edition = Array.isArray(b.book?.preferred_edition)
            ? b.book.preferred_edition[0]
            : b.book?.preferred_edition;
        return {
            id: b.book.id,
            title: b.book.title,
            cover: edition?.cover_url ?? null
        };
    }) || [];

    // Fetch ALL badges for the modal/explainer
    const { data: allBadges } = await supabase
        .from("badges")
        .select("*")
        .order("category");

    const libraryCountsResult = await Promise.all([
        supabase.from("user_books").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "READ"),
        supabase.from("user_books").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "READING"),
        supabase.from("user_books").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "WANT_TO_READ"),
        supabase.from("user_books").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "DNF"),
    ]);

    const libraryCounts = {
        read: libraryCountsResult[0].count || 0,
        reading: libraryCountsResult[1].count || 0,
        wantToRead: libraryCountsResult[2].count || 0,
        abandoned: libraryCountsResult[3].count || 0,
    };

    const secondaryGoals = await getSecondaryGoalsStatus();

    return <UserProfile
        profile={profile}
        stats={stats}
        badges={earnedBadges}
        allBadges={allBadges || []}
        activity={activity}
        initialLibrary={initialLibrary}
        libraryCounts={libraryCounts}
        secondaryGoals={secondaryGoals}
    />;
}

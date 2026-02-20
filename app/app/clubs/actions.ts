'use server';

import { createClient } from '@/utils/supabase/server';
import { Club, ClubRole, ClubWithMembers } from '@/types/clubs';
import { revalidatePath } from 'next/cache';

// Fetch clubs the user has joined or created
export async function getUserClubs() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { active: [], archived: [] };

    // Fetch memberships to get club IDs
    const { data: memberships, error: memberError } = await supabase
        .from('club_members')
        .select(`
            club_id,
            role,
            clubs (
                *,
                owner:profiles!owner_id(full_name, avatar_url),
                current_book: club_books(
                    *,
                    book: books(
                        *,
                        author:authors(name)
                    )
                )
            )
        `)
        .eq('user_id', user.id);

    if (memberError) {
        console.error("Error fetching user clubs:", memberError);
        return { active: [], archived: [] };
    }

    if (!memberships) return { active: [], archived: [] };

    const clubs = await Promise.all(memberships.map(async (m: any) => {
        const club = m.clubs;
        // Count members
        const { count } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

        // Get current book (filter inside query was tricky with array, so do manually if more than one returned or structure is different)
        // The join `club_books` returns an array. We want the one with status 'current'.
        const currentBook = Array.isArray(club.current_book)
            ? club.current_book.find((b: any) => b.status === 'current')
            : null;

        return {
            ...club,
            members: Array(count || 0).fill({}),
            memberCount: count || 0,
            ownerAvatar: club.owner?.avatar_url || null,
            ownerName: club.owner?.full_name || null,
            currentBook: currentBook ? {
                title: currentBook.book?.title,
                author: currentBook.book?.author?.name || null,
                coverUrl: currentBook.book?.cover_url
            } : null,
            role: m.role,
            membershipRole: m.role, // includes 'pending'
            isMember: m.role !== 'pending',
            isAdmin: m.role === 'admin' || m.role === 'moderator'
        };
    }));

    return {
        active: clubs.filter(c => !c.is_archived),
        archived: clubs.filter(c => c.is_archived)
    };
}

// Fetch public clubs for exploration
export async function getExploreClubs(search?: string, tags?: string[]) {
    const supabase = await createClient();

    let query = supabase
        .from('clubs')
        .select(`
            *,
            owner:profiles!owner_id(full_name, avatar_url),
            current_book: club_books(
                *,
                book: books(
                    *,
                    author:authors(name)
                )
            )
        `)
        .eq('visibility', 'public')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching explore clubs:", error);
        return [];
    }

    // Process to match UI needs (counts, book details)
    const clubs = await Promise.all(data.map(async (club: any) => {
        const { count } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

        const currentBook = Array.isArray(club.current_book)
            ? club.current_book.find((b: any) => b.status === 'current')
            : null;

        return {
            ...club,
            memberCount: count,
            ownerAvatar: club.owner?.avatar_url || null,
            ownerName: club.owner?.full_name || null,
            currentBook: currentBook ? {
                title: currentBook.book?.title,
                author: currentBook.book?.author?.name || null,
                coverUrl: currentBook.book?.cover_url
            } : null,
        };
    }));

    return clubs;
}

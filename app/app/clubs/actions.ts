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

export async function joinClubByCode(rawCode: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión para unirte a un club." };

    const code = rawCode.trim().toUpperCase();
    if (!code) return { error: "Introduce un código de acceso." };

    const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, visibility, is_archived')
        .eq('join_code', code)
        .maybeSingle();

    if (clubError) {
        console.error("Error finding club by code:", clubError);
        return { error: "No se ha podido validar el código. Inténtalo de nuevo." };
    }

    if (!club) return { error: "No encontramos ningún club con ese código." };
    if (club.is_archived) return { error: "Este club está archivado y no acepta nuevas solicitudes." };

    const { data: existing } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', club.id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existing?.role === 'pending') {
        return {
            success: true,
            status: 'pending',
            clubId: club.id,
            clubName: club.name,
            message: `Tu solicitud para ${club.name} ya está pendiente de aprobación.`,
        };
    }

    if (existing) {
        return {
            success: true,
            status: 'member',
            clubId: club.id,
            clubName: club.name,
            message: `Ya formas parte de ${club.name}.`,
        };
    }

    const shouldRequestApproval = club.visibility === 'private' || club.visibility === 'secret';
    const role = shouldRequestApproval ? 'pending' : 'member';

    const { error } = await supabase
        .from('club_members')
        .insert({
            club_id: club.id,
            user_id: user.id,
            role,
            joined_at: new Date().toISOString(),
        });

    if (error) {
        console.error("Error joining club by code:", error);
        if (error.code === '23505') {
            return { error: "Ya existe una solicitud o membresía para este club." };
        }
        return { error: "No se ha podido enviar la solicitud. Inténtalo de nuevo." };
    }

    revalidatePath('/app/clubs');
    revalidatePath(`/app/clubs/${club.id}`);

    return {
        success: true,
        status: role,
        clubId: club.id,
        clubName: club.name,
        message: shouldRequestApproval
            ? `Solicitud enviada a ${club.name}. Un administrador debe aprobarla.`
            : `Te has unido a ${club.name}.`,
    };
}

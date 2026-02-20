'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getClubDetails(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Fetch Club Data
    const { data: club, error } = await supabase
        .from('clubs')
        .select(`
            *,
            owner:profiles!owner_id(full_name, avatar_url),
            members:club_members(count),
            current_book:club_books(
                *,
                book:books(*)
            )
        `)
        .eq('id', clubId)
        .single();

    if (error || !club) {
        console.error("Error fetching club details:", error);
        return null;
    }

    // 2. Fetch User's Role & Membership
    const { data: membership } = await supabase
        .from('club_members')
        .select('role, joined_at')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    // 3. Transform Data for UI
    const currentBook = Array.isArray(club.current_book)
        ? club.current_book.find((b: any) => b.status === 'current')
        : null;

    return {
        ...club,
        memberCount: club.members?.[0]?.count || 0,
        currentBook: currentBook ? {
            ...currentBook,
            book: currentBook.book
        } : null,
        userRole: membership?.role || null, // 'admin', 'moderator', 'member' or null
        isMember: !!membership,
    };
}

export async function joinClub(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { error } = await supabase
        .from('club_members')
        .insert({
            club_id: clubId,
            user_id: user.id,
            role: 'member'
        });

    if (error) {
        console.error("Error joining club:", error);
        return { error: "No se pudo unir al club" };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

export async function startReading(clubId: string, bookData: any, config: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authenticated" };

    // 1. Verify Admin/Mod permissions
    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos para iniciar una lectura." };
    }

    try {
        let bookId = bookData.id; // If it came from our DB

        // 2. Resolve Book ID (Find or Create)
        if (bookData.isbn) {
            const { data: existingBook } = await supabase.from('books').select('id').eq('isbn', bookData.isbn).single();
            if (existingBook) {
                bookId = existingBook.id;
            } else {
                // Create Author
                let authorId = null;
                const authorName = bookData.authors?.[0] || bookData.author || "Autor desconocido";

                const { data: existingAuthor } = await supabase.from('authors').select('id').eq('name', authorName).single();
                if (existingAuthor) {
                    authorId = existingAuthor.id;
                } else {
                    const { data: newAuthor } = await supabase.from('authors').insert({ name: authorName }).select().single();
                    if (newAuthor) authorId = newAuthor.id;
                }

                // Create Book
                const { data: newBook } = await supabase.from('books').insert({
                    title: bookData.title,
                    author_id: authorId,
                    cover_url: bookData.cover_url,
                    description: bookData.description || "",
                    isbn: bookData.isbn,
                    page_count: bookData.page_count,
                }).select().single();

                if (newBook) bookId = newBook.id;
            }
        }

        if (!bookId) return { error: "No se pudo identificar el libro." };

        // 3. Archive any current book (optional, but good practice)
        await supabase
            .from('club_books')
            .update({ status: 'archived', end_date: new Date().toISOString() })
            .eq('club_id', clubId)
            .eq('status', 'current');

        // 3b. Close any active polls for this club
        await supabase
            .from('polls')
            .update({ is_active: false })
            .eq('club_id', clubId)
            .eq('is_active', true);

        // 4. Insert new Club Book
        const { error: insertError } = await supabase.from('club_books').insert({
            club_id: clubId,
            book_id: bookId,
            status: 'current',
            start_date: config.startDate,
            pace_config: {
                pace: config.pace,
                progressMeasure: config.progressMeasure
            },
            checkpoints: config.checkpoints
        });

        if (insertError) {
            console.error("Error linking book:", insertError);
            return { error: "Error al guardar la lectura." };
        }

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };

    } catch (e) {
        console.error("Error in startReading:", e);
        return { error: "Error inesperado." };
    }
}


// POLL ACTIONS

export async function createPoll(clubId: string, question: string, options: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        // 1. Create Poll
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .insert({
                club_id: clubId,
                question,
                created_by: user.id,
                is_active: true
            })
            .select()
            .single();

        if (pollError) throw pollError;

        // 2. Create Options
        const optionsData = options.map(text => ({
            poll_id: poll.id,
            text
        }));

        const { error: optionsError } = await supabase
            .from('poll_options')
            .insert(optionsData);

        if (optionsError) throw optionsError;

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Error creating poll:", error);
        return { error: error.message };
    }
}

// ... (keep creatingPoll)

export async function getActivePoll(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch active poll
    const { data: poll, error } = await supabase
        .from('polls')
        .select(`
            *,
            options:poll_options(
                id,
                text,
                votes:poll_votes(count)
            ),
            user_vote:poll_votes(option_id)
        `)
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !poll) return null;

    let myVoteId = null;
    if (user) {
        const { data: myVote } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', poll.id)
            .eq('user_id', user.id)
            .single();
        if (myVote) myVoteId = myVote.option_id;
    }

    return {
        id: poll.id,
        question: poll.question,
        isOpen: poll.is_open ?? true, // Default to true if null (migration default)
        options: poll.options.map((o: any) => ({
            id: o.id,
            text: o.text,
            votes: o.votes?.[0]?.count || 0
        })),
        userVoteId: myVoteId,
        totalVotes: poll.options.reduce((acc: number, o: any) => acc + (o.votes?.[0]?.count || 0), 0)
    };
}

export async function votePoll(pollId: string, optionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    // Check if poll is open
    const { data: poll } = await supabase.from('polls').select('is_open').eq('id', pollId).single();
    if (poll && poll.is_open === false) {
        return { error: "La votación está cerrada." };
    }

    try {
        const { error } = await supabase
            .from('poll_votes')
            .upsert({
                poll_id: pollId,
                option_id: optionId,
                user_id: user.id
            });

        if (error) throw error;

        revalidatePath('/app/clubs/[id]', 'page');
        return { success: true };
    } catch (error: any) {
        console.error("Error voting:", error);
        return { error: error.message };
    }
}

export async function closePoll(pollId: string) { // This is "Dismiss/Delete" from UI
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    // 1. Get Poll & Club ID
    const { data: poll, error: fetchError } = await supabase
        .from('polls')
        .select('club_id, is_active')
        .eq('id', pollId)
        .single();

    if (fetchError || !poll) return { error: "Votación no encontrada" };

    // 2. Verify Permissions
    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', poll.club_id)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos para cerrar la votación." };
    }

    // 3. Update is_active = false
    const { data: updated, error } = await supabase
        .from('polls')
        .update({ is_active: false })
        .eq('id', pollId)
        .select();

    if (error || !updated || updated.length === 0) {
        return { error: "Error al eliminar la votación." };
    }

    revalidatePath(`/app/clubs/${poll.club_id}`);
    return { success: true };
}

export async function endPoll(pollId: string) { // This is "End Vote" (stop voting)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { data: poll } = await supabase.from('polls').select('club_id').eq('id', pollId).single();
    if (!poll) return { error: "Votación no encontrada" };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', poll.club_id)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos." };
    }

    // Update is_open = false
    const { data: updated, error } = await supabase
        .from('polls')
        .update({ is_open: false })
        .eq('id', pollId)
        .select();

    if (error || !updated || updated.length === 0) {
        return { error: "Error al finalizar la votación." };
    }

    revalidatePath(`/app/clubs/${poll.club_id}`);
    return { success: true };
}


// --- POST ACTIONS ---

export async function getClubPosts(clubId: string, limit = 20) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch top-level posts (no parent)
    const { data: posts, error } = await supabase
        .from('club_posts')
        .select(`
            *,
            author:profiles!user_id(full_name, avatar_url),
            likes:post_likes(count),
            user_like:post_likes(user_id)
        `)
        .eq('club_id', clubId)
        .is('parent_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching posts:", error);
        return [];
    }

    // Fetch replies for all posts
    const postIds = posts.map((p: any) => p.id);
    let repliesMap: Record<string, any[]> = {};

    if (postIds.length > 0) {
        const { data: replies } = await supabase
            .from('club_posts')
            .select(`
                *,
                author:profiles!user_id(full_name, avatar_url),
                likes:post_likes(count),
                user_like:post_likes(user_id)
            `)
            .in('parent_id', postIds)
            .order('created_at', { ascending: true });

        if (replies) {
            for (const reply of replies) {
                if (!repliesMap[reply.parent_id]) repliesMap[reply.parent_id] = [];
                repliesMap[reply.parent_id].push({
                    id: reply.id,
                    content: reply.content,
                    date: new Date(reply.created_at).toLocaleDateString(),
                    author: {
                        name: reply.author?.full_name || "Usuario",
                        avatar: reply.author?.avatar_url
                    },
                    likesCount: reply.likes?.[0]?.count || 0,
                    isLiked: user ? reply.user_like?.some((l: any) => l.user_id === user.id) : false,
                    spoilerLevel: reply.is_spoiler ? "strict" : "none",
                    isAuthor: user?.id === reply.user_id,
                    currentUserId: user?.id,
                });
            }
        }
    }

    return posts.map((post: any) => ({
        id: post.id,
        content: post.content,
        date: new Date(post.created_at).toLocaleDateString(),
        author: {
            name: post.author?.full_name || "Usuario",
            avatar: post.author?.avatar_url
        },
        likesCount: post.likes?.[0]?.count || 0,
        isLiked: user ? post.user_like?.some((l: any) => l.user_id === user.id) : false,
        repliesCount: repliesMap[post.id]?.length || 0,
        replies: repliesMap[post.id] || [],
        spoilerLevel: post.is_spoiler ? "strict" : "none",
        isAnnouncement: post.is_announcement,
        isPinned: post.is_pinned,
        checkpointIndex: post.checkpoint_index,
        currentUserId: user?.id,
        isAuthor: user?.id === post.user_id
    }));
}

export async function createReply(clubId: string, parentPostId: string, content: string, isSpoiler: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        const { error } = await supabase
            .from('club_posts')
            .insert({
                club_id: clubId,
                user_id: user.id,
                content,
                is_spoiler: isSpoiler,
                parent_id: parentPostId,
            });

        if (error) throw error;

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error creating reply:", error);
        return { error: error.message };
    }
}

export async function createPost(clubId: string, content: string, isSpoiler: boolean, checkpointIndex?: number, isAnnouncement: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        // Optional: verify admin role if isAnnouncement is true
        if (isAnnouncement) {
            const { data: membership } = await supabase
                .from('club_members')
                .select('role')
                .eq('club_id', clubId)
                .eq('user_id', user.id)
                .single();

            if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
                // Ignore announcement flag if not admin, or return error?
                // For better UX, let's just force false
                isAnnouncement = false;
            }
        }

        const { error } = await supabase
            .from('club_posts')
            .insert({
                club_id: clubId,
                user_id: user.id,
                content,
                is_spoiler: isSpoiler,
                checkpoint_index: checkpointIndex,
                is_announcement: isAnnouncement
            });

        if (error) throw error;

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error creating post:", error);
        return { error: error.message };
    }
}

export async function toggleLike(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        // Check if liked
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existingLike) {
            // Unlike
            await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);
        } else {
            // Like
            await supabase
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: user.id
                });
        }

        const path = '/app/clubs/[id]'; // Hard to know exact path dynamic segment here, but revalidating page usually works
        // We probably need to pass clubId to revalidate specific path properly, or just let client handle optimistic update
        // For now, let's try to return success and client refreshes or we revalidate strictly if we knew clubId.
        // Actually we can fetch clubId from post if needed, but it's an extra query.
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deletePost(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        // RLS handles permission (author or admin)
        const { error } = await supabase
            .from('club_posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        return { error: "No se pudo eliminar el post." };
    }
}

export async function getClubCheckpoints(clubId: string) {
    const supabase = await createClient();

    const { data: clubBook, error } = await supabase
        .from('club_books')
        .select('checkpoints')
        .eq('club_id', clubId)
        .eq('status', 'current')
        .single();

    if (error || !clubBook) return [];

    const checkpoints = clubBook.checkpoints;
    if (!Array.isArray(checkpoints)) return [];

    return checkpoints as Array<{ id: string; title: string; start: string; end: string; date?: string }>;
}

export async function saveCheckpoints(clubId: string, checkpoints: Array<{ id: string; title: string; start: string; end: string; date?: string }>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    // Verify admin/moderator role
    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "Sin permisos" };
    }

    const { error } = await supabase
        .from('club_books')
        .update({ checkpoints })
        .eq('club_id', clubId)
        .eq('status', 'current');

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

export async function updateClubSettings(
    clubId: string,
    settings: { name?: string; description?: string; visibility?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    // Verify admin role
    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || membership.role !== 'admin') {
        return { error: "Solo el administrador puede cambiar la configuración del club" };
    }

    const updates: Record<string, any> = {};
    if (settings.name?.trim()) updates.name = settings.name.trim();
    if (settings.description !== undefined) updates.description = settings.description;
    if (settings.visibility) updates.visibility = settings.visibility;

    const { error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', clubId);

    if (error) {
        console.error("Error updating club settings:", error);
        return { error: error.message };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) return null;

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );
}

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
                book:books(
                    *,
                    author:authors(name)
                )
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

    // 3. Access control: private/secret clubs require membership
    if (club.visibility !== 'public' && (!membership || membership.role === 'pending')) {
        return null;
    }

    // 4. Transform Data for UI
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

export async function archiveClub(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (membership?.role !== 'admin') return { error: 'Solo el administrador puede archivar el club' };

    const { error } = await supabase
        .from('clubs')
        .update({ is_archived: true })
        .eq('id', clubId);

    if (error) {
        console.error('[archiveClub] error:', error);
        return { error: error.message };
    }

    revalidatePath('/app/clubs');
    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

export async function unarchiveClub(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (membership?.role !== 'admin') return { error: 'Solo el administrador puede reactivar el club' };

    const { error } = await supabase
        .from('clubs')
        .update({ is_archived: false })
        .eq('id', clubId);

    if (error) return { error: error.message };

    revalidatePath('/app/clubs');
    return { success: true };
}

export async function deleteClub(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (membership?.role !== 'admin') return { error: 'Solo el administrador puede eliminar el club' };

    // Get all post IDs for this club so we can delete their likes first
    const { data: postRows } = await supabase
        .from('club_posts')
        .select('id')
        .eq('club_id', clubId);

    const postIds = (postRows || []).map((p: any) => p.id);

    // 1. Delete post likes
    if (postIds.length > 0) {
        const { error: likesErr } = await supabase
            .from('post_likes')
            .delete()
            .in('post_id', postIds);
        if (likesErr) console.error('[deleteClub] post_likes:', likesErr);
    }

    // 2. Delete posts (includes replies via parent_id FK if no cascade, so delete replies first)
    await supabase.from('club_posts').delete().eq('club_id', clubId).not('parent_id', 'is', null);
    const { error: postsErr } = await supabase.from('club_posts').delete().eq('club_id', clubId);
    if (postsErr) { console.error('[deleteClub] club_posts:', postsErr); return { error: postsErr.message }; }

    // 3. Delete poll votes, options, polls
    const { data: pollRows } = await supabase.from('club_polls').select('id').eq('club_id', clubId);
    const pollIds = (pollRows || []).map((p: any) => p.id);
    if (pollIds.length > 0) {
        await supabase.from('poll_votes').delete().in('poll_id', pollIds);
        const { data: optionRows } = await supabase.from('poll_options').select('id').in('poll_id', pollIds);
        const optionIds = (optionRows || []).map((o: any) => o.id);
        if (optionIds.length > 0) await supabase.from('poll_votes').delete().in('option_id', optionIds);
        await supabase.from('poll_options').delete().in('poll_id', pollIds);
        await supabase.from('club_polls').delete().eq('club_id', clubId);
    }

    // 4. Delete club books
    const { error: booksErr } = await supabase.from('club_books').delete().eq('club_id', clubId);
    if (booksErr) console.error('[deleteClub] club_books:', booksErr);

    // 5. Delete members
    const { error: membersErr } = await supabase.from('club_members').delete().eq('club_id', clubId);
    if (membersErr) console.error('[deleteClub] club_members:', membersErr);

    // 6. Finally delete the club itself
    const { error: clubErr } = await supabase.from('clubs').delete().eq('id', clubId);
    if (clubErr) {
        console.error('[deleteClub] clubs:', clubErr);
        return { error: clubErr.message };
    }

    revalidatePath('/app/clubs');
    return { success: true };
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
        } else if (!bookId) {
            const authorName = bookData.authors?.[0] || bookData.author || "Autor desconocido";
            let authorId = null;

            const { data: existingAuthor } = await supabase
                .from('authors')
                .select('id')
                .eq('name', authorName)
                .single();

            if (existingAuthor) {
                authorId = existingAuthor.id;
            } else {
                const { data: newAuthor } = await supabase
                    .from('authors')
                    .insert({ name: authorName })
                    .select()
                    .single();
                if (newAuthor) authorId = newAuthor.id;
            }

            const { data: newBook, error: manualBookError } = await supabase.from('books').insert({
                title: bookData.title,
                author_id: authorId,
                cover_url: bookData.cover_url || null,
                description: bookData.description || "",
                isbn: null,
                page_count: bookData.page_count || null,
                language: bookData.language || "es",
            }).select().single();

            if (manualBookError) {
                console.error("Error creating manual book:", manualBookError);
                return { error: "No se pudo crear la ficha manual del libro." };
            }

            if (newBook) bookId = newBook.id;
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
            .update({ is_open: false, ended_at: new Date().toISOString() })
            .eq('club_id', clubId)
            .eq('is_open', true);

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

export async function updateClubBookDetails(
    clubId: string,
    bookId: string,
    data: {
        title: string;
        author: string;
        coverUrl?: string | null;
        description?: string | null;
        pageCount?: number | null;
        isbn?: string | null;
        publisher?: string | null;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    try {
        await assertAdminOrMod(supabase, clubId, user.id);

        const cleanTitle = data.title.trim();
        const cleanAuthor = data.author.trim() || "Autor desconocido";

        if (!cleanTitle) {
            return { error: "El título es obligatorio." };
        }

        const { data: linkedBook } = await supabase
            .from("club_books")
            .select("id")
            .eq("club_id", clubId)
            .eq("book_id", bookId)
            .maybeSingle();

        if (!linkedBook) {
            return { error: "Este libro no pertenece al club." };
        }

        const pageCount = Number.isFinite(data.pageCount) && data.pageCount && data.pageCount > 0
            ? data.pageCount
            : null;

        const updatePayload = {
            title: cleanTitle,
            author: cleanAuthor,
            cover_url: data.coverUrl?.trim() || null,
            description: data.description?.trim() || "",
            page_count: pageCount,
            isbn: data.isbn?.trim() || null,
            publisher: data.publisher?.trim() || null,
        };

        const { data: updatedBook, error } = await supabase
            .rpc("update_club_book_details_for_admin", {
                target_club_id: clubId,
                target_book_id: bookId,
                book_title: cleanTitle,
                book_author: cleanAuthor,
                book_cover_url: data.coverUrl?.trim() || null,
                book_description: data.description?.trim() || "",
                book_page_count: pageCount,
                book_isbn: data.isbn?.trim() || null,
                book_publisher: data.publisher?.trim() || null,
            })
            .single();

        if (error) {
            console.error("[updateClubBookDetails] book error:", error);
            return { error: "No se pudo actualizar la ficha." };
        }

        revalidatePath(`/app/clubs/${clubId}`);
        revalidatePath(`/app/libros/${bookId}`);
        return { success: true, book: updatedBook || { id: bookId, ...updatePayload, author: { name: cleanAuthor } } };
    } catch (e: any) {
        return { error: e.message || "No se pudo actualizar la ficha." };
    }
}


// POLL ACTIONS

export async function createPoll(clubId: string, question: string, options: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        const { data: openPoll } = await supabase
            .from('polls')
            .select('id')
            .eq('club_id', clubId)
            .eq('is_active', true)
            .eq('is_open', true)
            .maybeSingle();

        if (openPoll) {
            return { error: "Ya hay una votación activa en este club." };
        }

        // 1. Create Poll
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .insert({
                club_id: clubId,
                question,
                created_by: user.id,
                is_active: true,
                is_open: true,
                ended_at: null
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
        .eq('is_open', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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

export async function getClosedPolls(clubId: string, limit = 8) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: polls, error } = await supabase
        .from('polls')
        .select(`
            *,
            options:poll_options(
                id,
                text,
                votes:poll_votes(count)
            )
        `)
        .eq('club_id', clubId)
        .eq('is_active', true)
        .eq('is_open', false)
        .order('ended_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !polls) {
        if (error) console.error("Error fetching closed polls:", error);
        return [];
    }

    let myVotes: Record<string, string> = {};
    if (user && polls.length > 0) {
        const { data: votes } = await supabase
            .from('poll_votes')
            .select('poll_id, option_id')
            .in('poll_id', polls.map((poll: any) => poll.id))
            .eq('user_id', user.id);

        myVotes = (votes || []).reduce((acc: Record<string, string>, vote: any) => {
            acc[vote.poll_id] = vote.option_id;
            return acc;
        }, {});
    }

    return polls.map((poll: any) => {
        const options = (poll.options || []).map((option: any) => ({
            id: option.id,
            text: option.text,
            votes: option.votes?.[0]?.count || 0,
        }));
        const totalVotes = options.reduce((acc: number, option: any) => acc + option.votes, 0);
        const winner = options.reduce((best: any | null, option: any) => {
            if (!best || option.votes > best.votes) return option;
            return best;
        }, null);

        return {
            id: poll.id,
            question: poll.question,
            isOpen: false,
            endedAt: poll.ended_at || poll.created_at,
            options,
            userVoteId: myVotes[poll.id] || null,
            totalVotes,
            winner,
        };
    });
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

export async function closePoll(pollId: string) {
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

    const endedAt = new Date().toISOString();

    // 3. Close the poll while keeping it visible in history.
    const { data: updated, error } = await supabase
        .from('polls')
        .update({ is_open: false, ended_at: endedAt })
        .eq('id', pollId)
        .select();

    if (error || !updated || updated.length === 0) {
        return { error: "Error al cerrar la votación." };
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

    const endedAt = new Date().toISOString();

    // Update is_open = false
    const { data: updated, error } = await supabase
        .from('polls')
        .update({ is_open: false, ended_at: endedAt })
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

        // --- ACTIVITY FEED INSERTION ---
        try {
            const { data: clubData } = await supabase
                .from('clubs')
                .select('name')
                .eq('id', clubId)
                .single();

            const clubName = clubData?.name || 'un club';

            await supabase.from('activity_feed').insert({
                user_id: user.id,
                activity_type: 'club_post',
                content: `Ha iniciado un debate en el club '${clubName}'`,
                subtext: isSpoiler ? "El contenido contiene spoilers." : (content.length > 150 ? content.substring(0, 150) + '...' : content),
                metadata: { club_id: clubId, is_spoiler: isSpoiler }
            });
        } catch (activityError) {
            console.error("Error inserting activity:", activityError);
        }
        // ---------------------------------

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

export async function reportClubProblem(clubId: string, reason: string, details: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Debes iniciar sesión para enviar un reporte' };

    const cleanReason = reason.trim();
    const cleanDetails = details.trim();

    if (!clubId) return { error: 'Club no válido' };
    if (!cleanReason) return { error: 'Elige un motivo para el reporte' };
    if (cleanDetails.length < 10) return { error: 'Añade un poco más de contexto para poder revisarlo' };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .neq('role', 'pending')
        .maybeSingle();

    if (!membership) {
        return { error: 'Solo los miembros del club pueden enviar reportes' };
    }

    const { error } = await supabase
        .from('club_reports')
        .insert({
            club_id: clubId,
            reporter_id: user.id,
            reason: cleanReason,
            details: cleanDetails,
            status: 'open',
        });

    if (error) {
        console.error('[reportClubProblem] error:', error);
        return { error: 'No se pudo enviar el reporte. Inténtalo de nuevo.' };
    }

    return { success: true };
}

export async function getClubReports(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    try {
        await assertAdminOrMod(supabase, clubId, user.id);

        const { data, error } = await supabase
            .from('club_reports')
            .select(`
                id,
                club_id,
                reporter_id,
                reason,
                details,
                status,
                created_at,
                resolved_at,
                reporter:profiles!reporter_id(full_name, username, avatar_url),
                events:club_report_events(
                    id,
                    status,
                    note,
                    created_at,
                    actor:profiles!actor_id(full_name, username, avatar_url)
                )
            `)
            .eq('club_id', clubId)
            .order('created_at', { ascending: false })
            .order('created_at', { referencedTable: 'club_report_events', ascending: true });

        if (error) {
            console.error('[getClubReports] error:', error);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error('[getClubReports] permission error:', e);
        return [];
    }
}

export async function getMyClubReports(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('club_reports')
        .select(`
            id,
            reason,
            details,
            status,
            created_at,
            resolved_at,
            events:club_report_events(
                id,
                status,
                note,
                created_at,
                actor:profiles!actor_id(full_name, username, avatar_url)
            )
        `)
        .eq('club_id', clubId)
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })
        .order('created_at', { referencedTable: 'club_report_events', ascending: true });

    if (error) {
        console.error('[getMyClubReports] error:', error);
        return [];
    }

    return data || [];
}

export async function updateClubReportStatus(
    clubId: string,
    reportId: string,
    status: 'open' | 'reviewing' | 'resolved' | 'dismissed',
    note?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autenticado' };

    try {
        await assertAdminOrMod(supabase, clubId, user.id);

        const cleanNote = note?.trim() || null;
        if ((status === 'resolved' || status === 'dismissed') && !cleanNote) {
            return { error: 'Añade un motivo para cerrar el reporte' };
        }

        const isClosed = status === 'resolved' || status === 'dismissed';
        const { error } = await supabase
            .from('club_reports')
            .update({
                status,
                resolved_at: isClosed ? new Date().toISOString() : null,
                resolved_by: isClosed ? user.id : null,
            })
            .eq('id', reportId)
            .eq('club_id', clubId);

        if (error) {
            console.error('[updateClubReportStatus] error:', error);
            return { error: 'No se pudo actualizar el reporte' };
        }

        const { error: eventError } = await supabase
            .from('club_report_events')
            .insert({
                report_id: reportId,
                club_id: clubId,
                actor_id: user.id,
                status,
                note: cleanNote,
            });

        if (eventError) {
            console.error('[updateClubReportStatus] event error:', eventError);
            return { error: 'El estado cambió, pero no se pudo guardar el seguimiento' };
        }

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Sin permisos' };
    }
}

// ─── Member Management ───────────────────────────────────────────────────────

export async function getClubMembers(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { members: [], pending: [] };

    const { data, error } = await supabase
        .from('club_members')
        .select(`
            user_id,
            role,
            joined_at,
            profile:profiles!user_id(full_name, avatar_url, username)
        `)
        .eq('club_id', clubId)
        .order('joined_at', { ascending: true });

    if (error || !data) return { members: [], pending: [] };

    const members = data.filter((m: any) => m.role !== 'pending');
    const pending = data.filter((m: any) => m.role === 'pending');

    return { members, pending };
}

async function assertAdminOrMod(supabase: any, clubId: string, userId: string) {
    const { data } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();
    if (!data || (data.role !== 'admin' && data.role !== 'moderator')) {
        throw new Error('Sin permisos');
    }
    return data.role;
}

export async function approveMember(clubId: string, targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    try {
        await assertAdminOrMod(supabase, clubId, user.id);
        const { error } = await supabase
            .from('club_members')
            .update({ role: 'member', joined_at: new Date().toISOString() })
            .eq('club_id', clubId)
            .eq('user_id', targetUserId)
            .eq('role', 'pending');
        if (error) return { error: error.message };
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function rejectMember(clubId: string, targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    try {
        await assertAdminOrMod(supabase, clubId, user.id);
        const { error } = await supabase
            .from('club_members')
            .delete()
            .eq('club_id', clubId)
            .eq('user_id', targetUserId)
            .eq('role', 'pending');
        if (error) return { error: error.message };
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function removeMember(clubId: string, targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    try {
        const callerRole = await assertAdminOrMod(supabase, clubId, user.id);
        // Moderators can't remove admins
        const { data: target } = await supabase
            .from('club_members')
            .select('role')
            .eq('club_id', clubId)
            .eq('user_id', targetUserId)
            .single();
        if (target?.role === 'admin' && callerRole !== 'admin') {
            return { error: 'No puedes expulsar a un administrador' };
        }
        const { error } = await supabase
            .from('club_members')
            .delete()
            .eq('club_id', clubId)
            .eq('user_id', targetUserId);
        if (error) return { error: error.message };
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function updateMemberRole(clubId: string, targetUserId: string, role: 'member' | 'moderator') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    try {
        const callerRole = await assertAdminOrMod(supabase, clubId, user.id);
        if (callerRole !== 'admin') return { error: 'Solo el admin puede cambiar roles' };
        const { error } = await supabase
            .from('club_members')
            .update({ role })
            .eq('club_id', clubId)
            .eq('user_id', targetUserId);
        if (error) return { error: error.message };
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e: any) { return { error: e.message }; }
}

export async function inviteMemberByUsername(clubId: string, usernameOrEmail: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    try {
        await assertAdminOrMod(supabase, clubId, user.id);

        // Search by username or full_name
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .or(`username.ilike.${usernameOrEmail},full_name.ilike.${usernameOrEmail}`)
            .single();

        if (!profile) return { error: 'Usuario no encontrado' };

        // Check if already a member
        const { data: existing } = await supabase
            .from('club_members')
            .select('role')
            .eq('club_id', clubId)
            .eq('user_id', profile.id)
            .single();

        if (existing) return { error: 'Este usuario ya es miembro del club' };

        const writeClient = getAdminClient() || supabase;
        const { error } = await writeClient
            .from('club_members')
            .insert({ club_id: clubId, user_id: profile.id, role: 'member', joined_at: new Date().toISOString() });

        if (error) {
            const isRlsError = error.message.toLowerCase().includes('row-level security');
            return {
                error: isRlsError
                    ? 'No se ha podido invitar por permisos de base de datos. Revisa que esté aplicada la política RLS de invitaciones.'
                    : error.message
            };
        }
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true, profile };
    } catch (e: any) { return { error: e.message }; }
}

export async function regenerateJoinCode(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    try {
        await assertAdminOrMod(supabase, clubId, user.id);
        // Generate new code
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase() +
            Math.random().toString(36).substring(2, 6).toUpperCase();
        const { error } = await supabase
            .from('clubs')
            .update({ join_code: newCode })
            .eq('id', clubId);
        if (error) return { error: error.message };
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true, code: newCode };
    } catch (e: any) { return { error: e.message }; }
}

// ─── Club Stats ───────────────────────────────────────────────────────────────

export async function getClubStats(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();

    const [
        { count: memberCount },
        { count: postsThisWeek },
        { data: activeUsersData },
        { count: pendingCount },
        { count: myPostsThisWeek },
    ] = await Promise.all([
        supabase.from('club_members').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).neq('role', 'pending'),
        supabase.from('club_posts').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).gte('created_at', weekAgoIso).is('parent_id', null),
        supabase.from('club_posts').select('user_id')
            .eq('club_id', clubId).gte('created_at', weekAgoIso).is('parent_id', null),
        supabase.from('club_members').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('role', 'pending'),
        supabase.from('club_posts').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('user_id', user.id).gte('created_at', weekAgoIso),
    ]);

    const activeThisWeek = new Set((activeUsersData || []).map((r: any) => r.user_id)).size;

    return {
        memberCount: memberCount || 0,
        postsThisWeek: postsThisWeek || 0,
        activeThisWeek,
        pendingCount: pendingCount || 0,
        myPostsThisWeek: myPostsThisWeek || 0,
    };
}

// ─── Announcements ───────────────────────────────────────────────────────────

export async function getClubAnnouncements(clubId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('club_posts')
        .select(`
            id,
            content,
            is_spoiler,
            event_date,
            event_duration_minutes,
            event_format,
            event_location,
            created_at,
            updated_at,
            author:profiles!user_id(full_name, avatar_url, username)
        `)
        .eq('club_id', clubId)
        .eq('is_announcement', true)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
}

export async function createAnnouncement(
    clubId: string,
    content: string,
    eventDate?: string,
    eventDurationMinutes?: number,
    eventFormat?: 'online' | 'presencial',
    eventLocation?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: 'Sin permisos para publicar anuncios' };
    }

    const { error } = await supabase
        .from('club_posts')
        .insert({
            club_id: clubId,
            user_id: user.id,
            content,
            is_announcement: true,
            is_spoiler: false,
            event_date: eventDate || null,
            event_duration_minutes: eventDurationMinutes || null,
            event_format: eventFormat || null,
            event_location: eventLocation || null,
        });

    if (error) return { error: error.message };
    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

export async function updateAnnouncement(
    postId: string,
    clubId: string,
    content: string,
    eventDate?: string,
    eventDurationMinutes?: number,
    eventFormat?: 'online' | 'presencial',
    eventLocation?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: 'Sin permisos' };
    }

    const { error } = await supabase
        .from('club_posts')
        .update({
            content,
            event_date: eventDate || null,
            event_duration_minutes: eventDurationMinutes || null,
            event_format: eventFormat || null,
            event_location: eventLocation || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('club_id', clubId);

    if (error) return { error: error.message };
    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

export async function deleteClubPost(postId: string, clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // Must be post author OR admin/mod
    const { data: post } = await supabase
        .from('club_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    const isAuthor = post?.user_id === user.id;
    const isAdminOrMod = membership?.role === 'admin' || membership?.role === 'moderator';

    if (!isAuthor && !isAdminOrMod) return { error: 'Sin permisos' };

    const { error } = await supabase
        .from('club_posts')
        .delete()
        .eq('id', postId);

    if (error) return { error: error.message };
    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

// ─── Upcoming Milestones (for mi-lectura) ────────────────────────────────────

export async function getUpcomingMilestones() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get clubs the user belongs to
    const { data: memberships } = await supabase
        .from('club_members')
        .select('club_id, clubs(name)')
        .eq('user_id', user.id)
        .neq('role', 'pending');

    if (!memberships || memberships.length === 0) return [];

    const clubIds = memberships.map((m: any) => m.club_id);
    const clubNames: Record<string, string> = {};
    memberships.forEach((m: any) => { clubNames[m.club_id] = m.clubs?.name || ''; });

    // Get upcoming announcements with event_date
    const { data: posts } = await supabase
        .from('club_posts')
        .select('id, club_id, content, event_date, event_duration_minutes, event_format, event_location, created_at')
        .in('club_id', clubIds)
        .eq('is_announcement', true)
        .not('event_date', 'is', null)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

    if (!posts) return [];

    return posts.map((p: any) => ({
        id: p.id,
        clubId: p.club_id,
        clubName: clubNames[p.club_id] || 'Club',
        content: p.content,
        eventDate: p.event_date,
        durationMinutes: p.event_duration_minutes,
        format: p.event_format,
        location: p.event_location,
    }));
}

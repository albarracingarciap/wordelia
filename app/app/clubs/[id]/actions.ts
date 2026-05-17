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
    const clubBooks = Array.isArray(club.current_book) ? club.current_book : [];
    const currentBook = clubBooks.find((b: any) => b.status === 'current') || null;

    return {
        ...club,
        memberCount: club.members?.[0]?.count || 0,
        currentBook: currentBook ? {
            ...currentBook,
            book: currentBook.book
        } : null,
        libraryBooks: clubBooks.map((clubBook: any) => ({
            ...clubBook,
            book: clubBook.book,
        })),
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

export async function getMyClubBookProgress(bookId?: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !bookId) return null;

    const { data, error } = await supabase
        .from('user_books')
        .select('current_page, status')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching club book progress:", error);
        return null;
    }

    return {
        currentPage: data?.current_page || 0,
        status: data?.status || null,
    };
}

export async function markCheckpointCompleted(clubId: string, bookId: string, checkpointEnd: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };
    if (!clubId || !bookId) return { error: "No se ha encontrado la lectura del club." };

    const targetPage = Math.max(0, Math.round(Number(checkpointEnd) || 0));
    if (targetPage <= 0) return { error: "No se ha podido calcular el final del checkpoint." };

    const { data: membership } = await supabase
        .from("club_members")
        .select("role")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .neq("role", "pending")
        .maybeSingle();

    if (!membership) return { error: "No puedes actualizar el progreso de este club." };

    const { data: currentBook, error: currentBookError } = await supabase
        .from("user_books")
        .select("id, current_page, status")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    if (currentBookError) {
        console.error("Error fetching user book progress:", currentBookError);
        return { error: "No hemos podido leer tu progreso actual." };
    }

    const nextPage = Math.max(currentBook?.current_page || 0, targetPage);

    if (currentBook?.id) {
        const { error } = await supabase
            .from("user_books")
            .update({
                current_page: nextPage,
                status: currentBook.status || "READING",
                updated_at: new Date().toISOString(),
            })
            .eq("id", currentBook.id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating checkpoint progress:", error);
            return { error: "No hemos podido guardar este checkpoint." };
        }
    } else {
        const { error } = await supabase
            .from("user_books")
            .insert({
                user_id: user.id,
                book_id: bookId,
                current_page: nextPage,
                status: "READING",
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error creating checkpoint progress:", error);
            return { error: "No hemos podido guardar este checkpoint." };
        }
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true, currentPage: nextPage };
}

export async function markCheckpointPending(clubId: string, bookId: string, rollbackPage: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };
    if (!clubId || !bookId) return { error: "No se ha encontrado la lectura del club." };

    const targetPage = Math.max(0, Math.round(Number(rollbackPage) || 0));

    const { data: membership } = await supabase
        .from("club_members")
        .select("role")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .neq("role", "pending")
        .maybeSingle();

    if (!membership) return { error: "No puedes actualizar el progreso de este club." };

    const { data: currentBook, error: currentBookError } = await supabase
        .from("user_books")
        .select("id, current_page, status")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    if (currentBookError) {
        console.error("Error fetching user book progress:", currentBookError);
        return { error: "No hemos podido leer tu progreso actual." };
    }

    if (!currentBook?.id) {
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true, currentPage: targetPage };
    }

    const { error } = await supabase
        .from("user_books")
        .update({
            current_page: targetPage,
            status: currentBook.status || "READING",
            updated_at: new Date().toISOString(),
        })
        .eq("id", currentBook.id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error reverting checkpoint progress:", error);
        return { error: "No hemos podido marcar este checkpoint como pendiente." };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true, currentPage: targetPage };
}

export async function createReply(clubId: string, parentPostId: string, content: string, isSpoiler: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    try {
        const { data: parentPost } = await supabase
            .from('club_posts')
            .select('checkpoint_index, is_spoiler')
            .eq('id', parentPostId)
            .eq('club_id', clubId)
            .single();

        const { error } = await supabase
            .from('club_posts')
            .insert({
                club_id: clubId,
                user_id: user.id,
                content,
                is_spoiler: isSpoiler || !!parentPost?.is_spoiler,
                checkpoint_index: parentPost?.checkpoint_index ?? null,
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

    return checkpoints as Array<{ id: string; title: string; start: string; end: string; date?: string; questions?: string[] }>;
}

export async function saveCheckpoints(clubId: string, checkpoints: Array<{ id: string; title: string; start: string; end: string; date?: string; questions?: string[] }>) {
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

    if (error) {
        console.error("Error saving checkpoints:", error);
        return { error: error.message };
    }

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

export async function getClubBookCollectiveReview(clubId: string, clubBookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { reviews: [], myReview: null, averageRating: 0, totalReviews: 0 };
    }

    const { data: reviews, error } = await supabase
        .from("club_book_reviews")
        .select(`
            id,
            rating,
            conclusion,
            highlight,
            created_at,
            user_id,
            profiles(full_name, username, avatar_url)
        `)
        .eq("club_id", clubId)
        .eq("club_book_id", clubBookId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching club collective review:", error);
        return { reviews: [], myReview: null, averageRating: 0, totalReviews: 0 };
    }

    const formatted = (reviews || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        conclusion: review.conclusion,
        highlight: review.highlight,
        createdAt: review.created_at,
        isMine: review.user_id === user.id,
        user: {
            name: review.profiles?.full_name || review.profiles?.username || "Lector",
            avatarUrl: review.profiles?.avatar_url || null,
        },
    }));

    const totalReviews = formatted.length;
    const averageRating = totalReviews > 0
        ? Math.round((formatted.reduce((sum, review) => sum + review.rating, 0) / totalReviews) * 10) / 10
        : 0;

    return {
        reviews: formatted,
        myReview: formatted.find((review) => review.isMine) || null,
        averageRating,
        totalReviews,
    };
}

export async function saveClubBookCollectiveReview(
    clubId: string,
    clubBookId: string,
    bookId: string,
    payload: { rating: number; conclusion: string; highlight?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const rating = Number(payload.rating);
    const conclusion = payload.conclusion.trim();
    const highlight = payload.highlight?.trim() || "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { error: "Elige una valoración entre 1 y 5." };
    }

    if (conclusion.length < 10) {
        return { error: "Añade una conclusión un poco más completa." };
    }

    const { error } = await supabase
        .from("club_book_reviews")
        .upsert({
            club_id: clubId,
            club_book_id: clubBookId,
            book_id: bookId,
            user_id: user.id,
            rating,
            conclusion,
            highlight,
            updated_at: new Date().toISOString(),
        }, { onConflict: "club_book_id,user_id" });

    if (error) {
        console.error("Error saving club collective review:", error);
        return { error: "No se pudo guardar tu cierre." };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

const CLUB_EMOTIONS = [
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

type ClubEmotionValue = typeof CLUB_EMOTIONS[number];

const CLUB_RESPONSIBILITIES = [
    "session_host",
    "question_curator",
    "calendar_keeper",
    "conversation_spark",
    "spoiler_guardian",
    "librarian",
] as const;

type ClubResponsibility = typeof CLUB_RESPONSIBILITIES[number];

type ClubMemberWithProfile = {
    user_id: string;
    role: string;
    joined_at: string | null;
    profile?: unknown;
};

type ActiveUserRow = { user_id: string };
type EmotionStatsRow = { user_id: string; checkpoint_index: number | null; created_at: string | null };
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ClubEmotionProfile = {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
};

type ClubEmotionRow = {
    id: string;
    checkpoint_index: number;
    emotion: ClubEmotionValue;
    intensity: number;
    note?: string | null;
    is_note_public?: boolean | null;
    user_id: string;
    created_at?: string | null;
    updated_at?: string | null;
    profiles?: ClubEmotionProfile | ClubEmotionProfile[] | null;
};

function normalizeEmotionProfile(profile: ClubEmotionProfile | ClubEmotionProfile[] | null | undefined) {
    return Array.isArray(profile) ? profile[0] : profile;
}

export async function getClubCheckpointEmotionMap(clubId: string, clubBookId?: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !clubBookId) {
        return { byCheckpoint: {}, myEmotions: {} };
    }

    const { data, error } = await supabase
        .from("club_checkpoint_emotions")
        .select(`
            id,
            checkpoint_index,
            emotion,
            intensity,
            note,
            is_note_public,
            user_id,
            created_at,
            updated_at,
            profiles:profiles!user_id(full_name, username, avatar_url)
        `)
        .eq("club_id", clubId)
        .eq("club_book_id", clubBookId)
        .order("created_at", { ascending: false });

    if (error) {
        if (error.code !== "42P01" && error.code !== "PGRST205") {
            console.error("Error fetching checkpoint emotions:", error);
        }
        return { byCheckpoint: {}, myEmotions: {} };
    }

    const byCheckpoint: Record<number, {
        checkpointIndex: number;
        total: number;
        averageIntensity: number;
        dominantEmotion: ClubEmotionValue | null;
        distribution: Array<{
            emotion: ClubEmotionValue;
            count: number;
            percentage: number;
            averageIntensity: number;
        }>;
        records: Array<{
            id: string;
            emotion: ClubEmotionValue;
            intensity: number;
            note: string | null;
            isMine: boolean;
            createdAt: string | null;
            user: {
                name: string;
                username: string | null;
                avatarUrl: string | null;
            };
        }>;
    }> = {};
    const myEmotions: Record<number, {
        id: string;
        emotion: ClubEmotionValue;
        intensity: number;
        note: string;
        isNotePublic: boolean;
    }> = {};

    for (const row of (data || []) as ClubEmotionRow[]) {
        const checkpointIndex = Number(row.checkpoint_index);
        if (!byCheckpoint[checkpointIndex]) {
            byCheckpoint[checkpointIndex] = {
                checkpointIndex,
                total: 0,
                averageIntensity: 0,
                dominantEmotion: null,
                distribution: [],
                records: [],
            };
        }

        const profile = normalizeEmotionProfile(row.profiles);
        const isMine = row.user_id === user.id;
        const note = row.is_note_public || isMine ? row.note?.trim() || null : null;

        byCheckpoint[checkpointIndex].records.push({
            id: row.id,
            emotion: row.emotion,
            intensity: row.intensity,
            note,
            isMine,
            createdAt: row.created_at || null,
            user: {
                name: profile?.full_name || profile?.username || "Lector",
                username: profile?.username || null,
                avatarUrl: profile?.avatar_url || null,
            },
        });

        if (isMine) {
            myEmotions[checkpointIndex] = {
                id: row.id,
                emotion: row.emotion,
                intensity: row.intensity,
                note: row.note || "",
                isNotePublic: row.is_note_public !== false,
            };
        }
    }

    for (const checkpoint of Object.values(byCheckpoint)) {
        const counts = new Map<ClubEmotionValue, { count: number; intensity: number }>();
        let intensityTotal = 0;

        for (const record of checkpoint.records) {
            const current = counts.get(record.emotion) || { count: 0, intensity: 0 };
            current.count += 1;
            current.intensity += record.intensity;
            counts.set(record.emotion, current);
            intensityTotal += record.intensity;
        }

        checkpoint.total = checkpoint.records.length;
        checkpoint.averageIntensity = checkpoint.total > 0
            ? Math.round((intensityTotal / checkpoint.total) * 10) / 10
            : 0;
        checkpoint.distribution = CLUB_EMOTIONS
            .map((emotion) => {
                const emotionData = counts.get(emotion);
                const count = emotionData?.count || 0;

                return {
                    emotion,
                    count,
                    percentage: checkpoint.total > 0 ? Math.round((count / checkpoint.total) * 100) : 0,
                    averageIntensity: count > 0 && emotionData
                        ? Math.round((emotionData.intensity / count) * 10) / 10
                        : 0,
                };
            })
            .filter((emotion) => emotion.count > 0)
            .sort((a, b) => b.count - a.count || b.averageIntensity - a.averageIntensity);
        checkpoint.dominantEmotion = checkpoint.distribution[0]?.emotion || null;
    }

    return { byCheckpoint, myEmotions };
}

export async function saveCheckpointEmotion(
    clubId: string,
    payload: {
        clubBookId?: string | null;
        bookId?: string | null;
        checkpointIndex: number;
        emotion: string;
        intensity: number;
        note?: string;
        isNotePublic?: boolean;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesion" };
    if (!payload.clubBookId || !payload.bookId) return { error: "No se ha encontrado la lectura activa." };

    const emotion = payload.emotion as ClubEmotionValue;
    if (!CLUB_EMOTIONS.includes(emotion)) return { error: "Elige una emocion valida." };

    const checkpointIndex = Number(payload.checkpointIndex);
    if (!Number.isInteger(checkpointIndex) || checkpointIndex < 1) {
        return { error: "Checkpoint no valido." };
    }

    const intensity = Math.max(1, Math.min(5, Math.round(Number(payload.intensity) || 3)));

    const { data: membership } = await supabase
        .from("club_members")
        .select("role")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .neq("role", "pending")
        .maybeSingle();

    if (!membership) return { error: "No puedes registrar emociones en este club." };

    const { error } = await supabase
        .from("club_checkpoint_emotions")
        .upsert({
            club_id: clubId,
            club_book_id: payload.clubBookId,
            book_id: payload.bookId,
            user_id: user.id,
            checkpoint_index: checkpointIndex,
            emotion,
            intensity,
            note: payload.note?.trim() || null,
            is_note_public: payload.isNotePublic !== false,
            updated_at: new Date().toISOString(),
        }, { onConflict: "club_book_id,user_id,checkpoint_index" });

    if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
            return { error: "Aplica la migracion del mapa emocional antes de guardar." };
        }
        console.error("Error saving checkpoint emotion:", error);
        return { error: "No se pudo guardar tu emocion." };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

type WeeklyDigestProfile = {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
};

type WeeklyPostRow = {
    id: string;
    content: string;
    user_id: string;
    parent_id?: string | null;
    is_announcement?: boolean | null;
    checkpoint_index?: number | null;
    created_at: string;
    author?: WeeklyDigestProfile | WeeklyDigestProfile[] | null;
};

type WeeklyAnnouncementRow = {
    id: string;
    content: string;
    event_date?: string | null;
    event_format?: string | null;
    event_location?: string | null;
};

type WeeklyPollOptionRow = {
    id: string;
    text: string;
    votes?: Array<{ count?: number | null }> | null;
};

type WeeklyPollRow = {
    id: string;
    question: string;
    ended_at?: string | null;
    created_at: string;
    options?: WeeklyPollOptionRow[] | null;
};

type WeeklyReviewRow = {
    id: string;
    rating: number;
    conclusion: string;
    highlight: string;
    created_at: string;
    profiles?: WeeklyDigestProfile | WeeklyDigestProfile[] | null;
};

type RecommendationBookRow = {
    id: string;
    title: string;
    cover_url?: string | null;
    description?: string | null;
    page_count?: number | null;
    published_date?: string | null;
    created_at?: string | null;
    author?: { name?: string | null } | { name?: string | null }[] | null;
};

type RecommendationClubBookRow = {
    id: string;
    status?: string | null;
    book?: RecommendationBookRow | RecommendationBookRow[] | null;
};

type RecommendationPollRow = {
    question: string;
    options?: Array<{
        text: string;
        votes?: Array<{ count?: number | null }> | null;
    }> | null;
};

export async function getClubWeeklyDigest(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const weekAgoIso = weekAgo.toISOString();
    const nowIso = now.toISOString();
    const nextWeekIso = nextWeek.toISOString();

    const [
        { data: posts, error: postsError },
        { data: upcomingAnnouncements, error: announcementsError },
        { data: reviews, error: reviewsError },
        { data: closedPolls, error: pollsError },
        { count: memberCount },
    ] = await Promise.all([
        supabase
            .from("club_posts")
            .select(`
                id,
                content,
                user_id,
                parent_id,
                is_announcement,
                checkpoint_index,
                created_at,
                author:profiles!user_id(full_name, username, avatar_url)
            `)
            .eq("club_id", clubId)
            .gte("created_at", weekAgoIso)
            .order("created_at", { ascending: false }),
        supabase
            .from("club_posts")
            .select("id, content, event_date, event_format, event_location")
            .eq("club_id", clubId)
            .eq("is_announcement", true)
            .is("parent_id", null)
            .not("event_date", "is", null)
            .gte("event_date", nowIso)
            .lte("event_date", nextWeekIso)
            .order("event_date", { ascending: true })
            .limit(3),
        supabase
            .from("club_book_reviews")
            .select(`
                id,
                rating,
                conclusion,
                highlight,
                created_at,
                user_id,
                profiles(full_name, username, avatar_url)
            `)
            .eq("club_id", clubId)
            .gte("created_at", weekAgoIso)
            .order("created_at", { ascending: false })
            .limit(4),
        supabase
            .from("polls")
            .select(`
                id,
                question,
                ended_at,
                created_at,
                options:poll_options(
                    id,
                    text,
                    votes:poll_votes(count)
                )
            `)
            .eq("club_id", clubId)
            .eq("is_active", true)
            .eq("is_open", false)
            .gte("ended_at", weekAgoIso)
            .order("ended_at", { ascending: false, nullsFirst: false })
            .limit(3),
        supabase
            .from("club_members")
            .select("*", { count: "exact", head: true })
            .eq("club_id", clubId)
            .neq("role", "pending"),
    ]);

    if (postsError) console.error("Error fetching weekly posts:", postsError);
    if (announcementsError) console.error("Error fetching weekly announcements:", announcementsError);
    if (reviewsError) console.error("Error fetching weekly reviews:", reviewsError);
    if (pollsError) console.error("Error fetching weekly polls:", pollsError);

    const getProfile = (profile: WeeklyDigestProfile | WeeklyDigestProfile[] | null | undefined) =>
        Array.isArray(profile) ? profile[0] : profile;
    const weeklyPosts = (posts || []) as WeeklyPostRow[];
    const topLevelPosts = weeklyPosts.filter((post) => !post.parent_id && !post.is_announcement);
    const replies = weeklyPosts.filter((post) => !!post.parent_id);
    const announcements = weeklyPosts.filter((post) => post.is_announcement);
    const activeMembers = new Set(weeklyPosts.map((post) => post.user_id).filter(Boolean));

    const contributors = new Map<string, {
        userId: string;
        name: string;
        avatarUrl: string | null;
        contributions: number;
    }>();

    for (const post of weeklyPosts) {
        const current = contributors.get(post.user_id);
        const author = getProfile(post.author);
        const name = author?.full_name || author?.username || "Lector";
        contributors.set(post.user_id, {
            userId: post.user_id,
            name,
            avatarUrl: author?.avatar_url || null,
            contributions: (current?.contributions || 0) + 1,
        });
    }

    const formattedPolls = ((closedPolls || []) as WeeklyPollRow[]).map((poll) => {
        const options = (poll.options || []).map((option) => ({
            id: option.id,
            text: option.text,
            votes: option.votes?.[0]?.count || 0,
        }));
        const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);
        const winner = options.reduce<typeof options[number] | null>((best, option) => {
            if (!best || option.votes > best.votes) return option;
            return best;
        }, null);

        return {
            id: poll.id,
            question: poll.question,
            endedAt: poll.ended_at || poll.created_at,
            totalVotes,
            winner: winner ? { text: winner.text, votes: winner.votes } : null,
        };
    });

    return {
        range: {
            from: weekAgoIso,
            to: nowIso,
        },
        stats: {
            posts: topLevelPosts.length,
            replies: replies.length,
            announcements: announcements.length,
            activeMembers: activeMembers.size,
            memberCount: memberCount || 0,
            reviews: reviews?.length || 0,
            closedPolls: formattedPolls.length,
        },
        topContributors: Array.from(contributors.values())
            .sort((a, b) => b.contributions - a.contributions)
            .slice(0, 3),
        recentPosts: topLevelPosts.slice(0, 3).map((post) => {
            const author = getProfile(post.author);
            return {
                id: post.id,
                content: post.content,
                checkpointIndex: post.checkpoint_index,
                createdAt: post.created_at,
                author: {
                    name: author?.full_name || author?.username || "Lector",
                    avatarUrl: author?.avatar_url || null,
                },
            };
        }),
        upcomingAnnouncements: ((upcomingAnnouncements || []) as WeeklyAnnouncementRow[]).map((announcement) => ({
            id: announcement.id,
            content: announcement.content,
            eventDate: announcement.event_date,
            format: announcement.event_format,
            location: announcement.event_location,
        })),
        closedPolls: formattedPolls,
        recentReviews: ((reviews || []) as WeeklyReviewRow[]).map((review) => {
            const author = getProfile(review.profiles);
            return {
                id: review.id,
                rating: review.rating,
                conclusion: review.conclusion,
                highlight: review.highlight,
                createdAt: review.created_at,
                author: {
                    name: author?.full_name || author?.username || "Lector",
                    avatarUrl: author?.avatar_url || null,
                },
            };
        }),
    };
}

function normalizeRecommendationText(value?: string | null) {
    return (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getRecommendationAuthor(author?: RecommendationBookRow["author"]) {
    const profile = Array.isArray(author) ? author[0] : author;
    return profile?.name || "Autor desconocido";
}

function getRecommendationBook(book?: RecommendationClubBookRow["book"]) {
    return Array.isArray(book) ? book[0] : book;
}

export async function getClubNextReadingRecommendations(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const [{ data: club }, { data: clubBooks }, { data: books }, { data: polls }] = await Promise.all([
        supabase
            .from("clubs")
            .select("id, name, description, tags")
            .eq("id", clubId)
            .single(),
        supabase
            .from("club_books")
            .select(`
                id,
                status,
                book:books(
                    id,
                    title,
                    cover_url,
                    description,
                    page_count,
                    published_date,
                    author:authors(name)
                )
            `)
            .eq("club_id", clubId),
        supabase
            .from("books")
            .select(`
                id,
                title,
                cover_url,
                description,
                page_count,
                published_date,
                created_at,
                author:authors(name)
            `)
            .order("created_at", { ascending: false })
            .limit(240),
        supabase
            .from("polls")
            .select(`
                question,
                options:poll_options(
                    text,
                    votes:poll_votes(count)
                )
            `)
            .eq("club_id", clubId)
            .eq("is_active", true)
            .eq("is_open", false)
            .order("ended_at", { ascending: false, nullsFirst: false })
            .limit(8),
    ]);

    const clubTags = Array.isArray(club?.tags) ? club.tags.map((tag: string) => normalizeRecommendationText(tag)) : [];
    const history = ((clubBooks || []) as RecommendationClubBookRow[])
        .map((item) => ({ ...item, book: getRecommendationBook(item.book) }))
        .filter((item) => item.book?.title);

    const usedBookIds = new Set(history.map((item) => item.book?.id).filter(Boolean));
    const usedTitles = new Set(history.map((item) => normalizeRecommendationText(item.book?.title)));

    const historicalText = [
        club?.name,
        club?.description,
        ...clubTags,
        ...history.flatMap((item) => [
            item.book?.title,
            item.book?.description,
            getRecommendationAuthor(item.book?.author),
        ]),
        ...((polls || []) as RecommendationPollRow[]).flatMap((poll) => [
            poll.question,
            ...(poll.options || []).map((option) => option.text),
        ]),
    ]
        .filter(Boolean)
        .map((value) => normalizeRecommendationText(String(value)))
        .join(" ");

    const stopWords = new Set([
        "club", "lectura", "leer", "libro", "libros", "con", "para", "los", "las", "una", "uno", "del", "que", "por", "sin",
        "este", "esta", "sobre", "desde", "clasicos", "novela", "debate",
    ]);

    const interestTerms = Array.from(new Set(historicalText.split(" ").filter((term) => term.length > 4 && !stopWords.has(term)))).slice(0, 24);
    const readPageCounts = history
        .map((item) => item.book?.page_count)
        .filter((pageCount): pageCount is number => typeof pageCount === "number" && pageCount > 0);
    const averagePages = readPageCounts.length
        ? Math.round(readPageCounts.reduce((sum, pageCount) => sum + pageCount, 0) / readPageCounts.length)
        : 360;

    const pollMomentum = new Map<string, number>();
    for (const poll of (polls || []) as RecommendationPollRow[]) {
        for (const option of poll.options || []) {
            const votes = option.votes?.[0]?.count || 0;
            pollMomentum.set(normalizeRecommendationText(option.text), Math.max(pollMomentum.get(normalizeRecommendationText(option.text)) || 0, votes));
        }
    }

    const recommendations = ((books || []) as RecommendationBookRow[])
        .filter((book) => book.title && !usedBookIds.has(book.id) && !usedTitles.has(normalizeRecommendationText(book.title)))
        .map((book) => {
            const title = normalizeRecommendationText(book.title);
            const author = getRecommendationAuthor(book.author);
            const searchable = normalizeRecommendationText(`${book.title} ${author} ${book.description || ""}`);
            const matchingTerms = interestTerms.filter((term) => searchable.includes(term)).slice(0, 4);
            const pageCount = book.page_count || null;
            const pageFit = pageCount
                ? Math.max(0, 24 - Math.round(Math.abs(pageCount - averagePages) / 18))
                : 8;
            const momentumVotes = pollMomentum.get(title) || 0;

            let score = 18 + pageFit + Math.min(32, matchingTerms.length * 9) + Math.min(18, momentumVotes * 4);
            if (book.cover_url) score += 5;
            if (book.description) score += 4;
            if (book.published_date && Number.parseInt(book.published_date.slice(0, 4), 10) < 1980) score += clubTags.includes("clasicos") ? 8 : 0;

            const reasons = [
                matchingTerms.length ? `Conecta con ${matchingTerms.slice(0, 2).join(", ")}` : "Aporta una línea nueva al club",
                pageCount ? `${pageCount} páginas, cerca del ritmo del club` : "Ritmo por definir",
                momentumVotes > 0 ? `Ya tuvo ${momentumVotes} votos` : null,
            ].filter(Boolean) as string[];

            return {
                id: book.id,
                title: book.title,
                author,
                coverUrl: book.cover_url || null,
                pageCount,
                score: Math.min(99, Math.max(1, score)),
                reasons,
                tags: matchingTerms.slice(0, 3),
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

    return recommendations;
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

    const { data: responsibilities } = await supabase
        .from('club_member_responsibilities')
        .select('user_id, responsibility')
        .eq('club_id', clubId);

    const responsibilitiesByUser = ((responsibilities || []) as Array<{ user_id: string; responsibility: ClubResponsibility }>)
        .reduce((acc: Record<string, ClubResponsibility[]>, item) => {
            if (!acc[item.user_id]) acc[item.user_id] = [];
            acc[item.user_id].push(item.responsibility);
            return acc;
        }, {});

    const withResponsibilities = (data as ClubMemberWithProfile[]).map((member) => ({
        ...member,
        responsibilities: responsibilitiesByUser[member.user_id] || [],
    }));

    const members = withResponsibilities.filter((member) => member.role !== 'pending');
    const pending = withResponsibilities.filter((member) => member.role === 'pending');

    return { members, pending };
}

export async function updateMemberResponsibilities(
    clubId: string,
    targetUserId: string,
    responsibilities: string[]
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    try {
        await assertAdminOrMod(supabase, clubId, user.id);

        const cleanResponsibilities = Array.from(new Set(responsibilities))
            .filter((responsibility): responsibility is ClubResponsibility =>
                CLUB_RESPONSIBILITIES.includes(responsibility as ClubResponsibility)
            );

        const { data: targetMember } = await supabase
            .from('club_members')
            .select('user_id')
            .eq('club_id', clubId)
            .eq('user_id', targetUserId)
            .neq('role', 'pending')
            .maybeSingle();

        if (!targetMember) {
            return { error: 'Este usuario no es miembro activo del club' };
        }

        const { error: deleteError } = await supabase
            .from('club_member_responsibilities')
            .delete()
            .eq('club_id', clubId)
            .eq('user_id', targetUserId);

        if (deleteError) {
            if (deleteError.code === '42P01' || deleteError.code === 'PGRST205') {
                return { error: 'Aplica la migracion de responsabilidades antes de asignarlas.' };
            }
            return { error: 'No se pudieron actualizar las responsabilidades' };
        }

        if (cleanResponsibilities.length > 0) {
            const { error: insertError } = await supabase
                .from('club_member_responsibilities')
                .insert(cleanResponsibilities.map((responsibility) => ({
                    club_id: clubId,
                    user_id: targetUserId,
                    responsibility,
                    assigned_by: user.id,
                })));

            if (insertError) {
                return { error: 'No se pudieron guardar las responsabilidades' };
            }
        }

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : 'Sin permisos' };
    }
}

async function assertAdminOrMod(supabase: SupabaseServerClient, clubId: string, userId: string) {
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
    const nowIso = new Date().toISOString();

    const { data: currentBook } = await supabase
        .from('club_books')
        .select('id, checkpoints')
        .eq('club_id', clubId)
        .eq('status', 'current')
        .maybeSingle();

    const checkpoints = Array.isArray(currentBook?.checkpoints)
        ? currentBook.checkpoints as Array<{ date?: string }>
        : [];
    const activeCheckpointIndex = (() => {
        if (!checkpoints.length) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let index = 0; index < checkpoints.length; index++) {
            const checkpoint = checkpoints[index];
            if (!checkpoint.date) return index + 1;
            const deadline = new Date(checkpoint.date);
            deadline.setHours(23, 59, 59, 999);
            if (deadline >= today) return index + 1;
        }

        return checkpoints.length;
    })();

    const currentBookId = currentBook?.id || null;

    const [
        { count: memberCount },
        { count: postsThisWeek },
        { count: repliesThisWeek },
        { data: activeUsersData },
        { count: pendingCount },
        { count: myPostsThisWeek },
        { count: openReports },
        { count: upcomingEvents },
        { count: openPolls },
        { data: emotionRows },
        { data: responsibilityRows },
    ] = await Promise.all([
        supabase.from('club_members').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).neq('role', 'pending'),
        supabase.from('club_posts').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).gte('created_at', weekAgoIso).is('parent_id', null),
        supabase.from('club_posts').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).gte('created_at', weekAgoIso).not('parent_id', 'is', null),
        supabase.from('club_posts').select('user_id')
            .eq('club_id', clubId).gte('created_at', weekAgoIso),
        supabase.from('club_members').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('role', 'pending'),
        supabase.from('club_posts').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('user_id', user.id).gte('created_at', weekAgoIso),
        supabase.from('club_reports').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).in('status', ['open', 'reviewing']),
        supabase.from('club_calendar_events').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).gte('starts_at', nowIso),
        supabase.from('polls').select('*', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('is_active', true).eq('is_open', true),
        currentBookId
            ? supabase.from('club_checkpoint_emotions').select('user_id, checkpoint_index, created_at')
                .eq('club_id', clubId).eq('club_book_id', currentBookId)
            : Promise.resolve({ data: [] }),
        supabase.from('club_member_responsibilities').select('responsibility').eq('club_id', clubId),
    ]);

    const activeThisWeek = new Set(((activeUsersData || []) as ActiveUserRow[]).map((row) => row.user_id)).size;
    const emotionStatsRows = (emotionRows || []) as EmotionStatsRow[];
    const emotionsThisWeek = emotionStatsRows.filter((row) => row.created_at && row.created_at >= weekAgoIso);
    const emotionParticipantsThisWeek = new Set(emotionsThisWeek.map((row) => row.user_id)).size;
    const currentCheckpointEmotionCount = activeCheckpointIndex
        ? new Set(emotionStatsRows
            .filter((row) => row.checkpoint_index === activeCheckpointIndex)
            .map((row) => row.user_id)).size
        : 0;
    const activeRate = memberCount ? Math.round((activeThisWeek / memberCount) * 100) : 0;
    const emotionCoverage = memberCount ? Math.round((currentCheckpointEmotionCount / memberCount) * 100) : 0;
    const reportPressure = openReports || 0;
    const responsibilitiesSet = new Set(((responsibilityRows || []) as Array<{ responsibility: ClubResponsibility }>).map((row) => row.responsibility));
    const responsibilityCoverage = Math.round((responsibilitiesSet.size / CLUB_RESPONSIBILITIES.length) * 100);
    const healthScore = Math.max(0, Math.min(100,
        45
        + Math.min(25, Math.round(activeRate * 0.25))
        + Math.min(15, Math.round(emotionCoverage * 0.15))
        + Math.min(10, (postsThisWeek || 0) + (repliesThisWeek || 0))
        + (upcomingEvents ? 5 : 0)
        + Math.min(8, Math.round(responsibilityCoverage * 0.08))
        - Math.min(25, reportPressure * 8)
        - Math.min(15, (pendingCount || 0) * 4)
    ));

    const alerts = [
        pendingCount ? `${pendingCount} solicitud${pendingCount === 1 ? '' : 'es'} pendiente${pendingCount === 1 ? '' : 's'}` : null,
        openReports ? `${openReports} reporte${openReports === 1 ? '' : 's'} abierto${openReports === 1 ? '' : 's'}` : null,
        activeThisWeek === 0 && memberCount ? 'Sin actividad esta semana' : null,
        activeCheckpointIndex && currentCheckpointEmotionCount === 0 ? 'Sin emociones en el checkpoint actual' : null,
        !responsibilitiesSet.has('calendar_keeper') ? 'Sin responsable de calendario' : null,
        !responsibilitiesSet.has('question_curator') ? 'Sin curador de preguntas' : null,
        openPolls ? `${openPolls} votacion${openPolls === 1 ? '' : 'es'} abierta${openPolls === 1 ? '' : 's'}` : null,
    ].filter((alert): alert is string => Boolean(alert));

    return {
        memberCount: memberCount || 0,
        postsThisWeek: postsThisWeek || 0,
        repliesThisWeek: repliesThisWeek || 0,
        activeThisWeek,
        pendingCount: pendingCount || 0,
        myPostsThisWeek: myPostsThisWeek || 0,
        openReports: openReports || 0,
        upcomingEvents: upcomingEvents || 0,
        openPolls: openPolls || 0,
        emotionsThisWeek: emotionsThisWeek.length,
        emotionParticipantsThisWeek,
        currentCheckpointEmotionCount,
        activeCheckpointIndex,
        activeRate,
        emotionCoverage,
        responsibilityCoverage,
        assignedResponsibilities: responsibilitiesSet.size,
        healthScore,
        alerts,
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

// Calendar

type ClubCalendarEventType =
    | "checkpoint"
    | "discussion"
    | "vote_deadline"
    | "silent_session"
    | "final_meeting"
    | "announcement"
    | "other";

type ClubCalendarFormat = "online" | "presencial" | "mixto";

interface CalendarEventRow {
    id: string;
    title: string;
    description?: string | null;
    event_type: ClubCalendarEventType;
    starts_at: string;
    ends_at?: string | null;
    format?: ClubCalendarFormat | null;
    location?: string | null;
    checkpoint_index?: number | null;
    book_id?: string | null;
    created_at?: string | null;
}

interface AnnouncementEventRow {
    id: string;
    content: string;
    event_date?: string | null;
    event_duration_minutes?: number | null;
    event_format?: string | null;
    event_location?: string | null;
    created_at?: string | null;
}

interface CurrentClubBookRow {
    book_id?: string | null;
    checkpoints?: unknown;
    book?: {
        title?: string | null;
    } | null;
}

function getLocalDateTimeIso(date: string, time = "12:00") {
    return `${date}T${time}:00`;
}

function addMinutesIso(date: string, minutes?: number | null) {
    if (!minutes || !date) return null;
    const end = new Date(date);
    end.setMinutes(end.getMinutes() + minutes);
    return end.toISOString();
}

function getCheckpointDateIso(date?: string) {
    if (!date) return null;
    return getLocalDateTimeIso(date, "12:00");
}

function normalizeCalendarEvent(row: CalendarEventRow) {
    return {
        id: row.id,
        source: "calendar" as const,
        title: row.title,
        description: row.description || null,
        type: row.event_type,
        startsAt: row.starts_at,
        endsAt: row.ends_at || null,
        format: row.format || null,
        location: row.location || null,
        checkpointIndex: row.checkpoint_index ?? null,
        bookId: row.book_id || null,
        createdAt: row.created_at || null,
        canDelete: true,
    };
}

export async function getClubCalendarEvents(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const [{ data: calendarEvents, error: calendarError }, { data: announcements }, { data: currentBook }] = await Promise.all([
        supabase
            .from("club_calendar_events")
            .select("id, title, description, event_type, starts_at, ends_at, format, location, checkpoint_index, book_id, created_at")
            .eq("club_id", clubId)
            .order("starts_at", { ascending: true }),
        supabase
            .from("club_posts")
            .select("id, content, event_date, event_duration_minutes, event_format, event_location, created_at")
            .eq("club_id", clubId)
            .eq("is_announcement", true)
            .is("parent_id", null),
        supabase
            .from("club_books")
            .select("book_id, checkpoints, book:books(title)")
            .eq("club_id", clubId)
            .eq("status", "current")
            .maybeSingle(),
    ]);

    if (calendarError && calendarError.code !== "42P01" && calendarError.code !== "PGRST205") {
        console.error("Error fetching club calendar events:", calendarError);
    }

    const normalizedCalendarEvents = calendarError
        ? []
        : ((calendarEvents || []) as CalendarEventRow[]).map(normalizeCalendarEvent);

    const announcementEvents = ((announcements || []) as AnnouncementEventRow[]).map((announcement) => ({
        id: `announcement-${announcement.id}`,
        source: "announcement" as const,
        title: "Aviso del club",
        description: announcement.content,
        type: "announcement" as ClubCalendarEventType,
        startsAt: announcement.event_date || null,
        endsAt: addMinutesIso(announcement.event_date || "", announcement.event_duration_minutes),
        format: (announcement.event_format as ClubCalendarFormat | null) || null,
        location: announcement.event_location || null,
        checkpointIndex: null,
        bookId: null,
        createdAt: announcement.created_at || null,
        canDelete: false,
    }));

    const currentBookRow = currentBook as CurrentClubBookRow | null;
    const checkpoints = Array.isArray(currentBookRow?.checkpoints)
        ? currentBookRow.checkpoints as Array<{ id?: string; title?: string; start?: string; end?: string; date?: string }>
        : [];
    const checkpointEvents = checkpoints
        .map((checkpoint, index) => {
            const startsAt = getCheckpointDateIso(checkpoint.date);
            if (!startsAt) return null;

            return {
                id: `checkpoint-${checkpoint.id || index}`,
                source: "checkpoint" as const,
                title: `Cierre de checkpoint ${index + 1}`,
                description: checkpoint.title || currentBookRow?.book?.title || "Tramo de lectura",
                type: "checkpoint" as ClubCalendarEventType,
                startsAt,
                endsAt: null,
                format: null,
                location: null,
                checkpointIndex: index,
                bookId: currentBookRow?.book_id || null,
                createdAt: null,
                canDelete: false,
            };
        })
        .filter(Boolean);

    return [...normalizedCalendarEvents, ...announcementEvents, ...checkpointEvents]
        .sort((a, b) => {
            if (!a!.startsAt && !b!.startsAt) return 0;
            if (!a!.startsAt) return 1;
            if (!b!.startsAt) return -1;
            return new Date(a!.startsAt).getTime() - new Date(b!.startsAt).getTime();
        });
}

export async function createClubCalendarEvent(
    clubId: string,
    payload: {
        title: string;
        description?: string;
        type: ClubCalendarEventType;
        startsAt: string;
        endsAt?: string | null;
        format?: ClubCalendarFormat | null;
        location?: string;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesion" };

    const { data: membership } = await supabase
        .from("club_members")
        .select("role")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .single();

    if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
        return { error: "Sin permisos para crear eventos" };
    }

    const title = payload.title.trim();
    if (!title) return { error: "El titulo es obligatorio" };
    if (!payload.startsAt) return { error: "La fecha es obligatoria" };

    const { error } = await supabase
        .from("club_calendar_events")
        .insert({
            club_id: clubId,
            created_by: user.id,
            title,
            description: payload.description?.trim() || null,
            event_type: payload.type || "other",
            starts_at: payload.startsAt,
            ends_at: payload.endsAt || null,
            format: payload.format || null,
            location: payload.location?.trim() || null,
        });

    if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
            return { error: "Aplica la migracion del calendario antes de crear eventos." };
        }
        return { error: error.message };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

export async function deleteClubCalendarEvent(clubId: string, eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesion" };

    const { data: membership } = await supabase
        .from("club_members")
        .select("role")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .single();

    if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
        return { error: "Sin permisos" };
    }

    const { error } = await supabase
        .from("club_calendar_events")
        .delete()
        .eq("id", eventId)
        .eq("club_id", clubId);

    if (error) return { error: error.message };

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

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

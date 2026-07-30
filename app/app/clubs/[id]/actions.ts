'use server';

import { createClient } from '@/utils/supabase/server';
import { sendPushToUsers } from '@/lib/push-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isOrgProActive } from '@/lib/subscription-access';
import { revalidatePath } from 'next/cache';
import { BookSearchResult } from '@/lib/isbndb';
import { resolveBookFromResult } from '@/lib/book-resolution';
import { grantOfficialClubResourcesToUser, grantOfficialClubResourcesToMembers } from '@/lib/club-resource-grants';

const CLUB_VOICE_BUCKET = 'club-voice-messages';
const CLUB_VOICE_MAX_BYTES = 20 * 1024 * 1024;
const CLUB_VOICE_MAX_SECONDS = 5 * 60;
const CLUB_VOICE_ALLOWED_TYPES = new Set([
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/x-m4a',
]);

function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) return null;

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );
}

/**
 * If the club is hosted by a bookstore ("librería") on the Pro tier, grant the
 * new member perpetual access to the club book's guide + genome. Idempotent and
 * non-blocking: failures are logged, never thrown. Members keep the grant even
 * after leaving the club (expires_at = null).
 */
async function grantClubResourcesIfPro(supabase: any, clubId: string, userId: string) {
    try {
        const { data: club } = await supabase
            .from('clubs')
            .select('organization_id')
            .eq('id', clubId)
            .maybeSingle();
        if (!club?.organization_id) return;

        const { data: sub } = await supabase
            .from('organization_subscriptions')
            .select('tier, status, current_period_end')
            .eq('organization_id', club.organization_id)
            .maybeSingle();
        if (!isOrgProActive(sub)) return;

        const { data: clubBook } = await supabase
            .from('club_books')
            .select('book_id')
            .eq('club_id', clubId)
            .eq('status', 'current')
            .maybeSingle();
        if (!clubBook?.book_id) return;

        const admin = getAdminClient();
        if (!admin) {
            console.error('grantClubResourcesIfPro: missing service role key');
            return;
        }

        const rows = (['guide', 'genome'] as const).map((kind) => ({
            user_id: userId,
            book_id: clubBook.book_id,
            resource_kind: kind,
            access_source: 'org_club',
            expires_at: null,
            metadata: { organization_id: club.organization_id, club_id: clubId },
        }));

        const { error } = await admin
            .from('user_book_resource_access')
            .upsert(rows, { onConflict: 'user_id,book_id,resource_kind', ignoreDuplicates: true });

        if (error) console.error('grantClubResourcesIfPro upsert error:', error);
    } catch (e) {
        console.error('grantClubResourcesIfPro error:', e);
    }
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
                    author
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
    const plannedBook = clubBooks.find((b: any) => b.status === 'planned') || null;

    // Librería anfitriona (club de librería): branding + tienda para el botón de compra.
    let organization = null as null | { id: string; name: string; slug: string | null; logoUrl: string | null; brandColor: string | null; buyLinkTemplate: string | null };
    if (club.organization_id) {
        const { data: org } = await supabase
            .from('organizations')
            .select('id, name, slug, logo_url, brand_color, buy_link_template, is_active')
            .eq('id', club.organization_id)
            .maybeSingle();
        if (org && org.is_active) {
            organization = { id: org.id, name: org.name, slug: org.slug ?? null, logoUrl: org.logo_url ?? null, brandColor: org.brand_color ?? null, buyLinkTemplate: org.buy_link_template ?? null };
        }
    }

    // ISBN del libro actual (para enlaces de compra); vive en editions, no en books.
    let currentBookIsbn: string | null = null;
    if (currentBook?.book_id) {
        const { data: eds } = await supabase.from('editions').select('isbn13, isbn').eq('book_id', currentBook.book_id).limit(5);
        for (const e of (eds ?? []) as any[]) {
            const isbn = e.isbn13 || e.isbn;
            if (isbn) { currentBookIsbn = String(isbn); break; }
        }
    }

    return {
        ...club,
        organization,
        memberCount: club.members?.[0]?.count || 0,
        currentBook: currentBook ? {
            ...currentBook,
            book: currentBook.book,
            isbn: currentBookIsbn,
        } : null,
        plannedBook: plannedBook ? {
            ...plannedBook,
            book: plannedBook.book
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

    const { data: club } = await supabase
        .from('clubs')
        .select('is_official, price, currency')
        .eq('id', clubId)
        .maybeSingle();

    if (club?.is_official) {
        const { error: redeemError } = await supabase.rpc('redeem_founder_free_official_club', {
            target_club_id: clubId,
        });

        if (!redeemError) {
            // Recursos del club oficial (guía + genoma perpetuos).
            await grantOfficialClubResourcesToUser(clubId, user.id);
            // Monedas Wordelia: cualifica un referido pendiente al unirse al 1er club.
            await supabase.rpc('maybe_qualify_referral');
            revalidatePath('/app/clubs');
            revalidatePath(`/app/clubs/${clubId}`);
            return { success: true };
        }

        const isFounderBenefitError = redeemError.message?.includes('fundador')
            || redeemError.message?.includes('beneficio')
            || redeemError.message?.includes('gratuito');

        if (!isFounderBenefitError) {
            console.error("Error redeeming founder club benefit:", redeemError);
            return { error: redeemError.message || "No se pudo aplicar el beneficio fundador" };
        }

        // Sin beneficio fundador, un club oficial de PAGO requiere pago real
        // (PayPal o monedas). No se concede membresía gratuita.
        if (typeof club.price === 'number' && club.price > 0) {
            return { error: "Este club requiere unirse pagando.", requiresPayment: true };
        }
    }

    const { error } = await supabase
        .from('club_members')
        .insert({
            club_id: clubId,
            user_id: user.id,
            role: 'member',
            join_source: club?.is_official ? 'standard_official' : 'standard',
            price_paid_cents: club?.is_official && typeof club.price === 'number'
                ? Math.round(club.price * 100)
                : null,
        });

    if (error) {
        console.error("Error joining club:", error);
        return { error: "No se pudo unir al club" };
    }

    await grantClubResourcesIfPro(supabase, clubId, user.id);
    await grantOfficialClubResourcesToUser(clubId, user.id);

    // Monedas Wordelia: cualifica un referido pendiente al unirse al 1er club.
    await supabase.rpc('maybe_qualify_referral');

    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true };
}

// Monedas Wordelia W2: unirse a un club oficial de pago gastando monedas.
// Las monedas cubren el precio completo (1 moneda = 1 €). Espejo del canje fundador.
export async function joinOfficialClubWithCoins(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const { data, error } = await supabase.rpc('spend_coins_official_club', {
        target_club_id: clubId,
    });

    if (error) {
        console.error("[joinOfficialClubWithCoins]", error);
        return { error: error.message || "No se pudo unir con monedas" };
    }

    await grantClubResourcesIfPro(supabase, clubId, user.id);
    await grantOfficialClubResourcesToUser(clubId, user.id);
    // Por si este es su primer club (cualifica un referido pendiente).
    await supabase.rpc('maybe_qualify_referral');

    revalidatePath('/app/clubs');
    revalidatePath(`/app/clubs/${clubId}`);

    const row = Array.isArray(data) ? data[0] : data;
    return {
        success: true,
        alreadyMember: row?.already_member ?? false,
        coinsSpent: row?.coins_spent ?? 0,
        newBalance: row?.new_balance ?? 0,
    };
}

// Normaliza el libro seleccionado y resuelve su book_id canónico
// (EditionMatchingService). Reutilizado por startReading / saveReadingPlan.
async function resolveClubBook(bookData: any): Promise<{ bookId: string } | { error: string }> {
    const normalizedBook: BookSearchResult = {
        id: bookData.id || `manual-${Date.now()}`,
        title: bookData.title,
        authors: bookData.authors && bookData.authors.length > 0
            ? bookData.authors
            : (bookData.author ? [bookData.author] : []),
        cover_url: bookData.cover_url ?? null,
        description: bookData.description ?? null,
        isbn: bookData.isbn ?? null,
        isbn13: bookData.isbn13 ?? null,
        page_count: bookData.page_count ?? null,
        published_date: bookData.published_date ?? null,
        publisher: bookData.publisher ?? null,
        categories: bookData.categories ?? [],
        average_rating: null,
        ratings_count: null,
        language: bookData.language ?? null,
        price: null,
        source: bookData.source ?? "manual",
    };

    try {
        const resolved = await resolveBookFromResult(normalizedBook);
        if (!resolved.bookId) return { error: "No se pudo identificar el libro." };
        return { bookId: resolved.bookId };
    } catch (resolveError) {
        console.error("Error resolving book:", resolveError);
        return { error: resolveError instanceof Error ? resolveError.message : "No se pudo identificar el libro." };
    }
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
        // 2. Resolve Book ID — delega en EditionMatchingService.
        const resolved = await resolveClubBook(bookData);
        if ('error' in resolved) return { error: resolved.error };
        const bookId = resolved.bookId;

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
            cover_url: bookData.cover_url ?? null,
            pregunta_apertura: config.preguntaApertura ?? null,
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

        // Club oficial: concede la guía + genoma del nuevo libro a todos los miembros.
        await grantOfficialClubResourcesToMembers(clubId, bookId);

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };

    } catch (e) {
        console.error("Error in startReading:", e);
        return { error: "Error inesperado." };
    }
}

// Programa (o actualiza) la lectura del club como 'planned'. No la activa.
export async function saveReadingPlan(clubId: string, bookData: any, config: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos para programar una lectura." };
    }

    const resolved = await resolveClubBook(bookData);
    if ('error' in resolved) return { error: resolved.error };

    const row = {
        club_id: clubId,
        book_id: resolved.bookId,
        status: 'planned',
        start_date: config.startDate,
        cover_url: bookData.cover_url ?? null,
        pregunta_apertura: config.preguntaApertura ?? null,
        pace_config: {
            pace: config.pace,
            progressMeasure: config.progressMeasure,
        },
        checkpoints: config.checkpoints ?? [],
    };

    // Una lectura programada a la vez: si ya hay una, la actualizamos.
    const { data: existingPlanned } = await supabase
        .from('club_books')
        .select('id')
        .eq('club_id', clubId)
        .eq('status', 'planned')
        .maybeSingle();

    const { error } = existingPlanned?.id
        ? await supabase.from('club_books').update(row).eq('id', existingPlanned.id)
        : await supabase.from('club_books').insert(row);

    if (error) {
        console.error("Error saving reading plan:", error);
        return { error: "Error al guardar la lectura programada." };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    revalidatePath('/');
    return { success: true };
}

// Activa una lectura programada: la pasa a 'current'. Cierra la lectura activa
// anterior (si la hay) y las votaciones abiertas.
export async function activateReading(clubId: string, clubBookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos para iniciar una lectura." };
    }

    // Cierra la lectura activa anterior (el estado permitido es 'completed').
    await supabase
        .from('club_books')
        .update({ status: 'completed' })
        .eq('club_id', clubId)
        .eq('status', 'current');

    // Cierra votaciones abiertas.
    await supabase
        .from('polls')
        .update({ is_open: false, ended_at: new Date().toISOString() })
        .eq('club_id', clubId)
        .eq('is_open', true);

    const { error } = await supabase
        .from('club_books')
        .update({ status: 'current' })
        .eq('id', clubBookId)
        .eq('club_id', clubId)
        .eq('status', 'planned');

    if (error) {
        console.error("Error activating reading:", error);
        return { error: "Error al iniciar la lectura." };
    }

    // Club oficial: concede la guía + genoma del libro activado a todos los miembros.
    const { data: activated } = await supabase
        .from('club_books')
        .select('book_id')
        .eq('id', clubBookId)
        .maybeSingle();
    if (activated?.book_id) await grantOfficialClubResourcesToMembers(clubId, activated.book_id);

    revalidatePath(`/app/clubs/${clubId}`);
    revalidatePath('/');
    return { success: true };
}

// Revierte una lectura recién activada: vuelve a ponerla como 'planned'. Pensado
// para deshacer un "Comenzar ahora" pulsado por error. No restaura lecturas
// anteriores que se hubieran cerrado al activar (caso poco común).
export async function revertReadingToPlanned(clubId: string, clubBookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos para modificar la lectura." };
    }

    const { error } = await supabase
        .from('club_books')
        .update({ status: 'planned' })
        .eq('id', clubBookId)
        .eq('club_id', clubId)
        .eq('status', 'current');

    if (error) {
        console.error("Error reverting reading:", error);
        return { error: "No se pudo revertir la lectura." };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    revalidatePath('/');
    return { success: true };
}

// Descarta una lectura programada.
export async function cancelReadingPlan(clubId: string, clubBookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Debes iniciar sesión" };

    const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .single();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        return { error: "No tienes permisos para descartar la lectura." };
    }

    const { error } = await supabase
        .from('club_books')
        .delete()
        .eq('id', clubBookId)
        .eq('club_id', clubId)
        .eq('status', 'planned');

    if (error) {
        console.error("Error cancelling reading plan:", error);
        return { error: "Error al descartar la lectura programada." };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    revalidatePath('/');
    return { success: true };
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

        const cleanIsbn = data.isbn?.trim() || null;
        const cleanIsbnDigits = cleanIsbn ? cleanIsbn.replace(/[^0-9Xx]/g, "") : "";
        const isbn13 = cleanIsbnDigits.length === 13 ? cleanIsbnDigits : null;
        const isbn10 = cleanIsbnDigits.length === 10 ? cleanIsbnDigits : null;
        const coverUrl = data.coverUrl?.trim() || null;
        const description = data.description?.trim() || null;
        const publisher = data.publisher?.trim() || null;

        // 1. Actualizar la obra (work-level fields).
        const { error: bookUpdateError } = await supabase
            .from("books")
            .update({ title: cleanTitle, description })
            .eq("id", bookId);

        if (bookUpdateError) {
            console.error("[updateClubBookDetails] book update error:", bookUpdateError);
            return { error: "No se pudo actualizar la ficha." };
        }

        // 2. Actualizar (o crear) la edición preferida con los datos de edición.
        const { data: bookRow } = await supabase
            .from("books")
            .select("preferred_edition_id")
            .eq("id", bookId)
            .maybeSingle();

        const editionFields = {
            title: cleanTitle,
            cover_url: coverUrl,
            page_count: pageCount,
            isbn: isbn10,
            isbn13,
            publisher,
        };

        if (bookRow?.preferred_edition_id) {
            const { error: editionUpdateError } = await supabase
                .from("editions")
                .update(editionFields)
                .eq("id", bookRow.preferred_edition_id);
            if (editionUpdateError) {
                console.warn("[updateClubBookDetails] edition update error:", editionUpdateError);
            }
        } else if (coverUrl || pageCount || cleanIsbn || publisher) {
            const { data: newEdition, error: editionInsertError } = await supabase
                .from("editions")
                .insert({
                    ...editionFields,
                    book_id: bookId,
                    is_abridged: false,
                    source: "manual",
                })
                .select("id")
                .single();
            if (editionInsertError) {
                console.warn("[updateClubBookDetails] edition insert error:", editionInsertError);
            } else if (newEdition?.id) {
                await supabase
                    .from("books")
                    .update({ preferred_edition_id: newEdition.id })
                    .eq("id", bookId);
            }
        }

        // 3. Si cambió el nombre del autor, intentamos actualizarlo o reapuntar.
        if (cleanAuthor && cleanAuthor !== "Autor desconocido") {
            const { data: existingAuthor } = await supabase
                .from("authors")
                .select("id")
                .ilike("name", cleanAuthor)
                .limit(1)
                .maybeSingle();

            let authorId = existingAuthor?.id;
            if (!authorId) {
                const { data: newAuthor } = await supabase
                    .from("authors")
                    .insert({ name: cleanAuthor })
                    .select("id")
                    .single();
                authorId = newAuthor?.id;
            }
            if (authorId) {
                await supabase.from("books").update({ author_id: authorId }).eq("id", bookId);
            }
        }

        revalidatePath(`/app/clubs/${clubId}`);
        revalidatePath(`/app/libros/${bookId}`);
        return {
            success: true,
            book: {
                id: bookId,
                title: cleanTitle,
                author: { name: cleanAuthor },
                cover_url: coverUrl,
                description,
                page_count: pageCount,
                isbn: cleanIsbn,
                isbn13,
                publisher,
            },
        };
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
        createdAt: post.created_at,
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

function getAudioExtension(mimeType: string) {
    if (mimeType === 'audio/mpeg') return 'mp3';
    if (mimeType === 'audio/mp4' || mimeType === 'audio/x-m4a') return 'm4a';
    if (mimeType === 'audio/ogg') return 'ogg';
    if (mimeType === 'audio/wav') return 'wav';
    return 'webm';
}

async function assertClubMember(supabase: Awaited<ReturnType<typeof createClient>>, clubId: string, userId: string) {
    const { data } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .neq('role', 'pending')
        .maybeSingle();

    if (!data) throw new Error('No perteneces a este club');
    return data.role;
}

type ClubVoiceMessageRow = {
    id: string;
    club_id: string;
    club_book_id?: string | null;
    user_id: string;
    checkpoint_index?: number | null;
    title?: string | null;
    audio_path?: string | null;
    duration_seconds?: number | null;
    mime_type: string;
    file_size_bytes?: number | null;
    transcript_status?: string | null;
    is_pinned?: boolean | null;
    created_at: string;
    author?: {
        full_name?: string | null;
        avatar_url?: string | null;
    } | null;
};

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export async function getClubVoiceMessages(clubId: string, limit = 20) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    try {
        await assertClubMember(supabase, clubId, user.id);

        const { data, error } = await supabase
            .from('club_voice_messages')
            .select(`
                id,
                club_id,
                club_book_id,
                user_id,
                checkpoint_index,
                title,
                audio_path,
                duration_seconds,
                mime_type,
                file_size_bytes,
                transcript_status,
                is_pinned,
                created_at,
                author:profiles!user_id(full_name, avatar_url)
            `)
            .eq('club_id', clubId)
            .eq('upload_status', 'ready')
            .eq('is_archived', false)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') return [];
            console.error('Error fetching voice messages:', error);
            return [];
        }

        const rows = (data || []) as ClubVoiceMessageRow[];
        const withPlaybackUrls = await Promise.all(rows.map(async (message) => {
            let playbackUrl: string | null = null;

            if (message.audio_path) {
                const { data: signed } = await supabase
                    .storage
                    .from(CLUB_VOICE_BUCKET)
                    .createSignedUrl(message.audio_path, 60 * 10);
                playbackUrl = signed?.signedUrl || null;
            }

            return {
                id: message.id,
                clubId: message.club_id,
                clubBookId: message.club_book_id,
                userId: message.user_id,
                checkpointIndex: message.checkpoint_index,
                title: message.title,
                audioPath: message.audio_path,
                playbackUrl,
                durationSeconds: message.duration_seconds,
                mimeType: message.mime_type,
                fileSizeBytes: message.file_size_bytes,
                transcriptStatus: message.transcript_status,
                isPinned: message.is_pinned,
                createdAt: message.created_at,
                date: new Date(message.created_at).toLocaleDateString(),
                author: {
                    name: message.author?.full_name || 'Moderador',
                    avatar: message.author?.avatar_url,
                },
                isAuthor: user.id === message.user_id,
            };
        }));

        return withPlaybackUrls;
    } catch (error: unknown) {
        console.error('Error loading voice messages:', error);
        return [];
    }
}

export async function createClubVoiceMessage(clubId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Debes iniciar sesión' };

    try {
        await assertAdminOrMod(supabase, clubId, user.id);

        const audio = formData.get('audio');
        if (!(audio instanceof File)) return { error: 'Añade una grabación de audio' };

        const mimeType = audio.type || 'audio/webm';
        if (!CLUB_VOICE_ALLOWED_TYPES.has(mimeType)) {
            return { error: 'Formato de audio no admitido' };
        }

        if (audio.size <= 0) return { error: 'El archivo de audio está vacío' };
        if (audio.size > CLUB_VOICE_MAX_BYTES) return { error: 'El audio no puede superar 20 MB' };

        const durationSecondsRaw = Number(formData.get('durationSeconds') || 0);
        const durationSeconds = Number.isFinite(durationSecondsRaw) && durationSecondsRaw > 0
            ? Math.round(durationSecondsRaw)
            : null;

        if (durationSeconds && durationSeconds > CLUB_VOICE_MAX_SECONDS) {
            return { error: 'El audio no puede superar 5 minutos' };
        }

        const title = String(formData.get('title') || '').trim().slice(0, 120) || null;
        const checkpointRaw = formData.get('checkpointIndex');
        const checkpointIndex = checkpointRaw ? Number(checkpointRaw) : null;
        const clubBookId = String(formData.get('clubBookId') || '').trim() || null;
        const messageId = crypto.randomUUID();
        const extension = getAudioExtension(mimeType);
        const audioPath = `${clubId}/${messageId}/audio.${extension}`;

        const { error: insertError } = await supabase
            .from('club_voice_messages')
            .insert({
                id: messageId,
                club_id: clubId,
                club_book_id: clubBookId,
                user_id: user.id,
                checkpoint_index: Number.isFinite(checkpointIndex) ? checkpointIndex : null,
                title,
                mime_type: mimeType,
                file_size_bytes: audio.size,
                duration_seconds: durationSeconds,
                upload_status: 'pending',
                transcript_status: 'none',
            });

        if (insertError) throw insertError;

        const { error: uploadError } = await supabase
            .storage
            .from(CLUB_VOICE_BUCKET)
            .upload(audioPath, audio, {
                contentType: mimeType,
                upsert: false,
            });

        if (uploadError) {
            await supabase
                .from('club_voice_messages')
                .update({ upload_status: 'failed', updated_at: new Date().toISOString() })
                .eq('id', messageId)
                .eq('club_id', clubId);
            return { error: uploadError.message };
        }

        const { error: updateError } = await supabase
            .from('club_voice_messages')
            .update({
                audio_path: audioPath,
                upload_status: 'ready',
                updated_at: new Date().toISOString(),
            })
            .eq('id', messageId)
            .eq('club_id', clubId);

        if (updateError) throw updateError;

        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true, id: messageId };
    } catch (error: unknown) {
        console.error('Error creating club voice message:', error);
        return { error: getErrorMessage(error, 'No se pudo publicar el audio') };
    }
}

export async function getClubVoiceMessagePlaybackUrl(messageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autenticado' };

    const { data: message, error } = await supabase
        .from('club_voice_messages')
        .select('club_id, audio_path')
        .eq('id', messageId)
        .eq('upload_status', 'ready')
        .eq('is_archived', false)
        .maybeSingle();

    if (error) return { error: error.message };
    if (!message?.audio_path) return { error: 'Audio no encontrado' };

    try {
        await assertClubMember(supabase, message.club_id, user.id);

        const { data, error: signedUrlError } = await supabase
            .storage
            .from(CLUB_VOICE_BUCKET)
            .createSignedUrl(message.audio_path, 60 * 10);

        if (signedUrlError) return { error: signedUrlError.message };
        return { url: data?.signedUrl || null };
    } catch (error: unknown) {
        return { error: getErrorMessage(error, 'Sin permisos') };
    }
}

export async function pinClubVoiceMessage(messageId: string, isPinned: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autenticado' };

    const { data: message } = await supabase
        .from('club_voice_messages')
        .select('club_id')
        .eq('id', messageId)
        .maybeSingle();

    if (!message) return { error: 'Audio no encontrado' };

    try {
        await assertAdminOrMod(supabase, message.club_id, user.id);

        const { error } = await supabase
            .from('club_voice_messages')
            .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
            .eq('id', messageId);

        if (error) return { error: error.message };
        revalidatePath(`/app/clubs/${message.club_id}`);
        return { success: true };
    } catch (error: unknown) {
        return { error: getErrorMessage(error, 'Sin permisos') };
    }
}

export async function deleteClubVoiceMessage(messageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autenticado' };

    const { data: message } = await supabase
        .from('club_voice_messages')
        .select('club_id, audio_path')
        .eq('id', messageId)
        .maybeSingle();

    if (!message) return { error: 'Audio no encontrado' };

    try {
        await assertAdminOrMod(supabase, message.club_id, user.id);

        const { error } = await supabase
            .from('club_voice_messages')
            .update({ is_archived: true, updated_at: new Date().toISOString() })
            .eq('id', messageId);

        if (error) return { error: error.message };

        revalidatePath(`/app/clubs/${message.club_id}`);
        return { success: true };
    } catch (error: unknown) {
        return { error: getErrorMessage(error, 'Sin permisos') };
    }
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
    settings: {
        name?: string;
        description?: string;
        visibility?: string;
        price?: number;
        portada?: boolean;
        destacado?: boolean;
        coverUrl?: string | null;
    }
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
    if (settings.price !== undefined) {
        if (Number.isNaN(settings.price) || settings.price < 0) {
            return { error: "El precio no es válido" };
        }
        updates.price = settings.price;
    }
    if (settings.portada !== undefined) updates.portada = settings.portada;
    if (settings.destacado !== undefined) updates.destacado = settings.destacado;
    if (settings.coverUrl !== undefined) updates.cover_url = settings.coverUrl;

    // Los clubs oficiales comparten dueño y RLS limita las escrituras al dueño:
    // el gestor de plataforma (admin/editor, ya validado como admin del club)
    // puede no serlo, así que las escrituras de clubs OFICIALES van por service
    // role. Para clubs de usuario se mantiene el cliente con RLS.
    const { data: clubRow } = await supabase
        .from('clubs')
        .select('is_official')
        .eq('id', clubId)
        .maybeSingle();
    const writer: any = clubRow?.is_official ? (getAdminClient() ?? supabase) : supabase;

    // Solo un club puede estar destacado ("Libro del mes"): al marcar este,
    // desmarcamos cualquier otro.
    if (settings.destacado === true) {
        await writer
            .from('clubs')
            .update({ destacado: false })
            .eq('destacado', true)
            .neq('id', clubId);
    }

    const { error } = await writer
        .from('clubs')
        .update(updates)
        .eq('id', clubId);

    if (error) {
        console.error("Error updating club settings:", error);
        return { error: error.message };
    }

    revalidatePath(`/app/clubs/${clubId}`);
    revalidatePath('/');
    return { success: true };
}

export async function getClubBookCollectiveReview(clubId: string, clubBookId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            reviews: [],
            myReview: null,
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            consensus: null,
            highlights: [],
        };
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
        return {
            reviews: [],
            myReview: null,
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            consensus: null,
            highlights: [],
        };
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
    const ratingDistribution = formatted.reduce((acc, review) => {
        const rating = Math.max(1, Math.min(5, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
        acc[rating] += 1;
        return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>);
    const highlights = formatted
        .map((review) => review.highlight)
        .filter((highlight): highlight is string => Boolean(highlight?.trim()))
        .slice(0, 4);
    const consensus = formatted.length
        ? formatted
            .map((review) => review.conclusion)
            .filter((conclusion): conclusion is string => Boolean(conclusion?.trim()))
            .sort((a, b) => b.length - a.length)[0] || null
        : null;

    return {
        reviews: formatted,
        myReview: formatted.find((review) => review.isMine) || null,
        averageRating,
        totalReviews,
        ratingDistribution,
        consensus,
        highlights,
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
    description?: string | null;
    created_at?: string | null;
    author?: { name?: string | null } | { name?: string | null }[] | null;
    preferred_edition?: {
        cover_url?: string | null;
        page_count?: number | null;
        published_date?: string | null;
    } | { cover_url?: string | null; page_count?: number | null; published_date?: string | null }[] | null;
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

function getRecommendationEdition(book?: RecommendationBookRow | null) {
    if (!book) return null;
    const edition = book.preferred_edition;
    if (!edition) return null;
    return Array.isArray(edition) ? edition[0] ?? null : edition;
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
                    description,
                    author,
                    preferred_edition:editions!books_preferred_edition_fk(cover_url, page_count, published_date)
                )
            `)
            .eq("club_id", clubId),
        supabase
            .from("books")
            .select(`
                id,
                title,
                description,
                created_at,
                author,
                preferred_edition:editions!books_preferred_edition_fk(cover_url, page_count, published_date)
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
        .map((item) => getRecommendationEdition(item.book)?.page_count)
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
            const edition = getRecommendationEdition(book);
            const title = normalizeRecommendationText(book.title);
            const author = getRecommendationAuthor(book.author);
            const searchable = normalizeRecommendationText(`${book.title} ${author} ${book.description || ""}`);
            const matchingTerms = interestTerms.filter((term) => searchable.includes(term)).slice(0, 4);
            const pageCount = edition?.page_count ?? null;
            const coverUrl = edition?.cover_url ?? null;
            const publishedDate = edition?.published_date ?? null;
            const pageFit = pageCount
                ? Math.max(0, 24 - Math.round(Math.abs(pageCount - averagePages) / 18))
                : 8;
            const momentumVotes = pollMomentum.get(title) || 0;

            let score = 18 + pageFit + Math.min(32, matchingTerms.length * 9) + Math.min(18, momentumVotes * 4);
            if (coverUrl) score += 5;
            if (book.description) score += 4;
            if (publishedDate && Number.parseInt(publishedDate.slice(0, 4), 10) < 1980) score += clubTags.includes("clasicos") ? 8 : 0;

            const reasons = [
                matchingTerms.length ? `Conecta con ${matchingTerms.slice(0, 2).join(", ")}` : "Aporta una línea nueva al club",
                pageCount ? `${pageCount} páginas, cerca del ritmo del club` : "Ritmo por definir",
                momentumVotes > 0 ? `Ya tuvo ${momentumVotes} votos` : null,
            ].filter(Boolean) as string[];

            return {
                id: book.id,
                title: book.title,
                author,
                coverUrl,
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
        await grantClubResourcesIfPro(supabase, clubId, targetUserId);
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
        await grantClubResourcesIfPro(supabase, clubId, profile.id);
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

    // Push a los miembros del club (excepto al autor). Categoría "social".
    try {
        const [{ data: members }, { data: club }] = await Promise.all([
            supabase.from('club_members').select('user_id').eq('club_id', clubId),
            supabase.from('clubs').select('name').eq('id', clubId).single(),
        ]);
        await sendPushToUsers(
            (members ?? []).map((m) => m.user_id),
            'social',
            {
                title: `📣 Anuncio en ${club?.name || 'tu club'}`,
                body: content.slice(0, 140),
                url: `/app/clubs/${clubId}`,
                tag: `club-${clubId}`,
            },
            user.id,
        );
    } catch (e) {
        console.error('[Push] anuncio de club:', e);
    }

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


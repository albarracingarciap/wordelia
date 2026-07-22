import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';

// Concesión unificada de recursos de clubs OFICIALES: al unirse (por fundador,
// monedas o PayPal) o al fijarse la lectura, el miembro obtiene la guía + genoma
// del libro del club de forma perpetua (expires_at = null). Idempotente y no
// bloqueante: los fallos se registran, nunca se lanzan. Los tipos generados de
// Supabase están desfasados, así que usamos un cliente sin tipar.

type AdminDb = { from: (t: string) => any };
const KINDS = ['guide', 'genome'] as const;

function adminDb(): AdminDb {
    return createAdminClient() as unknown as AdminDb;
}

async function isOfficialClub(admin: AdminDb, clubId: string): Promise<boolean> {
    const { data } = await admin.from('clubs').select('is_official').eq('id', clubId).maybeSingle();
    return !!data?.is_official;
}

function grantRows(userId: string, bookId: string, clubId: string) {
    return KINDS.map((kind) => ({
        user_id: userId,
        book_id: bookId,
        resource_kind: kind,
        access_source: 'official_club',
        expires_at: null,
        metadata: { club_id: clubId },
    }));
}

async function upsertGrants(admin: AdminDb, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    const { error } = await admin
        .from('user_book_resource_access')
        .upsert(rows, { onConflict: 'user_id,book_id,resource_kind', ignoreDuplicates: true });
    if (error) console.error('[club-resource-grants] upsert:', error);
}

/** Guía + genoma perpetuos de los libros del club (current + planned) para un usuario. */
export async function grantOfficialClubResourcesToUser(clubId: string, userId: string): Promise<void> {
    try {
        const admin = adminDb();
        if (!(await isOfficialClub(admin, clubId))) return;
        const { data: books } = await admin
            .from('club_books')
            .select('book_id, status')
            .eq('club_id', clubId)
            .in('status', ['current', 'planned']);
        const bookIds = [...new Set(((books ?? []) as { book_id: string | null }[]).map((b) => b.book_id).filter(Boolean))] as string[];
        await upsertGrants(admin, bookIds.flatMap((bookId) => grantRows(userId, bookId, clubId)));
    } catch (e) {
        console.error('[club-resource-grants] toUser:', e);
    }
}

/** Guía + genoma perpetuos de un libro para TODOS los miembros del club. */
export async function grantOfficialClubResourcesToMembers(clubId: string, bookId: string): Promise<void> {
    try {
        if (!bookId) return;
        const admin = adminDb();
        if (!(await isOfficialClub(admin, clubId))) return;
        const { data: members } = await admin.from('club_members').select('user_id').eq('club_id', clubId);
        const userIds = [...new Set(((members ?? []) as { user_id: string | null }[]).map((m) => m.user_id).filter(Boolean))] as string[];
        await upsertGrants(admin, userIds.flatMap((uid) => grantRows(uid, bookId, clubId)));
    } catch (e) {
        console.error('[club-resource-grants] toMembers:', e);
    }
}

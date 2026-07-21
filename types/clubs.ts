export type ClubVisibility = 'public' | 'private' | 'secret';
export type ClubRole = 'admin' | 'moderator' | 'member' | 'pending';
export type BookStatus = 'current' | 'completed' | 'planned';

// --- Modelo de "tipo" de club en dos ejes -----------------------------------
// Eje 1 — Titularidad: quién es dueño (deriva de is_official + organization_id).
export type ClubKind = 'personal' | 'library' | 'official';
// Eje 2 — Estilo de lectura (la plantilla elegida en el alta).
export type ReadingStyle = 'slow' | 'deep' | 'social' | 'private' | 'challenge' | 'emotional';
export type ReadingType = 'guided' | 'analysis';
export type SpoilerPolicy = 'levels' | 'strict' | 'free';

/** Titularidad derivada (oficial > librería > personal). */
export function clubKind(club: { is_official?: boolean | null; organization_id?: string | null }): ClubKind {
    if (club.is_official) return 'official';
    if (club.organization_id) return 'library';
    return 'personal';
}

export interface Club {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    cover_url: string | null;
    invite_code: string | null;
    owner_id: string;
    organization_id: string | null;
    visibility: ClubVisibility;
    is_official: boolean;
    is_archived: boolean;
    price: number;
    currency: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    rules?: string[];
    // Eje 2 + ajustes persistidos (todos opcionales; clubs antiguos = null).
    reading_style?: ReadingStyle | null;
    reading_type?: ReadingType | null;
    spoiler_policy?: SpoilerPolicy | null;
    pace?: string | null;
    language?: string | null;
    max_members?: number | null;
}

export interface ClubMember {
    id: string;
    club_id: string;
    user_id: string;
    role: ClubRole;
    joined_at: string;
    profile?: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface ClubBook {
    id: string;
    club_id: string;
    book_id: string;
    status: BookStatus;
    start_date: string | null;
    target_date: string | null;
    discussion_schedule: string | null;
    checkpoints?: any[];
    created_at: string;
    book?: {
        title: string;
        author: string; // This might need adjustment based on how author is joined (if it's a relation)
        cover_url: string | null;
    };
}

export interface ClubWithMembers extends Club {
    members: { count: number }[]; // Aggregate count usually
    current_book?: ClubBook | null;
    user_role?: ClubRole | null; // For the current user
}

export type ClubVisibility = 'public' | 'private';
export type ClubRole = 'admin' | 'moderator' | 'member';
export type BookStatus = 'current' | 'completed' | 'planned';

export interface Club {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    cover_url: string | null;
    invite_code: string | null;
    owner_id: string;
    visibility: ClubVisibility;
    is_official: boolean;
    is_archived: boolean;
    price: number;
    currency: string;
    tags: string[];
    created_at: string;
    updated_at: string;
    rules?: string[];
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

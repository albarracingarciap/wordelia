export type OrganizationTier = 'free' | 'pro';
export type OrganizationRole = 'owner' | 'manager' | 'staff';

export interface OrganizationSubscription {
    id: string;
    organization_id: string;
    tier: OrganizationTier;
    status: 'active' | 'trialing' | 'past_due' | 'cancelled';
    billing_period: 'monthly' | 'annual' | null;
    started_at: string;
    current_period_end: string | null;
    external_ref: string | null;
    metadata: Record<string, unknown>;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    type: 'bookstore';
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    website: string | null;
    contact_email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
    owner_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    subscription?: OrganizationSubscription | null;
}

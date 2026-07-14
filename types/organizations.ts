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

export type OrganizationEventType = 'presentacion' | 'firma' | 'encuentro' | 'taller' | 'otro';
export type OrganizationEventFormat = 'presencial' | 'online' | 'mixto';

export interface OrganizationEvent {
    id: string;
    organization_id: string;
    title: string;
    description: string | null;
    event_type: OrganizationEventType;
    starts_at: string;
    ends_at: string | null;
    format: OrganizationEventFormat;
    location: string | null;
    location_id: string | null;
    url: string | null;
    cover_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrganizationLocation {
    id: string;
    organization_id: string;
    name: string;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
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
    buy_link_template: string | null;
    brand_color: string | null;
    owner_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    subscription?: OrganizationSubscription | null;
}

// Server-side price catalog. Prices are ALWAYS resolved here (never trusted
// from the client). Amounts in euro cents. Edit these to set real prices.

export type ProductType = 'org_subscription' | 'user_plan' | 'resource' | 'club';
export type BillingPeriod = 'monthly' | 'annual';

const CATALOG = {
    // Librería Pro — placeholder, ajustar al precio comercial real.
    org_subscription: { monthly: 1900, annual: 19000 },
    // User plans (mirrors app/planes/page.tsx): voraz 6,99/67,10 · ai 14,99/143,90.
    user_plan: {
        voraz: { monthly: 699, annual: 6710 },
        ai: { monthly: 1499, annual: 14390 },
    } as Record<string, { monthly: number; annual: number }>,
    // One-off resource purchase (guide/genome) — not wired to UI yet.
    resource: 699,
};

export interface PriceInput {
    productType: ProductType;
    referenceId: string;
    period?: BillingPeriod | null;
    resourceKind?: string | null;
}

export function getPrice(input: PriceInput): { amount_cents: number; currency: string } | null {
    const currency = 'EUR';

    if (input.productType === 'org_subscription') {
        if (input.period !== 'monthly' && input.period !== 'annual') return null;
        return { amount_cents: CATALOG.org_subscription[input.period], currency };
    }

    if (input.productType === 'user_plan') {
        const plan = CATALOG.user_plan[input.referenceId];
        if (!plan) return null;
        if (input.period !== 'monthly' && input.period !== 'annual') return null;
        return { amount_cents: plan[input.period], currency };
    }

    if (input.productType === 'resource') {
        return { amount_cents: CATALOG.resource, currency };
    }

    return null; // 'club' not priced here yet
}

/** "1900" cents -> "19,00 €" for display. */
export function formatAmount(cents: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100);
}

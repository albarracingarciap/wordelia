// Shared, framework-agnostic access predicates for subscriptions. Used by both
// the user resource gates and the library (organization) gate so "grace until
// the paid period ends" behaves the same everywhere.

// A cancelled or past_due subscription still grants access until its paid period
// ends; paused (suspended) and expired never grant.
const GRACE_STATUSES = new Set(["active", "cancelled", "past_due"]);

/** True while a subscription grants access. */
export function isSubscriptionActive(
    status: string | null | undefined,
    currentPeriodEnd: string | null | undefined,
): boolean {
    if (!status || !GRACE_STATUSES.has(status)) return false;
    if (!currentPeriodEnd) return status === "active";
    return new Date(currentPeriodEnd).getTime() > Date.now();
}

export interface OrgSubscriptionLike {
    tier: string | null;
    status: string | null;
    current_period_end: string | null;
}

/** True when a library has an active paid (Pro) subscription. */
export function isOrgProActive(sub: OrgSubscriptionLike | null | undefined): boolean {
    if (!sub || sub.tier !== "pro") return false;
    return isSubscriptionActive(sub.status, sub.current_period_end);
}

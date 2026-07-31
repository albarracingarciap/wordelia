import "server-only";

/** Autoriza una petición de cron por el header `Authorization: Bearer <CRON_SECRET>`. */
export function isCronAuthorized(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return (req.headers.get("authorization") || "") === `Bearer ${secret}`;
}

export const MADRID = "Europe/Madrid";

// Offset (ms) entre la hora local de `tz` y UTC en un instante dado.
function tzOffsetMs(tz: string, at: Date): number {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const parts = dtf.formatToParts(at);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return asUTC - at.getTime();
}

/**
 * Instante UTC correspondiente al inicio (00:00) del día en `tz`, `daysAgo` días
 * atrás. Robusto ante DST (la corrección se aplica sobre medianoche, lejos de las
 * transiciones horarias). Como no guardamos tz por usuario, los crons usan MADRID.
 */
export function zonedDayStartUTC(tz: string, daysAgo = 0): Date {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const base = new Date(Date.UTC(get("year"), get("month") - 1, get("day")) - daysAgo * 86_400_000);
    const guess = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0);
    const offset = tzOffsetMs(tz, new Date(guess));
    return new Date(guess - offset);
}

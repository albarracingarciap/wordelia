// Lógica pura (client-safe) de si el aviso global debe mostrarse. Vive aparte de
// lib/app-settings.ts porque ese módulo es server-only (service role) y el banner
// corre en el cliente. La comparten el banner y cualquier consumidor server.

export interface AnnouncementLike {
    enabled?: boolean;
    message?: string;
    variant?: "info" | "warning";
    expires_at?: string | null;
}

/** True si el aviso está habilitado, tiene texto y no ha caducado a fecha `now`. */
export function isAnnouncementLive(a: AnnouncementLike | null | undefined, now: Date = new Date()): boolean {
    if (!a?.enabled) return false;
    if (!a.message || !a.message.trim()) return false;
    if (a.expires_at) {
        // Caduca al final del día indicado (fecha YYYY-MM-DD, hora local).
        const end = new Date(`${a.expires_at}T23:59:59`);
        if (!Number.isNaN(end.getTime()) && now > end) return false;
    }
    return true;
}

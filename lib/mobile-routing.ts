// Enrutado del shell móvil /m (fase M5). Sin dependencias: se usa en el
// middleware (proxy) y en cliente.
//
// Regla: un móvil que ENTRA en una ruta de /app con equivalente en /m (app
// instalada, notificación, enlace externo, tras el login…) se redirige a /m,
// salvo que el usuario haya elegido la versión completa (cookie `wordelia-ui=full`).
// La navegación interna (enlaces dentro de /app o de /m a /app) no se toca: así
// "Ver versión completa" desde /m funciona sin rebotar.

export const UI_MODE_COOKIE = "wordelia-ui";
/** Parámetro que marca una entrada explícita (lo añade el service worker al abrir una notificación). */
export const ENTRY_PARAM = "entry";

/** Detección por cabeceras (Client Hints en Chromium, User-Agent en el resto). Tablets/iPad → escritorio. */
export function isMobileRequest(headers: Headers): boolean {
    const hint = headers.get("sec-ch-ua-mobile");
    if (hint === "?1") return true;
    if (hint === "?0") return false;
    const ua = headers.get("user-agent") || "";
    return /Mobi|iPhone|iPod/i.test(ua);
}

/** Equivalente en /m de una ruta de /app, o null si no lo hay. */
export function toMobilePath(pathname: string, search: URLSearchParams): string | null {
    const path = pathname.replace(/\/+$/, "") || "/";

    if (path === "/app" || path === "/app/mi-lectura") return "/m";
    if (path === "/app/clubs") return "/m/clubs";
    if (path === "/app/perfil") return "/m/yo";
    if (path === "/app/wishes") return search.get("tab") === "gifts" ? null : "/m/deseos";

    let m = path.match(/^\/app\/clubs\/([^/]+)\/sesion\/([^/]+)$/);
    if (m) return `/m/clubs/${m[1]}/sesion/${m[2]}`;

    m = path.match(/^\/app\/clubs\/([^/]+)$/);
    if (m && m[1] !== "crear") return `/m/clubs/${m[1]}`;

    // La vista de invitado (lista de otro) vive en /app: /m/deseos/[id] es solo del propietario.
    m = path.match(/^\/app\/wishes\/([^/]+)$/);
    if (m && m[1] !== "person" && search.get("view") !== "guest") return `/m/deseos/${m[1]}`;

    return null;
}

/** ¿La petición viene de navegar dentro de la app (desde /app o /m)? */
export function isInternalNavigation(headers: Headers): boolean {
    const site = headers.get("sec-fetch-site");
    if (site && site !== "same-origin") return false;
    const referer = headers.get("referer");
    if (!referer) return false;
    try {
        const p = new URL(referer).pathname;
        return p === "/app" || p.startsWith("/app/") || p === "/m" || p.startsWith("/m/");
    } catch {
        return false;
    }
}

/*
 * Service worker de Wordelia — PWA Fase 0.
 *
 * Estrategia CONSERVADORA a propósito, para no romper SSR/SEO ni servir contenido
 * privado obsoleto:
 *   - Navegaciones (HTML): network-first. Online → siempre fresco. Offline → página
 *     /offline.html. NUNCA cacheamos el HTML (evita servir páginas de otro usuario
 *     o versiones viejas de la web pública).
 *   - Assets estáticos con hash (/_next/static, /icons, /assets): cache-first con
 *     revalidación (son inmutables o versionados; seguros de cachear).
 *   - Cross-origin y no-GET: se dejan pasar sin tocar.
 *
 * Al cambiar la lógica, subir CACHE_VERSION para invalidar la caché anterior.
 */
const CACHE_VERSION = "wordelia-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // no interferir con terceros

    // Navegaciones: network-first, fallback offline. Sin cachear HTML.
    if (req.mode === "navigate") {
        event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
        return;
    }

    // Assets estáticos versionados: cache-first + revalidación en segundo plano.
    const isStatic =
        url.pathname.startsWith("/_next/static") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/fonts/");

    if (isStatic) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const network = fetch(req)
                    .then((res) => {
                        if (res && res.status === 200) {
                            const copy = res.clone();
                            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                        }
                        return res;
                    })
                    .catch(() => cached);
                return cached || network;
            }),
        );
        return;
    }

    // Resto (APIs, datos): red directa, sin cachear.
});

/* --- Web Push (Fase 0.3) --- */

self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: "Wordelia", body: event.data ? event.data.text() : "" };
    }

    const title = data.title || "Wordelia";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: data.url || "/app" },
        tag: data.tag, // colapsa notificaciones del mismo tipo si se indica
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const target = (event.notification.data && event.notification.data.url) || "/app";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            // Si ya hay una ventana de la app abierta, la enfocamos y navegamos.
            for (const client of clients) {
                if ("focus" in client) {
                    client.focus();
                    if ("navigate" in client) client.navigate(target).catch(() => {});
                    return;
                }
            }
            // Si no, abrimos una nueva.
            if (self.clients.openWindow) return self.clients.openWindow(target);
        }),
    );
});

import type { MetadataRoute } from "next";

// PWA (Fase 0). start_url apunta a /app: la app instalada abre la herramienta del
// lector; la web pública sigue navegable por navegador. Iconos en /public/icons
// (placeholder de marca — sustituir por el definitivo sin tocar este archivo).
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Wordelia",
        short_name: "Wordelia",
        description: "Tu lectura, tus notas y tus clubs. Donde importan las palabras.",
        start_url: "/app",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        lang: "es",
        background_color: "#FFFAEF",
        theme_color: "#336871",
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}

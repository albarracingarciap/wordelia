import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/utils/supabase/admin";

export const revalidate = 3600; // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
        { url: `${SITE_URL}/planes`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${SITE_URL}/explorar`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/librerias`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/guias`, changeFrequency: "weekly", priority: 0.7 },
        { url: `${SITE_URL}/genomas`, changeFrequency: "weekly", priority: 0.7 },
        { url: `${SITE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    ];

    // Solo fichas de libro CON reseñas: son las que tienen contenido que merece
    // indexar (evita miles de páginas vacías = thin content).
    let bookRoutes: MetadataRoute.Sitemap = [];
    try {
        const admin = createAdminClient() as unknown as { from: (t: string) => any };
        const { data } = await admin.from("reviews").select("book_id").limit(5000);
        const ids = [...new Set(((data ?? []) as any[]).map((r) => r.book_id).filter(Boolean))];
        bookRoutes = ids.map((id) => ({
            url: `${SITE_URL}/libro/${id}`,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }));
    } catch (e) {
        console.error("sitemap:books", e);
    }

    // Cada librería activa: es la casa pública de la librería, contenido único
    // (clubs, sedes, agenda) que queremos indexar.
    let libraryRoutes: MetadataRoute.Sitemap = [];
    try {
        const admin = createAdminClient() as unknown as { from: (t: string) => any };
        const { data } = await admin
            .from("organizations")
            .select("slug, updated_at")
            .eq("is_active", true)
            .limit(5000);
        libraryRoutes = ((data ?? []) as any[])
            .filter((o) => o.slug)
            .map((o) => ({
                url: `${SITE_URL}/librerias/${o.slug}`,
                lastModified: o.updated_at ? new Date(o.updated_at) : undefined,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));
    } catch (e) {
        console.error("sitemap:libraries", e);
    }

    return [...staticRoutes, ...bookRoutes, ...libraryRoutes];
}

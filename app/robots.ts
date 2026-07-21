import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // La zona autenticada y las APIs no aportan a la indexación.
            disallow: ["/app/", "/api/", "/auth/"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}

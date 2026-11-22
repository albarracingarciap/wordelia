import "server-only";
import { headers } from "next/headers";

/**
 * Origen público de la app para enlaces que salen fuera (emails de Supabase
 * auth, return_url de PayPal…). Orden:
 *   1. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL si están definidas.
 *   2. El origen real de la petición (host + proto tras el proxy): en producción
 *      es https://wordelia.es y en local http://localhost:3000.
 *   3. https://wordelia.es.
 * Antes el fallback era localhost:3000, y en producción sin la variable los
 * enlaces de confirmación de registro apuntaban a localhost.
 */
export async function getAppOrigin(): Promise<string> {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, "");

    try {
        const h = await headers();
        const host = h.get("x-forwarded-host") || h.get("host");
        if (host) {
            const proto =
                h.get("x-forwarded-proto")?.split(",")[0].trim() ||
                (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
            return `${proto}://${host}`;
        }
    } catch {
        // Fuera de un contexto de petición: usamos el valor por defecto.
    }
    return "https://wordelia.es";
}

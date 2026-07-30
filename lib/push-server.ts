import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/utils/supabase/admin";

// Configuración perezosa de VAPID (una vez por proceso).
let configured = false;
function ensureConfigured(): boolean {
    if (configured) return true;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:hola@wordelia.es";
    if (!publicKey || !privateKey) {
        console.error("[Push] Faltan VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY en el entorno.");
        return false;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    icon?: string;
}

// Categorías de notificación (deben coincidir con las keys `push_<cat>` de
// profiles.notification_settings). El default se aplica cuando la key no existe.
export type PushCategory = "reading_reminders" | "recommendations" | "social" | "achievements" | "libraries";

const CATEGORY_DEFAULT: Record<PushCategory, boolean> = {
    reading_reminders: true,
    recommendations: false,
    social: true,
    achievements: true,
    libraries: true,
};

/**
 * Envía push a un usuario SOLO si tiene activada esa categoría en sus preferencias
 * (profiles.notification_settings.push_<category>). Respeta el default si la key no
 * está guardada. Devuelve `{ skipped: true }` si la preferencia está desactivada.
 */
export async function sendPushIfEnabled(
    userId: string,
    category: PushCategory,
    payload: PushPayload,
): Promise<{ sent: number; pruned: number; skipped?: boolean }> {
    const admin = createAdminClient() as unknown as LooseAdmin;
    const { data: profile } = await admin
        .from("profiles")
        .select("notification_settings")
        .eq("id", userId)
        .maybeSingle();

    const settings = (profile?.notification_settings ?? {}) as Record<string, boolean> | null;
    const enabled = settings?.[`push_${category}`] ?? CATEGORY_DEFAULT[category];
    if (!enabled) return { sent: 0, pruned: 0, skipped: true };

    return sendPushToUser(userId, payload);
}

/**
 * Igual que sendPushIfEnabled pero para varios destinatarios en paralelo.
 * `exclude` normalmente es el autor de la acción (no notificarse a sí mismo).
 */
export async function sendPushToUsers(
    userIds: string[],
    category: PushCategory,
    payload: PushPayload,
    exclude?: string | null,
): Promise<void> {
    const targets = Array.from(new Set(userIds.filter((id) => id && id !== exclude)));
    if (targets.length === 0) return;
    await Promise.all(targets.map((id) => sendPushIfEnabled(id, category, payload).catch(() => undefined)));
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseAdmin = { from: (table: string) => any };

/**
 * Envía una notificación push a TODOS los dispositivos suscritos de un usuario.
 * Poda las suscripciones caducadas (404/410). Usa service role (bypassa RLS).
 * Devuelve cuántas se enviaron y cuántas se podaron.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; pruned: number }> {
    if (!ensureConfigured()) return { sent: 0, pruned: 0 };

    const admin = createAdminClient() as unknown as LooseAdmin;
    const { data: subs } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);

    const rows = (subs ?? []) as SubRow[];
    if (rows.length === 0) return { sent: 0, pruned: 0 };

    const body = JSON.stringify(payload);
    const deadIds: string[] = [];
    let sent = 0;

    await Promise.all(
        rows.map(async (s) => {
            try {
                await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
                sent++;
            } catch (err: unknown) {
                const code = (err as { statusCode?: number })?.statusCode;
                if (code === 404 || code === 410) {
                    deadIds.push(s.id); // suscripción caducada → podar
                } else {
                    console.error("[Push] Error enviando:", code, (err as { body?: string })?.body);
                }
            }
        }),
    );

    if (deadIds.length > 0) {
        await admin.from("push_subscriptions").delete().in("id", deadIds);
    }

    return { sent, pruned: deadIds.length };
}

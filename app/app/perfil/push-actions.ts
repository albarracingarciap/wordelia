"use server";

import { createClient } from "@/utils/supabase/server";
import { sendPushToUser } from "@/lib/push-server";

// push_subscriptions no está en los tipos generados; casts puntuales de forma.
type UpsertTable = {
    upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
    ) => Promise<{ error: { message?: string } | null }>;
};
type DeleteTable = {
    delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: { message?: string } | null }> } };
};

export async function savePushSubscription(sub: {
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
}): Promise<{ success?: true; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const table = supabase.from("push_subscriptions" as never) as never as UpsertTable;
    const { error } = await table.upsert(
        {
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
            user_agent: sub.userAgent ?? null,
        },
        { onConflict: "endpoint" },
    );
    if (error) return { error: error.message || "No hemos podido guardar la suscripción." };
    return { success: true };
}

export async function deletePushSubscription(endpoint: string): Promise<{ success?: true; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const table = supabase.from("push_subscriptions" as never) as never as DeleteTable;
    await table.delete().eq("endpoint", endpoint).eq("user_id", user.id);
    return { success: true };
}

/** Envío de prueba al propio usuario (para verificar el ciclo end-to-end). */
export async function sendTestPush(): Promise<{ success?: true; sent?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const res = await sendPushToUser(user.id, {
        title: "Notificaciones activadas 🎉",
        body: "Te avisaremos de la actividad de tus clubs, retos y librerías.",
        url: "/app/mi-lectura",
        tag: "wordelia-test",
    });
    if (res.sent === 0) return { error: "No hay dispositivos suscritos o falta configuración VAPID." };
    return { success: true, sent: res.sent };
}

"use client";

import { savePushSubscription, deletePushSubscription } from "@/app/app/perfil/push-actions";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// La applicationServerKey debe ir como Uint8Array (base64url → bytes).
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

export function pushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

export interface PushState {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
}

export async function getPushState(): Promise<PushState> {
    if (!pushSupported()) return { supported: false, permission: "denied", subscribed: false };
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return { supported: true, permission: Notification.permission, subscribed: !!sub };
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
    if (!pushSupported()) return { ok: false, error: "Tu navegador no soporta notificaciones." };
    if (!VAPID_PUBLIC) return { ok: false, error: "Falta la configuración de notificaciones (VAPID)." };

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        return { ok: false, error: "No has concedido permiso para las notificaciones." };
    }

    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
        return { ok: false, error: "El service worker no está activo. Prueba con el build de producción." };
    }

    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // cast: Uint8Array genérico vs BufferSource en TS reciente.
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
    });

    const json = sub.toJSON();
    const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
    });
    if (res.error) return { ok: false, error: res.error };
    return { ok: true };
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
    if (!pushSupported()) return { ok: false };
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
    }
    return { ok: true };
}

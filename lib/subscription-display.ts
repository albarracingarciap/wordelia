// Etiquetas y colores de display para planes de usuario y estados de suscripción.
// Client-safe (solo importa PLANS, que son cadenas de display). Lo consumen la
// lista y la ficha de /app/admin/usuarios para que ambas hablen el mismo idioma.
import { PLANS } from "./plans";

/** Nombre legible del plan a partir de su código (voraz → "Lector Voraz"). Sin plan = "Gratis". */
export function planLabel(code?: string | null): string {
    if (!code) return "Gratis";
    return PLANS.find((p) => p.id === code)?.name ?? code;
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
    active: "Activa",
    cancelled: "Cancelada",
    past_due: "Pago pendiente",
    paused: "Pausada",
    expired: "Expirada",
};

export function subscriptionStatusLabel(status?: string | null): string {
    if (!status) return "—";
    return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

/** Clases Tailwind para el pill de estado. Verde = concede acceso, ámbar = gracia, gris = sin acceso. */
export function subscriptionStatusClasses(status?: string | null): string {
    switch (status) {
        case "active":
            return "text-teal-dark bg-teal/15";
        case "cancelled":
        case "past_due":
            return "text-amber-700 bg-amber-100";
        case "paused":
        case "expired":
        default:
            return "text-muted-foreground bg-muted";
    }
}

export function periodLabel(period?: string | null): string {
    if (period === "monthly") return "Mensual";
    if (period === "annual") return "Anual";
    return "—";
}

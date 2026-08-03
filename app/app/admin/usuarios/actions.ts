"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { fetchUsersEnriched, type AdminUserRow } from "./data";

// Toda la sección Usuarios es solo-admin: expone emails, historial de pagos y
// acciones destructivas/financieras sobre terceros (el layout deja entrar
// también a editor, por eso re-checamos aquí como en Mensajes/Colecciones).
async function requireAdmin(): Promise<{ id: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("No autorizado");
    return { id: user.id };
}

type ActionResult = { success: true } | { success: false; error: string };

const GRANTABLE_PLANS = ["voraz", "ai"] as const;
type GrantablePlan = (typeof GRANTABLE_PLANS)[number];

// ---------------------------------------------------------------------------
// Lista (búsqueda en vivo desde el cliente)
// ---------------------------------------------------------------------------

export async function searchUsersAction(query: string): Promise<{ users?: AdminUserRow[]; error?: string }> {
    try {
        await requireAdmin();
        const users = await fetchUsersEnriched(query);
        return { users };
    } catch (e) {
        console.error("searchUsersAction:", e);
        return { error: "No se pudo buscar usuarios." };
    }
}

// ---------------------------------------------------------------------------
// Rol
// ---------------------------------------------------------------------------

export async function updateUserRoleAction(userId: string, newRole: string): Promise<ActionResult> {
    if (!["user", "editor", "admin"].includes(newRole)) {
        return { success: false, error: "Rol no válido." };
    }
    try {
        await requireAdmin();
        const admin = createAdminClient();
        const { error } = await admin.from("profiles").update({ role: newRole }).eq("id", userId);
        if (error) throw error;
        revalidatePath(`/app/admin/usuarios/${userId}`);
        revalidatePath("/app/admin/usuarios");
        return { success: true };
    } catch (e) {
        console.error("updateUserRoleAction:", e);
        return { success: false, error: "No se pudo actualizar el rol." };
    }
}

// ---------------------------------------------------------------------------
// Plan (concesión / revocación manual)
// ---------------------------------------------------------------------------

/**
 * Concede un plan de pago a mano (comp, cortesía, incidencia). `months` null =
 * indefinido (sin fecha de fin: activo hasta que se revoque). Preserva el enlace
 * con PayPal si lo hubiera (no lo cancela: eso hay que hacerlo en PayPal aparte).
 */
export async function grantPlanAction(
    userId: string,
    plan: string,
    months: number | null,
): Promise<ActionResult> {
    if (!GRANTABLE_PLANS.includes(plan as GrantablePlan)) {
        return { success: false, error: "Plan no válido para concesión manual." };
    }
    try {
        const { id: grantorId } = await requireAdmin();
        const admin = createAdminClient();
        const now = new Date();

        let currentPeriodEnd: string | null = null;
        let period: string | null = null;
        if (months && months > 0) {
            const end = new Date(now);
            end.setMonth(end.getMonth() + months);
            currentPeriodEnd = end.toISOString();
            period = months >= 12 ? "annual" : "monthly";
        }

        const { data: existing } = await admin
            .from("user_subscriptions")
            .select("provider_subscription_id")
            .eq("user_id", userId)
            .maybeSingle();

        const patch = {
            plan,
            status: "active",
            period,
            current_period_end: currentPeriodEnd,
            external_ref: `admin:${grantorId}`,
            updated_at: now.toISOString(),
        };

        if (existing) {
            // Si no había suscripción de proveedor, la marcamos como manual;
            // si la había (PayPal), conservamos provider/provider_subscription_id
            // para no huérfanar el enlace — la UI ya advierte de esto.
            const finalPatch = existing.provider_subscription_id
                ? patch
                : { ...patch, provider: "manual" };
            const { error } = await admin.from("user_subscriptions").update(finalPatch).eq("user_id", userId);
            if (error) throw error;
        } else {
            const { error } = await admin.from("user_subscriptions").insert({
                user_id: userId,
                provider: "manual",
                ...patch,
            });
            if (error) throw error;
        }

        revalidatePath(`/app/admin/usuarios/${userId}`);
        revalidatePath("/app/admin/usuarios");
        return { success: true };
    } catch (e) {
        console.error("grantPlanAction:", e);
        return { success: false, error: "No se pudo conceder el plan." };
    }
}

/**
 * Revoca el acceso marcando la suscripción como `expired` (nunca concede acceso,
 * sea cual sea la fecha). No borra la fila para conservar el histórico. Si es una
 * suscripción de PayPal hay que cancelarla también en PayPal (la UI lo advierte).
 */
export async function revokePlanAction(userId: string): Promise<ActionResult> {
    try {
        await requireAdmin();
        const admin = createAdminClient();

        const { data: existing } = await admin
            .from("user_subscriptions")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (!existing) return { success: false, error: "El usuario no tiene suscripción." };

        const { error } = await admin
            .from("user_subscriptions")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        if (error) throw error;

        revalidatePath(`/app/admin/usuarios/${userId}`);
        revalidatePath("/app/admin/usuarios");
        return { success: true };
    } catch (e) {
        console.error("revokePlanAction:", e);
        return { success: false, error: "No se pudo revocar el plan." };
    }
}

// ---------------------------------------------------------------------------
// Wordix (monedas): regalo manual
// ---------------------------------------------------------------------------

const MAX_GIFT_COINS = 10000;

/**
 * Regala Wordix a un usuario (cortesía, incidencia, evento). Usa la función
 * atómica `credit_coins` (security definer) con motivo `admin_adjust`, que
 * actualiza saldo + ledger en una sola operación. Solo importes positivos.
 */
export async function giftCoinsAction(userId: string, amount: number): Promise<ActionResult & { balance?: number }> {
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) {
        return { success: false, error: "Introduce una cantidad de Wordix mayor que 0." };
    }
    if (amt > MAX_GIFT_COINS) {
        return { success: false, error: `Máximo ${MAX_GIFT_COINS} Wordix por operación.` };
    }
    try {
        const { id: grantorId } = await requireAdmin();
        const admin = createAdminClient();
        // Tipos de Supabase desfasados: la RPC no está en el Database generado.
        const { data, error } = await (admin as unknown as {
            rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
        }).rpc("credit_coins", {
            p_user: userId,
            p_amount: amt,
            p_reason: "admin_adjust",
            p_reference: `admin:${grantorId}`,
        });
        if (error) throw error;
        revalidatePath(`/app/admin/usuarios/${userId}`);
        return { success: true, balance: typeof data === "number" ? data : undefined };
    } catch (e) {
        console.error("giftCoinsAction:", e);
        return { success: false, error: "No se pudieron regalar los Wordix." };
    }
}

// ---------------------------------------------------------------------------
// Acciones de cuenta
// ---------------------------------------------------------------------------

/** Marca el email como verificado a mano (desbloquea a un usuario atascado). */
export async function confirmEmailAction(userId: string): Promise<ActionResult> {
    try {
        await requireAdmin();
        const admin = createAdminClient();
        const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
        if (error) throw error;
        revalidatePath(`/app/admin/usuarios/${userId}`);
        return { success: true };
    } catch (e) {
        console.error("confirmEmailAction:", e);
        return { success: false, error: "No se pudo confirmar el email." };
    }
}

export async function setOnboardingAction(userId: string, completed: boolean): Promise<ActionResult> {
    try {
        await requireAdmin();
        const admin = createAdminClient();
        const { error } = await admin
            .from("profiles")
            .update({ onboarding_completed: completed })
            .eq("id", userId);
        if (error) throw error;
        revalidatePath(`/app/admin/usuarios/${userId}`);
        return { success: true };
    } catch (e) {
        console.error("setOnboardingAction:", e);
        return { success: false, error: "No se pudo actualizar el onboarding." };
    }
}

/**
 * Elimina la cuenta de auth (cascade borra su profile). Destructivo e
 * irreversible: bloqueamos borrarse a uno mismo y borrar a otros admins.
 */
export async function deleteUserAction(userId: string): Promise<ActionResult> {
    try {
        const { id: adminId } = await requireAdmin();
        if (userId === adminId) {
            return { success: false, error: "No puedes eliminar tu propia cuenta." };
        }

        const admin = createAdminClient();
        const { data: target } = await admin
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .maybeSingle();

        if (target?.role === "admin") {
            return { success: false, error: "No se puede eliminar a otro administrador." };
        }

        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw error;

        revalidatePath("/app/admin/usuarios");
        return { success: true };
    } catch (e) {
        console.error("deleteUserAction:", e);
        return { success: false, error: "No se pudo eliminar la cuenta." };
    }
}

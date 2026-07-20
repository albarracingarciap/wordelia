// Capa de datos de la sección Usuarios del admin. Server-only: usa el service
// role (createAdminClient) porque la RLS no da SELECT global sobre profiles,
// suscripciones ni pagos de terceros. La comparten la página lista (carga
// inicial) y las server actions (búsqueda en vivo), por eso vive fuera de
// actions.ts (un módulo "use server" no puede exportar helpers normales).
import { createAdminClient } from "@/utils/supabase/admin";

export interface AdminUserSubscription {
    plan: string;
    status: string;
    period: string | null;
    current_period_end: string | null;
    provider: string;
    provider_subscription_id: string | null;
}

export interface AdminUserRow {
    id: string;
    email: string | null;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    created_at: string | null;
    onboarding_completed: boolean | null;
    subscription: AdminUserSubscription | null;
}

/** Lista de usuarios (máx. 50) con su suscripción, ordenados por alta descendente. */
export async function fetchUsersEnriched(query = ""): Promise<AdminUserRow[]> {
    const admin = createAdminClient();

    let profilesQuery = admin
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, role, created_at, onboarding_completed")
        .order("created_at", { ascending: false })
        .limit(50);

    if (query) {
        const safe = query.replace(/[%,()]/g, " ").trim();
        if (safe) {
            profilesQuery = profilesQuery.or(
                `email.ilike.%${safe}%,full_name.ilike.%${safe}%,username.ilike.%${safe}%`,
            );
        }
    }

    const { data: profiles, error } = await profilesQuery;
    if (error || !profiles) {
        console.error("fetchUsersEnriched: error leyendo profiles", error);
        return [];
    }

    const ids = profiles.map((p) => p.id);
    const { data: subs } = ids.length
        ? await admin
              .from("user_subscriptions")
              .select("user_id, plan, status, period, current_period_end, provider, provider_subscription_id")
              .in("user_id", ids)
        : { data: [] as { user_id: string }[] };

    const byUser = new Map((subs ?? []).map((s: any) => [s.user_id, s]));

    return profiles.map((p) => {
        const sub = byUser.get(p.id) as any;
        return {
            ...p,
            subscription: sub
                ? {
                      plan: sub.plan,
                      status: sub.status,
                      period: sub.period,
                      current_period_end: sub.current_period_end,
                      provider: sub.provider,
                      provider_subscription_id: sub.provider_subscription_id,
                  }
                : null,
        };
    });
}

export interface AdminUserAuthInfo {
    email: string | null;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    created_at: string | null;
}

export interface AdminUserPayment {
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    product_type: string | null;
    provider: string;
    created_at: string;
}

export interface AdminUserDetail {
    profile: {
        id: string;
        email: string | null;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
        role: string | null;
        bio: string | null;
        location: string | null;
        created_at: string | null;
        onboarding_completed: boolean | null;
    };
    auth: AdminUserAuthInfo | null;
    subscription:
        | (AdminUserSubscription & {
              provider_plan_id: string | null;
              external_ref: string | null;
              created_at: string;
              updated_at: string;
          })
        | null;
    payments: AdminUserPayment[];
}

/** Ficha completa de un usuario: perfil, datos de auth, suscripción y pagos. */
export async function fetchUserDetail(id: string): Promise<AdminUserDetail | null> {
    const admin = createAdminClient();

    const { data: profile } = await admin
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, role, bio, location, created_at, onboarding_completed")
        .eq("id", id)
        .maybeSingle();

    if (!profile) return null;

    const [authRes, subRes, paymentsRes] = await Promise.all([
        admin.auth.admin.getUserById(id),
        admin
            .from("user_subscriptions")
            .select(
                "plan, status, period, current_period_end, provider, provider_subscription_id, provider_plan_id, external_ref, created_at, updated_at",
            )
            .eq("user_id", id)
            .maybeSingle(),
        admin
            .from("subscription_payments")
            .select("id, amount_cents, currency, status, product_type, provider, created_at")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
            .limit(50),
    ]);

    const authUser = authRes.data?.user;

    return {
        profile,
        auth: authUser
            ? {
                  email: authUser.email ?? null,
                  email_confirmed_at: authUser.email_confirmed_at ?? null,
                  last_sign_in_at: authUser.last_sign_in_at ?? null,
                  created_at: authUser.created_at ?? null,
              }
            : null,
        subscription: (subRes.data as AdminUserDetail["subscription"]) ?? null,
        payments: (paymentsRes.data as AdminUserPayment[]) ?? [],
    };
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { TRANSACTIONS_PAGE_SIZE } from "@/lib/coins";

export type CoinWallet = {
    balance: number;
    lifetimeEarned: number;
};

export type CoinTransaction = {
    id: string;
    amount: number;
    reason: string;
    reference: string | null;
    balanceAfter: number;
    createdAt: string;
};

export type ReferredEntry = {
    username: string | null;
    status: "pending" | "rewarded";
    createdAt: string;
};

export type ReferralInfo = {
    code: string;
    url: string;
    pending: number;
    rewarded: number;
    referred: ReferredEntry[];
};

export async function getMyWallet(): Promise<CoinWallet> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { balance: 0, lifetimeEarned: 0 };

    const { data } = await supabase
        .from("coin_wallets")
        .select("balance, lifetime_earned")
        .eq("user_id", user.id)
        .maybeSingle();

    return {
        balance: data?.balance ?? 0,
        lifetimeEarned: data?.lifetime_earned ?? 0,
    };
}

export async function getMyTransactions(limit = TRANSACTIONS_PAGE_SIZE, offset = 0): Promise<CoinTransaction[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from("coin_transactions")
        .select("id, amount, reason, reference, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    return (data ?? []).map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        reference: t.reference,
        balanceAfter: t.balance_after,
        createdAt: t.created_at,
    }));
}

export async function getMyReferralInfo(): Promise<ReferralInfo | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: code, error: codeError } = await supabase.rpc("get_or_create_referral_code");
    if (codeError || !code) {
        console.error("[getMyReferralInfo] code:", codeError);
        return null;
    }

    const { data: rows } = await supabase
        .from("referrals")
        .select("referred_id, status, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

    const referralRows = rows ?? [];

    // Nombres de los invitados (lectura cruzada de perfiles vía service role).
    let usernames: Record<string, string | null> = {};
    if (referralRows.length > 0) {
        const admin = createAdminClient();
        const ids = referralRows.map((r) => r.referred_id);
        const { data: profiles } = await admin
            .from("profiles")
            .select("id, username")
            .in("id", ids);
        usernames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
    }

    const referred: ReferredEntry[] = referralRows.map((r) => ({
        username: usernames[r.referred_id] ?? null,
        status: r.status as "pending" | "rewarded",
        createdAt: r.created_at,
    }));

    return {
        code: code as string,
        url: `${SITE_URL}/r/${code}`,
        pending: referred.filter((r) => r.status === "pending").length,
        rewarded: referred.filter((r) => r.status === "rewarded").length,
        referred,
    };
}

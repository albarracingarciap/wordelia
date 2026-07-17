import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SubscriptionManager from "@/components/payments/SubscriptionManager";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // RLS lets the user read their own subscription + payment rows.
    const [{ data: sub }, { data: payments }] = await Promise.all([
        supabase
            .from("user_subscriptions")
            .select("plan, period, status, current_period_end, provider_subscription_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        supabase
            .from("subscription_payments")
            .select("id, amount_cents, currency, status, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(24),
    ]);

    return <SubscriptionManager subscription={sub ?? null} payments={payments ?? []} />;
}

import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getMyWallet, getMyReferralInfo, getMyTransactions } from "./actions";
import MonedasClient from "./MonedasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Monedas Wordelia | Wordelia",
    description: "Gana monedas invitando a tus amigos y gástalas en los clubs oficiales de Wordelia.",
};

export default async function MonedasPage() {
    const [wallet, referral, transactions] = await Promise.all([
        getMyWallet(),
        getMyReferralInfo(),
        getMyTransactions(),
    ]);

    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="MONEDAS WORDELIA"
                title="Invita, acumula y disfruta"
                subtitle="Gana monedas cuando tus amigos se unen a su primer club. Gástalas en los clubs oficiales de Wordelia."
            />

            <MonedasClient wallet={wallet} referral={referral} transactions={transactions} />
        </div>
    );
}

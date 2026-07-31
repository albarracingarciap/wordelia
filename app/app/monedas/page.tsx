import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getMyWallet, getMyReferralInfo, getMyTransactions } from "./actions";
import MonedasClient from "./MonedasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Wordix | Wordelia",
    description: "Gana Wordix invitando a tus amigos y gástalos en los clubs oficiales de Wordelia.",
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
                eyebrow="WORDIX"
                title="Invita, acumula y disfruta"
                subtitle="Wordix son las monedas de Wordelia. Gánalos cuando tus amigos se unen a su primer club y gástalos en los clubs oficiales."
            />

            <MonedasClient wallet={wallet} referral={referral} transactions={transactions} />
        </div>
    );
}

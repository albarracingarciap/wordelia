import { MOCK_RECIPIENTS } from "@/lib/mock-data";
import { GiftRecipientView } from "@/components/gifts/GiftRecipientView";

export async function generateStaticParams() {
    return MOCK_RECIPIENTS.map((recipient) => ({
        id: recipient.id,
    }));
}

export default async function GiftRecipientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Find recipient details
    const recipient = MOCK_RECIPIENTS.find(p => p.id === id) || MOCK_RECIPIENTS[0];

    return <GiftRecipientView recipient={recipient} id={id} />;
}

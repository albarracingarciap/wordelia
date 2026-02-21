import { notFound } from "next/navigation";
import { getGiftRecipientDetail } from "@/app/app/wishes/gift-idea-actions";
import { GiftRecipientView } from "@/components/gifts/GiftRecipientView";

export default async function GiftRecipientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { recipient, ideas } = await getGiftRecipientDetail(id);

    if (!recipient) notFound();

    return <GiftRecipientView recipient={recipient} ideas={ideas} />;
}

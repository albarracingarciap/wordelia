import { notFound } from "next/navigation";
import { getBuddyRead, getBuddyMessages } from "@/app/app/lectura-pareja/actions";
import { BuddyReadRoom } from "@/components/buddy/BuddyReadRoom";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function BuddyReadPage({ params }: PageProps) {
    const { id } = await params;
    const buddy = await getBuddyRead(id);
    if (!buddy) notFound();
    const messages = await getBuddyMessages(id);
    return <BuddyReadRoom initialBuddy={buddy} initialMessages={messages} />;
}

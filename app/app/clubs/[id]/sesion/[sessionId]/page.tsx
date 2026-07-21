import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getLiveSession, getSessionMessages } from "@/app/app/clubs/[id]/session-actions";
import { LiveSessionRoom } from "@/components/club/LiveSessionRoom";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string; sessionId: string }> };

export default async function LiveSessionPage({ params }: PageProps) {
    const { id, sessionId } = await params;

    const data = await getLiveSession(sessionId);
    if (!data) notFound(); // no existe o no eres miembro (RLS)

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
    const initialMessages = await getSessionMessages(sessionId);

    return (
        <LiveSessionRoom
            clubId={id}
            initialSession={data.session}
            isManager={data.isManager}
            me={{ id: user.id, name: (profile as any)?.full_name ?? null, avatar: (profile as any)?.avatar_url ?? null }}
            initialMessages={initialMessages}
        />
    );
}

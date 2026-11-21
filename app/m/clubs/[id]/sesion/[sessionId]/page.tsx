import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getLiveSession, getSessionMessages } from "@/app/app/clubs/[id]/session-actions";
import { LiveSessionRoom } from "@/components/club/LiveSessionRoom";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string; sessionId: string }> };

// Sala de sesión en vivo dentro del shell móvil: misma sala (realtime, presencia,
// agenda, resumen) que /app, con el "volver" apuntando a la ficha móvil del club.
export default async function MobileLiveSessionPage({ params }: PageProps) {
    const { id, sessionId } = await params;

    const data = await getLiveSession(sessionId);
    if (!data || data.session.clubId !== id) notFound();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: profileRow } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
    const profile = profileRow as { full_name: string | null; avatar_url: string | null } | null;
    const initialMessages = await getSessionMessages(sessionId);

    return (
        <LiveSessionRoom
            clubId={id}
            initialSession={data.session}
            isManager={data.isManager}
            me={{ id: user.id, name: profile?.full_name ?? null, avatar: profile?.avatar_url ?? null }}
            initialMessages={initialMessages}
            backHref={`/m/clubs/${id}`}
        />
    );
}

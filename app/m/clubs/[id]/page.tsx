import { notFound } from "next/navigation";
import { getClubDetails, getClubCalendarEvents } from "@/app/app/clubs/[id]/actions";
import { getLiveSessions, type LiveSession } from "@/app/app/clubs/[id]/session-actions";
import { ClubMobileView, type MobileClub, type MobileAgendaItem } from "@/components/mobile/ClubMobileView";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

type ClubBookRow = {
    id?: string;
    cover_url?: string | null;
    checkpoints?: unknown;
    book?: { id: string; title: string; author?: string | null; cover_url?: string | null } | null;
} | null;

type CalendarItem = {
    id: string;
    source: string;
    title: string;
    description?: string | null;
    startsAt: string | null;
    location?: string | null;
};

function pickBook(cb: ClubBookRow): MobileClub["currentBook"] {
    if (!cb?.book) return null;
    return {
        id: cb.book.id,
        title: cb.book.title,
        author: cb.book.author ?? null,
        coverUrl: cb.cover_url || cb.book.cover_url || null,
    };
}

/** Agenda próxima (sesiones programadas + eventos/avisos/cierres de tramo) y sesiones pasadas. */
function buildAgenda(clubId: string, sessions: LiveSession[], events: CalendarItem[]) {
    const nowMs = Date.now();
    const startOfToday = new Date(nowMs);
    startOfToday.setHours(0, 0, 0, 0);

    const sessionItems: MobileAgendaItem[] = sessions
        // Programadas desde hace 1h (por si el anfitrión aún no la ha iniciado).
        .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt).getTime() >= nowMs - 60 * 60 * 1000)
        .map((s) => ({
            id: `session-${s.id}`,
            kind: "session",
            title: s.title,
            description: s.agenda.length ? s.agenda.map((b) => b.title).join(" · ") : null,
            startsAt: s.scheduledAt,
            href: `/m/clubs/${clubId}/sesion/${s.id}`,
        }));

    const eventItems: MobileAgendaItem[] = events
        .filter((e): e is CalendarItem & { startsAt: string } => !!e.startsAt && new Date(e.startsAt).getTime() >= startOfToday.getTime())
        .map((e) => ({
            id: String(e.id),
            kind: e.source === "checkpoint" ? "checkpoint" : e.source === "announcement" ? "announcement" : "event",
            title: e.title,
            description: e.description ?? null,
            startsAt: e.startsAt,
            location: e.location ?? null,
            href: null,
        }));

    const upcoming = [...sessionItems, ...eventItems].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
    const past = sessions
        .filter((s) => s.status === "ended")
        .slice(0, 5)
        .map((s) => ({ id: s.id, title: s.title, at: s.endedAt ?? s.scheduledAt, hasSummary: !!s.summary }));

    return { upcoming, past };
}

// Ficha del club en el shell móvil: lectura actual, sesión en vivo,
// conversación (ClubFeed, con protección de spoilers por tramos) y agenda.
export default async function MobileClubPage({ params }: PageProps) {
    const { id } = await params;
    const [club, sessions, events] = await Promise.all([
        getClubDetails(id),
        getLiveSessions(id),
        getClubCalendarEvents(id),
    ]);
    if (!club) notFound();

    const role: string | null = club.userRole ?? null;
    const current = club.currentBook as ClubBookRow;
    const planned = club.plannedBook as ClubBookRow;

    const slim: MobileClub = {
        id: club.id,
        name: club.name,
        organizationName: club.organization?.name ?? null,
        memberCount: club.memberCount ?? 0,
        role,
        isMember: !!role && role !== "pending",
        isPending: role === "pending",
        isManager: role === "admin" || role === "moderator",
        currentBook: pickBook(current),
        currentClubBookId: current?.id ?? null,
        checkpoints: (Array.isArray(current?.checkpoints) ? current.checkpoints : []) as MobileClub["checkpoints"],
        plannedBook: pickBook(planned),
    };

    const live = sessions.find((s) => s.status === "live") ?? null;
    const { upcoming, past } = buildAgenda(club.id, sessions, (events as (CalendarItem | null)[]).filter((e): e is CalendarItem => !!e));

    return (
        <ClubMobileView
            club={slim}
            live={live ? { id: live.id, title: live.title } : null}
            upcoming={upcoming}
            past={past}
        />
    );
}

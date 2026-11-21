"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft, BookOpen, CalendarClock, ChevronRight, Flag, MapPin, Megaphone, MessageCircle, Monitor, Radio, Store, Users,
} from "lucide-react";
import { ClubFeed } from "@/components/club/ClubFeed";
import { formatWhen } from "./format";

type FeedCheckpoints = NonNullable<React.ComponentProps<typeof ClubFeed>["checkpoints"]>;

export interface MobileClub {
    id: string;
    name: string;
    organizationName: string | null;
    memberCount: number;
    role: string | null;
    isMember: boolean;
    isPending: boolean;
    isManager: boolean;
    currentBook: { id: string; title: string; author: string | null; coverUrl: string | null } | null;
    currentClubBookId: string | null;
    checkpoints: FeedCheckpoints;
    plannedBook: { id: string; title: string; author: string | null; coverUrl: string | null } | null;
}

export interface MobileAgendaItem {
    id: string;
    kind: "session" | "event" | "checkpoint" | "announcement";
    title: string;
    description: string | null;
    startsAt: string;
    location?: string | null;
    href: string | null;
}

interface ClubMobileViewProps {
    club: MobileClub;
    live: { id: string; title: string } | null;
    upcoming: MobileAgendaItem[];
    past: { id: string; title: string; at: string; hasSummary: boolean }[];
}

type Tab = "feed" | "agenda";

export function ClubMobileView({ club, live, upcoming, past }: ClubMobileViewProps) {
    const [tab, setTab] = React.useState<Tab>("feed");
    const nextSession = upcoming.find((i) => i.kind === "session") ?? null;
    const book = club.currentBook ?? club.plannedBook;

    return (
        <div className="space-y-5">
            <Link href="/m/clubs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-grey/55">
                <ArrowLeft className="h-4 w-4" /> Clubs
            </Link>

            <header>
                {club.organizationName && (
                    <p className="mb-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-coral">
                        <Store className="h-3.5 w-3.5" /> {club.organizationName}
                    </p>
                )}
                <h1 className="text-2xl font-bold leading-tight text-teal">{club.name}</h1>
                <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-grey/55">
                    <Users className="h-3.5 w-3.5" /> {club.memberCount} {club.memberCount === 1 ? "miembro" : "miembros"}
                </p>
            </header>

            {book && (
                <Link href={`/app/libros/${book.id}`} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-teal/10">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                        {book.coverUrl ? (
                            <Image src={book.coverUrl} alt="" fill className="object-cover" sizes="56px" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-teal/30"><BookOpen className="h-6 w-6" /></div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-grey/45">
                            {club.currentBook ? "Leyendo ahora" : "Próxima lectura"}
                        </p>
                        <p className="line-clamp-2 font-bold leading-snug text-teal-dark">{book.title}</p>
                        {book.author && <p className="truncate text-sm text-coral">{book.author}</p>}
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-grey/30" />
                </Link>
            )}

            {!club.isMember ? (
                <section className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-teal/10">
                    <p className="font-bold text-teal-dark">
                        {club.isPending ? "Tu solicitud está pendiente" : "Aún no eres miembro de este club"}
                    </p>
                    <p className="mt-1 text-sm text-grey/60">
                        {club.isPending
                            ? "Cuando un administrador la apruebe podrás entrar en la conversación."
                            : "Únete desde la ficha completa del club."}
                    </p>
                    {!club.isPending && (
                        <Link href={`/app/clubs/${club.id}`} className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-teal px-5 font-bold text-white">
                            Ver el club
                        </Link>
                    )}
                </section>
            ) : (
                <>
                    {live ? (
                        <Link
                            href={`/m/clubs/${club.id}/sesion/${live.id}`}
                            className="flex items-center gap-3 rounded-3xl bg-coral p-4 text-white shadow-sm active:opacity-90"
                        >
                            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                                <Radio className="h-5 w-5" />
                                <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold uppercase tracking-widest opacity-85">Sesión en vivo ahora</span>
                                <span className="block truncate font-bold">{live.title}</span>
                            </span>
                            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-coral">Entrar</span>
                        </Link>
                    ) : nextSession ? (
                        <Link
                            href={nextSession.href ?? "#"}
                            className="flex items-center gap-3 rounded-3xl bg-teal/10 p-4 text-teal-dark active:bg-teal/15"
                        >
                            <CalendarClock className="h-6 w-6 shrink-0 text-teal" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold uppercase tracking-widest text-teal/70">Próxima sesión</span>
                                <span className="block truncate font-bold">{nextSession.title}</span>
                                <span className="block text-sm text-grey/65">{formatWhen(nextSession.startsAt)}</span>
                            </span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-teal/40" />
                        </Link>
                    ) : null}

                    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-teal/10" role="tablist">
                        <TabButton active={tab === "feed"} onClick={() => setTab("feed")} icon={<MessageCircle className="h-4 w-4" />}>
                            Conversación
                        </TabButton>
                        <TabButton active={tab === "agenda"} onClick={() => setTab("agenda")} icon={<CalendarClock className="h-4 w-4" />}>
                            Agenda{upcoming.length > 0 ? ` (${upcoming.length})` : ""}
                        </TabButton>
                    </div>

                    {tab === "feed" ? (
                        <ClubFeed
                            isAdminOrMod={club.isManager}
                            checkpoints={club.checkpoints}
                            currentBookId={club.currentBook?.id ?? null}
                            currentClubBookId={club.currentClubBookId}
                        />
                    ) : (
                        <AgendaList clubId={club.id} upcoming={upcoming} past={past} />
                    )}
                </>
            )}

            <footer className="pt-2 text-center">
                <Link href={`/app/clubs/${club.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-grey/55">
                    <Monitor className="h-4 w-4" />
                    {club.isManager ? "Gestionar el club (versión completa)" : "Ver club completo"}
                </Link>
            </footer>
        </div>
    );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors ${active ? "bg-teal text-white" : "text-grey/60"}`}
        >
            {icon}
            {children}
        </button>
    );
}

const KIND_META: Record<MobileAgendaItem["kind"], { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    session: { label: "Sesión en vivo", icon: Radio },
    event: { label: "Encuentro", icon: CalendarClock },
    checkpoint: { label: "Cierre de tramo", icon: Flag },
    announcement: { label: "Aviso", icon: Megaphone },
};

function AgendaList({ clubId, upcoming, past }: { clubId: string; upcoming: MobileAgendaItem[]; past: ClubMobileViewProps["past"] }) {
    return (
        <div className="space-y-5">
            {upcoming.length === 0 ? (
                <p className="rounded-3xl bg-white p-5 text-center text-sm text-grey/60 shadow-sm ring-1 ring-teal/10">
                    No hay nada programado de momento.
                </p>
            ) : (
                <ul className="space-y-2">
                    {upcoming.map((item) => {
                        const meta = KIND_META[item.kind];
                        const Icon = meta.icon;
                        const content = (
                            <>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold text-teal">{formatWhen(item.startsAt, item.kind !== "checkpoint")} · {meta.label}</span>
                                    <span className="block font-bold text-teal-dark">{item.title}</span>
                                    {item.description && <span className="line-clamp-2 block text-sm text-grey/60">{item.description}</span>}
                                    {item.location && (
                                        <span className="mt-0.5 flex items-center gap-1 text-xs text-grey/55">
                                            <MapPin className="h-3 w-3" /> {item.location}
                                        </span>
                                    )}
                                </span>
                                {item.href && <ChevronRight className="h-5 w-5 shrink-0 self-center text-grey/30" />}
                            </>
                        );
                        return (
                            <li key={item.id}>
                                {item.href ? (
                                    <Link href={item.href} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-teal/10 active:bg-teal/5">{content}</Link>
                                ) : (
                                    <div className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-teal/10">{content}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {past.length > 0 && (
                <section>
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/45">Sesiones pasadas</h2>
                    <ul className="space-y-2">
                        {past.map((s) => (
                            <li key={s.id}>
                                <Link
                                    href={`/m/clubs/${clubId}/sesion/${s.id}`}
                                    className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-teal/10"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold text-teal-dark">{s.title}</span>
                                        <span className="block text-xs text-grey/55">
                                            {formatWhen(s.at, false)} · {s.hasSummary ? "Resumen y transcripción" : "Transcripción"}
                                        </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-grey/30" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClubCard, type ClubCardProps } from "@/components/clubs/ClubCard";
import { JoinClubModal } from "@/components/clubs/JoinClubModal";
import { ClubFilters } from "@/components/clubs/ClubFilters";
import { unarchiveClub } from "@/app/app/clubs/[id]/actions";
import { PenLine } from "lucide-react";

type ClubListItem = Omit<ClubCardProps, "badges"> & {
    tags?: string[] | null;
    created_at?: string | null;
};

interface ClubsPageClientProps {
    activeClubs: ClubListItem[];
    archivedClubs: ClubListItem[];
    exploreClubs: ClubListItem[];
}

type ClubTab = "my-clubs" | "explore";

export default function ClubsPageClient({ activeClubs, archivedClubs, exploreClubs }: ClubsPageClientProps) {
    const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
    const [initialJoinCode, setInitialJoinCode] = React.useState("");
    const [activeTab, setActiveTab] = React.useState<ClubTab>("my-clubs");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [sortBy, setSortBy] = React.useState("active");
    const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showArchived, setShowArchived] = React.useState(false);
    const [localArchived, setLocalArchived] = React.useState(archivedClubs);
    const [unarchiving, setUnarchiving] = React.useState<string | null>(null);

    React.useEffect(() => {
        const codeFromUrl = searchParams.get("join");
        if (codeFromUrl) {
            setInitialJoinCode(codeFromUrl.toUpperCase());
            setIsJoinModalOpen(true);
        }
    }, [searchParams]);

    const handleUnarchive = async (clubId: string) => {
        setUnarchiving(clubId);
        const result = await unarchiveClub(clubId);
        setUnarchiving(null);
        if (!result?.error) {
            setLocalArchived(prev => prev.filter(c => c.id !== clubId));
            router.refresh();
        }
    };

    const filteredExploreClubs = React.useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const normalizedFilters = activeFilters.map(filter => filter.toLowerCase());

        const matchesFilter = (club: ClubListItem, filter: string) => {
            const values = [
                club.name,
                club.description,
                club.pace,
                club.currentBook?.title,
                club.currentBook?.author,
                ...(club.tags || []),
            ]
                .filter(Boolean)
                .map(value => String(value).toLowerCase());

            if (filter === "sin spoilers") {
                return values.some(value => value.includes("spoiler"));
            }

            return values.some(value => value.includes(filter));
        };

        const filtered = exploreClubs.filter((club) => {
            const searchableText = [
                club.name,
                club.description,
                club.currentBook?.title,
                club.currentBook?.author,
                club.ownerName,
                ...(club.tags || []),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
            const matchesFilters = normalizedFilters.every(filter => matchesFilter(club, filter));

            return matchesSearch && matchesFilters;
        });

        return [...filtered].sort((a, b) => {
            if (sortBy === "new") {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }

            if (sortBy === "soon") {
                return String(a.nextMilestone || "").localeCompare(String(b.nextMilestone || ""));
            }

            return (b.memberCount || 0) - (a.memberCount || 0);
        });
    }, [activeFilters, exploreClubs, searchQuery, sortBy]);

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev =>
            prev.includes(filter)
                ? prev.filter(item => item !== filter)
                : [...prev, filter]
        );
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSortBy("active");
        setActiveFilters([]);
    };

    return (
        <div className="pb-20">
            <SectionHeader
                eyebrow="CLUBS"
                title="Clubs de lectura"
                subtitle="Conversaciones cuidadas, a tu ritmo (y sin spoilers)."
                className="mb-5 [&_h1]:text-[1.8rem] [&_h1]:leading-tight [&_p]:text-base"
            >
                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                    <Button
                        variant="outline"
                        className="h-11 w-full rounded-full border-teal/15 bg-white/70 px-3 text-sm font-bold text-teal shadow-sm sm:h-12 sm:w-auto sm:rounded-2xl sm:px-6"
                        onClick={() => setIsJoinModalOpen(true)}
                    >
                        Unirme con código
                    </Button>
                    <Button
                        className="h-11 w-full rounded-full px-3 text-sm font-bold shadow-sm sm:h-12 sm:w-auto sm:rounded-2xl sm:px-7 sm:shadow-md"
                        onClick={() => router.push("/app/clubs/crear")}
                    >
                        Crear un club
                    </Button>
                </div>
            </SectionHeader>

            <JoinClubModal
                isOpen={isJoinModalOpen}
                initialCode={initialJoinCode}
                onClose={() => {
                    setIsJoinModalOpen(false);
                    setInitialJoinCode("");
                }}
                onJoined={() => router.refresh()}
            />

            <div className="mt-6">
                <div className="mb-7 grid grid-cols-2 rounded-2xl border border-teal/10 bg-white/70 p-1 shadow-sm">
                    {[
                        { value: "my-clubs" as const, label: "Tus clubs" },
                        { value: "explore" as const, label: "Explorar" },
                    ].map((tab) => {
                        const isActive = activeTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setActiveTab(tab.value)}
                                className={`h-11 rounded-xl text-sm font-bold transition-all ${isActive
                                    ? "bg-teal text-white shadow-sm"
                                    : "text-grey/60 hover:bg-teal/5 hover:text-teal"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === "my-clubs" && (
                    <div className="space-y-8 animate-fade-in">
                        <section>
                            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-grey/40">Activos</h3>
                            {activeClubs.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {activeClubs.map(club => (
                                        <ClubCard
                                            key={club.id}
                                            {...club}
                                            badges={club.tags ? club.tags.map((t: string) => ({ label: t })) : []}
                                        />
                                    ))}
                                    <button
                                        className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal/10 p-6 transition-all hover:border-teal/30 hover:bg-teal/5"
                                        onClick={() => router.push("/app/clubs/crear")}
                                    >
                                        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-2xl text-teal transition-transform">+</span>
                                        <span className="font-serif font-medium text-teal">Crear nuevo club</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-teal/5 bg-white/45 px-5 py-10 text-center shadow-sm sm:px-8 sm:py-12">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal/5 text-teal/40">
                                        <PenLine className="h-9 w-9" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="mx-auto max-w-sm text-2xl font-serif text-teal">
                                        Tu próxima conversación empieza aquí
                                    </h3>
                                <p className="mx-auto mt-3 max-w-md text-base leading-7 text-grey/75">
                                    Crea un espacio para leer con tu gente y organizar vuestra próxima conversación.
                                </p>
                                <div className="mx-auto mt-7 max-w-xs">
                                    <Button
                                        size="lg"
                                        className="h-12 w-full rounded-2xl text-sm font-bold"
                                        onClick={() => router.push("/app/clubs/crear")}
                                    >
                                        Crear club
                                    </Button>
                                </div>
                                </div>
                            )}
                        </section>

                        {archivedClubs.length > 0 && (
                            <section>
                                <button
                                    type="button"
                                    className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40 transition-colors hover:text-teal"
                                    onClick={() => setShowArchived(!showArchived)}
                                >
                                    <span>Archivados ({archivedClubs.length})</span>
                                    <svg className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showArchived && (
                                    <div className="grid grid-cols-1 gap-6 opacity-75 md:grid-cols-2 lg:grid-cols-3">
                                        {localArchived.map(club => (
                                            <div key={club.id} className="relative">
                                                <ClubCard
                                                    {...club}
                                                    badges={club.tags ? club.tags.map((t: string) => ({ label: t })) : []}
                                                    preview
                                                />
                                                {club.isAdmin && (
                                                    <div className="absolute bottom-4 right-4 z-10">
                                                        <button
                                                            onClick={() => handleUnarchive(club.id)}
                                                            disabled={unarchiving === club.id}
                                                            className="rounded-full border border-teal/30 bg-white px-3 py-1.5 text-xs font-bold text-teal shadow-sm transition-all hover:bg-teal hover:text-white disabled:opacity-50"
                                                        >
                                                            {unarchiving === club.id ? "Reactivando..." : "Reactivar"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                )}

                {activeTab === "explore" && (
                    <div className="animate-fade-in">
                        <ClubFilters
                            searchQuery={searchQuery}
                            sortBy={sortBy}
                            activeFilters={activeFilters}
                            onSearchChange={setSearchQuery}
                            onSortChange={setSortBy}
                            onToggleFilter={toggleFilter}
                            onClearFilters={clearFilters}
                        />

                        <div className="mt-8 space-y-12">
                            <section>
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-serif text-xl text-teal">Descubre clubs</h3>
                                        <p className="text-sm text-grey/60">Únete a la conversación</p>
                                    </div>
                                </div>
                                {filteredExploreClubs.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {filteredExploreClubs.map(club => (
                                            <ClubCard
                                                key={club.id}
                                                {...club}
                                                badges={club.tags ? club.tags.map((t: string) => ({ label: t })) : []}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center italic text-grey/40">
                                        No hay clubs que coincidan con estos filtros.
                                    </div>
                                )}
                            </section>

                            <section className="py-8">
                                <Card className="border-none bg-gradient-to-r from-teal/5 to-coral/5 py-8 text-center">
                                    <h3 className="mb-2 font-serif text-lg text-teal">¿No encuentras el tuyo?</h3>
                                    <p className="mb-6 text-sm text-grey/60">Crea uno en 1 minuto y lee con tu gente.</p>
                                    <Button variant="primary" onClick={() => router.push("/app/clubs/crear")}>
                                        Crear un club
                                    </Button>
                                </Card>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

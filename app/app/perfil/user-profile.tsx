"use client";

import * as React from "react";
import Link from "next/link";
import {
    Award,
    BookOpen,
    Calendar,
    CalendarCheck,
    Check,
    ChevronRight,
    Compass,
    Cookie,
    Edit2,
    FileText,
    Flame,
    Library,
    MapPin,
    Megaphone,
    Mouse,
    Palette,
    PenTool,
    Plus,
    Shield,
    Sparkles,
    Sun,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { updateProfile } from "./actions";

type ProfileData = {
    id: string;
    username: string;
    full_name: string;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    goals: {
        yearly_target: number;
        pages_target?: number;
        streak_target?: number;
        secondary: string[];
    } | null;
    favorite_genres: string[] | null;
    reading_format_preference?: string | null;
    story_complexity_preference?: number | null;
    engagement_elements?: string[] | null;
    banner_color?: string | null;
    created_at?: string | null;
};

type StatsData = {
    booksRead: number;
    pagesRead: number;
    streakDays: number;
};

type Badge = {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    category: string;
    awarded_at?: string;
};

type ActivityData = {
    lastRead: { title: string; author: string; timeAgo: string; cover: string | null } | null;
    current: { title: string; author: string; progress: number; cover: string | null } | null;
};

type LibraryBook = {
    id: string;
    title: string;
    cover: string | null;
};

type LibraryCounts = {
    read: number;
    reading: number;
    wantToRead: number;
    abandoned: number;
};

type LibraryEditionPick = { cover_url: string | null };
type LibraryBookEntry = {
    id: string;
    title: string;
    preferred_edition: LibraryEditionPick | LibraryEditionPick[] | null;
};
type LibraryBookRow = {
    book: LibraryBookEntry | LibraryBookEntry[];
};

const LIBRARY_TABS = [
    { label: "Leídos", status: "READ", filter: "read", countKey: "read" },
    { label: "Leyendo", status: "READING", filter: "reading", countKey: "reading" },
    { label: "Quiero leer", status: "WANT_TO_READ", filter: "toread", countKey: "wantToRead" },
    { label: "Abandonados", status: "DNF", filter: "abandoned", countKey: "abandoned" }
] as const;

const BANNER_COLORS = [
    "#115e59",
    "#14b8a6",
    "#0891b2",
    "#0284c7",
    "#2563eb",
    "#4f46e5",
    "#7c3aed",
    "#9333ea",
    "#c026d3",
    "#db2777",
    "#e11d48",
    "#FF7F50",
    "#FF9F80",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#65a30d",
    "#16a34a",
    "#059669",
    "#475569",
    "#27272a"
];

const GENRE_COLORS = ["#20535B", "#F27A72", "#FACC15", "#C084FC", "#60A5FA", "#F472B6"];

function getInitialColor(color?: string | null) {
    if (!color) return "#115e59";
    if (color.startsWith("#")) return color;
    if (color === "bg-teal-dark") return "#115e59";
    return "#115e59";
}

function ProgressBar({ current, target }: { current: number; target: number }) {
    const safeTarget = Math.max(target, 1);
    const percentage = Math.min(100, Math.max(0, (current / safeTarget) * 100));
    const monthIndex = new Date().getMonth() + 1;
    const expected = Math.ceil((safeTarget / 12) * monthIndex);
    const delta = current - expected;
    const remaining = Math.max(0, safeTarget - current);
    const statusText =
        delta >= 0
            ? delta === 0
                ? "Vas justo al ritmo previsto para este mes."
                : `Vas ${delta} ${delta === 1 ? "libro" : "libros"} por delante del ritmo.`
            : `Para ir al ritmo, intenta sumar ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "libro" : "libros"} más este mes.`;

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-teal-dark">Meta {new Date().getFullYear()}: {safeTarget} libros</span>
                <span className="text-sm font-semibold text-grey/60">{current}/{safeTarget} ({Math.round(percentage)}%)</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-grey/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-teal to-teal-light transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex flex-col gap-1 text-sm text-grey-dark sm:flex-row sm:items-center sm:justify-between">
                <span>{statusText}</span>
                <span className="font-semibold text-teal">{remaining} pendientes</span>
            </div>
        </div>
    );
}

function GoalMeter({
    label,
    current,
    target,
    suffix = "",
    tone = "teal"
}: {
    label: string;
    current: number;
    target: number;
    suffix?: string;
    tone?: "teal" | "coral" | "gold";
}) {
    const safeTarget = Math.max(target, 1);
    const percentage = Math.min(100, Math.round((current / safeTarget) * 100));
    const colorClass = tone === "coral" ? "bg-coral" : tone === "gold" ? "bg-yellow-400" : "bg-teal";

    return (
        <div className="rounded-2xl border border-grey/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-teal-dark">{label}</p>
                    <p className="mt-1 text-xs text-grey/60">
                        {current.toLocaleString()} / {safeTarget.toLocaleString()}{suffix}
                    </p>
                </div>
                <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-teal-dark">
                    {percentage}%
                </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-grey/10">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

function GoalsOverview({
    booksRead,
    pagesRead,
    streakDays,
    goals
}: {
    booksRead: number;
    pagesRead: number;
    streakDays: number;
    goals: NonNullable<ProfileData["goals"]> | null;
}) {
    const bookTarget = goals?.yearly_target || 50;
    const pagesTarget = goals?.pages_target || 10000;
    const streakTarget = goals?.streak_target || 7;

    return (
        <section className="space-y-4 rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <ProgressBar current={booksRead} target={bookTarget} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <GoalMeter label="Páginas" current={pagesRead} target={pagesTarget} suffix=" págs." tone="coral" />
                <GoalMeter label="Racha" current={streakDays} target={streakTarget} suffix=" días" tone="gold" />
            </div>
            {goals?.secondary?.length ? (
                <div className="rounded-2xl bg-cream/40 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-grey/50">Retos secundarios</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {goals.secondary.slice(0, 4).map((goal) => (
                            <span key={goal} className="rounded-full border border-teal/10 bg-white px-3 py-1.5 text-xs font-semibold text-grey-dark">
                                {goal}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3 rounded-2xl bg-cream/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-grey-dark/70">Añade retos secundarios para orientar mejor tu año lector.</p>
                    <Link href="/app/perfil/editar" className="text-sm font-bold text-coral">
                        Configurar metas
                    </Link>
                </div>
            )}
        </section>
    );
}

function RecommendedChallenge({
    genres,
    booksRead
}: {
    genres: string[];
    booksRead: number;
}) {
    const currentYear = new Date().getFullYear();
    const primaryGenre = genres[0];
    const challenge = primaryGenre
        ? {
            title: `Reto ${primaryGenre}`,
            description: `Lee 3 libros de ${primaryGenre.toLowerCase()} antes de terminar ${currentYear}.`,
            helper: "Basado en tus intereses lectores."
        }
        : booksRead === 0
            ? {
                title: "Primer libro del año",
                description: "Elige una lectura breve y márcala como leída para estrenar tu perfil.",
                helper: "Ideal para empezar sin presión."
            }
            : {
                title: "Reto de exploración",
                description: "Lee 3 libros de géneros distintos durante los próximos meses.",
                helper: "Pensado para ampliar tu mapa lector."
            };

    return (
        <section className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-[#FFF9C4] to-[#FFE0B2] p-4 shadow-sm transition-shadow hover:shadow-md sm:rounded-3xl sm:p-6">
            <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-teal-dark/50">Reto recomendado</div>
                <h3 className="mt-2 text-xl text-teal-dark">{challenge.title}</h3>
                <p className="mb-2 mt-2 text-sm font-medium leading-relaxed text-teal-dark/80">
                    {challenge.description}
                </p>
                <p className="mb-4 text-xs font-semibold text-teal-dark/50">{challenge.helper}</p>
                <Link href="/app/perfil/editar" className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs font-bold text-teal-dark shadow-sm transition-all hover:bg-teal hover:text-white">
                    Ajustar metas <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
            </div>
        </section>
    );
}

function StatCard({ label, value, subtext, icon }: { label: string; value: string | number; subtext: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-grey/10 bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-4 sm:text-left">
            <div className="rounded-xl bg-teal/5 p-2 text-teal sm:p-3">{icon}</div>
            <div>
                <div className="text-xl font-bold leading-tight text-teal-dark sm:text-2xl">{value}</div>
                <div className="text-xs font-medium text-grey-dark sm:text-sm">{label}</div>
                <div className="mt-1 hidden text-xs text-grey/50 sm:block">{subtext}</div>
            </div>
        </div>
    );
}

function EmptyActivityCard({
    icon,
    title,
    text,
    href,
    cta
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
    href: string;
    cta: string;
}) {
    return (
        <div className="rounded-2xl border border-grey/10 bg-cream/30 p-4">
            <div className="flex items-start gap-3">
                <div className="rounded-full bg-white p-2 text-teal shadow-sm">{icon}</div>
                <div className="min-w-0">
                    <h4 className="font-semibold text-teal-dark">{title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-grey-dark/70">{text}</p>
                    <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-coral">
                        {cta} <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function UserProfile({
    profile,
    stats,
    badges = [],
    allBadges = [],
    activity,
    initialLibrary = [],
    libraryCounts = { read: 0, reading: 0, wantToRead: 0, abandoned: 0 }
}: {
    profile: ProfileData;
    stats: StatsData;
    badges?: Badge[];
    allBadges?: Badge[];
    activity?: ActivityData;
    initialLibrary?: LibraryBook[];
    libraryCounts?: LibraryCounts;
}) {
    const [activeTab, setActiveTab] = React.useState("Leídos");
    const [libraryBooks, setLibraryBooks] = React.useState<LibraryBook[]>(initialLibrary);
    const [libraryLoading, setLibraryLoading] = React.useState(false);
    const [isBadgesModalOpen, setIsBadgesModalOpen] = React.useState(false);
    const [bannerColor, setBannerColor] = React.useState(getInitialColor(profile.banner_color));
    const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchBooks = async () => {
            setLibraryLoading(true);
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const tab = LIBRARY_TABS.find((item) => item.label === activeTab) || LIBRARY_TABS[0];

            const { data } = await supabase
                .from("user_books")
                .select(`
                    book:books (
                        id,
                        title,
                        preferred_edition:editions!books_preferred_edition_fk (cover_url)
                    )
                `)
                .eq("user_id", profile.id)
                .eq("status", tab.status)
                .limit(10);

            if (data) {
                setLibraryBooks((data as LibraryBookRow[]).map((row) => {
                    const book = Array.isArray(row.book) ? row.book[0] : row.book;
                    const edition = Array.isArray(book.preferred_edition)
                        ? book.preferred_edition[0]
                        : book.preferred_edition;
                    return {
                        id: book.id,
                        title: book.title,
                        cover: edition?.cover_url ?? null
                    };
                }));
            }
            setLibraryLoading(false);
        };

        if (activeTab === "Leídos" && initialLibrary.length > 0 && JSON.stringify(libraryBooks) === JSON.stringify(initialLibrary)) {
            return;
        }

        fetchBooks();
    }, [activeTab, profile.id]);

    const handleBannerColorChange = async (colorHex: string) => {
        setBannerColor(colorHex);
        setIsColorPickerOpen(false);

        const formData = new FormData();
        formData.append("banner_color", colorHex);
        await updateProfile(formData);
    };

    const memberSince = React.useMemo(() => {
        if (!profile.created_at) return "recientemente";
        try {
            return new Date(profile.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
        } catch {
            return "recientemente";
        }
    }, [profile.created_at]);

    const genres = (profile.favorite_genres || []).filter(Boolean).slice(0, 6);
    const activeTabData = LIBRARY_TABS.find((tab) => tab.label === activeTab) || LIBRARY_TABS[0];
    const activeTabCount = libraryCounts[activeTabData.countKey];
    const nextBadges = allBadges.filter((badge) => !badges.some((earned) => earned.id === badge.id)).slice(0, 3);
    const completionItems = [
        { label: "Foto", done: Boolean(profile.avatar_url), href: "/app/perfil/editar" },
        { label: "Bio", done: Boolean(profile.bio?.trim()), href: "/app/perfil/editar" },
        { label: "Géneros", done: genres.length > 0, href: "/app/perfil/editar" },
        { label: "Ubicación", done: Boolean(profile.location?.trim()), href: "/app/perfil/editar" },
        { label: "Meta", done: Boolean(profile.goals?.yearly_target), href: "/app/perfil/editar" },
        {
            label: "Preferencias",
            done: Boolean(
                profile.reading_format_preference ||
                profile.story_complexity_preference ||
                profile.engagement_elements?.length
            ),
            href: "/app/perfil/editar"
        }
    ];
    const completedItems = completionItems.filter((item) => item.done).length;
    const completionPercent = Math.round((completedItems / completionItems.length) * 100);
    const nextCompletionItem = completionItems.find((item) => !item.done);

    const IconMap: { [key: string]: React.ElementType } = {
        Mouse,
        Cookie,
        Library: BookOpen,
        Sun,
        CalendarCheck: Calendar,
        Shield: Award,
        Compass: MapPin,
        PenTool: Edit2,
        Megaphone: Flame
    };

    const getBadgeIcon = (name: string) => {
        const Icon = IconMap[name] || Award;
        return <Icon className="h-6 w-6" />;
    };

    return (
        <div className="min-h-screen bg-cream/20 pb-24">
            <header className="relative overflow-hidden rounded-2xl border-b border-grey/10 bg-white px-4 pb-6 pt-16 sm:px-6 sm:pb-8 sm:pt-24 md:px-12 lg:rounded-none">
                <div
                    className="absolute left-0 top-0 h-28 w-full opacity-90 transition-colors duration-500 sm:h-32"
                    style={{ backgroundColor: bannerColor }}
                />
                <div className="pattern-grid-lg pointer-events-none absolute left-0 top-0 h-28 w-full opacity-10 sm:h-32" />

                <div className="absolute right-3 top-3 z-50 sm:right-6 sm:top-4">
                    <button
                        onClick={() => setIsColorPickerOpen((value) => !value)}
                        className="rounded-full border border-white/20 bg-white/30 p-2 text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/50"
                        title="Cambiar color de portada"
                    >
                        <Palette className="h-4 w-4" />
                    </button>

                    {isColorPickerOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 grid w-32 grid-cols-3 gap-2 rounded-xl border border-grey/10 bg-white p-3 shadow-xl">
                            {BANNER_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handleBannerColorChange(color)}
                                    className={`h-8 w-8 rounded-full ring-2 ring-offset-1 transition-transform hover:scale-110 ${bannerColor === color ? "ring-grey/40" : "ring-transparent"}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:gap-6 md:flex-row md:items-end md:text-left">
                    <div className="relative">
                        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-grey/20 shadow-lg sm:h-32 sm:w-32">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal/20 to-coral/20 text-4xl">
                                    <span aria-hidden="true">👤</span>
                                </div>
                            )}
                        </div>
                        <Link href="/app/perfil/editar" className="absolute bottom-1 right-1 rounded-full border border-grey/10 bg-white p-2 text-grey-dark shadow-md transition-colors hover:text-teal">
                            <Edit2 className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                        <h1 className="break-words text-2xl font-bold text-teal-dark sm:text-3xl">{profile.full_name || "Lector sin nombre"}</h1>
                        <p className="text-sm font-medium text-grey/60">{profile.username ? `@${profile.username}` : ""}</p>

                        <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-xs text-grey/60 sm:gap-4 md:justify-start">
                            {profile.location && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
                            )}
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Miembro desde {memberSince}</span>
                        </div>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-grey-dark md:mx-0">
                            {profile.bio?.trim() || "Sin biografía aún."}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                        {profile.username && (
                            <Link
                                href={`/app/perfil/${profile.username}`}
                                className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-teal/15 bg-white/80 px-4 text-sm font-medium text-teal-dark shadow-sm transition-all hover:bg-teal/5 md:w-auto"
                            >
                                Ver público
                            </Link>
                        )}
                        <Link
                            href="/app/perfil/editar"
                            className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-coral bg-transparent px-4 text-sm font-medium text-coral transition-all hover:bg-coral/10 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 md:w-auto"
                        >
                            Editar perfil
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 sm:py-8 md:px-12 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-6 lg:col-span-2">
                    <section className="rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-grey/50">
                                    <Target className="h-4 w-4 text-coral" /> Perfil lector
                                </div>
                                <h2 className="mt-2 text-xl font-bold text-teal-dark">{completionPercent}% completo</h2>
                                <p className="mt-1 text-sm leading-relaxed text-grey-dark/70">
                                    Cuanto más completo esté, más útil será para recomendaciones, clubs y retos.
                                </p>
                            </div>
                            {nextCompletionItem && (
                                <Link href={nextCompletionItem.href} className="inline-flex h-10 items-center justify-center rounded-2xl bg-coral px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-coral-dark">
                                    Completar {nextCompletionItem.label}
                                </Link>
                            )}
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-grey/10">
                            <div className="h-full rounded-full bg-teal transition-all duration-700" style={{ width: `${completionPercent}%` }} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {completionItems.map((item) => (
                                <span
                                    key={item.label}
                                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${item.done ? "border-teal/15 bg-teal/5 text-teal" : "border-grey/15 bg-cream/40 text-grey/60"}`}
                                >
                                    {item.done ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="grid grid-cols-3 gap-2 sm:gap-4">
                        <StatCard icon={<BookOpen className="h-5 w-5" />} value={stats.booksRead} label="Libros" subtext="leídos este año" />
                        <StatCard icon={<FileText className="h-5 w-5" />} value={stats.pagesRead.toLocaleString()} label="Páginas" subtext="este año" />
                        <StatCard icon={<Flame className="h-5 w-5 text-coral" />} value={`${stats.streakDays} días`} label="Racha" subtext="leyendo" />
                    </section>

                    <GoalsOverview
                        booksRead={stats.booksRead}
                        pagesRead={stats.pagesRead}
                        streakDays={stats.streakDays}
                        goals={profile.goals}
                    />

                    <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-2">
                        <section className="space-y-5 rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                            <h3 className="font-bold text-teal-dark">Actividad reciente</h3>

                            {activity?.lastRead ? (
                                <div className="flex items-start gap-4">
                                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-grey/10 shadow-sm">
                                        {activity.lastRead.cover ? (
                                            <img src={activity.lastRead.cover} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-teal/20 text-xs">📖</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="mb-0.5 text-xs uppercase tracking-wider text-grey/40">Terminado</div>
                                        <h4 className="line-clamp-1 text-sm font-bold text-teal-dark">{activity.lastRead.title}</h4>
                                        <p className="text-xs text-grey/60">{activity.lastRead.timeAgo}</p>
                                    </div>
                                </div>
                            ) : (
                                <EmptyActivityCard
                                    icon={<Check className="h-4 w-4" />}
                                    title="Cierra tu primera lectura"
                                    text="Marca un libro como leído para que tu perfil empiece a contar actividad real."
                                    href="/app/mi-lectura"
                                    cta="Ir a mi lectura"
                                />
                            )}

                            {activity?.current ? (
                                <div className="flex items-start gap-4">
                                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-grey/10 shadow-sm">
                                        {activity.current.cover ? (
                                            <img src={activity.current.cover} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-coral/20 text-xs">📖</div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-0.5 text-xs uppercase tracking-wider text-grey/40">Leyendo</div>
                                        <h4 className="line-clamp-1 text-sm font-bold text-teal-dark">{activity.current.title}</h4>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-grey/10">
                                            <div className="h-full rounded-full bg-coral" style={{ width: `${activity.current.progress}%` }} />
                                        </div>
                                        <p className="mt-1 text-[10px] text-grey/60">{activity.current.progress}% completado</p>
                                    </div>
                                </div>
                            ) : (
                                <EmptyActivityCard
                                    icon={<BookOpen className="h-4 w-4" />}
                                    title="Elige tu lectura actual"
                                    text="Añade un libro a 'Leyendo' para ver tu progreso de un vistazo."
                                    href="/app/mi-lectura"
                                    cta="Añadir lectura"
                                />
                            )}
                        </section>

                        <section className="space-y-4 rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                            <div>
                                <h3 className="font-bold text-teal-dark">Intereses lectores</h3>
                                <p className="mt-1 text-xs leading-relaxed text-grey/60">
                                    Elegidos en tu perfil; se irán afinando con tus lecturas.
                                </p>
                            </div>

                            {genres.length > 0 ? (
                                <div className="flex items-center gap-4">
                                    <div
                                        className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[12px] border-cream"
                                        style={{
                                            background: `conic-gradient(${genres
                                                .map((genre, index) => {
                                                    const start = (index * 100) / genres.length;
                                                    const end = ((index + 1) * 100) / genres.length;
                                                    return `${GENRE_COLORS[index % GENRE_COLORS.length]} ${start}% ${end}%`;
                                                })
                                                .join(", ")})`
                                        }}
                                    >
                                        <div className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-white" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-3 text-xs">
                                        {genres.map((genre, index) => (
                                            <div key={genre} className="flex min-w-0 items-center gap-2">
                                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length] }} />
                                                <span className="truncate leading-tight text-grey-dark" title={genre}>{genre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-grey/20 bg-cream/30 p-5 text-center">
                                    <Sparkles className="mx-auto h-8 w-8 text-teal/50" />
                                    <p className="mt-2 text-sm font-semibold text-teal-dark">Aún no has elegido géneros.</p>
                                    <Link href="/app/perfil/editar" className="mt-3 inline-flex text-sm font-semibold text-coral">
                                        Añadir intereses
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    <section className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-grey/10">
                            <div className="flex min-w-0 gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
                                {LIBRARY_TABS.map((tab) => (
                                    <button
                                        key={tab.label}
                                        onClick={() => setActiveTab(tab.label)}
                                        className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm font-medium transition-colors ${activeTab === tab.label ? "text-teal-dark" : "text-grey/40 hover:text-teal"}`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className="rounded-full bg-grey/10 px-2 py-0.5 text-[11px] font-bold text-grey/60">
                                            {libraryCounts[tab.countKey]}
                                        </span>
                                        {activeTab === tab.label && (
                                            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-coral" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <Link
                                href={`/app/mi-lectura/estanterias?filter=${activeTabData.filter}`}
                                className="hidden items-center text-xs text-grey-dark hover:text-teal sm:flex"
                            >
                                Ver todos <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>
                        <Link
                            href={`/app/mi-lectura/estanterias?filter=${activeTabData.filter}`}
                            className="inline-flex items-center text-sm font-semibold text-teal sm:hidden"
                        >
                            Ver todos en {activeTab.toLowerCase()} <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>

                        <div className="grid grid-cols-3 gap-3 py-4 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
                            {libraryLoading ? (
                                <div className="col-span-full py-8 text-center text-xs text-grey/40">Cargando...</div>
                            ) : (
                                <>
                                    {libraryBooks.map((book) => (
                                        <Link
                                            href={`/app/libros/${book.id}`}
                                            key={book.id}
                                            className="group relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-grey/10 bg-white shadow-sm transition-transform hover:-translate-y-1"
                                        >
                                            {book.cover ? (
                                                <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="p-2 text-center">
                                                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-teal" />
                                                    <span className="line-clamp-2 text-xs">{book.title}</span>
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                    {libraryBooks.length === 0 && (
                                        <div className="col-span-full rounded-2xl border border-dashed border-grey/20 bg-white/60 px-4 py-8 text-center">
                                            <BookOpen className="mx-auto h-9 w-9 text-teal/40" />
                                            <p className="mt-3 text-sm font-semibold text-teal-dark">
                                                {activeTabCount > 0 ? "No se han cargado libros todavía." : `No hay libros en ${activeTab.toLowerCase()}.`}
                                            </p>
                                            <p className="mx-auto mt-1 max-w-md text-sm text-grey/60">
                                                Añade libros o cambia su estado desde Mi lectura para completar esta sección.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <Link href="/app/mi-lectura" className="flex aspect-[2/3] items-center justify-center rounded-xl border-2 border-dashed border-grey/20 transition-colors hover:border-teal/40 hover:bg-teal/5">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-grey/50">
                                    <Plus className="h-4 w-4" /> Añadir
                                </span>
                            </Link>
                        </div>
                    </section>
                </div>

                <div className="space-y-6 lg:space-y-8">
                    <section className="space-y-4 rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 font-bold text-teal-dark">
                                <Award className="h-4 w-4 text-coral" /> Insignias
                            </h3>
                            <span className="text-xs font-semibold text-grey/50">{badges.length}/{allBadges.length || badges.length}</span>
                        </div>

                        {badges.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {badges.slice(0, 6).map((badge) => (
                                    <div key={badge.id} className="group flex flex-col items-center gap-2 text-center" title={badge.description}>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/5 text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                                            {getBadgeIcon(badge.icon_name)}
                                        </div>
                                        <span className="text-xs font-medium text-teal-dark">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-cream/30 p-5 text-center">
                                <Award className="mx-auto h-8 w-8 text-coral/60" />
                                <p className="mt-2 text-sm font-semibold text-teal-dark">Aún no tienes insignias.</p>
                                <p className="mt-1 text-xs text-grey/60">Lee, registra avances y explora géneros para desbloquearlas.</p>
                            </div>
                        )}

                        {nextBadges.length > 0 && (
                            <div className="space-y-2 rounded-2xl bg-cream/30 p-3">
                                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-grey/50">Próximas</h4>
                                {nextBadges.map((badge) => (
                                    <div key={badge.id} className="flex items-start gap-3 rounded-xl bg-white p-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grey/10 text-grey-dark">
                                            {getBadgeIcon(badge.icon_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-teal-dark">{badge.name}</p>
                                            <p className="line-clamp-2 text-xs text-grey/60">{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full text-xs text-grey-dark hover:text-teal"
                            onClick={() => setIsBadgesModalOpen(true)}
                        >
                            Ver todas las insignias disponibles <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                    </section>

                    <RecommendedChallenge genres={genres} booksRead={stats.booksRead} />
                </div>
            </main>

            <Modal isOpen={isBadgesModalOpen} onClose={() => setIsBadgesModalOpen(false)} title="Insignias disponibles">
                <div className="space-y-6">
                    <p className="text-sm text-grey-dark">
                        Desbloquea insignias leyendo más libros, explorando nuevos géneros y manteniendo constancia.
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {allBadges.map((badge) => {
                            const isEarned = badges.some((earned) => earned.id === badge.id);
                            return (
                                <div
                                    key={badge.id}
                                    className={`flex items-start gap-4 rounded-xl border p-4 ${isEarned ? "border-teal/20 bg-teal/5" : "border-grey/10 bg-grey/5 opacity-70"}`}
                                >
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isEarned ? "bg-white text-teal shadow-sm" : "bg-grey/10 text-grey-dark"}`}>
                                        {getBadgeIcon(badge.icon_name)}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${isEarned ? "text-teal-dark" : "text-grey-dark"}`}>{badge.name}</h4>
                                        <p className="mt-1 text-xs text-grey-dark">{badge.description}</p>
                                        {isEarned && (
                                            <span className="mt-2 inline-block rounded-full border border-teal/20 bg-white px-2 py-0.5 text-[10px] font-bold text-teal shadow-sm">
                                                Conseguida
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

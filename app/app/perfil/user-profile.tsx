"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
    MapPin,
    Calendar,
    Edit2,
    BookOpen,
    FileText,
    Flame,
    Award,
    ChevronRight,
    MoreHorizontal,
    Mouse,
    Cookie,
    Library,
    Sun,
    CalendarCheck,
    Shield,
    Compass,
    PenTool,
    Megaphone,
    Palette,
    Check
} from "lucide-react";
import { updateProfile } from "./actions";
import { Modal } from "@/components/ui/Modal";

// Types
type ProfileData = {
    id: string;
    username: string;
    full_name: string;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;

    goals: {
        yearly_target: number;
        secondary: string[];
    } | null;
    favorite_genres: string[] | null; // stored as jsonb
    banner_color?: string | null;
    created_at?: string | null; // Optional if existing data is missing
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
    awarded_at?: string; // Optional because allBadges won't have it
};



const LIBRARY_TABS = ["Leídos", "Leyendo", "Quiero Leer", "Abandonados"];

function ProgressBar({ current, target }: { current: number; target: number }) {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
                <span className="text-teal-dark">Meta {new Date().getFullYear()}: {target} libros</span>
                <span className="text-grey/60">{current}/{target} ({Math.round(percentage)}%)</span>
            </div>
            <div className="h-3 w-full bg-grey/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-xs text-grey/60">
                ¡Vas genial! Te quedan <strong className="text-teal">{Math.max(0, target - current)}</strong> libros para tu meta 🎯
            </p>
        </div>
    );
}

function StatCard({ label, value, subtext, icon }: { label: string; value: string | number; subtext: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-grey/10 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-teal/5 text-teal rounded-xl">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-teal-dark leading-tight">{value}</div>
                <div className="text-sm font-medium text-grey-dark">{label}</div>
                <div className="text-xs text-grey/50 mt-1">{subtext}</div>
            </div>
        </div>
    );
}

// Activity Data Type
type ActivityData = {
    lastRead: { title: string; author: string; timeAgo: string; cover: string | null } | null;
    current: { title: string; author: string; progress: number; cover: string | null } | null;
};

type LibraryBook = {
    id: string;
    title: string;
    cover: string | null;
};

export default function UserProfile({
    profile,
    stats,
    badges = [],
    allBadges = [],
    activity,
    initialLibrary = []
}: {
    profile: ProfileData;
    stats: StatsData;
    badges?: Badge[];
    allBadges?: Badge[];
    activity?: ActivityData;
    initialLibrary?: LibraryBook[];
}) {
    const [activeTab, setActiveTab] = React.useState("Leídos");
    const [libraryBooks, setLibraryBooks] = React.useState<LibraryBook[]>(initialLibrary);
    const [libraryLoading, setLibraryLoading] = React.useState(false);
    const [isEditingBio, setIsEditingBio] = React.useState(false);
    const [isBadgesModalOpen, setIsBadgesModalOpen] = React.useState(false);
    const [bio, setBio] = React.useState(profile.bio || "Sin biografía aún.");

    // Optimistic UI for bio
    const handleBioSave = async () => {
        setIsEditingBio(false);
        if (bio !== profile.bio) {
            const formData = new FormData();
            formData.append('bio', bio);
            await updateProfile(formData);
        }
    };

    // Banner Color Logic
    // Predefined palette - tailored to the app theme
    const BANNER_COLORS = [
        "#115e59", // teal-dark (Default)
        "#14b8a6", // teal
        "#0891b2", // cyan-600
        "#0284c7", // sky-600
        "#2563eb", // blue-600
        "#4f46e5", // indigo-600
        "#7c3aed", // violet-600
        "#9333ea", // purple-600
        "#c026d3", // fuchsia-600
        "#db2777", // pink-600
        "#e11d48", // rose-600
        "#FF7F50", // coral
        "#FF9F80", // coral-light
        "#f97316", // orange-500
        "#f59e0b", // amber-500
        "#eab308", // yellow-500
        "#65a30d", // lime-600
        "#16a34a", // green-600
        "#059669", // emerald-600
        "#475569", // slate-600
        "#27272a"  // zinc-800
    ];

    // Helper: Normalize color (handle transition from tailwind class to hex)
    const getInitialColor = (color?: string | null) => {
        if (!color) return "#115e59";
        if (color.startsWith("#")) return color;
        // Fallback for legacy classes if they exist in DB
        if (color === "bg-teal-dark") return "#115e59";
        return "#115e59"; // Default fallback if unknown class
    };

    // We store the HEX code directly
    const [bannerColor, setBannerColor] = React.useState(getInitialColor(profile.banner_color));
    const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);

    const handleBannerColorChange = async (colorHex: string) => {
        setBannerColor(colorHex);
        setIsColorPickerOpen(false);

        // Optimistic update + Server Save
        const formData = new FormData();
        formData.append('banner_color', colorHex);
        await updateProfile(formData);
    };

    // Fetch library books when tab changes
    // We need to import createClient safely or pass a server action. 
    // Since this is a client component, we should strictly use `createClient` from `@/utils/supabase/client`.
    // However, I'll use a dynamic import or just standard client pattern.
    // Assuming `createClient` is available or I can import it at the top.
    // Wait, I need to add the import first. But I can't easily add top-level imports with replace_file_content if I don't see the top.
    // I check the top of the file in previous steps. It imports `createClient` from `.../server` which is WRONG for client component if used in useEffect.
    // `user-profile.tsx` has "use client" at the top.
    // `import { createClient } from "@/utils/supabase/server";` would break it if it was there (it uses fs).
    // Let's check imports.

    // Previous view_file of user-profile.tsx showed imports:
    // import * as React from "react";
    // import Link from "next/link";
    // import { Button } ...
    // import { updateProfile } from "./actions";

    // It DOES NOT import supabase client.

    // I'll add the useEffect logic but I need `createClient`.
    // I will mock it or use the server action pattern if possible? 
    // No, standard pattern is client-side fetch for tabs.

    // I will add the import in a separate step if needed, or assume I can use `createClient` from `@/utils/supabase/client`.

    // Let's inject the useEffect.
    React.useEffect(() => {
        const fetchBooks = async () => {
            setLibraryLoading(true);
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();

            let status = 'READ';
            if (activeTab === 'Leyendo') status = 'READING';
            if (activeTab === 'Quiero Leer') status = 'WANT_TO_READ';
            if (activeTab === 'Abandonados') status = 'DNF';

            const { data } = await supabase
                .from("user_books")
                .select(`
                    book:books (
                        id,
                        title,
                        cover_url
                    )
                `)
                .eq("user_id", profile.id)
                .eq("status", status)
                .limit(10);

            if (data) {
                setLibraryBooks(data.map((b: any) => ({
                    id: b.book.id,
                    title: b.book.title,
                    cover: b.book.cover_url
                })));
            }
            setLibraryLoading(false);
        };

        // Skip fetching if it's the initial tab and we already have data (optimization)
        if (activeTab === 'Leídos' && initialLibrary.length > 0 && JSON.stringify(libraryBooks) === JSON.stringify(initialLibrary)) {
            // do nothing, we have initial data
        } else {
            fetchBooks();
        }
    }, [activeTab, profile.id]); // Removed initialLibrary dependency to avoid loop if it changes ref

    const memberSince = React.useMemo(() => {
        const dateStr = profile.created_at || profile.created_at; // Fallback? No, just check existence
        if (!dateStr) return "Recientemente";
        try {
            return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        } catch (e) {
            return "Recientemente";
        }
    }, [profile.created_at]);
    const goalTarget = profile.goals?.yearly_target || 50;

    // Genres logic
    const genres = (profile.favorite_genres || []).slice(0, 4).map((g, i) => ({
        name: g,
        percentage: 25, // Mock
        color: ["bg-teal", "bg-coral", "bg-yellow-400", "bg-purple-400"][i % 4]
    }));

    // Icon mapping
    const IconMap: { [key: string]: React.ElementType } = {
        Mouse, Cookie, Library: BookOpen, Sun, CalendarCheck: Calendar, Shield: Award, Compass: MapPin, PenTool: Edit2, Megaphone: Flame
    };

    // Use a default icon if not found
    const getBadgeIcon = (name: string) => {
        const Icon = IconMap[name] || Award;
        return <Icon className="w-6 h-6" />;
    };

    return (
        <div className="min-h-screen bg-cream/20 pb-20">
            {/* --- Header Section --- */}
            <header className="bg-white border-b border-grey/10 pb-8 pt-24 px-6 md:px-12 relative group/header">
                {/* Cover/Banner Customizable */}
                <div
                    className="absolute top-0 left-0 w-full h-32 opacity-90 transition-colors duration-500"
                    style={{ backgroundColor: bannerColor }}
                />
                <div className="absolute top-0 left-0 w-full h-32 opacity-10 pattern-grid-lg pointer-events-none" />

                {/* Banner Edit Trigger - Always visible for now to debug, with high z-index */}
                <div className="absolute top-4 right-6 z-50">
                    <div className="relative">
                        <button
                            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                            className="p-2 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full text-white transition-all shadow-sm border border-white/20"
                            title="Cambiar color de portada"
                        >
                            <Palette className="w-4 h-4" />
                        </button>

                        {/* Color Picker Popover */}
                        {isColorPickerOpen && (
                            <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-grey/10 grid grid-cols-3 gap-2 z-50 animate-in fade-in zoom-in-95 w-32">
                                {BANNER_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleBannerColorChange(color)}
                                        className={`w-8 h-8 rounded-full hover:scale-110 transition-transform ring-2 ring-offset-1 ${bannerColor === color ? 'ring-grey/40' : 'ring-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-6 relative z-10">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-grey/20">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal/20 to-coral/20 flex items-center justify-center text-4xl">
                                    👤
                                </div>
                            )}
                        </div>
                        <Link href="/app/perfil/editar" className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md text-grey-dark hover:text-teal transition-colors border border-grey/10">
                            <Edit2 className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 space-y-2 mb-2 md:mb-0">
                        <h1 className="text-3xl font-bold text-teal-dark">{profile.full_name || "Lector Sin Nombre"}</h1>
                        <p className="text-grey/60 text-sm font-medium">{profile.username ? `@${profile.username}` : ""}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-grey/60 mt-1">
                            {profile.location && (
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>
                            )}
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Miembro desde {memberSince}</span>
                        </div>

                        {/* Editable Bio */}
                        <div className="mt-4 max-w-xl">
                            <p className="text-grey-dark text-sm leading-relaxed">
                                {bio}
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-3">
                        {/* Removed unused menu button */}
                        <Link
                            href="/app/perfil/editar"
                            className="inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-transparent border border-coral text-coral hover:bg-coral/10 hover:shadow-sm focus:ring-coral h-9 px-4 text-sm"
                        >
                            Editar Perfil
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Left Column (Stats & Charts) --- */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Stats Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            icon={<BookOpen className="w-5 h-5" />}
                            value={stats.booksRead}
                            label="Libros"
                            subtext="leídos este año"
                        />
                        <StatCard
                            icon={<FileText className="w-5 h-5" />}
                            value={stats.pagesRead.toLocaleString()}
                            label="Páginas"
                            subtext="este año"
                        />
                        <StatCard
                            icon={<Flame className="w-5 h-5 text-coral" />}
                            value={`${stats.streakDays} días`}
                            label="Racha"
                            subtext="leyendo"
                        />
                    </section>

                    {/* Goal Progress */}
                    <section className="bg-white p-6 rounded-3xl border border-grey/10 shadow-sm">
                        <ProgressBar current={stats.booksRead} target={goalTarget} />
                    </section>

                    {/* Recent Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Activity */}
                        <section className="bg-white p-6 rounded-3xl border border-grey/10 shadow-sm space-y-6">
                            <h3 className="font-bold text-teal-dark flex items-center gap-2">
                                Actividad Reciente
                            </h3>

                            {/* Last Read */}
                            {activity?.lastRead ? (
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-16 bg-grey/10 rounded shadow-sm shrink-0 overflow-hidden relative">
                                        {activity.lastRead.cover ? (
                                            <img src={activity.lastRead.cover} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 bg-teal/20 flex items-center justify-center text-xs">📖</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs text-grey/40 uppercase tracking-wider mb-0.5">Terminado</div>
                                        <h4 className="font-bold text-teal-dark text-sm line-clamp-1">{activity.lastRead.title}</h4>
                                        <p className="text-xs text-grey/60">{activity.lastRead.timeAgo}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-grey/60 italic">No has terminado ningún libro recientemente.</p>
                            )}

                            {/* Current Read */}
                            {activity?.current ? (
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-16 bg-grey/10 rounded shadow-sm shrink-0 overflow-hidden relative">
                                        {activity.current.cover ? (
                                            <img src={activity.current.cover} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 bg-coral/20 flex items-center justify-center text-xs">📖</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-grey/40 uppercase tracking-wider mb-0.5">Leyendo</div>
                                        <h4 className="font-bold text-teal-dark text-sm line-clamp-1">{activity.current.title}</h4>
                                        <div className="w-full bg-grey/10 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-coral h-full rounded-full" style={{ width: `${activity.current.progress}%` }} />
                                        </div>
                                        <p className="text-[10px] text-grey/60 mt-1">{activity.current.progress}% completado</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-grey/60 italic">No estás leyendo nada actualmente.</p>
                            )}
                        </section>

                        {/* Genres Chart */}
                        {/* Genres Chart */}
                        <section className="bg-white p-6 rounded-3xl border border-grey/10 shadow-sm space-y-4">
                            <h3 className="font-bold text-teal-dark">Géneros Favoritos</h3>
                            <div className="flex items-center gap-4">
                                {/* Simple CSS Donut Chart */}
                                {genres.length > 0 ? (
                                    <>
                                        <div className="relative w-28 h-28 rounded-full border-[12px] border-cream flex items-center justify-center shrink-0"
                                            style={{
                                                background: `conic-gradient(
                                                ${genres.map((g, i) => {
                                                    // Calculate cumulative percentages for gradient
                                                    const start = (i * 100) / genres.length;
                                                    const end = ((i + 1) * 100) / genres.length;
                                                    // Map tailwind classes to hex codes for gradient (Simplified)
                                                    const colorMap: { [key: string]: string } = {
                                                        "bg-teal": "#20535B",
                                                        "bg-coral": "#F27A72",
                                                        "bg-yellow-400": "#FACC15",
                                                        "bg-purple-400": "#C084FC",
                                                        "bg-blue-400": "#60A5FA",
                                                        "bg-pink-400": "#F472B6"
                                                    };
                                                    return `${colorMap[g.color] || '#ccc'} ${start}% ${end}%`;
                                                }).join(', ')}
                                            )`
                                            }}
                                        >
                                            <div className="absolute inset-0 m-auto w-14 h-14 bg-white rounded-full" />
                                        </div>
                                        <div className="space-y-3 text-xs flex-1 min-w-0">
                                            {genres.map(g => (
                                                <div key={g.name} className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${g.color}`} />
                                                        <span className="text-grey-dark text-[10px] truncate leading-tight" title={g.name}>{g.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 text-center py-4">
                                        <p className="text-grey/40 text-xs">Sin géneros favoritos.</p>
                                        <Link href="/app/perfil/editar" className="text-[10px] text-teal hover:underline">Añadir en Editar Perfil</Link>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Quick Library */}
                    <section className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-grey/10">
                            <div className="flex gap-6">
                                {LIBRARY_TABS.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab
                                            ? "text-teal-dark"
                                            : "text-grey/40 hover:text-teal"
                                            }`}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-coral rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <Link
                                href={`/app/mi-lectura/estanterias?filter=${activeTab === 'Leídos' ? 'read' :
                                    activeTab === 'Leyendo' ? 'reading' :
                                        activeTab === 'Quiero Leer' ? 'toread' :
                                            activeTab === 'Abandonados' ? 'abandoned' : 'all'
                                    }`}
                                className="hidden sm:flex text-xs text-grey-dark hover:text-teal items-center"
                            >
                                Ver todos <ChevronRight className="w-3 h-3 ml-1" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 py-4">
                            {libraryLoading ? (
                                <div className="col-span-full py-8 text-center text-xs text-grey/40">Cargando...</div>
                            ) : (
                                <>
                                    {libraryBooks.map((book) => (
                                        <Link href={`/app/libros/${book.id}`} key={book.id} className="aspect-[2/3] bg-white rounded-xl shadow-sm border border-grey/10 flex items-center justify-center relative group overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform">
                                            {book.cover ? (
                                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-2">
                                                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-teal" />
                                                    <span className="text-xs line-clamp-2">{book.title}</span>
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                    {(libraryBooks.length === 0 && !libraryLoading) && (
                                        <div className="col-span-full py-8 text-center text-xs text-grey/40 italic">
                                            No hay libros en esta sección.
                                        </div>
                                    )}
                                </>
                            )}

                            <Link href="/app/mi-lectura" className="aspect-[2/3] border-2 border-dashed border-grey/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-teal/40 hover:bg-teal/5 transition-colors">
                                <span className="text-xs text-grey/40 font-medium">+ Añadir</span>
                            </Link>
                        </div>
                    </section>
                </div>

                {/* --- Right Column (Badges & Extras) --- */}
                <div className="space-y-8">
                    {/* Badges */}
                    <section className="bg-white p-6 rounded-3xl border border-grey/10 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-teal-dark flex items-center gap-2">
                                <Award className="w-4 h-4 text-coral" /> Insignias
                            </h3>
                            {/* <span className="text-xs text-grey/50">Ver todas</span> */}
                        </div>
                        {badges.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {badges.map((badge) => (
                                    <div key={badge.id} className="flex flex-col items-center gap-2 text-center group cursor-pointer" title={badge.description}>
                                        <div className="w-12 h-12 rounded-full bg-teal/5 flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-white transition-colors">
                                            {getBadgeIcon(badge.icon_name)}
                                        </div>
                                        <span className="text-xs font-medium text-teal-dark">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-8 text-grey/40 text-sm">
                                <p className="font-medium">Aún no tienes insignias.</p>
                                <p className="text-xs mt-1">¡Sigue leyendo para desbloquearlas!</p>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full text-xs text-grey-dark hover:text-teal"
                            onClick={() => setIsBadgesModalOpen(true)}
                        >
                            Ver todas las insignias disponibles <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                    </section>

                    {/* Reading Challenge Promo (Optional/Extra) */}
                    <section className="bg-gradient-to-br from-[#FFF9C4] to-[#FFE0B2] p-6 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -mr-10 -mt-10 blur-xl group-hover:bg-white/60 transition-colors" />

                        <div className="relative z-10">
                            <h3 className="font-serif text-xl mb-2 text-teal-dark">Reto de Verano ☀️</h3>
                            <p className="text-xs text-teal-dark/80 mb-4 leading-relaxed font-medium">
                                Lee 3 libros de autores nórdicos antes de Septiembre.
                            </p>
                            <div className="inline-flex items-center text-xs font-bold bg-white text-teal-dark px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-teal group-hover:text-white transition-all">
                                Unirse al reto <ChevronRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Badges Modal */}
            <Modal isOpen={isBadgesModalOpen} onClose={() => setIsBadgesModalOpen(false)} title="Insignias Disponibles">
                <div className="space-y-6">
                    <p className="text-sm text-grey-dark mb-4">
                        Desbloquea insignias leyendo más libros, explorando nuevos géneros y siendo constante.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allBadges.map((badge) => {
                            const isEarned = badges.some(b => b.id === badge.id);
                            return (
                                <div
                                    key={badge.id}
                                    className={`flex items-start gap-4 p-4 rounded-xl border ${isEarned ? 'bg-teal/5 border-teal/20' : 'bg-grey/5 border-grey/10 opacity-60'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isEarned ? 'bg-white text-teal shadow-sm' : 'bg-grey/10 text-grey-dark'}`}>
                                        {getBadgeIcon(badge.icon_name)}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${isEarned ? 'text-teal-dark' : 'text-grey-dark'}`}>
                                            {badge.name}
                                        </h4>
                                        <p className="text-xs text-grey-dark mt-1">
                                            {badge.description}
                                        </p>
                                        {isEarned && (
                                            <span className="inline-block mt-2 text-[10px] font-bold text-teal bg-white px-2 py-0.5 rounded-full border border-teal/20 shadow-sm">
                                                ¡Conseguida!
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

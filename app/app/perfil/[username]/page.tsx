import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BookOpen, Calendar, ChevronLeft, FileText, Lock, MapPin, User } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getFollowState } from "../follow-actions";
import { FollowButton } from "@/components/social/FollowButton";
import { FollowCounts } from "@/components/social/FollowCounts";

export const dynamic = "force-dynamic";

type PublicProfileSummary = {
    profile: {
        id?: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
        bio?: string | null;
        location?: string | null;
        banner_color?: string | null;
        favorite_genres?: string[] | null;
        created_at?: string | null;
    };
    stats?: {
        books_read: number;
        pages_read: number;
        reading: number;
        badges: number;
    };
    recent_books?: Array<{
        id: string;
        title: string;
        cover_url: string | null;
        status: "READ" | "READING";
        finish_date?: string | null;
    }>;
    locked: boolean;
};

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
    return (
        <div className="rounded-2xl border border-grey/10 bg-white p-4 text-center shadow-sm">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal/5 text-teal">
                {icon}
            </div>
            <div className="text-xl font-bold text-teal-dark">{value}</div>
            <div className="text-xs font-semibold text-grey/60">{label}</div>
        </div>
    );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_public_profile_summary", {
        profile_username: decodeURIComponent(username).replace(/^@/, "")
    });

    if (error) {
        console.error("Error loading public profile:", error?.message, error?.details ?? "", error?.hint ?? "", error?.code ?? "");
    }

    if (!data) {
        notFound();
    }

    const summary = data as PublicProfileSummary;
    const profile = summary.profile;

    // Id del perfil objetivo (para el grafo de follows).
    const cleanUsername = decodeURIComponent(username).replace(/^@/, "");
    let targetId = profile.id ?? null;
    if (!targetId) {
        const { data: prof } = await supabase.from("profiles").select("id").eq("username", cleanUsername).maybeSingle();
        targetId = prof?.id ?? null;
    }
    const follow = targetId ? await getFollowState(targetId) : null;
    const memberSince = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })
        : null;
    const bannerColor = profile.banner_color?.startsWith("#") ? profile.banner_color : "#115e59";
    const genres = (profile.favorite_genres || []).filter(Boolean).slice(0, 6);

    return (
        <div className="min-h-screen bg-cream/20 pb-24">
            <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
                <header className="mb-7">
                    <Link href="/app/perfil" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-grey/60 transition-colors hover:text-teal-dark">
                        <ChevronLeft className="h-4 w-4" />
                        Volver
                    </Link>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/40">PERFIL PÚBLICO</span>
                    <h1 className="mb-2 text-[2rem] font-medium leading-tight tracking-tight text-teal">
                        @{profile.username}
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-gray-500">
                        Vista compartida del perfil lector.
                    </p>
                </header>

                <section className="overflow-hidden rounded-2xl border border-grey/10 bg-white shadow-sm sm:rounded-3xl">
                    <div className="h-28" style={{ backgroundColor: bannerColor }} />
                    <div className="px-4 pb-6 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-grey/10 shadow-md">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name || profile.username} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-teal/60" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1 sm:pt-3">
                                <h2 className="break-words text-3xl font-bold text-teal-dark">{profile.full_name || profile.username}</h2>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm text-grey/60">
                                    {profile.location && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-4 w-4" /> {profile.location}
                                        </span>
                                    )}
                                    {memberSince && (
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-4 w-4" /> Desde {memberSince}
                                        </span>
                                    )}
                                </div>

                                {follow && targetId && (
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <FollowCounts userId={targetId} followers={follow.followers} following={follow.following} />
                                        {!follow.isSelf && (
                                            <FollowButton targetId={targetId} initialFollowing={follow.isFollowing} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {summary.locked ? (
                            <div className="mt-6 rounded-2xl border border-grey/10 bg-cream/40 p-5 text-center">
                                <Lock className="mx-auto h-8 w-8 text-teal/60" />
                                <h3 className="mt-3 text-xl font-bold text-teal-dark">Perfil restringido</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-grey/60">
                                    Esta persona ha limitado la visibilidad de su perfil.
                                </p>
                            </div>
                        ) : (
                            <>
                                {profile.bio && (
                                    <p className="mt-6 max-w-2xl text-sm leading-relaxed text-grey-dark">{profile.bio}</p>
                                )}

                                {genres.length > 0 && (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {genres.map((genre) => (
                                            <span key={genre} className="rounded-full border border-teal/10 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal-dark">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {!summary.locked && (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <section className="grid grid-cols-2 gap-3 lg:col-span-1">
                            <Stat icon={<BookOpen className="h-5 w-5" />} value={summary.stats?.books_read || 0} label="Leídos" />
                            <Stat icon={<FileText className="h-5 w-5" />} value={(summary.stats?.pages_read || 0).toLocaleString()} label="Páginas" />
                            <Stat icon={<BookOpen className="h-5 w-5" />} value={summary.stats?.reading || 0} label="Leyendo" />
                            <Stat icon={<Award className="h-5 w-5" />} value={summary.stats?.badges || 0} label="Insignias" />
                        </section>

                        <section className="rounded-2xl border border-grey/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:col-span-2">
                            <h3 className="font-bold text-teal-dark">Lecturas visibles</h3>
                            {summary.recent_books?.length ? (
                                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                    {summary.recent_books.map((book) => (
                                        <Link href={`/app/libros/${book.id}`} key={book.id} className="group">
                                            <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-grey/10 bg-cream/30 shadow-sm transition group-hover:-translate-y-1">
                                                {book.cover_url ? (
                                                    <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <BookOpen className="h-8 w-8 text-teal/50" />
                                                )}
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs font-semibold text-grey-dark">{book.title}</p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-grey/20 bg-cream/30 p-6 text-center">
                                    <BookOpen className="mx-auto h-8 w-8 text-teal/40" />
                                    <p className="mt-2 text-sm font-semibold text-teal-dark">Sin lecturas visibles</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Star, Dna, Users } from "lucide-react";
import { getReaderDna } from "@/lib/reader-dna";
import { SITE_URL } from "@/lib/site";
import { ShareBookButton } from "@/components/book/ShareBookButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params;
    const dna = await getReaderDna(username);
    if (!dna) return { title: "ADN lector | Wordelia" };
    const title = `${dna.name} — ${dna.personality.label} | ADN lector`;
    const description = dna.topGenres.length
        ? `El ADN lector de ${dna.name}: ${dna.topGenres.slice(0, 3).map((g) => g.genre).join(", ")}. ${dna.booksRead} libros leídos en Wordelia.`
        : `Descubre el ADN lector de ${dna.name} en Wordelia.`;
    const url = `${SITE_URL}/lector/${username}`;
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: "profile", siteName: "Wordelia" },
        twitter: { card: "summary_large_image", title, description },
    };
}

export default async function ReaderDnaPage({ params }: PageProps) {
    const { username } = await params;
    const dna = await getReaderDna(username);
    if (!dna) notFound();

    const maxGenre = dna.topGenres[0]?.count || 1;

    return (
        <main className="min-h-screen bg-gradient-to-b from-cream to-[#EEF3EF] px-4 py-10">
            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-3xl border border-teal/10 bg-white shadow-lg">
                    <div className="h-3 bg-gradient-to-r from-teal to-coral" />
                    <div className="p-6 sm:p-8">
                        {/* Cabecera */}
                        <div className="flex items-center gap-4">
                            {dna.avatarUrl ? (
                                <Image src={dna.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 font-serif text-2xl text-teal-dark">{dna.name.charAt(0).toUpperCase()}</div>
                            )}
                            <div className="min-w-0">
                                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-coral"><Dna className="h-3.5 w-3.5" /> ADN lector</p>
                                <h1 className="mt-0.5 font-serif text-2xl text-teal-dark md:text-3xl">{dna.name}</h1>
                            </div>
                        </div>

                        {/* Personalidad */}
                        <div className="mt-6 rounded-2xl border border-teal/10 bg-cream/40 p-5 text-center">
                            <p className="font-serif text-2xl text-teal md:text-3xl">{dna.personality.label}</p>
                            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-grey/70">{dna.personality.blurb}</p>
                        </div>

                        {/* Stats */}
                        <div className="mt-5 grid grid-cols-3 gap-3">
                            <Stat icon={<BookOpen className="h-4 w-4" />} value={dna.booksRead} label={dna.booksRead === 1 ? "libro" : "libros"} />
                            <Stat icon={<span className="text-sm font-bold">≈</span>} value={dna.totalPages > 0 ? dna.totalPages.toLocaleString("es-ES") : "—"} label="páginas" />
                            <Stat icon={<Star className="h-4 w-4" />} value={dna.avgRating ?? "—"} label="valoración" />
                        </div>

                        {/* Géneros = el ADN */}
                        {dna.topGenres.length > 0 && (
                            <div className="mt-6">
                                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-grey/40">Tu ADN por géneros</h2>
                                <div className="space-y-2">
                                    {dna.topGenres.map((g) => (
                                        <div key={g.genre} className="flex items-center gap-3">
                                            <span className="w-28 shrink-0 truncate text-sm font-medium text-teal-dark">{g.genre}</span>
                                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-teal/10">
                                                <div className="h-full rounded-full bg-teal" style={{ width: `${Math.round((g.count / maxGenre) * 100)}%` }} />
                                            </div>
                                            <span className="w-6 text-right text-xs text-grey/50">{g.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Autores */}
                        {dna.topAuthors.length > 0 && (
                            <div className="mt-6">
                                <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Autores más leídos</h2>
                                <div className="flex flex-wrap gap-2">
                                    {dna.topAuthors.map((a) => (
                                        <span key={a.author} className="rounded-full bg-teal/5 px-3 py-1 text-sm font-medium text-teal">{a.author}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-teal/10 pt-5">
                            <Link href={`/app/perfil/${dna.username}`} className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark">
                                <Users className="h-4 w-4" /> Ver perfil
                            </Link>
                            <ShareBookButton title={`ADN lector de ${dna.name} — ${dna.personality.label}`} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-grey/60">Descubre tu propio ADN lector.</p>
                    <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-full border border-teal/25 bg-white px-5 py-2.5 text-sm font-semibold text-teal hover:bg-teal/5">
                        Empieza en Wordelia <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </main>
    );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-3 text-center shadow-sm">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal/5 text-teal">{icon}</div>
            <p className="text-lg font-bold text-teal-dark">{value}</p>
            <p className="text-[11px] text-grey/50">{label}</p>
        </div>
    );
}

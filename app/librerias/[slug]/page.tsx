import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Globe, MapPin, Users } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getOrganizationBySlug, getOrganizationClubs } from "@/app/app/librerias/actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const org = await getOrganizationBySlug(slug);
    if (!org) return { title: "Librería | Wordelia" };
    return {
        title: `${org.name} | Librerías Wordelia`,
        description: org.description || `Clubs de lectura organizados por ${org.name} en Wordelia.`,
    };
}

export default async function LibreriaProfilePage({ params }: PageProps) {
    const { slug } = await params;
    const org = await getOrganizationBySlug(slug);
    if (!org) notFound();

    const clubs = await getOrganizationClubs(org.id, { publicOnly: true });
    const location = [org.address, org.city, org.region].filter(Boolean).join(", ");

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar mode="public" />

            <main className="flex-1 pt-[72px]">
                {/* Cover + header */}
                <div className="relative h-40 w-full bg-[#D8E2DC] md:h-56">
                    {org.cover_url && (
                        <Image src={org.cover_url} alt="" fill className="object-cover" sizes="100vw" priority />
                    )}
                </div>

                <div className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
                    <Link
                        href="/librerias"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Todas las librerías
                    </Link>

                    <header className="-mt-2 flex flex-col gap-4 sm:flex-row sm:items-end">
                        {org.logo_url && (
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
                                <Image src={org.logo_url} alt={org.name} fill className="object-cover" sizes="80px" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">Librería</p>
                            <h1 className="mt-1 font-serif text-3xl text-teal md:text-4xl">{org.name}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-grey/70">
                                {location && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" aria-hidden="true" /> {location}
                                    </span>
                                )}
                                {org.website && (
                                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-teal hover:underline">
                                        <Globe className="h-4 w-4" aria-hidden="true" /> Web
                                    </a>
                                )}
                            </div>
                        </div>
                    </header>

                    {org.description && (
                        <p className="mt-5 max-w-3xl text-base leading-relaxed text-grey">{org.description}</p>
                    )}

                    {/* Clubs */}
                    <section className="mt-10">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-grey/40">Sus clubs de lectura</h2>
                        {clubs.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {clubs.map((club: any) => (
                                    <Link
                                        key={club.id}
                                        href={`/app/clubs/${club.id}`}
                                        className="group flex gap-4 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm transition-all hover:border-teal/25 hover:shadow-md"
                                    >
                                        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-grey/10">
                                            {club.currentBook?.coverUrl ? (
                                                <Image src={club.currentBook.coverUrl} alt="" fill className="object-cover" sizes="64px" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-grey/30">
                                                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-serif text-lg text-teal group-hover:text-coral">{club.name}</h3>
                                            {club.currentBook && (
                                                <p className="mt-0.5 truncate text-sm text-grey">
                                                    Leyendo: {club.currentBook.title}
                                                </p>
                                            )}
                                            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-grey/60">
                                                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                                {club.memberCount} {club.memberCount === 1 ? "miembro" : "miembros"}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-12 text-center text-sm text-grey/60">
                                Esta librería todavía no tiene clubs públicos.
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MessageCircle, Map, CheckSquare, Users, Sparkles, Lock } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ClubJoinCTA } from "@/components/clubes/ClubJoinCTA";
import { formatStartDate, formatClubPrice } from "@/components/clubes/format";
import { getPublicClubBySlug } from "../actions";

export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const club = await getPublicClubBySlug(slug);

    if (!club) {
        return { title: "Club no encontrado | Wordelia" };
    }

    const bookLine = club.book?.title
        ? `Leemos ${club.book.title}${club.book.author ? ` de ${club.book.author}` : ""}. `
        : "";
    const description = `${bookLine}${club.description ?? "Club de lectura guiado de Wordelia con guías de discusión por checkpoints."}`.slice(0, 300);

    return {
        title: `${club.name} | Clubs de lectura Wordelia`,
        description,
        openGraph: {
            title: `${club.name} | Wordelia`,
            description,
            type: "article",
            ...(club.book?.cover_url ? { images: [{ url: club.book.cover_url }] } : {}),
        },
    };
}

// Lo que se ve al unirse. Se muestra difuminado para quien no tiene sesión.
const LOCKED_FEATURES = [
    { icon: Calendar, label: "Calendario de lectura" },
    { icon: MessageCircle, label: "Guías de discusión" },
    { icon: Map, label: "Mapa emocional" },
    { icon: CheckSquare, label: "Checkpoints semanales" },
];

export default async function ClubDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const club = await getPublicClubBySlug(slug);

    if (!club) notFound();

    const startLabel = formatStartDate(club.start_date);
    const priceLabel = formatClubPrice(club.price, club.currency ?? "EUR");
    const cover = club.book?.cover_url;

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <Navbar mode="public" />

            <main className="flex-1 pt-[72px]">
                <div className="mx-auto max-w-6xl px-6 pb-16 pt-6 md:px-10">
                    <Link
                        href="/clubes"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Todos los clubs
                    </Link>

                    <article className="animate-fade-in space-y-10">
                        {club.headerImage && (
                            <div className="relative h-40 w-full overflow-hidden rounded-3xl bg-teal/5 shadow-sm md:h-56">
                                <Image
                                    src={club.headerImage}
                                    alt={`Cabecera de ${club.name}`}
                                    fill
                                    sizes="(min-width: 768px) 1000px, 100vw"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}
                        <header className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
                            <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-2xl bg-grey/10 shadow-lg md:mx-0">
                                {cover ? (
                                    <Image
                                        src={cover}
                                        alt={`Portada de ${club.book?.title ?? club.name}`}
                                        fill
                                        sizes="220px"
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                        <p className="text-center font-serif text-sm text-grey/60">
                                            {club.book?.title ?? club.name}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-coral">
                                        {club.destacado ? "Club destacado" : "Wordelia Originals"}
                                    </p>
                                    <h1 className="text-3xl leading-tight text-teal md:text-4xl">{club.name}</h1>
                                    {club.book?.title && (
                                        <p className="mt-2 text-lg text-grey/70">
                                            Leyendo: {club.book.title}
                                            {club.book.author && ` · ${club.book.author}`}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 text-sm font-semibold">
                                    {startLabel && (
                                        <span className="inline-flex items-center gap-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-coral">
                                            <Calendar className="h-4 w-4" aria-hidden="true" />
                                            Empieza el {startLabel}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-2 rounded-lg border border-teal/20 bg-teal/10 px-3 py-2 text-teal">
                                        <Users className="h-4 w-4" aria-hidden="true" />
                                        Club oficial
                                    </span>
                                    {priceLabel && (
                                        <span className="inline-flex items-center gap-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-coral">
                                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                                            {priceLabel}
                                        </span>
                                    )}
                                </div>

                                {club.description && (
                                    <p className="text-base leading-relaxed text-grey/80">{club.description}</p>
                                )}

                                {club.tags && club.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {club.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-dark"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <ClubJoinCTA clubId={club.id} clubName={club.name} />
                            </div>
                        </header>

                        {club.hook_question && (
                            <section className="rounded-3xl border border-teal/10 bg-white p-6 shadow-sm md:p-8">
                                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
                                    <MessageCircle className="h-4 w-4 text-coral" aria-hidden="true" />
                                    Pregunta de apertura
                                </div>
                                <p className="font-serif text-xl leading-relaxed text-teal-dark md:text-2xl">
                                    “{club.hook_question}”
                                </p>
                            </section>
                        )}

                        <section className="rounded-3xl bg-gradient-to-br from-grey/5 to-teal/5 p-6 md:p-8">
                            <h2 className="mb-6 text-2xl text-teal">Qué incluye el club</h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {LOCKED_FEATURES.map(({ icon: Icon, label }) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-3 rounded-2xl border border-teal/10 bg-white p-4"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                        <span className="font-medium text-teal-dark">{label}</span>
                                        <Lock className="ml-auto h-4 w-4 shrink-0 text-grey/30" aria-hidden="true" />
                                    </div>
                                ))}
                            </div>

                            <p className="mt-6 text-sm leading-relaxed text-grey/70">
                                Regístrate antes del 1 de septiembre y participa gratis en clubs de lectura de
                                Wordelia durante 2026 —1, 2 o 3 según tu plan—, con su guía y su genoma para
                                siempre. <Link href="/planes" className="font-medium text-teal underline-offset-2 hover:underline">Ver planes</Link>.
                            </p>
                        </section>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    );
}

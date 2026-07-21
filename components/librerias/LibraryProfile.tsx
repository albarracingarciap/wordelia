import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Building2, CalendarClock, Clock, Globe, MapPin, ShoppingBag, Sparkles, Users } from "lucide-react";
import { getOrganizationBySlug, getOrganizationClubs, getOrganizationEvents, getOrganizationLocations } from "@/app/app/librerias/actions";
import { getPublishedRecommendations } from "@/app/app/librerias/recommendation-actions";
import { getMyLibraryState } from "@/app/librerias/my-library-actions";
import { MyLibraryButton } from "@/components/librerias/MyLibraryButton";
import { buildBuyLink } from "@/lib/buy-link";
import type { OrganizationEventFormat, OrganizationEventType } from "@/types/organizations";

const EVENT_TYPE_LABELS: Record<OrganizationEventType, string> = {
    presentacion: "Presentación",
    firma: "Firma",
    encuentro: "Encuentro",
    taller: "Taller",
    otro: "Evento",
};
const EVENT_FORMAT_LABELS: Record<OrganizationEventFormat, string> = {
    presencial: "Presencial",
    online: "Online",
    mixto: "Mixto",
};

/**
 * Cuerpo del perfil público de una librería, compartido por la ruta pública
 * (`/librerias/[slug]`, con Navbar/Footer + SEO) y la vista in-app
 * (`/app/librerias/[slug]`, dentro del AppShell). `backHref` y `returnTo` cambian
 * según el contexto; el resto es idéntico.
 */
export async function LibraryProfile({
    slug,
    backHref,
    returnTo,
}: {
    slug: string;
    backHref: string;
    returnTo: string;
}) {
    const org = await getOrganizationBySlug(slug);
    if (!org) notFound();

    const [clubs, events, locations, myLibraryState, recommendations] = await Promise.all([
        getOrganizationClubs(org.id, { publicOnly: true }),
        getOrganizationEvents(org.id, { upcomingOnly: true }),
        getOrganizationLocations(org.id),
        getMyLibraryState(org.id),
        getPublishedRecommendations(org.id),
    ]);
    const location = [org.address, org.city, org.region].filter(Boolean).join(", ");
    const locationById = new Map(locations.map((l) => [l.id, l]));
    // Brand accent: inline styles override the default class colours when set.
    // The `1a` suffix is ~10% alpha (8-digit hex) for tinted backgrounds.
    const brandStyle = org.brand_color ? { color: org.brand_color } : undefined;
    const brandChipStyle = org.brand_color ? { color: org.brand_color, backgroundColor: `${org.brand_color}1a` } : undefined;
    const brandBtnStyle = org.brand_color ? { color: org.brand_color, borderColor: org.brand_color, backgroundColor: `${org.brand_color}14` } : undefined;
    // Si la librería tiene enlace de compra propio, el botón la nombra ("Comprar en X");
    // si no, cae a Todostuslibros y la etiqueta debe ser honesta (búsqueda indie).
    const hasOwnStore = !!org.buy_link_template?.trim();

    return (
        <>
            {/* Cover + header */}
            <div className="relative h-40 w-full bg-[#D8E2DC] md:h-56">
                {org.cover_url && (
                    <Image src={org.cover_url} alt="" fill className="object-cover" sizes="100vw" priority />
                )}
            </div>

            <div className="mx-auto max-w-5xl px-6 pb-16 md:px-10">
                <Link
                    href={backHref}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal transition-colors hover:text-coral"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Todas las librerías
                </Link>

                <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                    {org.logo_url && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
                            <Image src={org.logo_url} alt={org.name} fill className="object-cover" sizes="80px" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral" style={brandStyle}>Librería</p>
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

                    <div className="sm:ml-auto sm:pb-1">
                        <MyLibraryButton orgId={org.id} initial={myLibraryState} returnTo={returnTo} brandColor={org.brand_color} />
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
                            {clubs.map((club: any) => {
                                const buyUrl = club.currentBook
                                    ? buildBuyLink({
                                        template: org.buy_link_template,
                                        isbn: club.currentBook.isbn,
                                        title: club.currentBook.title,
                                    })
                                    : null;
                                return (
                                    <div
                                        key={club.id}
                                        className="flex flex-col gap-3 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm transition-all hover:border-teal/25 hover:shadow-md"
                                    >
                                        <Link href={`/app/clubs/${club.id}`} className="group flex gap-4">
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
                                        {buyUrl && (
                                            <a
                                                href={buyUrl}
                                                target="_blank"
                                                rel={hasOwnStore ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                                                style={hasOwnStore ? brandBtnStyle : undefined}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal/15 bg-teal/5 px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal/10"
                                            >
                                                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                                                {hasOwnStore ? `Comprar en ${org.name}` : "Buscar en librerías independientes"}
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-12 text-center text-sm text-grey/60">
                            Esta librería todavía no tiene clubs públicos.
                        </div>
                    )}
                </section>

                {recommendations.length > 0 && (
                    <section className="mt-10">
                        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40">
                            <Sparkles className="h-4 w-4" aria-hidden="true" /> Lo que recomendamos
                        </h2>
                        <div className="space-y-6">
                            {recommendations.map((list) => (
                                <div key={list.id}>
                                    <h3 className="font-serif text-xl text-teal">{list.title}</h3>
                                    {list.description && <p className="mt-0.5 text-sm text-grey/70">{list.description}</p>}
                                    <div className="mt-3 space-y-3">
                                        {list.items.map((it) => {
                                            const inner = (
                                                <div className="flex gap-4 rounded-2xl border border-teal/10 bg-white p-4 shadow-sm transition-all hover:border-teal/25 hover:shadow-md">
                                                    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-grey/10">
                                                        {it.coverUrl ? (
                                                            <Image src={it.coverUrl} alt="" fill className="object-cover" sizes="64px" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-grey/30"><BookOpen className="h-5 w-5" aria-hidden="true" /></div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-serif text-lg leading-tight text-teal-dark">{it.title}</p>
                                                        {it.author && <p className="mt-0.5 text-sm text-grey/60">{it.author}</p>}
                                                        {it.note && <p className="mt-2 text-sm italic leading-relaxed text-grey">“{it.note}”</p>}
                                                    </div>
                                                </div>
                                            );
                                            // Con book_id → ficha pública; si no, ficha in-app por ISBN.
                                            const bookHref = it.bookId ? `/libro/${it.bookId}` : it.isbn ? `/app/libros/${it.isbn}` : null;
                                            return bookHref ? (
                                                <Link key={it.id} href={bookHref} className="block">{inner}</Link>
                                            ) : (
                                                <div key={it.id}>{inner}</div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {locations.length > 0 && (
                    <section className="mt-10">
                        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40">
                            <Building2 className="h-4 w-4" aria-hidden="true" /> Sedes
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {locations.map((loc) => {
                                const addr = [loc.address, loc.city, loc.region].filter(Boolean).join(", ");
                                const mapQuery = encodeURIComponent([loc.name, addr].filter(Boolean).join(", "));
                                return (
                                    <div key={loc.id} className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-serif text-lg text-teal">{loc.name}</h3>
                                            {loc.is_primary && <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">Principal</span>}
                                        </div>
                                        {addr && (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm text-grey/70 hover:text-teal">
                                                <MapPin className="h-4 w-4" aria-hidden="true" /> {addr}
                                            </a>
                                        )}
                                        {loc.phone && <p className="mt-1 text-sm text-grey/60">{loc.phone}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {events.length > 0 && (
                    <section className="mt-10">
                        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-grey/40">
                            <CalendarClock className="h-4 w-4" aria-hidden="true" /> Próximos eventos
                        </h2>
                        <div className="space-y-3">
                            {events.map((ev) => {
                                const when = new Date(ev.starts_at).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                                const sede = ev.location_id ? locationById.get(ev.location_id) : null;
                                const venue = sede?.name || ev.location;
                                return (
                                    <div key={ev.id} className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-bold text-coral" style={brandChipStyle}>{EVENT_TYPE_LABELS[ev.event_type]}</span>
                                            <h3 className="font-serif text-lg text-teal">{ev.title}</h3>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-grey/70">
                                            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {when}</span>
                                            <span className="inline-flex items-center gap-1.5">
                                                {ev.format === "online" ? <Globe className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                                                {EVENT_FORMAT_LABELS[ev.format]}{venue ? ` · ${venue}` : ""}
                                            </span>
                                        </div>
                                        {ev.description && <p className="mt-2 text-sm leading-relaxed text-grey">{ev.description}</p>}
                                        {ev.format === "online" && ev.url && (
                                            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-semibold text-teal hover:underline">Enlace del evento</a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

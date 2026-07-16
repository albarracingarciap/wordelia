"use client";

import * as React from "react";
import Image from "next/image";
import { BookOpen, CalendarDays, Gauge, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import type { BookSearchResult } from "@/lib/isbndb";

interface Club {
    id?: string;
    title: string;
    book: string;
    author: string;
    cover: string;
    pace: string;
    status: string;
    badges: string[];
    description: string;
    hookQuestion: string;
    priceLabel: string;
    destacado?: boolean;
}

interface InitialClub {
    id?: string;
    slug?: string | null;
    name?: string;
    description?: string | null;
    tags?: string[] | null;
    start_date?: string | null;
    hook_question?: string | null;
    price?: number | null;
    price_cents?: number | null;
    currency?: string | null;
    destacado?: boolean;
    book_data?: BookSearchResult | null;
    book?: {
        title?: string | null;
        author?: string | null;
        cover_url?: string | null;
    } | null;
}

interface ClubsGridProps {
    initialClubs?: InitialClub[];
}

const fallbackClubs: Club[] = [
    {
        title: "Mundo Distópico",
        book: "Fahrenheit 451",
        author: "Ray Bradbury",
        cover: "/assets/images/fahrenheit_451.jpg",
        pace: "Lectura guiada",
        status: "15 jul",
        badges: ["Lectura distópica", "Futuros controlados", "Libertad y resistencia"],
        description: "Explora sociedades futuras controladas y la lucha por la libertad a través de clásicos distópicos que siguen hablando del presente.",
        hookQuestion: "En el mundo de Montag, los libros se queman porque causan infelicidad al hacer pensar a la gente. Si tuvieras que elegir entre vivir en una ignorancia absolutamente feliz y pacífica, o en una verdad dolorosa y caótica, ¿qué elegirías honestamente?",
        priceLabel: "9,90 €",
    },
    {
        title: "Resistencia Psicológica",
        book: "1984",
        author: "George Orwell",
        cover: "/assets/images/1984_Orwell.jpg",
        pace: "Lectura guiada",
        status: "15 jul",
        badges: ["Mente libre", "Contra el totalitarismo", "Resistencia psicológica"],
        description: "Una lectura para conversar sobre vigilancia, lenguaje, miedo colectivo y pensamiento libre.",
        hookQuestion: "Si hoy en día sacrificamos voluntariamente tanta privacidad a través de nuestros teléfonos y redes sociales a cambio de comodidad, ¿estamos construyendo el Gran Hermano por elección propia, o la distopía de Orwell era algo completamente diferente?",
        priceLabel: "9,90 €",
    },
    {
        title: "Justicia Social",
        book: "Matar a un ruiseñor",
        author: "Harper Lee",
        cover: "/assets/images/rui_harper_lee.jpg",
        pace: "Lectura guiada",
        status: "15 ago",
        badges: ["Justicia social", "Prejuicios", "Moralidad en cuestión"],
        description: "Análisis profundo de una obra que cuestiona prejuicios, desigualdades y valentía moral.",
        hookQuestion: "Atticus Finch dice que nunca entiendes realmente a una persona hasta que te pones en su pellejo. Pensando en los personajes más juzgados del libro, como Boo Radley o Mayella Ewell, ¿con quién les costó más empatizar y por qué?",
        priceLabel: "9,90 €",
    },
    {
        title: "Alegoría Social",
        book: "Ensayo sobre la ceguera",
        author: "José Saramago",
        cover: "/assets/images/ensayo_saramago.jpg",
        pace: "Lectura guiada",
        status: "15 ago",
        badges: ["Metáforas de interpelan", "Condición humana", "Lectura lenta"],
        description: "Una conversación sobre fragilidad, comunidad y lo que revelan las crisis.",
        hookQuestion: "Saramago nos muestra que, al perder la vista, los personajes pierden rápidamente la capa de civilización y moral que los cubre. Si mañana colapsaran las reglas básicas de nuestra sociedad, ¿creen que los seres humanos tenderíamos a la crueldad por supervivencia o a la solidaridad?",
        priceLabel: "9,90 €",
    },
];

const clubIncludes = [
    "Checkpoints sin spoilers",
    "Preguntas de discusión",
    "Mapa emocional",
    "Calendario de lectura",
];

const hookQuestionByBook: Record<string, string> = {
    "1984": "Si hoy en día sacrificamos voluntariamente tanta privacidad a través de nuestros teléfonos y redes sociales a cambio de comodidad, ¿estamos construyendo el Gran Hermano por elección propia, o la distopía de Orwell era algo completamente diferente?",
    "Fahrenheit 451": "En el mundo de Montag, los libros se queman porque causan infelicidad al hacer pensar a la gente. Si tuvieras que elegir entre vivir en una ignorancia absolutamente feliz y pacífica, o en una verdad dolorosa y caótica, ¿qué elegirías honestamente?",
    "Matar a un ruiseñor": "Atticus Finch dice que nunca entiendes realmente a una persona hasta que te pones en su pellejo. Pensando en los personajes más juzgados del libro, como Boo Radley o Mayella Ewell, ¿con quién les costó más empatizar y por qué?",
    "Ensayo sobre la ceguera": "Saramago nos muestra que, al perder la vista, los personajes pierden rápidamente la capa de civilización y moral que los cubre. Si mañana colapsaran las reglas básicas de nuestra sociedad, ¿creen que los seres humanos tenderíamos a la crueldad por supervivencia o a la solidaridad?",
};

function formatClubStartDate(value?: string | null) {
    if (!value) {
        return "Próximamente";
    }

    const [datePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);

    if (!year || !month || !day) {
        return "Próximamente";
    }

    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
    }).format(new Date(year, month - 1, day));
}

function formatClubPrice(price?: number | null, currency = "EUR") {
    if (typeof price !== "number" || price <= 0) {
        return "Incluido";
    }

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
    }).format(price);
}

function formatClubPriceFromCents(priceCents?: number | null, currency = "EUR") {
    if (typeof priceCents !== "number" || priceCents <= 0) {
        return "Incluido";
    }

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
    }).format(priceCents / 100);
}

function mapDbClub(dbClub: InitialClub): Club {
    const bookData = dbClub.book_data;
    const bookTitle = bookData?.title || dbClub.book?.title || "Libro por confirmar";
    const normalizedBookTitle = Object.keys(hookQuestionByBook).find((title) =>
        bookTitle.toLowerCase().includes(title.toLowerCase())
    );

    return {
        id: dbClub.id,
        title: dbClub.name || "Club de lectura",
        book: bookTitle,
        author: bookData?.authors?.join(", ") || dbClub.book?.author || "Autor por confirmar",
        cover: bookData?.cover_url || dbClub.book?.cover_url || "/assets/images/default_cover.jpg",
        pace: "Lectura guiada",
        status: formatClubStartDate(dbClub.start_date),
        badges: dbClub.tags?.slice(0, 3) || bookData?.categories?.slice(0, 3) || ["Sin spoilers", "Checkpoints"],
        description: dbClub.description || "Un club para leer con calma, contexto y conversación cuidada.",
        hookQuestion: dbClub.hook_question
            || (normalizedBookTitle ? hookQuestionByBook[normalizedBookTitle] : "")
            || dbClub.description
            || "¿Qué conversación abriría este libro?",
        priceLabel: typeof dbClub.price_cents === "number"
            ? formatClubPriceFromCents(dbClub.price_cents, dbClub.currency || "EUR")
            : formatClubPrice(dbClub.price, dbClub.currency || "EUR"),
        destacado: Boolean(dbClub.destacado),
    };
}

export function ClubsGrid({ initialClubs }: ClubsGridProps) {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const [selectedClub, setSelectedClub] = React.useState<Club | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const displayClubs = initialClubs && initialClubs.length > 0
        ? initialClubs.map(mapDbClub)
        : fallbackClubs;
    const featuredClub = displayClubs.find((club) => club.destacado) || displayClubs[0];
    const upcomingClubs = displayClubs.filter((club) => club !== featuredClub).slice(0, 3);

    const handleClubClick = (club: Club) => {
        if (isLoggedIn && club.id) {
            router.push(`/app/clubs/${club.id}`);
            return;
        }

        setSelectedClub(club);
        setIsModalOpen(true);
    };

    const handleCreateClub = () => {
        router.push(isLoggedIn ? "/app/clubs/crear" : "/register?source=beta&intent=create-club");
    };

    return (
        <Section id="clubs" className="bg-[#D8E2DC] py-16 md:py-24">
            <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center md:mb-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Clubs de lectura</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Lecturas guiadas para conversaciones más profundas
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Guías de discusión basadas en checkpoints, conversaciones sin spoilers y registro de emociones.
                </p>
            </div>

            {featuredClub && (
                <div className="mb-10 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                    <article className="overflow-hidden rounded-3xl border border-teal/10 bg-offwhite shadow-sm">
                        <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                            <div className="bg-cream p-6 md:p-7">
                                <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-2xl shadow-md md:w-full">
                                    <Image
                                        src={featuredClub.cover}
                                        alt={`Portada de ${featuredClub.book}`}
                                        fill
                                        className="object-cover"
                                        sizes="(min-width: 768px) 210px, 160px"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col justify-between gap-7 p-6 md:p-8">
                                <div className="space-y-5">
                                    <div>
                                        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                            Club destacado
                                        </p>
                                        <h3 className="text-3xl leading-tight text-teal md:text-4xl">{featuredClub.title}</h3>
                                        <p className="mt-1 text-sm font-semibold text-grey">
                                            Leyendo: {featuredClub.book} · {featuredClub.author}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-teal/10 bg-white p-5">
                                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
                                            <MessageCircle className="h-4 w-4 text-coral" aria-hidden="true" />
                                            Pregunta de apertura
                                        </div>
                                        <p className="font-serif text-xl leading-snug text-teal-dark">
                                            “{featuredClub.hookQuestion}”
                                        </p>
                                    </div>

                                    <p className="text-sm leading-relaxed text-grey md:text-base">
                                        {featuredClub.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-teal-dark">
                                            <Gauge className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                                            {featuredClub.pace}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-teal-dark">
                                            <CalendarDays className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                                            {featuredClub.status}
                                        </span>
                                        <span className="rounded-full bg-coral/10 px-3 py-1.5 text-coral">
                                            Precio {featuredClub.priceLabel}
                                        </span>
                                        <span className="rounded-full bg-teal/10 px-3 py-1.5 text-teal">
                                            Gratis para fundadores
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleClubClick(featuredClub)}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-6 font-semibold text-white transition-colors hover:bg-[#C25852] sm:w-auto"
                                >
                                    {isLoggedIn && featuredClub.id ? "Ir al club" : "Vista previa"}
                                </button>
                            </div>
                        </div>
                    </article>

                    <aside className="grid gap-4">
                        <div className="rounded-3xl border border-teal/10 bg-white/65 p-5 shadow-sm">
                            <h3 className="mb-4 text-2xl font-semibold text-teal">Próximos clubs</h3>
                            <div className="space-y-3">
                                {upcomingClubs.map((club) => (
                                    <button
                                        key={`${club.title}-${club.book}`}
                                        type="button"
                                        onClick={() => handleClubClick(club)}
                                        className="group flex w-full gap-4 rounded-2xl border border-teal/10 bg-offwhite p-3 text-left transition-colors hover:bg-white"
                                    >
                                        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-grey/10">
                                            <Image
                                                src={club.cover}
                                                alt={`Portada de ${club.book}`}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <h4 className="line-clamp-1 font-semibold text-teal-dark">{club.title}</h4>
                                            </div>
                                            <p className="line-clamp-1 text-sm text-grey">{club.book}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-teal">
                                                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                                    {club.status}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-coral/10 px-2.5 py-1 text-xs font-semibold text-coral">
                                                    {club.priceLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-teal/10 bg-teal p-5 text-white shadow-sm">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-cream">
                                Cada club incluye
                            </p>
                            <div className="grid gap-2">
                                {clubIncludes.map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-white/90">
                                        <ShieldCheck className="h-4 w-4 text-cream" aria-hidden="true" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={() => router.push("/clubes")} className="w-full sm:w-auto">
                    Explorar clubs
                </Button>
                <Button onClick={handleCreateClub} className="w-full sm:w-auto">
                    {isLoggedIn ? "Crear un club" : "Crea tu propio club"}
                </Button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                size="lg"
                title=""
                className="bg-cream"
            >
                {selectedClub && (
                    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                        <div className="rounded-2xl border border-teal/10 bg-white p-4 text-center">
                            <div className="relative mx-auto mb-4 h-48 w-32 overflow-hidden rounded-xl shadow-md">
                                <Image
                                    src={selectedClub.cover}
                                    alt={`Portada de ${selectedClub.book}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-teal">{selectedClub.book}</h3>
                            <p className="text-sm text-grey">{selectedClub.author}</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-teal">
                                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    Vista previa sin spoilers
                                </p>
                                <h3 className="text-2xl font-bold text-teal-dark">{selectedClub.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-grey">{selectedClub.description}</p>
                            </div>

                            <div className="rounded-2xl border border-teal/10 bg-white p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
                                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                                    Pregunta de apertura
                                </div>
                                <p className="text-lg leading-snug text-teal-dark">
                                    “{selectedClub.hookQuestion}”
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-white/70 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey">Ritmo</p>
                                    <p className="mt-1 font-semibold text-teal-dark">{selectedClub.pace}</p>
                                </div>
                                <div className="rounded-2xl bg-white/70 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey">Estado</p>
                                    <p className="mt-1 font-semibold text-teal-dark">{selectedClub.status}</p>
                                </div>
                                <div className="rounded-2xl bg-white/70 p-4 sm:col-span-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey">Acceso fundador</p>
                                    <p className="mt-1 font-semibold text-teal-dark">
                                        Precio {selectedClub.priceLabel}; incluido en uno de los clubs oficiales si eres fundador.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button fullWidth onClick={() => router.push("/register?source=beta&intent=join-club")}>
                                    Solicitar acceso beta
                                </Button>
                                <Button variant="secondary" fullWidth onClick={() => router.push("/clubes")}>
                                    Ver más clubs
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Section>
    );
}

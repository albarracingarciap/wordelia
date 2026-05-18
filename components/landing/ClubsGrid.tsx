"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Gauge, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useAuth } from "@/contexts/AuthContext";

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
}

interface InitialClub {
    id?: string;
    name?: string;
    description?: string | null;
    tags?: string[] | null;
    start_date?: string | null;
    hook_question?: string | null;
    price?: number | null;
    currency?: string | null;
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
        badges: ["Sin spoilers", "Checkpoints", "Debate guiado"],
        description: "Una lectura sobre censura, memoria y pensamiento crítico con conversación por tramos.",
        hookQuestion: "¿Qué hace que una sociedad deje de proteger los libros?",
        priceLabel: "9,90 €",
    },
    {
        title: "Resistencia Psicológica",
        book: "1984",
        author: "George Orwell",
        cover: "/assets/images/1984_Orwell.jpg",
        pace: "Lectura guiada",
        status: "15 jul",
        badges: ["Mapa emocional", "Contexto", "Sin spoilers"],
        description: "Un club para leer vigilancia, lenguaje y miedo colectivo con calma y capas de análisis.",
        hookQuestion: "¿Cuándo deja una persona de pensar libremente?",
        priceLabel: "9,90 €",
    },
    {
        title: "Justicia Social",
        book: "Matar a un ruiseñor",
        author: "Harper Lee",
        cover: "/assets/images/rui_harper_lee.jpg",
        pace: "Lectura guiada",
        status: "15 ago",
        badges: ["Debate", "Contexto histórico", "Empatía"],
        description: "Lectura pausada sobre justicia, prejuicio y valentía moral.",
        hookQuestion: "¿La verdadera valentía está en resistir o en acompañar?",
        priceLabel: "9,90 €",
    },
    {
        title: "Alegoría Social",
        book: "Ensayo sobre la ceguera",
        author: "José Saramago",
        cover: "/assets/images/ensayo_saramago.jpg",
        pace: "Lectura guiada",
        status: "15 ago",
        badges: ["Simbología", "Mapa emocional", "Lectura lenta"],
        description: "Una conversación sobre fragilidad, comunidad y lo que revelan las crisis.",
        hookQuestion: "¿Qué vemos de nosotros cuando todo lo demás desaparece?",
        priceLabel: "9,90 €",
    },
];

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

function mapDbClub(dbClub: InitialClub): Club {
    return {
        id: dbClub.id,
        title: dbClub.name || "Club de lectura",
        book: dbClub.book?.title || "Libro por confirmar",
        author: dbClub.book?.author || "Autor por confirmar",
        cover: dbClub.book?.cover_url || "/assets/images/default_cover.jpg",
        pace: "Lectura guiada",
        status: formatClubStartDate(dbClub.start_date),
        badges: dbClub.tags?.slice(0, 3) || ["Sin spoilers", "Checkpoints"],
        description: dbClub.description || "Un club para leer con calma, contexto y conversación cuidada.",
        hookQuestion: dbClub.hook_question || dbClub.description || "¿Qué conversación abriría este libro?",
        priceLabel: formatClubPrice(dbClub.price, dbClub.currency || "EUR"),
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
                    Conversaciones con ritmo, contexto y cero spoilers
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Únete a clubs guiados por checkpoints, mapas emocionales y preguntas que respetan tu avance.
                </p>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {displayClubs.map((club, idx) => (
                    <article
                        key={`${club.title}-${club.book}`}
                        className={`group rounded-2xl border border-teal/5 bg-offwhite p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md ${idx > 1 ? "hidden md:block" : "block"}`}
                    >
                        <div className="flex gap-4 lg:block">
                            <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-xl bg-grey/10 shadow-inner lg:mb-4 lg:h-auto lg:w-full lg:aspect-[2/3]">
                                <Image
                                    src={club.cover}
                                    alt={`Portada de ${club.book}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(min-width: 1024px) 22vw, 96px"
                                />
                            </div>

                            <div className="min-w-0 flex-1 space-y-3">
                                <div>
                                    <h3 className="line-clamp-1 text-lg font-bold text-teal">{club.title}</h3>
                                    <p className="line-clamp-2 text-sm text-grey">Leyendo: {club.book}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-grey lg:grid-cols-[1.2fr_0.8fr]">
                                    <span className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-white/70 px-2.5 py-1">
                                        <Gauge className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                                        {club.pace}
                                    </span>
                                    <span className="inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-white/70 px-2.5 py-1">
                                        <Users className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                                        {club.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-coral/10 px-2.5 py-1 text-coral">
                                        Valor {club.priceLabel}
                                    </span>
                                    <span className="rounded-full bg-teal/10 px-2.5 py-1 text-teal">
                                        Gratis para fundadores
                                    </span>
                                </div>

                                <p className="hidden text-sm leading-relaxed text-grey md:line-clamp-3">
                                    {club.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {club.badges.map((badge) => (
                                        <span
                                            key={badge}
                                            className="rounded-full border border-teal/10 bg-cream px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal"
                                        >
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 border-t border-black/5 pt-4">
                            <button
                                type="button"
                                onClick={() => handleClubClick(club)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C25852]"
                            >
                                {isLoggedIn && club.id ? "Ir al club" : "Vista previa"}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={() => router.push("/clubes")} className="w-full sm:w-auto">
                    Explorar clubs
                </Button>
                <Button onClick={handleCreateClub} className="w-full sm:w-auto">
                    {isLoggedIn ? "Crear un club" : "Crear club en la beta"}
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
                                    &ldquo;{selectedClub.hookQuestion}&rdquo;
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
                                        Valor {selectedClub.priceLabel}; incluido en uno de los clubs oficiales si eres fundador.
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

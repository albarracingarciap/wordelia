"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MessageCircle, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";
import type { OfficialClub } from "@/app/clubes/actions";

const tags = ["Distopía", "Debate guiado", "Lectura media"];

interface BookMonthProps {
    club?: OfficialClub | null;
}

function formatStartDate(value?: string | null) {
    if (!value) {
        return "15 junio";
    }

    const [datePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);

    if (!year || !month || !day) {
        return "15 junio";
    }

    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
    }).format(new Date(year, month - 1, day));
}

function formatPriceFromCents(value?: number | null, currency = "EUR") {
    const cents = typeof value === "number" ? value : 990;

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
    }).format(cents / 100);
}

export function BookMonth({ club }: BookMonthProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const book = club?.book_data;
    const title = book?.title || "El cuento de la criada";
    const author = book?.authors?.join(", ") || "Margaret Atwood";
    const cover = book?.cover_url || "/assets/images/cuento_criada.gif";
    const description = club?.description
        || "Una distopía íntima y contundente sobre poder, identidad y resistencia. La leeremos con checkpoints para avanzar juntos sin adelantar revelaciones.";
    const startDate = formatStartDate(club?.start_date);
    const priceLabel = formatPriceFromCents(club?.price_cents, club?.currency || "EUR");

    const handleJoinClick = () => {
        router.push(isLoggedIn ? "/app/clubs" : "/register?source=beta&intent=book-month");
    };

    return (
        <Section id="libro-del-mes" className="bg-cream pb-8 pt-16 md:py-24">
            <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center md:mb-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Club destacado</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Una lectura común para probar Wordelia
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    El club del mes será uno de los espacios de la beta: lectura por tramos, preguntas guiadas,
                    mapa emocional y conversación sin spoilers.
                </p>
            </div>

            <div className="mx-auto mb-10 max-w-5xl overflow-hidden rounded-3xl border border-teal/10 bg-offwhite shadow-sm">
                <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                    <div className="bg-[#D8E2DC] p-6 md:p-8">
                        <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-2xl shadow-lg md:w-full">
                            <Image
                                src={cover}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="(min-width: 768px) 220px, 160px"
                            />
                        </div>
                    </div>

                    <div className="space-y-6 p-6 md:p-8 lg:p-10">
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-medium text-grey"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div>
                                <h3 className="text-3xl leading-tight text-teal md:text-4xl">
                                    {title}
                                </h3>
                                <p className="mt-1 text-lg font-semibold text-coral">{author}</p>
                            </div>

                            <p className="max-w-3xl text-sm leading-relaxed text-grey md:text-base">
                                {description}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl bg-white/75 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-dark">
                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                    Inicio
                                </div>
                                <p className="font-semibold text-teal-dark">{startDate}</p>
                                <p className="text-xs text-grey/70">beta privada</p>
                            </div>
                            <div className="rounded-2xl bg-white/75 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-dark">
                                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                    Formato
                                </div>
                                <p className="font-semibold text-teal-dark">Sin spoilers</p>
                                <p className="text-xs text-grey/70">por checkpoints</p>
                            </div>
                            <div className="rounded-2xl bg-white/75 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-dark">
                                    <Users className="h-4 w-4" aria-hidden="true" />
                                    Plazas
                                </div>
                                <p className="font-semibold text-teal-dark">Limitadas</p>
                                <p className="text-xs text-grey/70">lectores fundadores</p>
                            </div>
                            <div className="rounded-2xl bg-white/75 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-dark">
                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                    Fundadores
                                </div>
                                <p className="font-semibold text-teal-dark">Valor {priceLabel}</p>
                                <p className="text-xs text-grey/70">1 club incluido</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-teal/10 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">
                                <Sparkles className="h-4 w-4 text-coral" aria-hidden="true" />
                                Vista previa del ADN
                            </div>
                            <div className="grid gap-5 md:grid-cols-[1fr_260px]">
                                <ul className="space-y-3 text-sm">
                                    {[
                                        { label: "Temas", val: "Poder, identidad, resistencia" },
                                        { label: "Tono", val: "Inquietante, íntimo" },
                                        { label: "Complejidad", val: "Accesible" },
                                    ].map((item) => (
                                        <li key={item.label} className="flex items-start gap-3">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                                            <span className="text-grey">
                                                <strong className="text-teal-dark">{item.label}:</strong> {item.val}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex flex-col justify-center rounded-xl border border-teal/5 bg-cream/50 p-4 text-center">
                                    <div className="mb-1 flex justify-between px-1 text-[10px] font-medium text-teal/60">
                                        <span>Pausado</span>
                                        <span>Frenético</span>
                                    </div>
                                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-teal/10">
                                        <div className="absolute left-0 top-0 h-full w-[68%] bg-coral" />
                                    </div>
                                    <span className="mt-2 block text-[10px] font-medium uppercase tracking-wider text-teal">
                                        Ritmo de lectura
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                <Button
                    size="lg"
                    className="w-full px-10 shadow-coral/20 sm:w-auto"
                    onClick={handleJoinClick}
                >
                    {isLoggedIn ? "Ver clubs disponibles" : "Solicitar plaza en la beta"}
                </Button>
                <div className="flex flex-col gap-3 text-center text-sm font-medium text-teal sm:flex-row sm:gap-6">
                    <Link href="/explorar" className="hover:underline">Explorar libros</Link>
                    <Link href="/clubes" className="hover:underline">Ver clubs públicos</Link>
                </div>
            </div>
        </Section>
    );
}

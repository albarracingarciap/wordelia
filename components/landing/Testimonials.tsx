"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenCheck, HeartPulse, MessageCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

const validationAreas = [
    {
        title: "Lectura sin presión",
        text: "Queremos comprobar si el seguimiento por sesiones ayuda a mantener el hábito sin convertirlo en una carrera.",
        icon: BookOpenCheck,
        tag: "Mi lectura",
    },
    {
        title: "Notas que vuelven contigo",
        text: "La beta nos servirá para pulir notas, etiquetas, destacados y recuerdos de lectura que realmente apetezca recuperar.",
        icon: Sparkles,
        tag: "Notas",
    },
    {
        title: "Clubes sin spoilers",
        text: "Validaremos conversaciones por checkpoints, guías y ritmos compartidos para que todos puedan participar a su paso.",
        icon: MessageCircle,
        tag: "Clubs",
    },
    {
        title: "Mapa emocional",
        text: "Buscamos lectores que nos ayuden a afinar cómo registrar y visualizar lo que cada tramo de un libro provoca.",
        icon: HeartPulse,
        tag: "Emociones",
    },
];

export function Testimonials() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    const handleBetaClick = () => {
        router.push(isLoggedIn ? "/app/mi-lectura" : "/register?source=beta&intent=founder-feedback");
    };

    return (
        <Section id="lectores-fundadores" className="bg-[#D8E2DC] py-14 md:py-24">
            <div className="mx-auto mb-8 max-w-3xl space-y-4 text-center md:mb-12">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Lectores fundadores</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Antes de abrir Wordelia, queremos leer contigo
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    La beta no va de acumular testimonios: va de escuchar a los primeros lectores y construir una
                    experiencia que cuide el ritmo, la conversación y la memoria de cada libro.
                </p>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-2 md:gap-6">
                {validationAreas.map((item) => {
                    const Icon = item.icon;

                    return (
                        <article
                            key={item.title}
                            className="rounded-3xl border border-teal/10 bg-offwhite p-5 shadow-sm md:p-7"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal shadow-sm">
                                    <Icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <span className="mb-2 inline-flex rounded-full border border-teal/10 bg-white px-3 py-1 text-xs font-bold text-teal">
                                        {item.tag}
                                    </span>
                                    <h3 className="text-xl font-bold text-teal-dark">{item.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-grey/80 md:text-base">{item.text}</p>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-white/60 bg-white/55 p-5 text-center shadow-sm md:mt-12 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-dark">200 plazas iniciales</p>
                <h3 className="text-2xl font-bold text-teal-dark">Tu feedback puede decidir qué llega al lanzamiento</h3>
                <p className="max-w-xl text-sm leading-relaxed text-grey/80 md:text-base">
                    Los lectores fundadores tendrán prioridad en novedades, acceso a la beta privada y voz directa en
                    las decisiones de producto antes del 15 de julio.
                </p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <Button className="w-full rounded-2xl px-8 sm:w-auto" onClick={handleBetaClick}>
                        Solicitar acceso beta
                    </Button>
                    <Link
                        href="/clubes"
                        className="inline-flex h-11 items-center justify-center rounded-2xl px-6 text-base font-medium text-teal hover:bg-white"
                    >
                        Ver clubs públicos
                    </Link>
                </div>
            </div>
        </Section>
    );
}

"use client";

import React, { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

type PlanId = "explorador" | "voraz" | "ai";

const plans: Array<{
    id: PlanId;
    name: string;
    monthlyPrice: string;
    annualPrice: string;
    description: string;
    cta: string;
    popular?: boolean;
    features: Array<{ text: string; included: boolean }>;
}> = [
    {
        id: "explorador",
        name: "Lector Explorador",
        monthlyPrice: "0€",
        annualPrice: "0€",
        description: "Para empezar a organizar tu biblioteca, registrar sesiones y guardar lo que te mueve.",
        cta: "Empezar en beta",
        features: [
            { text: "Biblioteca personal", included: true },
            { text: "Seguimiento de lecturas", included: true },
            { text: "Notas, citas y emociones", included: true },
            { text: "Unirse a clubs públicos", included: true },
            { text: "ADN literario limitado", included: true },
            { text: "Mapas emocionales avanzados", included: false },
            { text: "Crear clubs privados", included: false },
        ],
    },
    {
        id: "voraz",
        name: "Lector Voraz",
        monthlyPrice: "4,99€",
        annualPrice: "47,90€",
        description: "Para profundizar en cada libro, participar en clubs y desbloquear análisis completos.",
        cta: "Reservar beneficio fundador",
        popular: true,
        features: [
            { text: "Todo lo del plan Explorador", included: true },
            { text: "ADN literario ilimitado", included: true },
            { text: "Mapas emocionales completos", included: true },
            { text: "Crear y moderar clubs", included: true },
            { text: "Estadísticas avanzadas", included: true },
            { text: "Sin publicidad", included: true },
            { text: "Asistente literario personal", included: false },
        ],
    },
    {
        id: "ai",
        name: "Bibliófilo AI",
        monthlyPrice: "9,99€",
        annualPrice: "95,90€",
        description: "Para lectores y clubs que quieren análisis asistido, guías y herramientas de profundidad.",
        cta: "Apuntarme a la lista",
        features: [
            { text: "Todo lo del plan Voraz", included: true },
            { text: "Asistente literario personal", included: true },
            { text: "Guías de discusión asistidas", included: true },
            { text: "Sugerencias para clubs", included: true },
            { text: "Soporte prioritario", included: true },
            { text: "Acceso anticipado a novedades", included: true },
        ],
    },
];

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    const handlePlanClick = (planId: PlanId) => {
        if (isLoggedIn) {
            router.push("/app/mi-lectura");
            return;
        }

        router.push(`/register?source=beta&intent=plan-${planId}&plan=${planId}&billing=${isAnnual ? "annual" : "monthly"}`);
    };

    return (
        <Section id="planes" className="bg-[#FFFAEF] pb-14 pt-8 md:py-24">
            <div className="mx-auto mb-8 max-w-3xl space-y-4 px-4 text-center md:mb-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Planes previstos</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Elige cómo quieres vivir tus lecturas
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Durante la beta podrás probar Wordelia y reservar beneficios fundadores antes del lanzamiento
                    público del 15 de julio.
                </p>

                <div className="inline-flex items-center gap-2 rounded-full bg-white p-1.5 text-sm font-semibold shadow-sm">
                    <button
                        type="button"
                        onClick={() => setIsAnnual(false)}
                        className={`rounded-full px-4 py-2 transition-colors ${!isAnnual ? "bg-teal text-white" : "text-grey hover:text-teal"}`}
                    >
                        Mensual
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAnnual(true)}
                        className={`rounded-full px-4 py-2 transition-colors ${isAnnual ? "bg-teal text-white" : "text-grey hover:text-teal"}`}
                    >
                        Anual -20%
                    </button>
                </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-3 md:gap-6">
                {plans.map((plan) => {
                    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                    const period = price === "0€" ? "" : isAnnual ? "/año" : "/mes";

                    return (
                        <article
                            key={plan.id}
                            className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm transition-all md:p-8 ${plan.popular
                                ? "border-coral shadow-xl shadow-coral/10 md:-translate-y-3"
                                : "border-teal/10"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                                    Más elegido
                                </div>
                            )}

                            <div className="mb-5 space-y-3">
                                <h3 className="text-xl font-bold text-teal-dark">{plan.name}</h3>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-bold text-grey-dark">{price}</span>
                                    {period && <span className="pb-1 text-sm text-grey/60">{period}</span>}
                                </div>
                                <p className="text-sm leading-relaxed text-grey/80">{plan.description}</p>
                            </div>

                            <ul className="mb-7 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature.text} className="flex items-start gap-3 text-sm">
                                        <span className={`mt-0.5 rounded-full p-1 ${feature.included ? "bg-teal/10" : "bg-grey/5"}`}>
                                            {feature.included ? (
                                                <Check className="h-3 w-3 text-teal" aria-hidden="true" />
                                            ) : (
                                                <X className="h-3 w-3 text-grey/40" aria-hidden="true" />
                                            )}
                                        </span>
                                        <span className={feature.included ? "text-grey" : "text-grey/40 line-through"}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.popular ? "primary" : "outline"}
                                className="mt-auto w-full"
                                onClick={() => handlePlanClick(plan.id)}
                            >
                                {plan.cta}
                            </Button>
                        </article>
                    );
                })}
            </div>

            <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 rounded-3xl border border-teal/10 bg-white p-5 shadow-sm md:mt-10 md:flex-row md:items-center md:justify-between md:p-8">
                <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Beneficio fundador
                    </div>
                    <h3 className="text-2xl font-bold text-teal-dark">¿Tienes un club, librería o proyecto educativo?</h3>
                    <p className="mt-3 text-sm leading-relaxed text-grey/80 md:text-base">
                        Estamos reservando plazas de beta para grupos que quieran probar clubs guiados, calendario,
                        checkpoints y conversación sin spoilers con acompañamiento directo.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="w-full border-teal/30 text-teal hover:bg-teal hover:text-white md:w-auto"
                    onClick={() => router.push("/contacto?source=beta")}
                >
                    Contactar
                </Button>
            </div>
        </Section>
    );
}

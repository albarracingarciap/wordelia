"use client";

import { useState } from "react";
import { Check, Gift, Sparkles, X, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

// Los IDs (explorador / voraz / ai) se mantienen estables: alimentan el flujo
// de /register y el desbloqueo de recursos (resolveAccess: plan "ai" libera
// guías, "voraz"/"ai" liberan genomas). Solo cambian los textos.
type PlanId = "explorador" | "voraz" | "ai";

const plans: Array<{
    id: PlanId;
    name: string;
    monthlyPrice: string;
    annualPrice: string;
    description: string;
    cta: string;
    popular?: boolean;
    founderClubs: number;
    features: Array<{ text: string; included: boolean }>;
}> = [
    {
        id: "explorador",
        name: "Lector Explorador",
        monthlyPrice: "0€",
        annualPrice: "0€",
        description: "Para empezar a organizar tu biblioteca, registrar sesiones y guardar lo que te mueve.",
        cta: "Empezar gratis",
        founderClubs: 1,
        features: [
            { text: "Biblioteca personal", included: true },
            { text: "Seguimiento de lecturas y rachas", included: true },
            { text: "Notas, citas y emociones", included: true },
            { text: "Unirse a clubs públicos", included: true },
            { text: "Muestra de guía y genoma", included: true },
            { text: "Genomas (ADN) ilimitados", included: false },
            { text: "Crear clubs privados", included: false },
        ],
    },
    {
        id: "voraz",
        name: "Lector Voraz",
        monthlyPrice: "4,99€",
        annualPrice: "47,90€",
        description: "Para profundizar en cada libro, crear tus clubs y desbloquear el ADN literario sin límites.",
        cta: "Reservar beneficio fundador",
        popular: true,
        founderClubs: 2,
        features: [
            { text: "Todo lo del plan Explorador", included: true },
            { text: "Genomas (ADN) ilimitados", included: true },
            { text: "Nuevos genomas cada mes", included: true },
            { text: "Mapas emocionales completos", included: true },
            { text: "Crear y moderar clubs", included: true },
            { text: "Estadísticas avanzadas", included: true },
            { text: "Sin publicidad", included: true },
            { text: "Guías de discusión ilimitadas", included: false },
            { text: "Asistente literario IA", included: false },
        ],
    },
    {
        id: "ai",
        name: "Bibliófilo",
        monthlyPrice: "9,99€",
        annualPrice: "95,90€",
        description: "Acceso total: todas las guías y genomas sin límite, más tu asistente literario con IA.",
        cta: "Reservar beneficio fundador",
        founderClubs: 3,
        features: [
            { text: "Todo lo del plan Voraz", included: true },
            { text: "Guías de discusión ilimitadas", included: true },
            { text: "Genomas (ADN) ilimitados", included: true },
            { text: "Nuevas guías y genomas cada mes", included: true },
            { text: "Asistente literario IA", included: true },
            { text: "Sugerencias para tus clubs", included: true },
            { text: "Acceso anticipado a novedades", included: true },
            { text: "Soporte prioritario", included: true },
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
        <Section id="planes" className="bg-[#D8E2DC] py-16 md:py-24">
            <div className="mx-auto mb-8 max-w-3xl space-y-4 px-4 text-center md:mb-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Planes fundador hasta el 1 de septiembre</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Elige cómo quieres vivir tus lecturas
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Wordelia se lanza al público el 2 de agosto. Regístrate antes del 1 de septiembre y bloquea tu
                    beneficio fundador: participación gratuita en clubs de lectura de Wordelia.
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
                                    <span className="text-4xl font-bold text-teal-dark">{price}</span>
                                    {period && <span className="pb-1 text-sm text-grey/60">{period}</span>}
                                </div>
                                <p className="text-sm leading-relaxed text-grey/80">{plan.description}</p>
                            </div>

                            <div className="mb-5 rounded-2xl border border-coral/20 bg-coral/5 p-3">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-coral">
                                    <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                                    Beneficio fundador
                                </p>
                                <p className="mt-1.5 text-sm font-semibold text-teal-dark">
                                    {plan.founderClubs} {plan.founderClubs === 1 ? "club de lectura gratis" : "clubs de lectura gratis"}
                                </p>
                                <p className="mt-0.5 text-xs leading-relaxed text-grey">Incluye su guía y genoma, para siempre.</p>
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
                <div className="flex items-start gap-4 md:max-w-2xl">
                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral sm:flex">
                        <Building2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            Wordelia para organizaciones
                        </div>
                        <h3 className="text-2xl font-bold text-teal-dark">¿Tienes un club, librería o proyecto educativo?</h3>
                        <p className="mt-3 text-sm leading-relaxed text-grey/80 md:text-base">
                            Licencia guías y genomas para tus socios, gestiona clubs guiados con calendario y
                            checkpoints, y acompaña la lectura sin spoilers. El acceso a los materiales se hereda
                            a los miembros mientras pertenecen al club.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full border-teal/30 text-teal hover:bg-teal hover:text-white md:w-auto md:shrink-0"
                    onClick={() => router.push("/contacto?source=planes-b2b")}
                >
                    Hablar con el equipo
                </Button>
            </div>
        </Section>
    );
}

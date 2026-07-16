"use client";

import { useState } from "react";
import { Sparkles, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";
import { PlanCard } from "../pricing/PlanCard";
import { PLANS, type PlanId } from "@/lib/plans";

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    const handlePlanClick = (planId: PlanId) => {
        const billing = isAnnual ? "annual" : "monthly";

        // El plan gratis no pasa por pago: registro directo (o app si ya entró).
        if (planId === "explorador") {
            router.push(isLoggedIn ? "/app/mi-lectura" : `/register?source=beta&intent=plan-explorador&plan=explorador&billing=${billing}`);
            return;
        }

        // Planes de pago: llevan a la página de checkout con el plan preseleccionado.
        router.push(`/planes?plan=${planId}&billing=${billing}`);
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
                {PLANS.map((plan) => {
                    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                    const period = price === "0€" ? "" : isAnnual ? "/año" : "/mes";

                    return (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            price={price}
                            period={period}
                            action={
                                <Button
                                    variant={plan.popular ? "primary" : "outline"}
                                    className="w-full"
                                    onClick={() => handlePlanClick(plan.id)}
                                >
                                    {plan.cta}
                                </Button>
                            }
                        />
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

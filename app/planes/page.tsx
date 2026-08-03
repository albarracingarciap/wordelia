"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/landing/Navbar";
import { PlanCard } from "@/components/pricing/PlanCard";
import { createClient } from "@/utils/supabase/client";
import { PayPalSubscriptionProvider, PayPalSubscribeButton } from "@/components/payments/PayPalSubscribe";
import { PLANS, type PlanId } from "@/lib/plans";
import { isSubscriptionActive } from "@/lib/subscription-access";
import { isFounderWindowOpen, type FounderWindowLike } from "@/lib/founder-window";

function PlansContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedPlan = searchParams.get("plan");
    const selectedPlan = PLANS.find((plan) => plan.id === preselectedPlan) ?? null;
    const [isAnnual, setIsAnnual] = React.useState(searchParams.get("billing") === "annual");
    const [userId, setUserId] = React.useState<string | null>(null);
    const [authReady, setAuthReady] = React.useState(false);
    // Ventana de fundador (fila pública de app_settings). Por defecto abierta:
    // no ocultamos el beneficio ante un error/lectura transitoria.
    const [founderWindowOpen, setFounderWindowOpen] = React.useState(true);
    // Plan de pago activo del usuario (null = ninguno / plan gratis).
    const [currentPlan, setCurrentPlan] = React.useState<string | null>(null);
    const period: "monthly" | "annual" = isAnnual ? "annual" : "monthly";
    const selectedCardRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const supabase = createClient();
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);
            if (user) {
                const { data: sub } = await supabase
                    .from("user_subscriptions")
                    .select("plan, status, current_period_end")
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (sub && isSubscriptionActive(sub.status, sub.current_period_end)) {
                    setCurrentPlan(sub.plan);
                }
            }
            setAuthReady(true);
        })();
    }, []);

    React.useEffect(() => {
        let active = true;
        const supabase = createClient();
        (async () => {
            const { data } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "founder_window")
                .maybeSingle();
            if (active && data?.value) {
                setFounderWindowOpen(isFounderWindowOpen(data.value as FounderWindowLike));
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    // Al llegar con ?plan=X la página actúa como confirmación: salta al plan elegido.
    React.useEffect(() => {
        if (selectedPlan && selectedCardRef.current) {
            selectedCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [selectedPlan]);

    // Volver: logueado → página anterior (o la app si no hay historial); si no, a la home.
    const handleBack = () => {
        if (!userId) {
            router.push("/");
            return;
        }
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push("/app/mi-lectura");
    };

    return (
        <div className="min-h-[100svh] space-y-16 bg-cream pb-20 pt-[72px]">
            <Navbar minimal />

            <div className="mx-auto max-w-3xl space-y-6 px-4 pt-10 text-center">
                <div className="text-left">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-1 text-sm font-medium text-teal transition-colors hover:text-coral"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Volver
                    </button>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">
                    {selectedPlan
                        ? "Último paso"
                        : founderWindowOpen
                            ? "Planes fundador hasta el 1 de septiembre"
                            : "Nuestros planes"}
                </p>
                <SectionHeader
                    title={selectedPlan ? "Confirma tu plan" : "Elige tu plan"}
                    subtitle={
                        selectedPlan
                            ? `Estás a un paso de suscribirte a ${selectedPlan.name}. Completa el pago para activarlo, o elige otro plan más abajo.`
                            : "Desde la organización esencial hasta el análisis literario más avanzado con Inteligencia Artificial. Cambia o cancela cuando quieras."
                    }
                />

                <div className="flex items-center justify-center gap-4 pt-2">
                    <span className={`text-sm font-medium ${!isAnnual ? "text-teal-dark" : "text-grey/60"}`}>Mensual</span>
                    <button
                        onClick={() => setIsAnnual((current) => !current)}
                        className={`relative h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal/20 ${isAnnual ? "bg-teal" : "bg-grey/30"}`}
                        aria-label="Cambiar entre facturación mensual y anual"
                    >
                        <span
                            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAnnual ? "translate-x-6" : "translate-x-0"}`}
                        />
                    </button>
                    <span className={`text-sm font-medium ${isAnnual ? "text-teal-dark" : "text-grey/60"}`}>
                        Anual <span className="ml-1 text-xs font-bold text-coral">-20%</span>
                    </span>
                </div>
            </div>

            <PayPalSubscriptionProvider>
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-3 md:gap-6">
                    {PLANS.map((plan) => {
                        const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                        const displayPeriod = price === "0€" ? "" : isAnnual ? "/año" : "/mes";
                        const isSelected = selectedPlan?.id === plan.id;
                        const dimmed = Boolean(selectedPlan) && !isSelected;

                        return (
                            <div
                                key={plan.id}
                                ref={isSelected ? selectedCardRef : undefined}
                                className={`relative scroll-mt-28 rounded-3xl transition-all duration-300 ${isSelected ? "ring-2 ring-coral ring-offset-2 ring-offset-cream md:scale-[1.03]" : ""} ${dimmed ? "opacity-60 hover:opacity-100" : ""}`}
                            >
                                {isSelected && (
                                    <span className="absolute -top-3 left-4 z-10 rounded-full bg-coral px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                                        Tu elección
                                    </span>
                                )}
                                <PlanCard
                                    plan={plan}
                                    price={price}
                                    period={displayPeriod}
                                    hidePopularBadge={isSelected}
                                    showFounderBenefit={founderWindowOpen}
                                    action={<PlanAction planId={plan.id} cta={plan.cta} period={period} authReady={authReady} userId={userId} currentPlan={currentPlan} router={router} />}
                                />
                            </div>
                        );
                    })}
                </div>
            </PayPalSubscriptionProvider>

            <div className="mx-auto max-w-3xl border-t border-teal/10 px-4 pt-16 text-center">
                <h3 className="mb-8 text-2xl font-serif text-teal">Preguntas Frecuentes</h3>
                <div className="grid gap-6 text-left">
                    <div className="rounded-xl border border-teal/5 bg-white p-6">
                        <h4 className="mb-2 font-bold text-teal-dark">¿Puedo cambiar de plan en cualquier momento?</h4>
                        <p className="text-sm text-grey/80">Sí, puedes mejorar o cancelar tu suscripción en cualquier momento desde tu perfil.</p>
                    </div>
                    <div className="rounded-xl border border-teal/5 bg-white p-6">
                        <h4 className="mb-2 font-bold text-teal-dark">Las funciones con IA del plan Bibliófilo llevan un asterisco, ¿cuándo estarán disponibles?</h4>
                        <p className="text-sm text-grey/80">
                            Las funciones marcadas con <strong>*</strong> (recomendaciones de lectura con IA, tus estadísticas contadas por IA y las herramientas de club con IA) estarán disponibles en <strong>septiembre de 2026</strong>. Todo lo demás del plan Bibliófilo —guías de discusión y genomas literarios ilimitados, novedades cada mes, acceso anticipado y soporte prioritario— lo tienes desde el primer día. Cuando activemos las funciones de IA se añadirán a tu plan <strong>sin coste adicional</strong> y sin que tengas que hacer nada.
                        </p>
                    </div>
                    {founderWindowOpen && (
                        <div className="rounded-xl border border-teal/5 bg-white p-6">
                            <h4 className="mb-2 font-bold text-teal-dark">¿Qué es el beneficio fundador?</h4>
                            <p className="text-sm text-grey/80">Si te registras antes del 1 de septiembre, obtienes participación gratuita en clubs de lectura de Wordelia (1, 2 o 3 según tu plan) durante 2026, con su guía y genoma para siempre.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CurrentPlanBadge() {
    return (
        <div className="flex h-11 w-full items-center justify-center rounded-xl bg-teal/10 text-sm font-semibold text-teal-dark">
            <Check className="mr-1.5 h-4 w-4" aria-hidden="true" /> Tu plan actual
        </div>
    );
}

function PlanAction({
    planId,
    cta,
    period,
    authReady,
    userId,
    currentPlan,
    router,
}: {
    planId: PlanId;
    cta: string;
    period: "monthly" | "annual";
    authReady: boolean;
    userId: string | null;
    currentPlan: string | null;
    router: ReturnType<typeof useRouter>;
}) {
    // Esperamos a resolver sesión/suscripción para no parpadear entre estados.
    if (!authReady) return <div className="h-11" />;

    const hasActiveSub = currentPlan !== null;
    const isCurrent = currentPlan === planId;

    // Plan gratis.
    if (planId === "explorador") {
        // Logueado: el gratis es una elección accionable, no solo una etiqueta.
        // Sin esto, un usuario recién registrado que aterriza aquí solo veía
        // botones de pago y sentía que estaba obligado a suscribirse.
        if (userId) {
            return (
                <div className="space-y-2">
                    <Button
                        variant={hasActiveSub ? "outline" : "primary"}
                        className="w-full"
                        onClick={() => router.push("/app/mi-lectura")}
                    >
                        {hasActiveSub ? "Ir a la app" : "Empezar gratis"}
                    </Button>
                    {!hasActiveSub && (
                        <p className="text-center text-xs text-grey/60">Es tu plan actual, sin coste.</p>
                    )}
                </div>
            );
        }
        // Sin sesión → registro con el plan gratis preseleccionado.
        return (
            <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/register?source=planes&intent=plan-explorador&plan=explorador`)}
            >
                {cta}
            </Button>
        );
    }

    // Planes de pago, sin sesión: registro/login conservando el plan elegido.
    if (!userId) {
        const next = `/planes?plan=${planId}&billing=${period}`;
        const encodedNext = encodeURIComponent(next);
        return (
            <div className="space-y-2">
                <Link
                    href={`/register?source=planes&intent=plan-${planId}&plan=${planId}&billing=${period}&next=${encodedNext}`}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
                >
                    Crear cuenta y suscribirme
                </Link>
                <p className="text-center text-xs text-grey/70">
                    ¿Ya tienes cuenta?{" "}
                    <Link href={`/login?next=${encodedNext}`} className="font-semibold text-teal hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        );
    }

    // Ya es su plan actual → gestionar, no volver a suscribirse.
    if (isCurrent) {
        return (
            <div className="space-y-2">
                <CurrentPlanBadge />
                <Link href="/app/perfil/suscripcion" className="block text-center text-xs font-semibold text-teal hover:underline">
                    Gestionar suscripción
                </Link>
            </div>
        );
    }

    // Tiene OTRO plan de pago activo → cambiar desde gestión (evita una 2ª suscripción/doble cobro).
    if (hasActiveSub) {
        return (
            <Link
                href="/app/perfil/suscripcion"
                className="flex h-11 w-full items-center justify-center rounded-xl border border-teal text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
            >
                Cambiar a este plan
            </Link>
        );
    }

    // Sin suscripción activa → alta directa.
    return (
        <PayPalSubscribeButton
            productType="user_plan"
            referenceId={planId}
            period={period}
            onSuccess={() => router.push("/app/mi-lectura")}
        />
    );
}

export default function PlansPage() {
    return (
        <Suspense fallback={null}>
            <PlansContent />
        </Suspense>
    );
}

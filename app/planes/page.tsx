"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PricingCard } from "@/components/ui/PricingCard";
import { Navbar } from "@/components/landing/Navbar";
import { createClient } from "@/utils/supabase/client";
import { PayPalProvider, PayPalCheckout } from "@/components/payments/PayPalCheckout";

// Mock data based on proposal
const PLANS = [
    {
        title: "Lector Explorador",
        plan: null as null | "voraz" | "ai",
        price: { monthly: "0€", annual: "0€" },
        description: "Ideal para empezar a organizar tu biblioteca y probar la experiencia Wordelia.",
        buttonText: "Comenzar Gratis",
        variant: "default",
        features: [
            { text: "Biblioteca ilimitada", included: true },
            { text: "Estadísticas básicas", included: true },
            { text: "ADN Literario (3 consultas/mes)", included: true },
            { text: "Unirse a Clubes públicos", included: true },
            { text: "Modo Tienda básico", included: true },
            { text: "Mapas Emocionales", included: false },
            { text: "Crear Clubes privados", included: false },
            { text: "Asistente AI Personal", included: false },
        ]
    },
    {
        title: "Lector Voraz",
        plan: "voraz" as null | "voraz" | "ai",
        price: { monthly: "4.99€", annual: "49€" },
        description: "El estándar para quien ama profundizar en sus lecturas y conectar con otros.",
        buttonText: "Elegir Premium",
        variant: "premium",
        isPopular: true,
        features: [
            { text: "Todo lo del plan Gratuito", included: true },
            { text: "ADN Literario Ilimitado", included: true },
            { text: "Mapas Emocionales de trama", included: true },
            { text: "Crear y moderar Clubes", included: true },
            { text: "Estadísticas Avanzadas", included: true },
            { text: "Sin publicidad", included: true },
            { text: "Asistente AI Personal", included: false },
            { text: "Guías de discusión AI", included: false },
        ]
    },
    {
        title: "Bibliófilo AI",
        plan: "ai" as null | "voraz" | "ai",
        price: { monthly: "9.99€", annual: "99€" },
        description: "Para el usuario que quiere la máxima potencia tecnológica y social.",
        buttonText: "Elegir Pro",
        variant: "pro",
        features: [
            { text: "Todo lo del plan Premium", included: true },
            { text: "Asistente AI Personal (Chat con libros)", included: true },
            { text: "Guías de discusión AI automáticas", included: true },
            { text: "Destaque en perfil y badges", included: true },
            { text: "Acceso anticipado a novedades", included: true },
            { text: "Soporte prioritario", included: true },
        ]
    }
];

export default function PlansPage() {
    const router = useRouter();
    const [isAnnual, setIsAnnual] = React.useState(false);
    const [userId, setUserId] = React.useState<string | null>(null);
    const [authReady, setAuthReady] = React.useState(false);
    const period: "monthly" | "annual" = isAnnual ? "annual" : "monthly";

    React.useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
            setAuthReady(true);
        });
    }, []);

    return (
        <div className="space-y-16 pb-20 pt-[72px]">
            <Navbar />
            <div className="text-center max-w-3xl mx-auto space-y-6 px-4 pt-10">
                <SectionHeader
                    eyebrow="SUSCRIPCIONES"
                    title="Elige tu nivel de profundidad"
                    subtitle="Desde la organización esencial hasta el análisis literario más avanzado con Inteligencia Artificial."
                />

                <div className="flex items-center justify-center gap-4 pt-4">
                    <span className={`text-sm font-medium ${!isAnnual ? "text-teal-dark" : "text-grey/60"}`}>Mensual</span>

                    {/* Simple Toggle Switch */}
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className={`
                            relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal/20
                            ${isAnnual ? "bg-teal" : "bg-grey/30"}
                        `}
                    >
                        <span
                            className={`
                                absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform duration-300
                                ${isAnnual ? "translate-x-6" : "translate-x-0"}
                            `}
                        />
                    </button>

                    <span className={`text-sm font-medium ${isAnnual ? "text-teal-dark" : "text-grey/60"}`}>
                        Anual <span className="text-coral text-xs font-bold ml-1">-20%</span>
                    </span>
                </div>
            </div>

            <PayPalProvider>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                    {PLANS.map((plan, idx) => (
                        <div key={idx} className="flex h-full flex-col gap-3">
                            <PricingCard
                                title={plan.title}
                                price={isAnnual ? plan.price.annual : plan.price.monthly}
                                period={isAnnual ? "/año" : "/mes"}
                                description={plan.description}
                                features={plan.features}
                                buttonText={plan.buttonText}
                                variant={plan.variant as any}
                                isPopular={plan.isPopular}
                            />
                            {plan.plan && (
                                <div className="rounded-2xl border border-teal/10 bg-white p-3">
                                    {!authReady ? (
                                        <div className="h-10" />
                                    ) : userId ? (
                                        <PayPalCheckout
                                            productType="user_plan"
                                            referenceId={plan.plan}
                                            period={period}
                                            onSuccess={() => router.push("/app/mi-lectura")}
                                        />
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="flex h-10 items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
                                        >
                                            Inicia sesión para suscribirte
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </PayPalProvider>

            {/* FAQ Section (Optional placeholder) */}
            <div className="max-w-3xl mx-auto px-4 text-center border-t border-teal/10 pt-16">
                <h3 className="text-2xl font-serif text-teal mb-8">Preguntas Frecuentes</h3>
                <div className="grid gap-6 text-left">
                    <div className="bg-white p-6 rounded-xl border border-teal/5">
                        <h4 className="font-bold text-teal-dark mb-2">¿Puedo cambiar de plan en cualquier momento?</h4>
                        <p className="text-grey/80 text-sm">Sí, puedes mejorar o cancelar tu suscripción en cualquier momento desde tu perfil.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-teal/5">
                        <h4 className="font-bold text-teal-dark mb-2">¿Qué incluye el ADN Literario gratuito?</h4>
                        <p className="text-grey/80 text-sm">El plan gratuito permite visualizar el análisis de 3 libros al mes, o acceso ilimitado a nuestra selección de Clásicos Universales.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

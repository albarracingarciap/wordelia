import { Check, Gift, X } from "lucide-react";
import type { Plan } from "@/lib/plans";

interface PlanCardProps {
    plan: Plan;
    /** Precio ya resuelto para el periodo activo (mensual/anual). */
    price: string;
    /** Sufijo de periodo: "/mes", "/año" o "" para el plan gratis. */
    period: string;
    /** Zona de acción al pie: botón CTA, checkout de PayPal, enlace de login… */
    action: React.ReactNode;
    /** Oculta la píldora "Más elegido" (p. ej. cuando la tarjeta ya muestra "Tu elección"). */
    hidePopularBadge?: boolean;
    /** Muestra la caja "Beneficio fundador". Se oculta cuando la ventana está cerrada. */
    showFounderBenefit?: boolean;
}

/**
 * Tarjeta de plan compartida entre la sección de precios de la home y la página
 * /planes. El contenido (nombre, precio, features, beneficio fundador) es idéntico
 * en ambas superficies; solo cambia `action`, que cada superficie decide.
 */
export function PlanCard({ plan, price, period, action, hidePopularBadge = false, showFounderBenefit = true }: PlanCardProps) {
    return (
        <article
            className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm transition-all md:p-8 ${plan.popular
                ? "border-coral shadow-xl shadow-coral/10 md:-translate-y-3"
                : "border-teal/10"
                }`}
        >
            {plan.popular && !hidePopularBadge && (
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

            {showFounderBenefit && (
                <div className="mb-5 rounded-2xl border border-coral/20 bg-coral/5 p-3">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-coral">
                        <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                        Beneficio fundador
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-teal-dark">
                        {plan.founderClubs} {plan.founderClubs === 1 ? "club de lectura gratis" : "clubs de lectura gratis"} durante 2026
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-grey">Incluye su guía y genoma, para siempre.</p>
                </div>
            )}

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

            {plan.footnote && (
                <p className="mb-5 -mt-3 text-xs leading-relaxed text-grey/55">{plan.footnote}</p>
            )}

            <div className="mt-auto">{action}</div>
        </article>
    );
}

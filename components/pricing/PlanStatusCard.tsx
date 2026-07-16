import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Tarjeta persistente de "tu plan" con CTA de mejora. Se alimenta del plan activo
 * (null = Explorador gratis, "voraz", "ai"). No se muestra en el plan máximo ("ai"),
 * donde ya no hay nada que mejorar.
 */
export function PlanStatusCard({ plan }: { plan: string | null }) {
    if (plan === "ai") return null;

    const isVoraz = plan === "voraz";
    const currentName = isVoraz ? "Lector Voraz" : "Lector Explorador";
    const href = isVoraz ? "/planes?plan=ai" : "/planes";
    const ctaLabel = isVoraz ? "Mejorar a Bibliófilo" : "Mejorar plan";
    const pitch = isVoraz
        ? "Añade guías de discusión ilimitadas y tu asistente literario con IA."
        : "Desbloquea genomas ilimitados, mapas emocionales y crea tus propios clubs.";

    return (
        <section className="order-0">
            <div className="rounded-2xl border border-coral/20 bg-coral/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-grey/40">Tu plan</p>
                <p className="mt-1 text-sm font-bold text-teal-dark">{currentName}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-grey/70">{pitch}</p>
                <Link
                    href={href}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-coral px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#C25852]"
                >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {ctaLabel}
                </Link>
            </div>
        </section>
    );
}

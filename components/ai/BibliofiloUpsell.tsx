import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Gancho de las funciones con IA para quien no tiene el plan Bibliófilo: se
 * muestra la función (qué haría por él) con un acceso a /planes, en lugar de
 * ocultarla. Solo para reason "requires_plan" (con la IA encendida).
 */
export function BibliofiloUpsell({ description, compact = false }: { description: string; compact?: boolean }) {
    return (
        <div className={`flex flex-col gap-3 ${compact ? "py-1 text-center" : "py-1 sm:flex-row sm:items-center sm:justify-between"}`}>
            <p className="text-sm text-grey/70">{description}</p>
            <Link
                href="/planes"
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 self-center rounded-full border border-coral/30 bg-coral/5 px-4 py-2 text-xs font-bold text-coral transition-colors hover:bg-coral/10 ${compact ? "" : "sm:self-auto"}`}
            >
                <Sparkles className="h-3.5 w-3.5" /> Disponible en Bibliófilo
            </Link>
        </div>
    );
}

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function ClubsCTA() {
    return (
        <div className="rounded-3xl bg-gradient-to-br from-grey/5 to-teal/5 p-8 text-center md:p-12">
            <h2 className="mb-4 text-3xl text-teal md:text-4xl">
                ¿Listo para unirte a la conversación?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-grey/70">
                Regístrate antes del 1 de septiembre y participa gratis en clubs de lectura de Wordelia
                durante 2026 —1, 2 o 3 según tu plan—, con su guía y su genoma para siempre.
            </p>

            <div className="mx-auto mb-8 grid max-w-3xl gap-6 sm:grid-cols-3">
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-teal" aria-hidden="true" />
                    <p className="text-sm text-grey/70">Guías de discusión por checkpoints</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-teal" aria-hidden="true" />
                    <p className="text-sm text-grey/70">Conversaciones sin spoilers</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-teal" aria-hidden="true" />
                    <p className="text-sm text-grey/70">Registro de emociones de lectura</p>
                </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                    href="/register?source=clubes"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-coral px-8 font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852]"
                >
                    Empezar
                </Link>
                <Link
                    href="/planes"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-teal/30 px-8 font-semibold text-teal transition-all hover:bg-teal/5"
                >
                    Ver planes
                </Link>
            </div>
        </div>
    );
}

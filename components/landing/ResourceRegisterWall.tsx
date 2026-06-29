import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

type ResourceRegisterWallProps = {
    kind: "guide" | "genome";
    bookTitle?: string;
};

const copy = {
    guide: {
        eyebrow: "Sigue leyendo gratis",
        title: "Regístrate para ver la guía completa",
        unlocks: [
            "Las 5 rutas de discusión con sus preguntas analíticas",
            "Preguntas poderosas, tarjetas de personajes y símbolos",
            "Lecturas del final, actividades y notas del moderador",
        ],
        source: "demo-guia",
    },
    genome: {
        eyebrow: "Sigue explorando gratis",
        title: "Regístrate para ver el genoma completo",
        unlocks: [
            "Los 8 cromosomas literarios al detalle",
            "Perfil emocional, ADN de personajes y composición de temas",
            "Ritmo, densidad, estilo y contexto cultural de la obra",
        ],
        source: "demo-adn",
    },
} as const;

export function ResourceRegisterWall({ kind, bookTitle }: ResourceRegisterWallProps) {
    const content = copy[kind];

    return (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-teal/10 bg-teal p-7 text-white shadow-xl md:p-10">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-cream/30 bg-cream/15 text-cream">
                        <LockKeyhole className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cream">{content.eyebrow}</p>
                    <h2 className="mt-3 text-3xl leading-tight text-white md:text-4xl">{content.title}</h2>
                    {bookTitle && (
                        <p className="mt-2 text-base text-white/80">
                            Estás viendo una muestra gratuita de <strong className="text-cream">{bookTitle}</strong>.
                        </p>
                    )}

                    <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
                        {content.unlocks.map((item) => (
                            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-cream" aria-hidden="true" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={`/register?source=${content.source}`}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-7 font-semibold text-white shadow-sm shadow-coral/20 transition-colors hover:bg-[#C25852]"
                        >
                            Crear cuenta gratis
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 px-7 font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            Ya tengo cuenta
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

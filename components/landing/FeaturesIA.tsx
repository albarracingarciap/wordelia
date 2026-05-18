import Image from "next/image";
import Link from "next/link";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

const features = [
    {
        title: "Checkpoints",
        kicker: "Ritmo sin spoilers",
        description: "Divide cada lectura en tramos claros para saber dónde estás y conversar solo sobre lo que ya has leído.",
        icon: "/assets/icons/icono_1.png",
    },
    {
        title: "Mapas emocionales",
        kicker: "Lo que el libro provoca",
        description: "Registra asombro, dudas, esperanza o tensión y mira cómo evoluciona el pulso de tu lectura.",
        icon: "/assets/icons/icono_2.png",
    },
    {
        title: "Guías de discusión",
        kicker: "Conversaciones con intención",
        description: "Preguntas por tramo para activar debates cuidados, con contexto y sin adelantar revelaciones.",
        icon: "/assets/icons/icono_3.png",
    },
    {
        title: "Asistente literario",
        kicker: "ADN de la obra",
        description: "Explora estructura, símbolos, personajes y estilo para volver al libro con más capas de lectura.",
        icon: "/assets/icons/icono_4.png",
    },
];

export function FeaturesIA() {
    return (
        <Section id="ia-literaria" className="bg-cream py-16 md:py-24">
            <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center md:mb-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-coral">Experiencia lectora 360°</p>
                <h2 className="text-3xl leading-tight text-teal md:text-5xl">
                    Herramientas para leer mejor, no más rápido
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-grey md:text-lg">
                    Wordelia combina seguimiento, notas, clubs y análisis literario para que cada libro tenga contexto,
                    memoria y conversación a su ritmo.
                </p>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className="group flex items-center gap-4 rounded-2xl border border-teal/5 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:border-teal/20 hover:shadow-lg sm:flex-col sm:items-center sm:p-6 sm:text-center"
                    >
                        <div className="relative h-16 w-16 shrink-0 sm:mb-2 sm:h-24 sm:w-24">
                            <Image
                                src={feature.icon}
                                alt={feature.title}
                                fill
                                className="object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral/80">
                                {feature.kicker}
                            </p>
                            <h3 className="text-xl font-semibold text-teal">{feature.title}</h3>
                            <p className="text-sm leading-relaxed text-grey">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mx-auto max-w-2xl space-y-6 text-center">
                <p className="text-sm font-medium text-grey md:text-base">
                    En la beta vamos a pulir estas herramientas con lectores fundadores: más calma, mejor memoria
                    y conversaciones sin spoilers.
                </p>
                <Link href="/demo">
                    <Button className="shadow-coral/20">
                        Ver una demo
                    </Button>
                </Link>
            </div>
        </Section>
    );
}

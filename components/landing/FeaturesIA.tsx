import Image from "next/image";
import Link from "next/link";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

export function FeaturesIA() {
    const features = [
        {
            title: "Checkpoints",
            description: "que identifican momentos cruciales de la narrativa, el ritmo natural de cada historia.",
            icon: "/assets/icons/icono_1.png",
        },
        {
            title: "Mapas emocionales",
            description: "que capuran el pulso emocional de tu lectura y que revelan la magia de cada libro.",
            icon: "/assets/icons/icono_2.png",
        },
        {
            title: "Guías de discusión",
            description: "adaptativas, por capas y personalizadas que descubren conexiones temáticas.",
            icon: "/assets/icons/icono_3.png",
        },
        {
            title: "Asistente literario",
            description: "que analiza una obra pra revelarte todo su ADN, estructura, ritmo, personajes, estilo, y mucho más.",
            icon: "/assets/icons/icono_4.png",
        },
    ];

    return (
        <Section id="ia-literaria" className="bg-cream">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                <h2 className="text-3xl md:text-4xl font-serif text-teal">
                    Herramientas que enriquecen tu experiencia lectora
                </h2>
                <p className="text-base text-grey leading-relaxed max-w-xl mx-auto">
                    Desarrolladas por lectores apasionados. Wordelia, una plataforma que amplifica tu experiencia lectora con una visión 360º de tus obras favoritas
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="group p-6 rounded-2xl bg-white border border-teal/5 hover:border-teal/20 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center space-y-4"
                    >
                        <div className="w-24 h-24 relative mb-2">
                            <Image
                                src={feature.icon}
                                alt={feature.title}
                                fill
                                className="object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <h3 className="text-xl font-semibold text-teal">{feature.title}</h3>
                        <p className="text-sm text-grey leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="text-center space-y-6">
                <p className="text-grey font-medium">
                    Una vivencia compartida única. Mas conversación, nuevos matices y control de spoilers
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

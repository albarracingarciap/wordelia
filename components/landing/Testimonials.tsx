"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";

type Tab = "Lectores" | "Clubs";

interface TestimonialItem {
    text: string;
    author: string;
    role: string;
    badges: string[];
    location?: string;
}

export function Testimonials() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<Tab>("Lectores");

    const testimonials: Record<Tab, TestimonialItem[]> = {
        Lectores: [
            {
                text: "Antes me costaba mantener el hábito. Con ‘Mi lectura’ y las notas, leer volvió a sentirse mío.",
                author: "Laura",
                role: "Lectora",
                badges: ["Mi lectura", "Notas"],
            },
            {
                text: "Me encanta poder leer a mi ritmo sin miedo a spoilers. Las guías me ayudan a fijarme en detalles.",
                author: "Daniel",
                role: "Lector",
                badges: ["Guías sin spoilers", "Análisis literario"],
            },
            {
                text: "Las estadísticas son suaves, no te presionan. Solo te acompañan. Y eso cambia todo.",
                author: "Marta",
                role: "Lectora",
                badges: ["Mi lectura", "Estadísticas"],
            },
            {
                text: "El mapa emocional me ayudó a entender por qué ciertas partes me golpeaban más. Fue bonito.",
                author: "Irene",
                role: "Lectora",
                badges: ["Mapa emocional", "Diario"],
            },
        ],
        Clubs: [
            {
                text: "Nuestro club se quedaba en ‘me gustó/no me gustó’. Con checkpoints, la conversación ganó profundidad.",
                author: "Sergio",
                role: "Moderador de club",
                location: "Club de 12 personas",
                badges: ["Checkpoints", "Guías de discusión"],
            },
            {
                text: "La guía por capítulos nos dio estructura sin hacerlo rígido. Cada sesión salió natural.",
                author: "Paula",
                role: "Moderadora",
                badges: ["Guías de discusión", "Ritmo"],
            },
            {
                text: "El control de spoilers es oro. Nadie se corta por miedo y nadie se arruina el libro.",
                author: "Nuria",
                role: "Club de lectura",
                badges: ["Sin spoilers", "Moderación"],
            },
            {
                text: "El ADN del libro nos dio temas y símbolos para debatir sin sentirnos ‘en clase’. Muy disfrutable.",
                author: "Álex",
                role: "Moderador",
                badges: ["ADN del libro", "Análisis literario"],
            },
        ],
    };

    return (
        <Section id="testimonios" className="bg-[#D8E2DC]">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-3xl md:text-4xl font-serif text-teal mb-3 flex flex-col items-center gap-4">
                    <span>Lo que nuestros lectores opinan de</span>
                    <div className="relative w-80 h-20">
                        <Image
                            src="/assets/images/logo_wordelia.png"
                            alt="Wordelia"
                            fill
                            className="object-contain"
                        />
                    </div>
                </h2>
                <p className="text-sm md:text-base text-grey leading-relaxed">
                    Historias que disfrutamos en compañía. Apreciando cada detalle
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-12">
                <div className="inline-flex bg-white rounded-full p-1 border border-black/5 shadow-sm">
                    {(["Lectores", "Clubs"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === tab
                                ? "bg-teal/10 text-teal-dark shadow-sm"
                                : "text-grey hover:text-teal hover:bg-cream"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {testimonials[activeTab].map((item, idx) => (
                    <div
                        key={idx}
                        className="bg-offwhite rounded-2xl p-6 md:p-8 border border-teal/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full animate-fade-in"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-cream border border-teal/10 flex items-center justify-center text-teal font-serif font-bold text-lg">
                                {item.author[0]}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-teal">{item.author}</p>
                                <p className="text-xs text-grey">
                                    {item.role} {item.location && `· ${item.location}`}
                                </p>
                            </div>
                        </div>

                        {/* Quote */}
                        <blockquote className="text-lg text-grey leading-relaxed mb-6 flex-grow italic">
                            "{item.text}"
                        </blockquote>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-auto mb-3">
                            {item.badges.map(badge => (
                                <span key={badge} className="px-2.5 py-1 rounded-md bg-white border border-black/5 text-xs text-teal font-medium">
                                    {badge}
                                </span>
                            ))}
                        </div>

                        {/* Stars */}
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-coral text-sm">★</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer CTA */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                    <Button
                        className="rounded-full px-8 shadow-coral/20"
                        onClick={() => router.push(isLoggedIn ? "/app/mi-lectura" : "/login")}
                    >
                        Empezar gratis
                    </Button>
                    <Link href="/clubes" className="text-teal font-medium hover:underline">
                        Explorar clubs
                    </Link>
                </div>
            </div>
        </Section>
    );
}

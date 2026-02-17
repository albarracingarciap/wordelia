"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Section } from "../ui/Section";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal"; // Import Modal
import { useAuth } from "@/contexts/AuthContext";

// Define Club type for better type safety
interface Club {
    title: string;
    book: string;
    author: string;
    cover: string;
    pace: string;
    status: string;
    badges: string[];
    description: string;
    hookQuestion: string; // New field
}

export function ClubsGrid() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    // State for modal
    const [selectedClub, setSelectedClub] = React.useState<Club | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleProtectedAction = (action: () => void) => {
        if (isLoggedIn) {
            action();
        } else {
            router.push("/login"); // Redirect to login page
        }
    };

    const handleClubClick = (club: Club) => {
        if (isLoggedIn) {
            // Navigate to actual club page (mock path for now)
            router.push(`/app/clubs/mock-id`);
        } else {
            setSelectedClub(club);
            setIsModalOpen(true);
        }
    };

    const clubs: Club[] = [
        {
            title: "Mundo Distópico",
            book: "Fahrenheit 451",
            author: "Ray Bradbury",
            cover: "/assets/images/fahrenheit_451.jpg",
            pace: "80 pág/semana",
            status: "Quedan 12 plazas",
            badges: ["ADN del libro", "Guía por capítulos"],
            description: "Una odisea de despertar intelectual que desafía la censura y celebra el poder transformador de un libro",
            hookQuestion: "¿Por qué crees que Montag se sintió tan perturbado por la mujer que decidió arder con sus libros?",
        },
        {
            title: "Resistencia Psicológica",
            book: "1984",
            author: "George Orwell",
            cover: "/assets/images/1984_Orwell.jpg",
            pace: "100 pág/semana",
            status: "Empieza lunes",
            badges: ["Mapa emocional", "Sin spoilers"],
            description: "La obra definitiva sobre totalistarismo y vigilancia que ha definido nuestros miedos colectivos",
            hookQuestion: "¿El 'doblepensar' de Winston es una estrategia de supervivencia consciente o la prueba de que ya ha perdido la cordura?",
        },
        {
            title: "Justicia Social",
            book: "Matar a un ruiseñor",
            author: "Harper Lee",
            cover: "/assets/images/rui_harper_lee.jpg",
            pace: "60 pág/semana",
            status: "Grupo pequeño",
            badges: ["Debate", "Contexto histórico"],
            description: "Una conmovedora exploración de la justicia, la empatía y el coraje moral frante a la intolerancia",
            hookQuestion: "¿Crees que la verdadera valentía es la de Atticus enfrentando al pueblo o la de la Sra. Dubose luchando contra su adicción?",
        },
        {
            title: "Alegoría Social",
            book: "Ensayo sobre la ceguera",
            author: "José Saramago",
            cover: "/assets/images/ensayo_saramago.jpg",
            pace: "70 pág/semana",
            status: "Nivel alto",
            badges: ["Análisis", "Simbología"],
            description: "La parábola más perturbadora de Saramago sobre cómo en la oscuridad vemos quienes realmente somos",
            hookQuestion: "¿Es la 'ceguera blanca' una enfermedad física contagiosa o una metáfora de nuestra incapacidad para ver realmente al otro?",
        },
    ];

    return (
        <Section id="clubs" className="bg-[#D8E2DC]">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-serif text-teal mb-4">
                    Empieza hoy mismo y disfruta de uno de nuestros clubs de lectura
                </h2>
                <p className="text-sm md:text-base text-grey leading-relaxed">
                    Herramientas que cobran vida en conversaciones cuidadas y ritmos compartidos. Emociones, análisis, simbología
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {clubs.map((club, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col bg-offwhite hover:bg-white rounded-2xl p-4 border border-teal/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Header: Title & Book */}
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-teal line-clamp-1">{club.title}</h3>
                            <p className="text-sm text-grey">Libro: {club.book}</p>
                        </div>

                        {/* Book Cover with Tooltip */}
                        <div className="relative group/cover w-full aspect-[2/3] mb-4 rounded-lg overflow-hidden shadow-inner bg-grey/10 cursor-help">
                            <Image
                                src={club.cover}
                                alt={`Portada de ${club.book}`}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-500"
                            />
                            {/* Tooltip */}
                            <div className="absolute inset-0 bg-teal/90 p-4 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300">
                                <p className="text-white text-xs md:text-sm font-medium text-center leading-relaxed">
                                    {club.description}
                                </p>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {club.badges.map((badge) => (
                                <span
                                    key={badge}
                                    className="px-2 py-1 rounded-md bg-cream text-[10px] font-semibold text-teal border border-teal/10 uppercase tracking-wide"
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>

                        {/* Meta Info */}
                        <div className="mt-auto space-y-4">
                            <div className="flex items-center justify-between text-xs text-grey font-medium border-t border-black/5 pt-3">
                                <span className="flex items-center gap-1">
                                    📖 {club.pace}
                                </span>
                                <span className="text-coral">{club.status}</span>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    fullWidth
                                    className="text-sm"
                                    onClick={() => handleClubClick(club)}
                                >
                                    Ver detalles
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom CTA */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => router.push("/app/explorar")}
                    >
                        Ver todos los clubs
                    </Button>
                    <Button
                        onClick={() => handleProtectedAction(() => router.push("/app/clubs/crear"))}
                    >
                        Crear un club
                    </Button>
                </div>
            </div>

            {/* Sneak Peek Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                size="lg"
                title=""
                className="bg-cream"
            >
                {selectedClub && (
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar: Book Info */}
                        <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-teal/10 pb-6 md:pb-0 md:pr-6">
                            <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-md mb-4 rotate-2 transform hover:rotate-0 transition-all">
                                <Image
                                    src={selectedClub.cover}
                                    alt={`Portada de ${selectedClub.book}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="text-lg font-serif text-teal font-bold">{selectedClub.book}</h3>
                            <p className="text-sm text-grey/80 mb-4">{selectedClub.author}</p>

                            <div className="w-full bg-white p-3 rounded-lg border border-teal/5 shadow-sm text-left">
                                <p className="text-xs font-bold text-teal uppercase tracking-widest mb-2">Cronograma</p>
                                <div className="space-y-3 relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-grey/10"></div>

                                    <div className="relative flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-teal z-10 ring-2 ring-white"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-grey">Semana 1 (Completado)</p>
                                            <p className="text-[10px] text-grey/60">Caps. 1-5</p>
                                        </div>
                                    </div>
                                    <div className="relative flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-coral animate-pulse z-10 ring-2 ring-white"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-coral">Semana 2 (En curso)</p>
                                            <p className="text-[10px] text-coral/80">Caps. 6-10 • Conversación activa</p>
                                        </div>
                                    </div>
                                    <div className="relative flex items-center gap-3 opacity-50">
                                        <div className="w-3 h-3 rounded-full bg-grey/20 z-10 ring-2 ring-white"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-grey">Semana 3</p>
                                            <p className="text-[10px] text-grey/60">Caps. 11-15</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Discussion Sneak Peek */}
                        <div className="w-full md:w-2/3 flex flex-col relative">


                            <div className="mb-6">
                                <div className="inline-block px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full mb-3">
                                    Pregunta de la semana
                                </div>
                                <h4 className="text-xl md:text-2xl font-serif text-teal-dark font-medium leading-snug">
                                    "{selectedClub.hookQuestion}"
                                </h4>
                            </div>

                            {/* Blurred Conversation */}
                            <div className="space-y-4 relative flex-grow overflow-hidden">
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-cream/60 to-cream">
                                    <Button
                                        size="lg"
                                        className="shadow-xl transform hover:scale-105 transition-all"
                                        onClick={() => router.push("/register")}
                                    >
                                        Desbloquear conversación
                                    </Button>
                                    <p className="mt-3 text-xs text-grey font-medium">Únete a {selectedClub.status.toLowerCase()} para ver las respuestas</p>
                                </div>

                                {/* Mock User 1 */}
                                <div className="flex gap-3 filter blur-[3px] select-none opacity-60">
                                    <div className="w-8 h-8 rounded-full bg-grey/20"></div>
                                    <div className="bg-white p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl text-sm border border-grey/10 w-3/4">
                                        Para mí fue claramente imprudencia. No consideró las consecuencias que tendría para su familia.
                                    </div>
                                </div>

                                {/* Mock User 2 */}
                                <div className="flex gap-3 flex-row-reverse filter blur-[3px] select-none opacity-60">
                                    <div className="w-8 h-8 rounded-full bg-teal/20"></div>
                                    <div className="bg-teal/5 p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl text-sm border border-teal/10 w-3/4 text-teal-dark">
                                        ¡Discrepo totalmente! El contexto histórico no le dejaba otra opción. Fue un acto heroico.
                                    </div>
                                </div>

                                {/* Mock User 3 */}
                                <div className="flex gap-3 filter blur-[3px] select-none opacity-40">
                                    <div className="w-8 h-8 rounded-full bg-coral/20"></div>
                                    <div className="bg-white p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl text-sm border border-grey/10 w-2/3">
                                        Me fijé en el simbolismo del pájaro en esa misma página...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Section>
    );
}

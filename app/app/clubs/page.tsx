"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

import { ClubCard } from "@/components/clubs/ClubCard";
import { JoinClubModal } from "@/components/clubs/JoinClubModal";
import { ClubFilters } from "@/components/clubs/ClubFilters";

// MOCKS
const MY_CLUBS = [
    {
        id: "c1",
        name: "Lectura Calmada",
        description: "Un espacio para leer sin prisas.",
        currentBook: { title: "Seda", author: "Alessandro Baricco", coverUrl: "/assets/images/book_cover_3.png" },
        members: [{ fallback: "A" }, { fallback: "M" }, { fallback: "J" }],
        memberCount: 12,
        badges: [{ label: "Sin spoilers" }],
        pace: "2 cap/semana",
        nextMilestone: "Sess. Dom 19h",
        isMember: true,
        isAdmin: true
    },
    {
        id: "c2",
        name: "Sci-Fi Classics",
        description: "Explorando los clásicos del género.",
        currentBook: { title: "Dune", author: "Frank Herbert", coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg" }, // External placeholder or use local abstract
        members: [{ fallback: "R" }, { fallback: "K" }],
        memberCount: 45,
        badges: [{ label: "Nivel: Intermedio" }],
        pace: "Semanal",
        isMember: true
    }
];

const EXPLORE_FEATURED = [
    {
        id: "c3",
        name: "Los Lunes al Sol",
        description: "Empezamos la semana con energía y buenas letras.",
        currentBook: { title: "El infinito en un junco", author: "Irene Vallejo", coverUrl: "/assets/images/book_cover_2.png" },
        members: [{ fallback: "S" }, { fallback: "L" }, { fallback: "P" }],
        memberCount: 128,
        badges: [{ label: "Ensayo" }, { label: "Debate" }],
        pace: "Mensual",
        featured: true
    }
];

const EXPLORE_SOON = [
    {
        id: "c4",
        name: "Misterio en la Mansión",
        currentBook: { title: "Diez negritos", author: "Agatha Christie", coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1638425585i/16299.jpg" },
        members: [{ fallback: "X" }],
        memberCount: 8,
        badges: [{ label: "Novela negra" }],
        pace: "Rápido",
        nextMilestone: "Empieza en 3d"
    },
    {
        id: "c5",
        name: "Jane Austen Book Club",
        currentBook: { title: "Orgullo y Prejuicio", author: "Jane Austen", coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg" },
        members: [{ fallback: "E" }, { fallback: "L" }],
        memberCount: 320,
        badges: [{ label: "Romance" }, { label: "Clásicos" }],
        pace: "Semanal",
        nextMilestone: "Empieza mañana"
    }
];


export default function ClubsPage() {
    const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
    const router = useRouter(); // Import useRouter

    return (
        <div className="pb-20">
            <SectionHeader
                eyebrow="CLUBS"
                title="Clubs de lectura"
                subtitle="Conversaciones cuidadas, a tu ritmo (y sin spoilers)."
                action={{
                    label: "Crear un club",
                    onClick: () => router.push("/app/clubs/crear"),
                    variant: "primary"
                }}
                secondaryAction={{
                    label: "Unirme con código",
                    onClick: () => setIsJoinModalOpen(true),
                    variant: "ghost"
                }}
            >
            </SectionHeader>

            <JoinClubModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />

            <Tabs defaultValue="my-clubs" className="mt-6">
                <TabsList className="mb-6">
                    <TabsTrigger value="my-clubs">Tus clubs</TabsTrigger>
                    <TabsTrigger value="explore">Explorar</TabsTrigger>
                </TabsList>

                {/* TAB 1: MY CLUBS */}
                <TabsContent value="my-clubs" className="space-y-12">
                    <section>
                        <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-6">Activos</h3>
                        {MY_CLUBS.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {MY_CLUBS.map(club => (
                                    <ClubCard key={club.id} {...club} />
                                ))}
                                {/* Add New Card Placeholder */}
                                <button className="flex flex-col items-center justify-center border-2 border-dashed border-teal/10 rounded-xl p-6 h-full min-h-[280px] hover:bg-teal/5 hover:border-teal/30 transition-all group" onClick={() => router.push("/app/clubs/crear")}>
                                    <span className="w-12 h-12 rounded-full bg-teal/10 text-teal flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">+</span>
                                    <span className="font-serif text-teal font-medium">Crear nuevo club</span>
                                </button>
                            </div>
                        ) : (
                            <EmptyState
                                title="Tu próxima conversación empieza aquí"
                                description="Explora clubs que ya están leyendo o crea uno con tu gente."
                                actionLabel="Explorar clubs"
                                onAction={() => document.getElementById("tab-explore")?.click()} // Simple hack or use tab state
                            />
                        )}
                    </section>

                    <section>
                        <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-4 flex items-center gap-2 cursor-pointer hover:text-teal">
                            <span>Archivados</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </h3>
                        {/* Collapsed content would go here */}
                    </section>
                </TabsContent>

                {/* TAB 2: EXPLORE */}
                <TabsContent value="explore">
                    <ClubFilters />

                    <div className="space-y-12 mt-8">
                        {/* Featured */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-serif text-xl text-teal">Destacados para ti</h3>
                                    <p className="text-sm text-grey/60">Por tus gustos y tu ritmo</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {EXPLORE_FEATURED.map(club => (
                                    <ClubCard key={club.id} {...club} />
                                ))}
                            </div>
                        </section>

                        {/* Starting Soon */}
                        <section>
                            <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-6">Empiezan pronto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {EXPLORE_SOON.map(club => (
                                    <ClubCard key={club.id} {...club} />
                                ))}
                            </div>
                        </section>

                        {/* Themes (Horizontal Scroll) */}
                        <section>
                            <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-6">Clásicos con calma</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                                {/* Mock replicas for scrolling */}
                                {[...EXPLORE_SOON, ...EXPLORE_FEATURED].map((club, i) => (
                                    <div key={i} className="min-w-[280px] md:min-w-[300px]">
                                        <ClubCard {...club} id={`theme-${i}`} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Final CTA */}
                        <section className="py-8">
                            <Card className="bg-gradient-to-r from-teal/5 to-coral/5 text-center py-8 border-none">
                                <h3 className="font-serif text-lg text-teal mb-2">¿No encuentras el tuyo?</h3>
                                <p className="text-sm text-grey/60 mb-6">Crea uno en 1 minuto y lee con tu gente.</p>
                                <Button variant="primary" onClick={() => router.push("/app/clubs/crear")}>Crear un club</Button>
                            </Card>
                        </section>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

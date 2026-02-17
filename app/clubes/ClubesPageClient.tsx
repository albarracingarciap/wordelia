"use client";

import { OfficialClub } from "./actions";
import { useState } from "react";
import { ClubsHero } from "@/components/clubes/ClubsHero";
import { FeaturedClub } from "@/components/clubes/FeaturedClub";
import { OfficialClubCard } from "@/components/clubes/OfficialClubCard";
import { ClubPreviewModal } from "@/components/clubes/ClubPreviewModal";
import { ClubsCTA } from "@/components/clubes/ClubsCTA";

interface ClubesPageClientProps {
    featuredClub: OfficialClub | null;
    regularClubs: OfficialClub[];
}

export default function ClubesPageClient({ featuredClub, regularClubs }: ClubesPageClientProps) {
    const [selectedClub, setSelectedClub] = useState<OfficialClub | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClubClick = (club: OfficialClub) => {
        setSelectedClub(club);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedClub(null), 300); // Delay to allow animation
    };

    return (
        <>
            <div className="space-y-12 animate-fade-in">
                {/* Hero Section */}
                <ClubsHero />

                {/* Featured Club (Club del Mes) */}
                {featuredClub && (
                    <section>
                        <FeaturedClub
                            club={featuredClub}
                            onViewDetails={() => handleClubClick(featuredClub)}
                        />
                    </section>
                )}

                {/* Regular Clubs Grid */}
                {regularClubs.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-serif text-grey mb-6">
                            Clubs Oficiales
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {regularClubs.map((club) => (
                                <OfficialClubCard
                                    key={club.id}
                                    club={club}
                                    onClick={() => handleClubClick(club)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA Section */}
                <ClubsCTA />
            </div>

            {/* Preview Modal */}
            <ClubPreviewModal
                club={selectedClub}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </>
    );
}

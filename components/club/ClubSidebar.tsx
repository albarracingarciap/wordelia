import * as React from "react";
import { Card } from "../ui/Card";
import { AvatarStack } from "../ui/AvatarStack";
import Image from "next/image";
import { Button } from "../ui/Button";
import { BookDetailsModal } from "./BookDetailsModal";
import { MembersListModal } from "./MembersListModal";
import { PollWidget } from "./polls/PollWidget";
// import { CreatePollModal } from "./polls/CreatePollModal"; // Moved to Dashboard
// import { createPoll } from "@/app/app/clubs/[id]/actions"; // Moved to Dashboard

interface ClubSidebarProps {
    club?: any;
    activePoll?: any;
    onOpenCreatePoll?: () => void;
}

export function ClubSidebar({ club, activePoll, onOpenCreatePoll }: ClubSidebarProps) {
    const memberCount = club?.memberCount || 0;
    const members = club?.members || [];
    const hasActiveBook = !!club?.currentBook;
    const currentBook = club?.currentBook?.book;

    // Permission: Only admin/moderator can create poll
    // Assuming club has userRole property populated by getClubDetails
    const canCreatePoll = club?.userRole === 'admin' || club?.userRole === 'moderator';

    const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);

    // WIDGETS

    const BookWidget = () => (
        <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
            <div className="relative h-48 bg-grey/10">
                {currentBook?.cover_url ? (
                    <>
                        <Image
                            src={currentBook.cover_url}
                            alt="Cover"
                            fill
                            className="object-cover blur-md opacity-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-24 h-36 shadow-lg rounded overflow-hidden">
                                <Image src={currentBook.cover_url} alt="Cover" fill className="object-cover" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-grey/40">
                        Sin imagen
                    </div>
                )}
            </div>
            <div className="p-4 text-center">
                <h3 className="font-serif font-bold text-lg text-grey-dark">{currentBook?.title || "Libro Desconocido"}</h3>
                <p className="text-sm text-grey/60 mb-4">{currentBook?.authors?.name || "Autor Desconocido"}</p>
                <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setIsBookModalOpen(true)}>Ver ficha</Button>
                </div>
            </div>

            {/* Reusing existing modal logic from original sidebar if possible, or adapting book data */}
            {currentBook && (
                <BookDetailsModal
                    isOpen={isBookModalOpen}
                    onClose={() => setIsBookModalOpen(false)}
                    book={{
                        title: currentBook.title,
                        author: currentBook.authors?.name || "Autor",
                        coverUrl: currentBook.cover_url,
                        pages: currentBook.page_count,
                        synopsis: currentBook.description
                    }}
                />
            )}
        </div>
    );

    const ReadersWidget = () => (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-grey-dark">Lectores</h4>
                <span className="text-xs text-grey/50">{memberCount} miembros</span>
            </div>
            {/* Show up to 5 avatars from members array if available, or mock if still waiting for real data mapping */}
            {/* Assuming members is simpler currently, we might need to map profiles */}
            <AvatarStack
                avatars={memberCount > 0 ? Array(Math.min(memberCount, 5)).fill({ fallback: "U" }) : []}
                max={5}
                size="md"
                className="mb-4 justify-center"
            />

            <Button variant="ghost" size="sm" className="w-full text-xs text-grey/60" onClick={() => setIsMembersModalOpen(true)}>Ver todos</Button>

            <MembersListModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
            />
        </Card>
    );

    const RulesWidget = () => (
        <Card>
            <h4 className="font-bold text-sm text-grey-dark mb-3">Reglas del club</h4>
            <ul className="space-y-2 text-xs text-grey/70">
                {/* Display actual regulations if stored in club.rules, otherwise defaults */}
                {club?.rules && club.rules.length > 0 ? (
                    club.rules.map((rule: string, i: number) => (
                        <li key={i} className="flex gap-2"><span>•</span> {rule}</li>
                    ))
                ) : (
                    <>
                        <li className="flex gap-2"><span>•</span> Sin spoilers fuera de hilos</li>
                        <li className="flex gap-2"><span>•</span> Respeto en debates</li>
                    </>
                )}
            </ul>
            <div className="mt-4 pt-3 border-t border-black/5 text-center">
                <button className="text-[10px] text-grey/40 hover:text-coral transition-colors">Reportar problema</button>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            {!hasActiveBook && (
                <>
                    {/* No Book: Poll First */}
                    <PollWidget
                        poll={activePoll}
                        canCreate={canCreatePoll}
                        onCreateClick={() => onOpenCreatePoll?.()}
                    />
                </>
            )}

            {hasActiveBook && (
                <>
                    {/* Active Book: Book First */}
                    <BookWidget />

                    {/* Then Poll (for next book) */}
                    <PollWidget
                        poll={activePoll}
                        canCreate={canCreatePoll}
                        onCreateClick={() => onOpenCreatePoll?.()}
                    />
                </>
            )}

            <ReadersWidget />
            <RulesWidget />
        </div>
    );
}

import * as React from "react";
import { Card } from "../ui/Card";
import { AvatarStack } from "../ui/AvatarStack";
import Image from "next/image";
import { Button } from "../ui/Button";
import { BookDetailsModal } from "./BookDetailsModal";
import { MembersListModal } from "./MembersListModal";

export function ClubSidebar() {
    const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);

    return (
        <div className="space-y-6">
            {/* Book Card */}
            <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
                <div className="relative h-48 bg-grey/10">
                    <Image
                        src="/assets/images/book_cover_3.png"
                        alt="Seda Cover"
                        fill
                        className="object-cover blur-md opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-24 h-36 shadow-lg rounded overflow-hidden">
                            <Image src="/assets/images/book_cover_3.png" alt="Seda Cover" fill className="object-cover" />
                        </div>
                    </div>
                </div>
                <div className="p-4 text-center">
                    <h3 className="font-serif font-bold text-lg text-grey-dark">Seda</h3>
                    <p className="text-sm text-grey/60 mb-4">Alessandro Baricco</p>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setIsBookModalOpen(true)}>Ver ficha</Button>
                    </div>
                </div>
            </div>

            <BookDetailsModal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                book={{
                    title: "Seda",
                    author: "Alessandro Baricco",
                    coverUrl: "/assets/images/book_cover_3.png",
                    pages: 128,
                    synopsis: "Hervé Joncour compra y vende gusanos de seda. Año tras año, viaja hasta Japón para conseguir la mejor mercancía. Y allí, en el fin del mundo, una mirada lo cambiará todo para siempre. Una historia envolvente y delicada."
                }}
            />

            {/* Members */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm text-grey-dark">Lectores</h4>
                    <span className="text-xs text-grey/50">12 miembros</span>
                </div>
                <AvatarStack avatars={[
                    { fallback: "A" }, { fallback: "M" }, { fallback: "J" }, { fallback: "S" }, { fallback: "K" }
                ]} max={5} size="md" className="mb-4 justify-center" />

                <Button variant="ghost" size="sm" className="w-full text-xs text-grey/60" onClick={() => setIsMembersModalOpen(true)}>Ver todos</Button>
            </Card>

            <MembersListModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
            />

            {/* Rules */}
            <Card>
                <h4 className="font-bold text-sm text-grey-dark mb-3">Reglas del club</h4>
                <ul className="space-y-2 text-xs text-grey/70">
                    <li className="flex gap-2"><span>•</span> Sin spoilers fuera de hilos</li>
                    <li className="flex gap-2"><span>•</span> Respeto en debates</li>
                    <li className="flex gap-2"><span>•</span> 1 cap por semana</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-black/5 text-center">
                    <button className="text-[10px] text-grey/40 hover:text-coral transition-colors">Reportar problema</button>
                </div>
            </Card>
        </div>
    );
}

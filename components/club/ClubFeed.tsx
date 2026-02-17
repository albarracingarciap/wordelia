import * as React from "react";
import { Button } from "../ui/Button";
import { PostCard } from "./PostCard";
import { Chip } from "../ui/Chip";

const MOCK_POSTS = [
    {
        id: "p1",
        author: { name: "Sofía M.", avatar: "/assets/images/user_avatar.png" }, // Mock avatar
        date: "Hace 2h",
        content: "Me está encantando la atmósfera del capítulo 3, es envolvente. ¿Alguien más notó la referencia a la naturaleza como personaje?",
        likesCount: 5,
        repliesCount: 2,
        spoilerLevel: "none" as const
    },
    {
        id: "p2",
        author: { name: "Carlos R." },
        date: "Hace 5h",
        content: "OMG el final del capítulo 5... no me esperaba ese giro con el personaje de Hervé. Me dejó helado.",
        likesCount: 12,
        repliesCount: 8,
        spoilerLevel: "strict" as const
    },
    {
        id: "p3",
        author: { name: "Ana (Mod)" },
        date: "Ayer",
        content: "Recordatorio: El domingo tenemos sesión para comentar hasta el Checkpoint 1. Traed vuestras teorías.",
        likesCount: 20,
        isAnnouncement: true,
        spoilerLevel: "none" as const
    }
];

export function ClubFeed() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Chip label="Todo" active />
                    <Chip label="Checkpoints" />
                    <Chip label="Anuncios" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-grey/60">Ocultar spoilers</span>
                    {/* Toggle Mock */}
                    <div className="w-8 h-4 bg-teal rounded-full relative cursor-pointer">
                        <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm flex gap-4 items-center cursor-pointer hover:bg-grey/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs">A</div>
                <div className="flex-1 text-grey/50 text-sm">Comparte una idea, una pregunta o una sensación...</div>
                <Button size="sm" variant="ghost">Publicar</Button>
            </div>

            <div className="space-y-4">
                {MOCK_POSTS.map(post => (
                    <PostCard key={post.id} {...post} />
                ))}
            </div>

            <div className="text-center pt-4">
                <Button variant="ghost" className="text-grey/50">Cargar más</Button>
            </div>
        </div>
    );
}

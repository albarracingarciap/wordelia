"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { CheckpointDetail } from "@/components/club/checkpoints/CheckpointDetail"; // Reusing types or context if needed
import { SessionAgenda } from "@/components/club/session/SessionAgenda";
import { SessionChat } from "@/components/club/session/SessionChat";
import { SessionSummary } from "@/components/club/session/SessionSummary";

interface Message {
    id: string;
    user: { name: string; role?: "mod"; avatar?: string };
    content: string;
    timestamp: string;
    isPinned?: boolean;
    spoilerLevel?: "none" | "mild" | "strict";
}

// MOCKS
const AGENDA_BLOCKS = [
    { id: "b1", title: "Bienvenida y Check-in", duration: "5 min", isCompleted: true },
    { id: "b2", title: "Debate: El segundo viaje", duration: "15 min", isCurrent: true },
    { id: "b3", title: "Análisis de símbolos", duration: "20 min" },
    { id: "b4", title: "Cierre y próximos pasos", duration: "10 min" },
];

const MOCK_MESSAGES: Message[] = [
    { id: "m1", user: { name: "Ana (Mod)", role: "mod" }, content: "¿Qué os pareció el cambio de ritmo en el capítulo 10?", timestamp: "19:05", isPinned: true },
    { id: "m2", user: { name: "Carlos" }, content: "A mí me sorprendió mucho, no lo vi venir.", timestamp: "19:06" },
    { id: "m3", user: { name: "Sofía" }, content: "Totalmente. Creo que es clave para entender su motivación.", timestamp: "19:07", spoilerLevel: "mild" },
];

export default function ClientPage() {
    const params = useParams();
    const router = useRouter();

    // State: "scheduled" | "live" | "ended"
    // For demo purposes, we default to "live" and allow toggling
    const [status, setStatus] = React.useState<"scheduled" | "live" | "ended">("live");
    const [messages, setMessages] = React.useState<Message[]>(MOCK_MESSAGES);

    const handleSendMessage = (text: string, spoiler: string) => {
        const newMsg: Message = {
            id: Date.now().toString(),
            user: { name: "Tú", avatar: "" },
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            spoilerLevel: spoiler as "none" | "mild" | "strict"
        };
        setMessages([...messages, newMsg]);
    };

    if (status === "ended") {
        return (
            <div className="pb-20 max-w-4xl mx-auto pt-8">
                <SessionSummary />
                <div className="text-center mt-8">
                    <button onClick={() => setStatus("live")} className="text-xs text-grey/30 hover:text-teal underline">
                        (Demo: Volver a Live)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="mb-4 shrink-0">
                <SectionHeader
                    eyebrow="SESIÓN EN VIVO"
                    title="Debate: El segundo viaje"
                    subtitle="Lectura Calmada · Checkpoint 2"
                    action={{
                        label: status === 'live' ? "Finalizar Sesión (Mod)" : "Iniciar Sesión",
                        onClick: () => setStatus(status === 'live' ? 'ended' : 'live'),
                        variant: "outline"
                    }}
                >
                    <div className="absolute top-4 right-4 md:right-auto md:left-full md:ml-4 bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold text-xs animate-pulse flex items-center gap-2 border border-red-100 whitespace-nowrap">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {status === 'live' ? '00:45:12' : 'Empieza en 5 min'}
                    </div>
                </SectionHeader>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Left: Agenda (7 cols) - Scrollable independent */}
                <div className="lg:col-span-4 flex flex-col min-h-0">
                    <SessionAgenda blocks={AGENDA_BLOCKS} status={status} />
                </div>

                {/* Right: Chat (5 cols) - Scrollable independent */}
                <div className="lg:col-span-8 flex flex-col min-h-0">
                    {status === 'scheduled' ? (
                        <div className="h-full flex items-center justify-center bg-grey/5 rounded-xl border border-dashed border-grey/20">
                            <div className="text-center">
                                <h3 className="font-serif text-xl text-teal-dark mb-2">La sala aún no está abierta</h3>
                                <p className="text-grey/60 mb-6">Puedes ir preparando tus notas o un café.</p>
                                <Button onClick={() => setStatus("live")}>Entrar ahora (Demo)</Button>
                            </div>
                        </div>
                    ) : (
                        <SessionChat
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isSlowMode={true}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

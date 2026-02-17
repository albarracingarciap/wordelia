"use client";

import { Bell, EyeOff, FolderHeart, Calendar, Tag, MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
    {
        id: "reminders",
        title: "Recordatorios Inteligentes",
        description: "Olvídate de olvidar. Wordelia te avisa 5 días antes del cumpleaños de Clara o el aniversario con Lucas.",
        icon: Bell,
        color: "bg-coral",
        visual: (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-grey/5 w-full max-w-[280px]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                        💡
                    </div>
                    <div>
                        <p className="text-sm font-bold text-grey">Recordatorio</p>
                        <p className="text-[10px] text-grey/60">Hace 2 horas</p>
                    </div>
                </div>
                <p className="text-xs text-grey/80 leading-relaxed">
                    Se acerca el aniversario de <strong className="text-coral">Clara</strong> (5 días). Tienes 4 ideas guardadas. ¿Repasamos?
                </p>
                <div className="mt-3 flex justify-end">
                    <span className="text-[10px] font-semibold text-teal cursor-pointer hover:underline">Ver ideas →</span>
                </div>
            </div>
        )
    },
    {
        id: "secret",
        title: "Ideas Secretas",
        description: "Apunta regalos durante todo el año. Mantén la sorpresa activando el modo 'Oculto' para que ellos no vean lo que planeas.",
        icon: EyeOff,
        color: "bg-teal",
        visual: (
            <div className="relative w-full max-w-[280px]">
                {/* Public View (Blurred) */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-grey/5 opacity-50 blur-[1px]">
                    <div className="h-4 w-3/4 bg-grey/10 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-grey/5 rounded"></div>
                </div>

                {/* Private View Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-teal/20 flex items-center gap-2 whitespace-nowrap">
                    <EyeOff className="w-3 h-3 text-teal" />
                    <span className="text-xs font-bold text-teal">Solo tú lo ves</span>
                </div>
            </div>
        )
    },
    {
        id: "organization",
        title: "Organización por Mood",
        description: "No es solo una lista. Son tus 'Lecturas de Verano', 'Para Llorar' o 'Regalos de Navidad'.",
        icon: FolderHeart,
        color: "bg-yellow-400",
        visual: (
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {/* Folder 1 */}
                <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-yellow-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">☀️</span>
                        <span className="text-sm font-medium text-grey">Lecturas de Verano</span>
                    </div>
                    <span className="text-xs text-grey/40">12 libros</span>
                </div>
                {/* Folder 2 */}
                <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">😢</span>
                        <span className="text-sm font-medium text-grey">Para Llorar</span>
                    </div>
                    <span className="text-xs text-grey/40">5 libros</span>
                </div>
            </div>
        )
    },
    {
        id: "messages",
        title: "Mensajes Sorpresa",
        description: "Envía una dedicatoria especial que solo se revelará cuando reciban el regalo. Magia pura y emoción garantizada.",
        icon: MessageSquareHeart,
        color: "bg-pink-500",
        visual: (
            <div className="relative w-full max-w-[280px]">
                {/* Message Bubble */}
                <div className="bg-white p-4 rounded-2xl rounded-tr-sm shadow-sm border border-pink-100 relative">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-pink-50">
                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-500">A</div>
                        <span className="text-xs font-bold text-grey">Mensaje de Ana</span>
                    </div>
                    <p className="text-xs text-grey italic leading-relaxed">
                        "¡Espero que te encante! Sé que llevas tiempo queriéndolo leer. ¡Feliz Cumpleaños! 🎉"
                    </p>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] shadow-sm transform rotate-3">
                        ✨ Sorpresa
                    </div>
                </div>
            </div>
        )
    }
];

export function GiftFeatures() {
    return (
        <section className="py-28 bg-[#F7F4F0]">
            <div className="container mx-auto px-6 md:px-12">

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-coral font-serif italic text-xl mb-2 block">Más que una lista</span>
                    <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-dancing)] text-teal mb-6">
                        El arte de regalar (y recibir) libros
                    </h2>
                    <p className="text-grey/70 text-lg leading-relaxed">
                        Wordelia transforma cómo gestionas los regalos. Sin hojas de cálculo, sin notas dispersas y sin perder la magia de la sorpresa.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {FEATURES.map((feature) => (
                        <div key={feature.id} className="bg-white/50 rounded-2xl p-6 border border-white/60 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">

                            {/* Icon Header */}
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 shadow-md transition-transform group-hover:scale-110", feature.color)}>
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-serif text-grey mb-3 group-hover:text-teal transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-sm text-grey/70 mb-8 leading-relaxed min-h-[60px]">
                                {feature.description}
                            </p>

                            {/* Visual Representation Area */}
                            <div className="bg-grey/5 rounded-xl p-4 lg:p-6 flex items-center justify-center min-h-[160px] relative overflow-hidden group-hover:bg-grey/10 transition-colors">
                                {feature.visual}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

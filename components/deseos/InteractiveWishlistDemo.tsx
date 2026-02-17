"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Gift, Check, Bell, Loader2, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Mock Data
const MOCK_BOOKS = [
    {
        id: "dune",
        title: "Dune",
        author: "Frank Herbert",
        cover: "/assets/images/dune.png",
        price: "15.90€",
        originalPrice: "22.00€"
    },
    {
        id: "yellowface",
        title: "Yellowface",
        author: "R. F. Kuang",
        cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1671336608i/62047984.jpg",
        price: "18.50€",
        originalPrice: ""
    }
];

export function InteractiveWishlistDemo() {
    const [selectedBook, setSelectedBook] = useState(MOCK_BOOKS[0]);
    const [demoState, setDemoState] = useState<"idle" | "adding" | "success_personal" | "success_gift">("idle");
    const [notification, setNotification] = useState<{ visible: boolean; text: string; subtext?: string; icon?: any }>({ visible: false, text: "" });

    const handleAction = (type: "personal" | "gift") => {
        setDemoState("adding");

        // Simulate network delay
        setTimeout(() => {
            if (type === "personal") {
                setDemoState("success_personal");
                showNotification("¡Guardado en tus deseos!", "Te avisaremos si baja de precio 📉", Bell);
            } else {
                setDemoState("success_gift");
                showNotification("¡Idea Secreta guardada! 🤫", "Recordatorio activado: 5 días antes", Lock);
            }

            // Reset after a delay
            setTimeout(() => {
                setDemoState("idle");
            }, 3000);
        }, 800);
    };

    const showNotification = (text: string, subtext: string, Icon: any) => {
        setNotification({ visible: true, text, subtext, icon: Icon });
        setTimeout(() => setNotification({ ...notification, visible: false }), 4000);
    };

    return (
        <section id="demo" className="py-20 bg-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-cream/30 -skew-x-12 z-0 pointer-events-none"></div>

            <div className="container mx-auto px-6 md:px-12 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif text-teal mb-4">
                        Pruébalo ahora mismo
                    </h2>
                    <p className="text-grey/70 max-w-xl mx-auto">
                        Selecciona un libro y mira lo que pasa. Sin registros (por ahora).
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-grey/10 overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Book Highlight */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-gradient-to-br from-cream to-white border-b md:border-b-0 md:border-r border-grey/10 relative">
                        {/* Book Cover */}
                        <div className="relative w-40 h-60 shadow-2xl rounded-lg transform transition-transform duration-500 hover:scale-105 z-10">
                            {/* Using a colored placeholder if image fails/is external, but attempting to show generic style */}
                            <div className="absolute inset-0 bg-teal/20 flex items-center justify-center text-teal font-serif text-center p-2">
                                <span className="font-bold">{selectedBook.title}</span>
                            </div>
                            {selectedBook.cover && (
                                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover rounded-lg relative z-10" />
                            )}
                        </div>

                        {/* Selection Dots */}
                        <div className="flex gap-2 mt-8">
                            {MOCK_BOOKS.map(book => (
                                <button
                                    key={book.id}
                                    onClick={() => setSelectedBook(book)}
                                    className={cn(
                                        "w-3 h-3 rounded-full transition-colors",
                                        selectedBook.id === book.id ? "bg-teal" : "bg-grey/20 hover:bg-grey/40"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div className="mb-8">
                            <h3 className="text-2xl font-serif text-grey mb-1">{selectedBook.title}</h3>
                            <p className="text-grey/60 text-sm mb-2">{selectedBook.author}</p>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-teal">{selectedBook.price}</span>
                                {selectedBook.originalPrice && (
                                    <span className="text-sm text-grey/40 line-through">{selectedBook.originalPrice}</span>
                                )}
                                {selectedBook.originalPrice && (
                                    <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full font-bold"> -28%</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Personal Wishlist Action */}
                            <button
                                onClick={() => handleAction("personal")}
                                disabled={demoState !== "idle"}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 group",
                                    demoState === "success_personal"
                                        ? "bg-coral text-white border-coral"
                                        : "bg-white border-grey/10 hover:border-coral/50 hover:shadow-md"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-full", demoState === "success_personal" ? "bg-white/20" : "bg-coral/10 text-coral")}>
                                        <Heart className={cn("w-5 h-5", demoState === "success_personal" && "fill-current")} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-semibold">Lo quiero leer</span>
                                        <span className={cn("text-xs opacity-70", demoState === "success_personal" ? "text-white/80" : "text-grey/60")}>
                                            Añadir a mis deseos
                                        </span>
                                    </div>
                                </div>
                                {demoState === "success_personal" && <Check className="w-5 h-5 animate-scale-in" />}
                            </button>

                            {/* Gift Idea Action */}
                            <button
                                onClick={() => handleAction("gift")}
                                disabled={demoState !== "idle"}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 group",
                                    demoState === "success_gift"
                                        ? "bg-teal text-white border-teal"
                                        : "bg-white border-grey/10 hover:border-teal/50 hover:shadow-md"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-full", demoState === "success_gift" ? "bg-white/20" : "bg-teal/10 text-teal")}>
                                        <Gift className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-semibold">Es para un regalo</span>
                                        <span className={cn("text-xs opacity-70", demoState === "success_gift" ? "text-white/80" : "text-grey/60")}>
                                            Guardar como idea secreta
                                        </span>
                                    </div>
                                </div>
                                {demoState === "success_gift" && <Lock className="w-4 h-4 animate-scale-in" />}
                            </button>
                        </div>

                        {/* Demo Feedback Text */}
                        {demoState !== "idle" && (
                            <p className="mt-6 text-xs text-center text-grey/50 animate-fade-in">
                                {demoState === "adding" ? "Procesando..." : "Para guardar esto permanentemente, necesitas una cuenta."}
                            </p>
                        )}
                    </div>
                </div>

                {/* Simulated Notification Toast */}
                {notification.visible && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 bg-white shadow-2xl rounded-xl p-4 border border-grey/10 flex items-center gap-4 z-50 animate-slide-up max-w-[90vw] md:max-w-sm">
                        <div className="bg-teal/10 p-2 rounded-full text-teal">
                            {notification.icon && <notification.icon className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="font-semibold text-grey text-sm">{notification.text}</p>
                            {notification.subtext && <p className="text-xs text-grey/60">{notification.subtext}</p>}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function ADNPromoModal() {
    const { isLoggedIn } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const [hasSeenPromo, setHasSeenPromo] = React.useState(false);

    React.useEffect(() => {
        // Show modal if not logged in and haven't seen it in this session (optional logic, 
        // for now let's show it every time they land here if not logged in, as requested)
        if (!isLoggedIn) {
            const timer = setTimeout(() => setIsOpen(true), 1000); // Small delay for better UX
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn]);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title=""
            size="lg"
            className="md:max-w-2xl"
        >
            <div className="flex flex-col items-center text-center p-4 space-y-6">
                <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center animate-pulse-slow">
                    <Sparkles className="w-8 h-8 text-teal" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-serif text-teal-dark">
                        Descubre el verdadero ADN de tus libros favoritos
                    </h2>
                    <p className="text-grey/80 text-lg max-w-lg mx-auto leading-relaxed">
                        Esta página es una demo de lo que Wordelia te ofrece. Con la funcionalidad ADN Literario tendrás un análsis exhaustivo de cada obra basado en 8 "cromosomas" que definen su identidad.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md pt-4">
                    <Link href="/register" className="w-full">
                        <Button fullWidth size="lg" className="shadow-lg shadow-teal/20">
                            ¡Regístrate Gratis!
                        </Button>
                    </Link>
                    <Link href="/login" className="w-full">
                        <Button fullWidth variant="outline" size="lg">
                            Ya tengo cuenta
                        </Button>
                    </Link>
                </div>

                <button
                    onClick={handleClose}
                    className="text-sm text-grey/50 hover:text-teal transition-colors underline decoration-grey/30 hover:decoration-teal"
                >
                    Solo quiero ver la demo
                </button>
            </div>
        </Modal>
    );
}

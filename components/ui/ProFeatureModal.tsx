"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ProFeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export function ProFeatureModal({ isOpen, onClose, featureName = "esta funcionalidad" }: ProFeatureModalProps) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="text-center p-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-light to-teal rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse-slow">
                    <span className="text-3xl">✨</span>
                </div>

                <h3 className="font-serif text-2xl text-teal-dark mb-3">
                    Desbloquea el poder de la IA
                </h3>

                <p className="text-grey/80 mb-8 leading-relaxed">
                    La generación automática de checkpoints con <strong>{featureName}</strong> está disponible exclusivamente en el plan <strong>Lector Pro</strong>.
                </p>

                <div className="bg-cream/50 rounded-xl p-6 mb-8 text-left border border-teal/10">
                    <h4 className="text-sm font-bold text-teal-dark uppercase tracking-wider mb-3">Incluye:</h4>
                    <ul className="space-y-2 text-sm text-grey-dark">
                        <li className="flex items-center gap-2">✓ Generación de planes de lectura inteligentes</li>
                        <li className="flex items-center gap-2">✓ Análisis de sentimiento en debates</li>
                        <li className="flex items-center gap-2">✓ Sugerencias de preguntas para dinamizar</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3">
                    <Button variant="primary" className="w-full justify-center" onClick={() => { window.location.href = "/planes"; }}>
                        Actualizar a Pro
                    </Button>
                    <Button variant="ghost" className="w-full justify-center text-grey/60" onClick={onClose}>
                        Quizás luego
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/**
 * Aviso de "función con IA aún no disponible". Las funciones de IA están hoy
 * activas solo para admin (pruebas); al resto se les muestra este diálogo.
 */
export function AIComingSoonModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="p-4 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-coral/20 to-teal/10 text-coral">
                    <Sparkles className="h-7 w-7" />
                </div>

                <h3 className="font-serif text-2xl text-teal-dark">Muy pronto ✨</h3>

                <p className="mt-3 leading-relaxed text-grey/80">
                    Las funciones con <strong>IA</strong> de Wordelia estarán disponibles en{" "}
                    <strong>septiembre de 2026</strong> para los usuarios del plan <strong>Bibliófilo</strong>.
                    Estamos afinándolas para que la experiencia sea excelente.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                    <Link href="/planes" onClick={onClose}>
                        <Button variant="primary" className="w-full justify-center">
                            Ver el plan Bibliófilo
                        </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-center text-grey/60" onClick={onClose}>
                        Entendido
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

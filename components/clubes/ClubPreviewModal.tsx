"use client";

import { OfficialClub } from "@/app/clubes/actions";
import Image from "next/image";
import { X, Lock, Calendar, Users, MessageCircle, Map, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useEffect } from "react";

interface ClubPreviewModalProps {
    club: OfficialClub | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ClubPreviewModal({ club, isOpen, onClose }: ClubPreviewModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !club) return null;

    const bookData = club.book_data;
    if (!bookData) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-grey/10 hover:bg-grey/20 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-grey" />
                    </button>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Book Cover */}
                            <div className="shrink-0">
                                <div className="relative w-48 aspect-[2/3] bg-grey/10 rounded-lg overflow-hidden shadow-lg">
                                    {bookData.cover_url ? (
                                        <Image
                                            src={bookData.cover_url}
                                            alt={bookData.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                            <p className="text-sm text-grey/60 text-center font-serif">
                                                {bookData.title}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Club Info */}
                            <div className="flex-1 space-y-4">
                                {/* Title & Badge */}
                                <div>
                                    {club.is_featured && (
                                        <Badge className="bg-coral text-white font-semibold border-none mb-2">
                                            CLUB DEL MES
                                        </Badge>
                                    )}
                                    <h2 className="text-2xl md:text-3xl font-serif text-grey mb-2">
                                        {club.name}
                                    </h2>
                                    <p className="text-grey/70 text-lg">
                                        {bookData.title}
                                    </p>
                                    <p className="text-grey/60 text-sm">
                                        por {bookData.authors?.join(", ") || "Autor desconocido"}
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <p className="text-grey/80 text-sm leading-relaxed">
                                        {club.description}
                                    </p>
                                </div>

                                {/* Start Date */}
                                <div className="flex items-center gap-2 text-sm text-grey/60 bg-teal/5 rounded-lg p-3">
                                    <Calendar className="w-5 h-5 text-teal" />
                                    <span><strong>Fecha de inicio:</strong> 15 de marzo de 2026</span>
                                </div>

                                {/* Blurred Content Section */}
                                <div className="relative">
                                    {/* Blur overlay */}
                                    <div className="relative">
                                        <div className="filter blur-sm select-none pointer-events-none">
                                            <div className="space-y-4 opacity-40">
                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Calendario de Lectura
                                                    </h3>
                                                    <div className="h-24 bg-gradient-to-r from-teal/20 to-blue/20 rounded-lg" />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <MessageCircle className="w-4 h-4" />
                                                        Guías de Discusión
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="h-16 bg-grey/10 rounded-lg" />
                                                        <div className="h-16 bg-grey/10 rounded-lg" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Map className="w-4 h-4" />
                                                        Mapa Emocional
                                                    </h3>
                                                    <div className="h-32 bg-gradient-to-r from-coral/20 to-teal/20 rounded-lg" />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <CheckSquare className="w-4 h-4" />
                                                        Checkpoints Semanales
                                                    </h3>
                                                    <div className="h-20 bg-grey/10 rounded-lg" />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        Participantes
                                                    </h3>
                                                    <div className="h-16 bg-grey/10 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lock icon overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white rounded-full p-4 shadow-xl">
                                                <Lock className="w-8 h-8 text-teal" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA on blur */}
                                    <div className="mt-6 bg-gradient-to-r from-teal/10 to-coral/10 rounded-xl p-6 border-2 border-teal/20">
                                        <h3 className="text-lg font-serif text-teal mb-2">
                                            🔓 Únete al club completo
                                        </h3>
                                        <p className="text-grey/70 text-sm mb-4">
                                            Regístrate gratis para acceder al calendario completo, guías de discusión,
                                            mapa emocional, checkpoints y conectar con otros lectores.
                                        </p>
                                        <Link href="/register">
                                            <Button className="w-full bg-teal hover:bg-teal-dark text-white font-semibold">
                                                Crear cuenta gratis
                                            </Button>
                                        </Link>
                                        <p className="text-xs text-grey/50 text-center mt-3">
                                            ¿Ya tienes cuenta?{" "}
                                            <Link href="/login" className="text-teal hover:underline">
                                                Inicia sesión
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

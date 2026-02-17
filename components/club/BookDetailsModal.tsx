import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface Book {
    title: string;
    author: string;
    coverUrl: string;
    pages?: number;
    synopsis?: string;
}

interface BookDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book;
}

export function BookDetailsModal({ isOpen, onClose, book }: BookDetailsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col md:flex-row max-h-[90vh]">
                {/* Visual Side */}
                <div className="relative w-full md:w-2/5 h-64 md:h-auto bg-cream/30 flex items-center justify-center p-8">
                    <div className="relative w-32 md:w-40 aspect-[2/3] shadow-2xl rounded-lg transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                        <Image src={book.coverUrl} alt={book.title} fill className="object-cover rounded-lg" />
                    </div>
                </div>

                {/* Content Side */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="font-serif text-2xl text-teal-dark font-bold leading-tight mb-2">{book.title}</h2>
                            <p className="text-lg text-grey/60 font-medium">{book.author}</p>
                        </div>
                        <button onClick={onClose} className="text-grey/40 hover:text-coral transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Stats mockup */}
                        <div className="flex gap-6 border-b border-black/5 pb-6">
                            <div>
                                <span className="block text-xs font-bold text-grey/40 uppercase tracking-widest">Páginas</span>
                                <span className="text-lg text-grey-dark font-medium">{book.pages || "320"}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-grey/40 uppercase tracking-widest">Valoración</span>
                                <span className="text-lg text-grey-dark font-medium">4.8 <span className="text-xs text-grey/40">/ 5</span></span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-grey/40 uppercase tracking-widest">Publicado</span>
                                <span className="text-lg text-grey-dark font-medium">1996</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-sm text-grey-dark mb-2">Sinopsis</h3>
                            <p className="text-sm text-grey/70 leading-relaxed">
                                {book.synopsis || "Esta es una historia que empieza con un hombre que atraviesa el mundo, y acaba con un lago que permanece inmóvil, en un día de viento. El hombre se llama Hervé Joncour. El lago, no se sabe. Se podría decir que es una historia de amor. Pero si solamente fuera eso, no valdría la pena contarla."}
                            </p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button variant="primary" onClick={onClose} className="flex-1">Empezar a leer</Button>
                            <Button variant="outline" className="flex-1">Comprar</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

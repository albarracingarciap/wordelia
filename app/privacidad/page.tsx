import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-[#FFFAEF] flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-serif text-teal-dark mb-4 capitalize">Página: Privacidad</h1>
            <p className="text-grey mb-8">Esta página está en construcción. Pronto habrá más información disponible aquí.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-white hover:bg-teal-dark transition-colors font-medium shadow-sm">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
            </Link>
        </div>
    );
}

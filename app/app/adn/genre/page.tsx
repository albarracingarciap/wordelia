"use client";

import * as React from "react";
import { GenreDNA, GenreDNAData } from "@/components/adn/GenreDNA";
import Link from "next/link";

const GENRE_DATA: GenreDNAData = {
    genre: "DISTOPÍA",
    sampleSize: 234,
    characteristics: [
        { label: "Estructura", value: 6, description: "Moderadamente compleja" },
        { label: "Estilo", value: 7, description: "Denso" },
        { label: "Emoción", value: 8, description: "Alta intensidad" },
        { label: "Temas", value: 9, description: "Muy profundos" },
        { label: "Personajes", value: 7, description: "Complejos" },
        { label: "Ritmo", value: 6, description: "Moderado" },
        { label: "Complejidad", value: 7, description: "Media-alta" }
    ],
    emotions: [
        { emotion: "Miedo", percentage: 89, color: "#D56962" },
        { emotion: "Tristeza", percentage: 72, color: "#3B8C85" },
        { emotion: "Desesperanza", percentage: 68, color: "#7D8C8A" }, // Greyish
        { emotion: "Ira", percentage: 61, color: "#D98884" }, // Lighter Coral
        { emotion: "Esperanza", percentage: 38, color: "#8FBDB9" } // Lighter Teal
    ],
    themes: [
        { id: 1, name: "Control autoritario" },
        { id: 2, name: "Pérdida de libertad" },
        { id: 3, name: "Vigilancia / Tecnología" },
        { id: 4, name: "Resistencia individual" },
        { id: 5, name: "Manipulación de verdad" }
    ],
    definingWorks: [
        { title: "1984", author: "George Orwell", match: 98 },
        { title: "Fahrenheit 451", author: "Ray Bradbury", match: 96 },
        { title: "El cuento de la criada", author: "Margaret Atwood", match: 94 }
    ]
};

export default function GenrePage() {
    return (
        <div className="pt-8 pb-20">
            <div className="flex justify-center mb-8">
                <Link href="/app/adn" className="text-sm font-medium text-grey hover:text-teal transition-colors flex items-center gap-2">
                    ← Volver al Genoma
                </Link>
            </div>
            <GenreDNA data={GENRE_DATA} />
        </div>
    );
}

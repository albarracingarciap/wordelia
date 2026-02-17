"use client";

import * as React from "react";
import { BookComparison, ComparisonData } from "@/components/adn/BookComparison";

const MOCK_COMPARISON_DATA: ComparisonData = {
    book1: {
        title: "1984",
        author: "George Orwell",
        coverColor: "#3B8C85" // Teal
    },
    book2: {
        title: "Un mundo feliz",
        author: "Aldous Huxley",
        coverColor: "#D56962" // Coral
    },
    compatibility: {
        percentage: 76,
        label: "Alta similitud"
    },
    chromosomes: [
        { label: "Estructura", value1: 6, value2: 7 },
        { label: "Estilo", value1: 7, value2: 6 },
        { label: "Emoción", value1: 9, value2: 5, diffLabel: "Mayor diferencia" },
        { label: "Temas", value1: 10, value2: 9 },
        { label: "Personajes", value1: 8, value2: 7 },
        { label: "Ritmo", value1: 6, value2: 6 },
        { label: "Complejidad", value1: 7, value2: 6 },
        { label: "Contexto", value1: 10, value2: 9 },
    ],
    similarities: [
        "Ambas son distopías políticas clásicas",
        "Crítica a totalitarismos y control social sistémico",
        "Protagonista que 'despierta' y se rebela",
        "Worldbuilding detallado y opresivo",
        "Influencia cultural masiva y vigencia contemporánea"
    ],
    differences: [
        {
            aspect: "Intensidad Emocional",
            book1Desc: "Devastador, opresivo, genera miedo y desesperanza.",
            book1Value: 9,
            book2Desc: "Moderado, intelectual, genera inquietud más que terror.",
            book2Value: 5,
            insight: "\"1984\" es una experiencia visceral, \"Un mundo feliz\" es más cerebral."
        },
        {
            aspect: "Método de Control",
            book1Desc: "Miedo, dolor, vigilancia constante, represión.",
            book2Desc: "Placer, drogas (Soma), condicionamiento genético.",
            insight: "Orwell temía que nos prohibieran los libros. Huxley temía que no quisiéramos leerlos."
        },
        {
            aspect: "Tono General",
            book1Desc: "Sombrío, claustrofóbico, pesimista.",
            book2Desc: "Satírico, aséptico, a veces ligero pero perturbador.",
            insight: "Experiencias de lectura muy diferentes pese a la temática similar."
        },
        {
            aspect: "Final",
            book1Desc: "Derrota absoluta del individuo y del espíritu.",
            book2Desc: "Ambiguo, trágico pero con cierto margen de elección personal.",
            insight: "El final de 1984 es definitivo; el de Huxley deja preguntas abiertas."
        }
    ],
    recommendation: {
        text: "Si te gustó \"1984\", \"Un mundo feliz\" te ofrecerá una perspectiva complementaria sobre el control totalitario, pero atacando desde el placer en lugar del dolor.",
        readingOrder: "Mejor leer: PRIMERO Huxley, DESPUÉS Orwell (Progresión de intensidad)"
    }
};

export default function ComparePage() {
    return (
        <div className="pt-8">
            <BookComparison data={MOCK_COMPARISON_DATA} />
        </div>
    );
}

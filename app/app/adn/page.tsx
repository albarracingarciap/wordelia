"use client";

import * as React from "react";
import { NarrativeStructure, NarrativeData } from "@/components/adn/NarrativeStructure";
import { LiteraryStyle, LiteraryStyleData } from "@/components/adn/LiteraryStyle";
import { EmotionalProfile, EmotionalProfileData } from "@/components/adn/EmotionalProfile";
import { ThematicComposition, ThematicData } from "@/components/adn/ThematicComposition";
import { CharacterDNA, CharacterData } from "@/components/adn/CharacterDNA";
import { RhythmDensity, RhythmDensityData } from "@/components/adn/RhythmDensity";
import { LinguisticComplexity, LinguisticComplexityData } from "@/components/adn/LinguisticComplexity";
import { CulturalContext, CulturalContextData } from "@/components/adn/CulturalContext";
import { GeneticFingerprint, GeneticFingerprintData } from "@/components/adn/GeneticFingerprint";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ADNPromoModal } from "@/components/adn/ADNPromoModal";

// --- MOCK DATA ---
const NARRATIVE_DATA: NarrativeData = {
    structureType: "Lineal cronológica",
    perspective: "Tercera persona limitada",
    plotLines: {
        active: 2,
        total: 10
    },
    complexity: {
        value: 6,
        label: "6/10"
    },
    division: [
        "3 Partes",
        "23 Capítulos sin título",
        "Longitud desigual (Parte III más corta)"
    ],
    turningPoints: [
        { id: 1, label: "Inicio del diario", page: 20 },
        { id: 2, label: "Encuentro con Julia", page: 105 },
        { id: 3, label: "La captura", page: 230 },
        { id: 4, label: "Sala 101", page: 280 },
    ]
};

const LITERARY_DATA: LiteraryStyleData = {
    vocabulary: {
        value: 7,
        label: "7/10",
        details: [
            "Vocabulario político especializado",
            "Neologismos (Neolengua, doblepensar)",
            "Nivel lectura: Secundaria/Universitario"
        ]
    },
    sentenceLength: {
        value: 6,
        label: "6/10",
        details: [
            "Promedio: 18 palabras/oración",
            "Mezcla de oraciones directas y complejas",
            "Algunas subordinadas largas descriptivas"
        ]
    },
    descriptiveDensity: {
        value: 8,
        label: "8/10",
        details: [
            "Descripciones detalladas del mundo",
            "Enfoque en ambientación opresiva",
            "Poco énfasis en apariencia física"
        ]
    },
    dialogueRatio: {
        dialogue: 30,
        narration: 70
    },
    tone: {
        somberness: 8,
        pessimism: 9
    },
    rhetoricalFigures: [
        { name: "Ironía", value: 9, label: "9/10" },
        { name: "Metáfora", value: 7, label: "7/10" },
        { name: "Símil", value: 4, label: "4/10" },
        { name: "Hipérbole", value: 2, label: "2/10" }
    ],
    register: [
        "Formal con toques coloquiales",
        "Prosa directa pero cuidada",
        "Sin arcaísmos ni vulgarismos",
        "Neolengua: registro artificial ideológico"
    ]
};

const EMOTIONAL_DATA: EmotionalProfileData = {
    curvePoints: [
        { x: 0, y: 1 }, { x: 10, y: 2 }, { x: 20, y: 3 }, { x: 30, y: 5 }, { x: 40, y: 6 },
        { x: 50, y: 7 }, { x: 60, y: 6 }, { x: 70, y: 8 }, { x: 80, y: 9 }, { x: 90, y: 4 }, { x: 100, y: 1 }
    ],
    predominantEmotions: [
        { emotion: "Miedo", percentage: 87, emoji: "😨" },
        { emotion: "Tristeza", percentage: 76, emoji: "😢" },
        { emotion: "Ira", percentage: 58, emoji: "😤" },
        { emotion: "Esperanza", percentage: 34, emoji: "🤗" },
        { emotion: "Sorpresa", percentage: 29, emoji: "😲" },
        { emotion: "Alegría", percentage: 15, emoji: "😊" },
    ],
    tensionType: [
        { type: "Psicológica", value: 9 },
        { type: "Física", value: 4 },
        { type: "Emocional", value: 8 },
        { type: "Intelectual", value: 7 },
    ],
    keyMoments: [
        { id: 1, label: "Escritura del diario", emotions: ["Liberación", "Miedo"] },
        { id: 2, label: "Encuentro con Julia", emotions: ["Esperanza", "Miedo"] },
        { id: 3, label: "Habitación secreta", emotions: ["Alegría efímera"] },
        { id: 4, label: "La captura", emotions: ["Shock", "Terror"] },
        { id: 5, label: "Sala 101", emotions: ["Terror absoluto"] },
        { id: 6, label: "Final", emotions: ["Desolación", "Resignación"] },
    ],
    ending: {
        type: "Trágico/Desolador",
        climaxIntensity: 10,
        catharsis: 8
    }
};

const THEMATIC_DATA: ThematicData = {
    thematicCloud: [
        { word: "CONTROL", weight: 9 },
        { word: "VERDAD", weight: 8 },
        { word: "TOTALITARISMO", weight: 10 },
        { word: "LIBERTAD", weight: 8 },
        { word: "VIGILANCIA", weight: 9 },
        { word: "MEMORIA", weight: 7 },
        { word: "INDIVIDUALIDAD", weight: 6 },
        { word: "PODER", weight: 8 },
        { word: "MANIPULACIÓN", weight: 9 },
        { word: "LENGUAJE", weight: 7 },
        { word: "RESISTENCIA", weight: 6 },
        { word: "OPRESIÓN", weight: 7 },
    ],
    topThemes: [
        {
            id: 1,
            title: "TOTALITARISMO Y CONTROL ESTATAL",
            presence: 10,
            depth: 9,
            points: ["Control del pensamiento", "Vigilancia omnipresente", "Eliminación de privacidad"]
        },
        {
            id: 2,
            title: "MANIPULACIÓN DE LA VERDAD",
            presence: 9,
            depth: 9,
            points: ["Reescritura de historia", "Doblepensar", "Control del lenguaje (Neolengua)"]
        },
        {
            id: 3,
            title: "PÉRDIDA DE INDIVIDUALIDAD",
            presence: 8,
            depth: 8,
            points: ["Anulación del yo", "Lealtad al Estado sobre identidad", "Destrucción de relaciones personales"]
        },
        {
            id: 4,
            title: "RESISTENCIA Y REBELIÓN",
            presence: 7,
            depth: 7,
            points: ["Búsqueda de libertad", "Amor como acto de rebelión", "Futilidad de la resistencia individual"]
        },
        {
            id: 5,
            title: "PODER DEL LENGUAJE",
            presence: 6,
            depth: 9,
            points: ["Lenguaje limita pensamiento", "Neolengua como herramienta de control", "Importancia de preservar palabras"]
        },
    ],
    secondaryThemes: [
        "Memoria colectiva e individual",
        "Sexualidad reprimida",
        "Clase social y estratificación",
        "Propaganda y manipulación mediática",
        "Tecnología de vigilancia",
        "Traición y lealtad"
    ],
    philosophicalDepth: 9,
    moralAmbiguity: 5
};

const CHARACTER_DATA: CharacterData = {
    distribution: {
        protagonists: 1,
        main: 3,
        secondary: 5,
        background: "15+"
    },
    complexity: {
        value: 8,
        label: "Muy compleja",
        focusCharacter: {
            name: "Winston Smith",
            points: [
                "Conflicto interno profundo",
                "Evolución psicológica clara",
                "Motivaciones complejas y contradictorias",
                "Transformación dramática"
            ]
        }
    },
    arcs: [
        {
            name: "Winston Smith",
            stages: ["Rebelde esperanzado", "Enamorado idealista", "Quebrado resignado"],
            intensity: 10
        },
        {
            name: "Julia",
            stages: ["Cínica pragmática", "Vulnerable amorosa", "Destruida indiferente"],
            intensity: 8
        }
    ],
    diversity: {
        gender: [
            { label: "Masculino", value: 70 },
            { label: "Femenino", value: 30 }
        ],
        age: [
            { label: "Jóvenes adultos", value: 40 },
            { label: "Mediana edad", value: 50 },
            { label: "Ancianos", value: 10 }
        ],
        social: [
            { label: "Partido Ext.", value: 60 },
            { label: "Partido Int.", value: 20 },
            { label: "Proles", value: 20 }
        ]
    },
    relationships: {
        nodes: [
            { id: "Winston", x: 50, y: 20 },
            { id: "Julia", x: 20, y: 80 },
            { id: "O'Brien", x: 80, y: 80 },
        ],
        edges: [
            { source: "Winston", target: "Julia", label: "Amor" },
            { source: "Winston", target: "O'Brien", label: "Mentoria/Traición" },
            { source: "Julia", target: "O'Brien", label: "Odio" }, // Inferred
        ],
        dominantType: "Relaciones de poder",
        conflict: 9,
        collaboration: 2
    }
};

const RHYTHM_DATA: RhythmDensityData = {
    narrativeSpeed: {
        value: 6,
        label: "Pausado - Vertiginoso",
        breakdown: [
            { part: "Parte I", desc: "Lento, establecimiento del mundo y rutina." },
            { part: "Parte II", desc: "Moderado, desarrollo de la relación y el conflicto." },
            { part: "Parte III", desc: "Intenso, clímax, tortura y resolución acelerada." }
        ]
    },
    infoDensity: {
        value: 8,
        label: "Muy densa",
        points: [
            "Alto contenido ideológico y político",
            "Descripciones detalladas del entorno (worldbuilding)",
            "Reflexiones filosóficas frecuentes (El Libro)",
            "Complejidad de la Neolengua"
        ]
    },
    actionProportion: [
        { label: "Reflexión interna", value: 50, color: "#D56962" }, // Coral
        { label: "Diálogo", value: 30, color: "#3B8C85" }, // Teal
        { label: "Acción física", value: 20, color: "#BFBFBF" }, // Grey
    ],
    readingTime: {
        fast: "7-9 horas",
        average: "10-12 horas",
        slow: "15-18 horas",
        pagesPerHour: 25,
        note: "Más lento que la ficción comercial promedio debido a la densidad conceptual y la prosa descriptiva."
    },
    rhythmCurve: [
        // Part 1
        { label: "I-1", value: 2 }, { label: "I-2", value: 3 }, { label: "I-3", value: 3 }, { label: "I-4", value: 4 },
        // Part 2
        { label: "II-1", value: 5 }, { label: "II-2", value: 6 }, { label: "II-3", value: 5 }, { label: "II-4", value: 7 },
        // Part 3
        { label: "III-1", value: 9 }, { label: "III-2", value: 10 }, { label: "III-3", value: 8 }, { label: "III-4", value: 6 },
    ]
};

const COMPLEXITY_DATA: LinguisticComplexityData = {
    readingLevel: {
        value: 7,
        label: "7/10",
        age: "16+ años",
        eduLevel: "Secundaria superior"
    },
    lexicalRichness: {
        uniqueWords: "~8,500",
        diversity: 8,
        difficultWords: {
            count: "~450 (5%)",
            examples: ["Términos políticos", "Neologismos", "Conceptos abstractos"]
        }
    },
    syntax: {
        value: 6,
        label: "6/10",
        points: [
            "Mezcla de oraciones simples y complejas",
            "Subordinadas moderadas",
            "Estructura mayormente clara"
        ]
    },
    readability: {
        fleschEase: "65/100",
        fleschEaseDesc: "Ligeramente difícil",
        kincaidGrade: "9.2",
        kincaidGradeDesc: "Nivel 3º ESO"
    },
    innovations: {
        list: ["Doblepensar", "Crimental", "Neolengua", "Vaporizar", "Big Brother"],
        culturalImpact: 10,
        impactDesc: "Términos adoptados al lenguaje común"
    }
};

const CULTURAL_DATA: CulturalContextData = {
    publication: {
        year: 1949,
        context: [
            "Post Segunda Guerra Mundial",
            "Inicio de Guerra Fría",
            "Auge de totalitarismos",
            "Temor nuclear"
        ]
    },
    narrative: {
        year: 1984,
        location: "Londres, Oceanía",
        period: "Distopía futurista"
    },
    movement: [
        "Distopía política",
        "Ficción especulativa",
        "Literatura de advertencia",
        "Modernismo tardío"
    ],
    evolution: {
        points: [
            { year: 1933, work: "Down and Out", complexity: 3 },
            { year: 1937, work: "Wigan Pier", complexity: 5 },
            { year: 1945, work: "Animal Farm", complexity: 7 },
            { year: 1949, work: "1984", complexity: 9 }
        ],
        insights: [
            "Complejidad temática creciente",
            "Tono cada vez más sombrío",
            "Paso de narrativa personal a alegórica",
            "Intensidad emocional en aumento"
        ],
        signature: "Realista → Alegórico → Distópico"
    },
    tree: {
        ancestors: [
            { title: "Nosotros", author: "Zamiatin", year: 1921, dnaMatch: 82 },
            { title: "Un mundo feliz", author: "Huxley", year: 1932, dnaMatch: 76 }
        ],
        descendants: [
            { title: "Fahrenheit 451", author: "Bradbury", year: 1953, dnaMatch: 91 },
            { title: "V de Vendetta", author: "Moore", year: 1982, dnaMatch: 78 },
            { title: "El cuento de la criada", author: "Atwood", year: 1985, dnaMatch: 88 }
        ]
    },
    relevance: {
        value: 10,
        points: [
            "Vigilancia digital moderna",
            "Fake news y manipulación",
            "Polarización política",
            "Control de narrativas",
            "Tecnología de reconocimiento facial"
        ]
    }
};

const GENETIC_DATA: GeneticFingerprintData = {
    book: {
        title: "1984",
        author: "George Orwell",
        year: 1949,
        genre: "Distopía / Ficción Política"
    },
    dimensions: [
        { label: "Estructura", value: 6, code: "ST" },
        { label: "Estilo", value: 7, code: "ES" },
        { label: "Emoción", value: 9, code: "EM" },
        { label: "Temas", value: 10, code: "TM" },
        { label: "Personajes", value: 8, code: "PS" },
        { label: "Ritmo", value: 6, code: "RT" },
        { label: "Complejidad", value: 7, code: "CX" },
        { label: "Contexto", value: 10, code: "CT" },
    ],
    signature: "#ST06-ES07-EM09-TM10-PS08-RT06-CX07-CT10",
    profile: [
        "Distopía psicológica intensa",
        "Prosa densa pero accesible",
        "Emocionalmente devastador",
        "Temas profundos y vigentes",
        "Personajes transformados",
        "Ritmo creciente",
        "Impacto cultural masivo"
    ]
};

export default function ADNPage() {
    return (
        <div className="space-y-12 pb-20 pt-10">
            <div className="max-w-4xl mx-auto">
                <SectionHeader
                    eyebrow="ADN LITERARIO"
                    title="Genoma del Libro: 1984"
                    subtitle="Análisis profundo de la composición, estructura y esencia de la obra."
                />
            </div>

            <Tabs defaultValue="narrative" className="max-w-4xl mx-auto">
                <TabsList className="flex-wrap h-auto gap-y-2">
                    <TabsTrigger value="narrative">Estructura Narrativa</TabsTrigger>
                    <TabsTrigger value="style">Estilo Literario</TabsTrigger>
                    <TabsTrigger value="emotional">Perfil Emocional</TabsTrigger>
                    <TabsTrigger value="thematic">Composición Temática</TabsTrigger>
                    <TabsTrigger value="characters">ADN de Personajes</TabsTrigger>
                    <TabsTrigger value="rhythm">Ritmo y Densidad</TabsTrigger>
                    <TabsTrigger value="complexity">Complejidad Lingüística</TabsTrigger>
                    <TabsTrigger value="cultural">Contexto Cultural</TabsTrigger>
                    <div className="w-full md:w-auto mt-2 md:mt-0 md:ml-2">
                        <TabsTrigger value="fingerprint" className="w-full">
                            ✨ Huella Genética
                        </TabsTrigger>
                    </div>
                </TabsList>

                <div className="bg-gradient-to-b from-transparent to-white/40 p-6 md:p-10 rounded-3xl border border-teal/5 mt-8">
                    <TabsContent value="narrative">
                        <NarrativeStructure data={NARRATIVE_DATA} />
                    </TabsContent>

                    <TabsContent value="style">
                        <LiteraryStyle data={LITERARY_DATA} />
                    </TabsContent>

                    <TabsContent value="emotional">
                        <EmotionalProfile data={EMOTIONAL_DATA} />
                    </TabsContent>

                    <TabsContent value="thematic">
                        <ThematicComposition data={THEMATIC_DATA} />
                    </TabsContent>

                    <TabsContent value="characters">
                        <CharacterDNA data={CHARACTER_DATA} />
                    </TabsContent>

                    <TabsContent value="rhythm">
                        <RhythmDensity data={RHYTHM_DATA} />
                    </TabsContent>

                    <TabsContent value="complexity">
                        <LinguisticComplexity data={COMPLEXITY_DATA} />
                    </TabsContent>

                    <TabsContent value="cultural">
                        <CulturalContext data={CULTURAL_DATA} />
                    </TabsContent>

                    <TabsContent value="fingerprint">
                        <GeneticFingerprint data={GENETIC_DATA} />
                    </TabsContent>
                </div>
            </Tabs>

            <ADNPromoModal />
        </div>
    );
}

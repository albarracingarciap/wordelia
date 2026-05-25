export type ReadingExperience = {
    label: string;
    slug: string;
    description: string;
    searchTerms: string[];
    signals: string[];
};

export const readingExperiences: ReadingExperience[] = [
    {
        label: "No apto para leer antes de dormir",
        slug: "no-apto-para-leer-antes-de-dormir",
        description: "Thrillers, suspense y tensión narrativa alta para cuando quieres una lectura que no suelte.",
        searchTerms: ["thriller psicológico", "suspense", "terror novela"],
        signals: ["Tensión alta", "Ritmo rápido", "Giros", "Oscuro"],
    },
    {
        label: "Para perderse en otro mundo",
        slug: "para-perderse-en-otro-mundo",
        description: "Historias con mundos amplios, reglas propias y sensación de viaje largo.",
        searchTerms: ["fantasía épica", "ciencia ficción", "saga histórica"],
        signals: ["Mundo complejo", "Inmersivo", "Largo recorrido"],
    },
    {
        label: "Libros que dejan resaca emocional",
        slug: "libros-que-dejan-resaca-emocional",
        description: "Lecturas intensas que se quedan dando vueltas cuando cierras el libro.",
        searchTerms: ["novela emocional", "drama familiar", "novela iniciática"],
        signals: ["Carga emocional", "Personajes memorables", "Melancolía"],
    },
    {
        label: "Para subrayar sin prisa",
        slug: "para-subrayar-sin-prisa",
        description: "Prosa cuidada, ideas con peso y libros que piden margen, lápiz y calma.",
        searchTerms: ["novela literaria", "novela filosófica", "prosa poética"],
        signals: ["Prosa cuidada", "Ritmo pausado", "Ideas"],
    },
    {
        label: "Cuando quieres una trama adictiva",
        slug: "cuando-quieres-una-trama-adictiva",
        description: "Libros de avance rápido, capítulos que empujan y ganas de leer uno más.",
        searchTerms: ["thriller", "novela negra", "misterio"],
        signals: ["Muy ágil", "Intriga", "Cliffhangers"],
    },
    {
        label: "Historias que abrazan",
        slug: "historias-que-abrazan",
        description: "Lecturas cálidas, humanas y reparadoras para volver a confiar un poco en el mundo.",
        searchTerms: ["novela feel good", "novela romántica", "novela contemporánea optimista"],
        signals: ["Cálido", "Luminoso", "Reconfortante"],
    },
    {
        label: "Universos con mapa mental",
        slug: "universos-con-mapa-mental",
        description: "Obras densas, con política interna, linajes, sistemas y muchas piezas que encajar.",
        searchTerms: ["fantasía épica", "ciencia ficción compleja", "saga fantástica"],
        signals: ["Densidad alta", "Sistema complejo", "Mapa mental"],
    },
    {
        label: "Para leer con el corazón encogido",
        slug: "para-leer-con-el-corazon-encogido",
        description: "Historias delicadas, duras o conmovedoras que se leen con un nudo dentro.",
        searchTerms: ["novela dramática", "novela histórica guerra", "drama emocional"],
        signals: ["Dolor emocional", "Intimidad", "Vulnerabilidad"],
    },
    {
        label: "Libros que se leen como un secreto",
        slug: "libros-que-se-leen-como-un-secreto",
        description: "Narraciones íntimas, misteriosas o confesionales que parecen dichas al oído.",
        searchTerms: ["novela gótica", "secreto familiar novela", "novela psicológica"],
        signals: ["Íntimo", "Misterioso", "Confesional"],
    },
    {
        label: "Para conversaciones largas",
        slug: "para-conversaciones-largas",
        description: "Libros que abren dilemas, desacuerdos y preguntas que siguen después de la sesión.",
        searchTerms: ["club de lectura novela", "novela social", "novela filosófica"],
        signals: ["Debate", "Dilemas", "Capas"],
    },
    {
        label: "Cuando necesitas belleza en cada frase",
        slug: "cuando-necesitas-belleza-en-cada-frase",
        description: "Obras donde el estilo, el ritmo de la frase y las imágenes importan tanto como la historia.",
        searchTerms: ["prosa poética", "novela lírica", "literatura contemporánea"],
        signals: ["Estilo", "Belleza", "Frase cuidada"],
    },
    {
        label: "Más experiencias",
        slug: "mas-experiencias",
        description: "Una selección amplia para seguir explorando lecturas desde sensaciones, no desde etiquetas.",
        searchTerms: ["novela literaria", "club de lectura", "narrativa contemporánea"],
        signals: ["Exploración", "Variedad", "Curaduría"],
    },
];

export function getReadingExperience(slug?: string | null) {
    if (!slug) return null;
    return readingExperiences.find((experience) => experience.slug === slug) || null;
}

export type DiscussionGuide = {
    slug: string;
    title: string;
    bookTitle: string;
    author: string;
    cover: string;
    priceLabel: string;
    badge: string;
    level: string;
    sessions: string;
    checkpoints: number;
    description: string;
    themes: string[];
    isFree?: boolean;
};

export type GuidePack = {
    slug: string;
    title: string;
    priceLabel: string;
    savingsLabel: string;
    description: string;
    guideSlugs: string[];
    tone: string;
};

export const discussionGuides: DiscussionGuide[] = [
    {
        slug: "el-tunel",
        title: "Guía de discusión de El túnel",
        bookTitle: "El túnel",
        author: "Ernesto Sábato",
        cover: "/assets/images/el_tunel_sabato.jpg",
        priceLabel: "Gratis con registro",
        badge: "Guía gratuita",
        level: "Intermedio",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Juan Pablo Castel, un pintor solitario y atormentado, narra desde la cárcel la obsesión que lo llevó a destruir a María Iribarne. Tras conocerla en una exposición, se convence de que ella es la única persona capaz de comprenderlo. Sin embargo, su amor se transforma en celos, aislamiento y desesperación, hasta desembocar en un crimen irreversible.",
        themes: ["Obsesión", "Soledad", "Celos"],
        isFree: true,
    },
    {
        slug: "1984",
        title: "Guía de discusión de 1984",
        bookTitle: "1984",
        author: "George Orwell",
        cover: "/assets/images/1984_Orwell.jpg",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Intermedio",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Una lectura guiada sobre vigilancia, lenguaje, miedo colectivo y libertad interior.",
        themes: ["Vigilancia", "Lenguaje", "Totalitarismo"],
    },
    {
        slug: "fahrenheit-451",
        title: "Guía de discusión de Fahrenheit 451",
        bookTitle: "Fahrenheit 451",
        author: "Ray Bradbury",
        cover: "/assets/images/fahrenheit_451.jpg",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Iniciación",
        sessions: "3 semanas",
        checkpoints: 3,
        description: "Preguntas para conversar sobre censura, comodidad, pensamiento crítico y felicidad impuesta.",
        themes: ["Censura", "Memoria", "Libertad"],
    },
    {
        slug: "ensayo-sobre-la-ceguera",
        title: "Guía de discusión de Ensayo sobre la ceguera",
        bookTitle: "Ensayo sobre la ceguera",
        author: "José Saramago",
        cover: "/assets/images/ensayo_saramago.jpg",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Avanzado",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Una guía para leer crisis, comunidad, crueldad, solidaridad y condición humana.",
        themes: ["Alegoría", "Crisis", "Moralidad"],
    },
    {
        slug: "el-cuento-de-la-criada",
        title: "Guía de discusión de El cuento de la criada",
        bookTitle: "El cuento de la criada",
        author: "Margaret Atwood",
        cover: "/assets/images/cuento_criada.gif",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Intermedio",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Una guía para debatir poder, control, memoria, resistencia y derechos perdidos de forma gradual.",
        themes: ["Distopía", "Poder", "Resistencia"],
    },
    {
        slug: "siddhartha",
        title: "Guía de discusión de Siddhartha",
        bookTitle: "Siddhartha",
        author: "Hermann Hesse",
        cover: "/assets/images/siddhartha_hesse.jpg",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Intermedio",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Una guía para conversar sobre búsqueda espiritual, sabiduría, experiencia y sentido de la vida.",
        themes: ["Espiritualidad", "Búsqueda", "Sabiduría"],
    },
    {
        slug: "la-muerte-de-ivan-illich",
        title: "Guía de discusión de La muerte de Iván Illich",
        bookTitle: "La muerte de Iván Illich",
        author: "León Tolstói",
        cover: "/assets/images/muerte_ivan_illich_tolstoi.jpg",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Intermedio",
        sessions: "3 semanas",
        checkpoints: 3,
        description: "Una guía para debatir mortalidad, autenticidad y el sentido de una vida frente a la muerte.",
        themes: ["Mortalidad", "Sentido", "Autenticidad"],
    },
    {
        slug: "crimen-y-castigo",
        title: "Guía de discusión de Crimen y castigo",
        bookTitle: "Crimen y castigo",
        author: "Fiódor Dostoyevski",
        cover: "/assets/images/crimen_castigo_dostoievski.jpg",
        priceLabel: "6,99 €",
        badge: "Individual",
        level: "Avanzado",
        sessions: "5 semanas",
        checkpoints: 5,
        description: "Una guía para explorar culpa, moralidad, redención y los límites de la conciencia.",
        themes: ["Culpa", "Moralidad", "Redención"],
    },
];

export const guidePacks: GuidePack[] = [
    {
        slug: "distopias-esenciales",
        title: "Pack Distopías esenciales",
        priceLabel: "18,00 €",
        savingsLabel: "Ahorra 11,97 €",
        description: "Tres guías para conversar sobre poder, vigilancia, censura y derechos que se pierden poco a poco.",
        guideSlugs: ["el-cuento-de-la-criada", "1984", "fahrenheit-451"],
        tone: "Para debates intensos",
    },
    {
        slug: "grandes-conversaciones",
        title: "Pack Grandes conversaciones",
        priceLabel: "25,00 €",
        savingsLabel: "Ahorra 14,96 €",
        description: "Cuatro guías para clubs que buscan preguntas éticas, sociales y emocionales con recorrido.",
        guideSlugs: ["el-tunel", "siddhartha", "la-muerte-de-ivan-illich", "crimen-y-castigo"],
        tone: "Para clubs que quieren profundidad",
    },
];

export function getGuidesBySlug(slugs: string[]) {
    return slugs
        .map((slug) => discussionGuides.find((guide) => guide.slug === slug))
        .filter((guide): guide is DiscussionGuide => Boolean(guide));
}

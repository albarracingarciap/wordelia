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
    pdfUrl?: string;
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
        slug: "el-cuento-de-la-criada",
        title: "Guía de discusión de El cuento de la criada",
        bookTitle: "El cuento de la criada",
        author: "Margaret Atwood",
        cover: "/assets/images/cuento_criada.gif",
        priceLabel: "Gratis con registro",
        badge: "Guía gratuita",
        level: "Intermedio",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Una guía para debatir poder, control, memoria, resistencia y derechos perdidos de forma gradual.",
        themes: ["Distopía", "Poder", "Resistencia"],
        isFree: true,
        pdfUrl: "/guides/guia_el_cuento_de_la_criada.pdf",
    },
    {
        slug: "1984",
        title: "Guía de discusión de 1984",
        bookTitle: "1984",
        author: "George Orwell",
        cover: "/assets/images/1984_Orwell.jpg",
        priceLabel: "9,90 €",
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
        priceLabel: "9,90 €",
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
        priceLabel: "9,90 €",
        badge: "Individual",
        level: "Avanzado",
        sessions: "4 semanas",
        checkpoints: 4,
        description: "Una guía para leer crisis, comunidad, crueldad, solidaridad y condición humana.",
        themes: ["Alegoría", "Crisis", "Moralidad"],
    },
];

export const guidePacks: GuidePack[] = [
    {
        slug: "distopias-esenciales",
        title: "Pack Distopías esenciales",
        priceLabel: "24,90 €",
        savingsLabel: "Ahorra 4,80 €",
        description: "Tres guías para conversar sobre poder, vigilancia, censura y derechos que se pierden poco a poco.",
        guideSlugs: ["el-cuento-de-la-criada", "1984", "fahrenheit-451"],
        tone: "Para debates intensos",
    },
    {
        slug: "grandes-conversaciones",
        title: "Pack Grandes conversaciones",
        priceLabel: "29,90 €",
        savingsLabel: "Ahorra 9,70 €",
        description: "Cuatro guías para clubs que buscan preguntas éticas, sociales y emocionales con recorrido.",
        guideSlugs: ["el-cuento-de-la-criada", "1984", "fahrenheit-451", "ensayo-sobre-la-ceguera"],
        tone: "Para clubs que quieren profundidad",
    },
];

export function getGuidesBySlug(slugs: string[]) {
    return slugs
        .map((slug) => discussionGuides.find((guide) => guide.slug === slug))
        .filter((guide): guide is DiscussionGuide => Boolean(guide));
}

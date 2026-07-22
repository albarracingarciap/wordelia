// Modelo compartido de retos de comunidad (cliente/servidor).

export type ChallengeGoalType = "books" | "genre" | "pages";

export const CHALLENGE_GOAL_TYPES: { value: ChallengeGoalType; label: string }[] = [
    { value: "books", label: "Nº de libros leídos" },
    { value: "genre", label: "Libros de un género concreto" },
    { value: "pages", label: "Páginas leídas" },
];

/** Descripción legible del objetivo de un reto. */
export function challengeGoalLabel(type: string | null | undefined, target: number | null | undefined, genre: string | null | undefined): string {
    const n = target ?? 0;
    if (type === "books") return `Leer ${n} ${n === 1 ? "libro" : "libros"}`;
    if (type === "genre") return `Leer ${n} ${n === 1 ? "libro" : "libros"} de ${genre?.trim() || "un género"}`;
    if (type === "pages") return `Leer ${n.toLocaleString("es-ES")} páginas`;
    return "Reto de lectura";
}

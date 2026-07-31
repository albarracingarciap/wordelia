// Modelo compartido de retos de comunidad (cliente/servidor).

export type ChallengeGoalType = "books" | "genre" | "pages" | "manual";

export const CHALLENGE_GOAL_TYPES: { value: ChallengeGoalType; label: string }[] = [
    { value: "books", label: "Nº de libros leídos" },
    { value: "genre", label: "Libros de un género concreto" },
    { value: "pages", label: "Páginas leídas" },
    { value: "manual", label: "Selección manual de libros (temático)" },
];

/** ¿El reto se cuenta marcando libros a mano (curado) en vez de por regla automática? */
export function isManualChallenge(type: string | null | undefined): boolean {
    return type === "manual";
}

/** Descripción legible del objetivo de un reto. */
export function challengeGoalLabel(type: string | null | undefined, target: number | null | undefined, genre: string | null | undefined): string {
    const n = target ?? 0;
    if (type === "books") return `Leer ${n} ${n === 1 ? "libro" : "libros"}`;
    if (type === "genre") return `Leer ${n} ${n === 1 ? "libro" : "libros"} de ${genre?.trim() || "un género"}`;
    if (type === "pages") return `Leer ${n.toLocaleString("es-ES")} páginas`;
    if (type === "manual") return `Elegir ${n} ${n === 1 ? "libro" : "libros"} a tu criterio`;
    return "Reto de lectura";
}

// Metas secundarias del año lector. Cada una es "auto" (se verifica sola desde
// tus lecturas del año) o "manual" (la marcas tú). Compartido cliente/servidor.

export type SecondaryGoalType = "auto" | "manual";

export interface SecondaryGoalDef {
    key: string;
    label: string;
    type: SecondaryGoalType;
    hint?: string;
}

export const SECONDARY_GOALS: SecondaryGoalDef[] = [
    { key: "genres3", label: "Leer al menos 3 géneros diferentes", type: "auto", hint: "Se marca sola al leer libros de 3 géneros distintos este año." },
    { key: "pages500", label: "Leer un libro de más de 500 páginas", type: "auto", hint: "Se marca sola al terminar un libro de +500 páginas este año." },
    { key: "published_this_year", label: "Leer un libro publicado este año", type: "auto", hint: "Se marca sola al leer un libro publicado este mismo año." },
    { key: "countries5", label: "Explorar autores de 5 países", type: "manual" },
    { key: "classic", label: "Leer 1 clásico universal", type: "manual" },
    { key: "continent", label: "Leer un autor de un continente diferente", type: "manual" },
    { key: "reread", label: "Releer un libro favorito", type: "manual" },
];

export const SECONDARY_GOAL_BY_KEY: Record<string, SecondaryGoalDef> =
    Object.fromEntries(SECONDARY_GOALS.map((g) => [g.key, g]));

// Mapea etiquetas antiguas (cuando se guardaban como texto) a las nuevas keys,
// para no perder selecciones previas.
const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(SECONDARY_GOALS.map((g) => [g.label, g.key]));

export function normalizeSecondaryKeys(stored: unknown): string[] {
    if (!Array.isArray(stored)) return [];
    const keys = stored
        .map((v) => (typeof v === "string" ? (SECONDARY_GOAL_BY_KEY[v] ? v : LABEL_TO_KEY[v]) : null))
        .filter((k): k is string => Boolean(k));
    return Array.from(new Set(keys));
}

export interface SecondaryGoalStatus {
    key: string;
    label: string;
    type: SecondaryGoalType;
    done: boolean;
}

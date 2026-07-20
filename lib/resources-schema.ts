// Esquema compartido (client-safe) de guías y genomas: claves canónicas y
// normalizadores para importar JSON generado por el script externo. Lo usan la
// F2 (import) y lo usarán F3/F4 (editores). Sin imports de servidor.

// --- Genoma (book_literary_chromosomes) ------------------------------------

export const CHROMOSOME_KEYS = [
    "narrative_structure",
    "literary_style",
    "emotional_profile",
    "thematic_composition",
    "character_dna",
    "rhythm_density",
    "linguistic_complexity",
    "cultural_context",
] as const;

export type ChromosomeKey = (typeof CHROMOSOME_KEYS)[number];

export const CHROMOSOME_LABELS: Record<string, string> = {
    narrative_structure: "Estructura narrativa",
    literary_style: "Estilo literario",
    emotional_profile: "Perfil emocional",
    thematic_composition: "Composición temática",
    character_dna: "ADN de personajes",
    rhythm_density: "Ritmo y densidad",
    linguistic_complexity: "Complejidad lingüística",
    cultural_context: "Contexto cultural",
};

export function chromosomeLabel(key: string): string {
    return CHROMOSOME_LABELS[key] ?? key;
}

export interface GenomeImportRow {
    chromosome_key: string;
    chromosome_data: any;
}

/**
 * Normaliza un JSON de genoma importado a filas {chromosome_key, chromosome_data}.
 * Acepta: objeto agregado {clave: data} (lo que consume el render), array de
 * {chromosome_key, chromosome_data|...}, o esos mismos envueltos en genome/data/etc.
 */
export function normalizeGenomeImport(parsed: any): { rows: GenomeImportRow[]; unknownKeys: string[] } {
    let src = parsed;
    if (src && typeof src === "object" && !Array.isArray(src)) {
        for (const wrap of ["genome", "genoma", "chromosomes", "cromosomas", "data", "payload"]) {
            if (src[wrap] && typeof src[wrap] === "object") {
                src = src[wrap];
                break;
            }
        }
    }

    const known = new Set<string>(CHROMOSOME_KEYS);
    const rows: GenomeImportRow[] = [];
    const unknownKeys: string[] = [];

    if (Array.isArray(src)) {
        for (const item of src) {
            const key = item?.chromosome_key ?? item?.key ?? null;
            if (typeof key !== "string") continue;
            if (known.has(key)) rows.push({ chromosome_key: key, chromosome_data: item.chromosome_data ?? item });
            else unknownKeys.push(key);
        }
    } else if (src && typeof src === "object") {
        for (const [key, val] of Object.entries(src)) {
            if (known.has(key)) rows.push({ chromosome_key: key, chromosome_data: val });
            else unknownKeys.push(key);
        }
    }

    return { rows, unknownKeys };
}

// --- Guía (book_guides.discussion_guide) -----------------------------------

export const GUIDE_SECTIONS: { key: string; label: string }[] = [
    { key: "metadata", label: "Metadatos" },
    { key: "cabecera", label: "Cabecera" },
    { key: "como_usar_guia", label: "Cómo usar la guía" },
    { key: "obra_y_contexto", label: "Obra y contexto" },
    { key: "mapa_discusion_rutas", label: "Rutas de discusión" },
    { key: "preguntas_poderosas", label: "Preguntas poderosas" },
    { key: "personajes_tarjetas", label: "Personajes" },
    { key: "simbolos_y_motivos", label: "Símbolos y motivos" },
    { key: "estructura_y_final", label: "Estructura y final" },
    { key: "conexiones_mundo_actual", label: "Conexiones con la actualidad" },
    { key: "actividades_dinamizar", label: "Actividades" },
    { key: "cierre_discusion", label: "Cierre de la discusión" },
    { key: "notas_moderador_salvavidas", label: "Notas del moderador" },
];

/** Desenvuelve un JSON de guía si viene envuelto (discussion_guide/guide/content…). */
export function unwrapGuidePayload(parsed: any): any {
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const wrap of ["discussion_guide", "guide", "guide_data", "content", "data", "payload"]) {
            if (parsed[wrap] && typeof parsed[wrap] === "object") return parsed[wrap];
        }
    }
    return parsed;
}

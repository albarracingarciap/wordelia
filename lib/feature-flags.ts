// Feature flags de la plataforma (fila `flags` de app_settings). Client-safe: sin
// imports de servidor, para que el nav y otras superficies de cliente puedan
// consumirlo. La lectura server vive en lib/app-settings.ts (getAppSettings).

export interface FeatureFlags {
    /** Asistente literario IA (plan Bibliófilo). Reservado: la feature aún no existe. */
    asistente_ia: boolean;
    /** Espacio para librerías (clubs alojados). Controla ruta y enlace de nav. */
    librerias: boolean;
    /** Registro abierto. Si false, la acción signup rechaza nuevas altas. */
    registro_abierto: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    asistente_ia: false,
    librerias: true,
    registro_abierto: true,
};

/** Mezcla un value jsonb (posiblemente parcial/ausente) con los defaults. */
export function mergeFlags(value: unknown): FeatureFlags {
    if (value && typeof value === "object") {
        return { ...DEFAULT_FEATURE_FLAGS, ...(value as Partial<FeatureFlags>) };
    }
    return DEFAULT_FEATURE_FLAGS;
}

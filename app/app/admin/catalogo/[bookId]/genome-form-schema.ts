// Esquema de la ENVOLTURA de un cromosoma del genoma (F4). Común a los 8. El
// bloque `analisis` (profundo y distinto por cromosoma) se edita como JSON aparte.
import type { SectionSpec } from "./guide-form-schema";

export const GENOME_WRAPPER_SPEC: SectionSpec = {
    key: "wrapper",
    label: "Envoltura",
    kind: "object",
    fields: [
        { key: "nombre", label: "Nombre del cromosoma", type: "text" },
        {
            key: "visualizacion",
            label: "Visualización",
            type: "group",
            fields: [
                { key: "descripcion_corta", label: "Descripción corta", type: "textarea" },
                { key: "puntuacion_global", label: "Puntuación global (0–10)", type: "number" },
                { key: "caracteristicas_destacadas", label: "Características destacadas", type: "stringList" },
            ],
        },
        {
            key: "metadata",
            label: "Metadatos",
            type: "group",
            fields: [
                { key: "confianza", label: "Confianza (0–1, % o texto)", type: "text" },
                { key: "fecha_analisis", label: "Fecha de análisis", type: "text" },
                { key: "version_analisis", label: "Versión del análisis", type: "text" },
            ],
        },
    ],
};

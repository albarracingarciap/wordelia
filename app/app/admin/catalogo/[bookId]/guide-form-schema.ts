// Esquema de formulario para el editor estructurado de la GUÍA (F3). Dirige un
// renderer genérico (GuideFields). Cada sección declara su "kind" y sus campos.
// Las secciones con formas variantes/anidadas (como_usar_guia, preguntas_poderosas,
// estructura_y_final) usan kind:"raw" (editor JSON) como escotilla, para no dejar
// nada sin editar. El orden refleja GUIDE_SECTIONS de lib/resources-schema.

export type SimpleFieldType = "text" | "textarea" | "number" | "stringList";

export interface SimpleField {
    key: string;
    label: string;
    type: SimpleFieldType;
    placeholder?: string;
}

export type SectionField = SimpleField | { key: string; label: string; type: "group"; fields: SimpleField[] };

export type SectionSpec =
    | { key: string; label: string; kind: "object"; fields: SectionField[] }
    | { key: string; label: string; kind: "objectList"; itemLabel: string; itemFields: SimpleField[] }
    | { key: string; label: string; kind: "stringList"; itemLabel?: string }
    | { key: string; label: string; kind: "raw"; note?: string };

export const GUIDE_FORM_SECTIONS: SectionSpec[] = [
    {
        key: "metadata",
        label: "Metadatos",
        kind: "object",
        fields: [
            { key: "marca", label: "Marca", type: "text" },
            { key: "tipo_documento", label: "Tipo de documento", type: "text" },
            { key: "instrucciones_formato", label: "Instrucciones de formato", type: "textarea" },
        ],
    },
    {
        key: "cabecera",
        label: "Cabecera",
        kind: "object",
        fields: [
            { key: "titulo_libro", label: "Título del libro", type: "text" },
            { key: "autor", label: "Autor", type: "text" },
            { key: "ano_publicacion", label: "Año de publicación", type: "text" },
            { key: "conceptos_clave", label: "Conceptos clave", type: "stringList" },
            { key: "idea_central_apertura", label: "Idea central de apertura", type: "textarea" },
        ],
    },
    { key: "como_usar_guia", label: "Cómo usar la guía", kind: "raw", note: "Estructura anidada con variantes de formato." },
    {
        key: "obra_y_contexto",
        label: "Obra y contexto",
        kind: "object",
        fields: [
            { key: "resumen_analitico", label: "Resumen analítico (párrafos)", type: "stringList" },
            { key: "clave_de_lectura", label: "Clave de lectura", type: "textarea" },
            { key: "contexto_creacion_ecos_historicos", label: "Contexto y ecos históricos (párrafos)", type: "stringList" },
        ],
    },
    {
        key: "mapa_discusion_rutas",
        label: "Rutas de discusión",
        kind: "objectList",
        itemLabel: "Ruta",
        itemFields: [
            { key: "eje_numero", label: "Nº de eje", type: "text" },
            { key: "titulo", label: "Título", type: "text" },
            { key: "linea_conceptual", label: "Línea conceptual", type: "textarea" },
            { key: "preguntas_analiticas", label: "Preguntas analíticas", type: "stringList" },
        ],
    },
    { key: "preguntas_poderosas", label: "Preguntas poderosas", kind: "raw", note: "Bloques temáticos con claves dinámicas." },
    {
        key: "personajes_tarjetas",
        label: "Personajes",
        kind: "objectList",
        itemLabel: "Personaje",
        itemFields: [
            { key: "nombre", label: "Nombre", type: "text" },
            { key: "analisis", label: "Análisis", type: "textarea" },
            { key: "pregunta_discusion", label: "Pregunta de discusión", type: "textarea" },
        ],
    },
    {
        key: "simbolos_y_motivos",
        label: "Símbolos y motivos",
        kind: "objectList",
        itemLabel: "Símbolo",
        itemFields: [
            { key: "simbolo", label: "Símbolo", type: "text" },
            { key: "lectura_posible", label: "Lectura posible", type: "textarea" },
        ],
    },
    { key: "estructura_y_final", label: "Estructura y final", kind: "raw", note: "Campos con formas variantes." },
    { key: "conexiones_mundo_actual", label: "Conexiones con la actualidad", kind: "stringList", itemLabel: "Conexión" },
    {
        key: "actividades_dinamizar",
        label: "Actividades",
        kind: "objectList",
        itemLabel: "Actividad",
        itemFields: [
            { key: "nombre_actividad", label: "Nombre de la actividad", type: "text" },
            { key: "descripcion_detallada", label: "Descripción detallada", type: "textarea" },
        ],
    },
    {
        key: "cierre_discusion",
        label: "Cierre de la discusión",
        kind: "object",
        fields: [
            { key: "pregunta_sintesis", label: "Pregunta de síntesis", type: "textarea" },
            { key: "pregunta_vigencia", label: "Pregunta de vigencia", type: "textarea" },
            { key: "evaluacion_relevancia", label: "Evaluación de relevancia", type: "textarea" },
            {
                key: "frase_salida",
                label: "Frase de salida",
                type: "group",
                fields: [
                    { key: "texto", label: "Texto", type: "textarea" },
                    { key: "fuente", label: "Fuente", type: "text" },
                ],
            },
        ],
    },
    {
        key: "notas_moderador_salvavidas",
        label: "Notas del moderador",
        kind: "objectList",
        itemLabel: "Nota",
        itemFields: [
            { key: "situacion", label: "Situación", type: "text" },
            { key: "intervencion_sugerida", label: "Intervención sugerida", type: "textarea" },
        ],
    },
];

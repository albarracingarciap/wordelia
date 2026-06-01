export const chromosomeTabs = [
    { key: "narrative_structure", label: "Estructura narrativa" },
    { key: "literary_style", label: "Estilo literario" },
    { key: "emotional_profile", label: "Perfil emocional" },
    { key: "thematic_composition", label: "Composición de temas" },
    { key: "character_dna", label: "ADN de personajes" },
    { key: "rhythm_density", label: "Ritmo y densidad" },
    { key: "linguistic_complexity", label: "Complejidad lingüística" },
    { key: "cultural_context", label: "Contexto cultural" },
] as const;

export type ChromosomeKey = (typeof chromosomeTabs)[number]["key"];
export type NarrativeChromosome = typeof narrativeStructureChromosome;

export const narrativeStructureChromosome = {
    libro: {
        año: 1995,
        autor: "José Saramago",
        titulo: "Ensayo sobre la ceguera",
    },
    nombre: "Estructura Narrativa",
    analisis: {
        puntos_giro: [
            {
                tipo: "incidente_incitador",
                numero: 1,
                titulo: "Inicio de la ceguera",
                ubicacion: { capitulo: null, porcentaje: 10 },
                descripcion:
                    "El primer caso de ceguera blanca ocurre en un hombre en un semáforo, marcando el inicio de la epidemia.",
                importancia: 10,
            },
            {
                tipo: "primer_punto_giro",
                numero: 2,
                titulo: "Internamiento en el manicomio",
                ubicacion: { capitulo: null, porcentaje: 30 },
                descripcion:
                    "Los afectados por la ceguera son internados en un manicomio abandonado, donde las condiciones se deterioran rápidamente.",
                importancia: 9,
            },
            {
                tipo: "punto_medio",
                numero: 3,
                titulo: "Formación de una comunidad",
                ubicacion: { capitulo: null, porcentaje: 60 },
                descripcion:
                    "Los personajes principales forman una comunidad para sobrevivir, destacando la solidaridad en medio del caos.",
                importancia: 8,
            },
            {
                tipo: "segundo_punto_giro",
                numero: 4,
                titulo: "Incendio y escape",
                ubicacion: { capitulo: null, porcentaje: 80 },
                descripcion:
                    "Un incendio en el manicomio lleva a los personajes a escapar y enfrentarse al mundo exterior caótico.",
                importancia: 9,
            },
            {
                tipo: "resolucion",
                numero: 5,
                titulo: "Recuperación de la vista",
                ubicacion: { capitulo: null, porcentaje: 95 },
                descripcion:
                    "La ceguera comienza a desaparecer tan misteriosamente como llegó, marcando el inicio de la recuperación.",
                importancia: 10,
            },
        ],
        division_formal: {
            capitulos: 0,
            notas_adicionales:
                "La falta de capítulos y la estructura de párrafos largos son características distintivas del estilo de Saramago.",
            longitud_capitulos: "muy_variable",
            partes_principales: 1,
            capitulos_con_titulo: false,
            patrones_estructurales:
                "La novela está dividida en párrafos extensos sin capítulos tradicionales, lo que refleja la fluidez y continuidad de la experiencia de la ceguera.",
        },
        ritmo_narrativo: {
            inicio: "moderado",
            desarrollo: "creciente",
            resolucion: "moderada",
            descripcion:
                "El ritmo narrativo es constante pero con una variación notable en los momentos de mayor tensión y caos.",
            variacion_ritmo: 6,
            ubicacion_climax: 85,
            velocidad_general: 7,
        },
        tipo_estructura: {
            principal: "lineal_cronologica",
            secundarios: ["fragmentada_no_lineal"],
        },
        lineas_argumentales: {
            principales: 1,
            secundarias: 3,
            descripcion_tramas:
                "La trama principal sigue la propagación de una ceguera blanca en una ciudad sin nombre y sus consecuencias sociales. Las tramas secundarias exploran las experiencias individuales de varios personajes y sus luchas por sobrevivir en un mundo caótico.",
            nivel_entrelazamiento: 7,
        },
        perspectiva_narrativa: {
            otras: [],
            principal: "tercera_persona_omnisciente",
            narrador_confiable: true,
            cambios_perspectiva: false,
        },
        complejidad_estructural: {
            nivel: "compleja",
            factores: [
                "Uso de una narrativa no lineal en ciertos segmentos",
                "Múltiples personajes con arcos narrativos significativos",
                "Exploración de temas filosóficos y sociales",
                "Estructura de párrafos largos y diálogos integrados sin marcas tradicionales",
            ],
            puntuacion: 8,
        },
    },
    metadata: {
        confianza: 0.95,
        fecha_analisis: "2023-10-01",
        version_analisis: 1,
    },
    cromosoma: 1,
    visualizacion: {
        descripcion_corta:
            "Estructura narrativa compleja con una perspectiva omnisciente y un ritmo constante pero variable en momentos clave.",
        puntuacion_global: 9,
        caracteristicas_destacadas: [
            "Uso de una narrativa no lineal en ciertos segmentos",
            "Múltiples personajes con arcos narrativos significativos",
            "Estructura de párrafos largos y diálogos integrados sin marcas tradicionales",
        ],
    },
};

export const literaryStyleChromosome = {
    libro: {
        año: 1995,
        autor: "José Saramago",
        titulo: "Ensayo sobre la ceguera",
    },
    nombre: "Estilo Literario",
    analisis: {
        ritmo_prosa: {
            cadencia: "variable",
            descripcion:
                "El ritmo de la prosa es variable, con una cadencia que oscila entre lo fluido y lo entrecortado, y una musicalidad que refleja la complejidad de la narrativa.",
            musicalidad: 7,
            uso_repeticiones: "frecuente",
            longitud_parrafos: "largos",
        },
        tono_general: {
            seriedad: { descriptor: "muy serio", puntuacion: 9 },
            optimismo: { descriptor: "pesimista", puntuacion: 2 },
            descripcion:
                "El tono general de la obra es oscuro y pesimista, con una intensidad emocional que refleja la gravedad de la situación descrita en la narrativa.",
            luminosidad: { descriptor: "sombrío", puntuacion: 3 },
            emocionalidad: { descriptor: "intenso", puntuacion: 8 },
            tono_predominante: "oscuro intenso",
        },
        figuras_retoricas: {
            ranking: [
                {
                    nombre: "ironia",
                    frecuencia: 8,
                    ejemplo_tipo:
                        "La ironía se utiliza para resaltar la crueldad y la absurdidad de la condición humana.",
                },
                {
                    nombre: "metafora",
                    frecuencia: 7,
                    ejemplo_tipo: "La ceguera como metáfora de la ignorancia y la falta de empatía.",
                },
                {
                    nombre: "simil",
                    frecuencia: 6,
                    ejemplo_tipo: "Comparaciones que resaltan la desesperación y el caos.",
                },
            ],
            descripcion:
                "Saramago emplea una variedad de figuras retóricas para enriquecer su narrativa, con un uso notable de la ironía y la metáfora.",
        },
        longitud_oraciones: {
            variacion: "muy_variable",
            descripcion:
                "Las oraciones en la obra de Saramago son notablemente largas y complejas, con una estructura que a menudo incluye múltiples cláusulas subordinadas. Este estilo contribuye a la profundidad y la riqueza del texto.",
            predominancia: "largas",
            uso_subordinadas: "muy_frecuente",
            puntuacion_complejidad: 9,
            promedio_palabras_oracion: 30,
        },
        densidad_descriptiva: {
            nivel: "rica",
            puntuacion: 7,
            descripcion:
                "La descripción en 'Ensayo sobre la ceguera' es detallada y evocadora, con un enfoque particular en la psicología de los personajes y la atmósfera opresiva de la narrativa.",
            tipos_descripcion: {
                fisica: 8,
                sensorial: 7,
                atmosferica: 8,
                psicologica: 9,
            },
        },
        registro_linguistico: {
            principal: "formal",
            descripcion:
                "El registro lingüístico es principalmente formal, con incursiones en el lenguaje coloquial y literario para reflejar la diversidad de los personajes y las situaciones.",
            secundarios: ["colloquial", "literario"],
            caracteristicas_especiales: {
                anacronismos: false,
                regionalismos: false,
                jerga_especifica: false,
                lenguaje_inventado: false,
            },
        },
        complejidad_vocabulario: {
            nivel: "rico",
            puntuacion: 8,
            descripcion:
                "El vocabulario de Saramago es rico y variado, con un uso frecuente de términos precisos y un lenguaje que refleja una profunda reflexión filosófica y existencial.",
            caracteristicas: {
                neologismos: false,
                vocabulario_arcaico: false,
                terminos_especializados: false,
                nivel_educativo_requerido: "universitario",
            },
            ejemplos_vocabulario: ["ceguera", "epidemia", "humanidad", "caos", "supervivencia"],
            porcentaje_palabras_dificiles: 15,
        },
        proporcion_dialogo_narracion: {
            descripcion:
                "El diálogo en la obra es naturalista y refleja la diversidad de los personajes. La narración es predominante, con una notable cantidad de reflexión interna que profundiza en la psicología de los personajes.",
            estilo_dialogo: "naturalista",
            dialogo_porcentaje: 40,
            narracion_porcentaje: 50,
            reflexion_interna_porcentaje: 10,
        },
    },
    metadata: {
        confianza: 0.95,
        fecha_analisis: "2023-10-01",
        version_analisis: "1.0",
    },
    cromosoma: 2,
    visualizacion: {
        descripcion_corta: "Estilo literario rico y complejo, con una prosa detallada y evocadora.",
        puntuacion_global: 8,
        caracteristicas_destacadas: [
            "Vocabulario rico y variado",
            "Oraciones largas y complejas",
            "Descripción detallada y evocadora",
            "Tono oscuro e intenso",
            "Uso frecuente de figuras retóricas",
        ],
    },
};

export type LiteraryStyleChromosome = typeof literaryStyleChromosome;

export const emotionalProfileChromosome = {
    libro: {
        año: 1995,
        autor: "José Saramago",
        titulo: "Ensayo sobre la ceguera",
    },
    nombre: "Perfil Emocional",
    analisis: {
        tipo_final: {
            descripcion: "El final es abierto y ambiguo, dejando al lector con una mezcla de tristeza y esperanza.",
            clasificacion: "abierto_ambiguo",
            nivel_catarsis: 8,
            intensidad_climax: 10,
            satisfaccion_emocional: 6,
        },
        tipo_tension: {
            ranking: [
                {
                    tipo: "psicologica",
                    puntuacion: 9,
                    descripcion:
                        "La tensión psicológica es constante debido a la pérdida de visión y la incertidumbre.",
                },
                {
                    tipo: "emocional",
                    puntuacion: 8,
                    descripcion:
                        "La tensión emocional es alta debido a las relaciones y conflictos entre los personajes.",
                },
                {
                    tipo: "social",
                    puntuacion: 7,
                    descripcion:
                        "La tensión social surge del colapso de la sociedad y la lucha por la supervivencia.",
                },
                {
                    tipo: "fisica",
                    puntuacion: 6,
                    descripcion: "La tensión física es evidente en las escenas de violencia y peligro.",
                },
                {
                    tipo: "existencial",
                    puntuacion: 5,
                    descripcion:
                        "La tensión existencial se refleja en la reflexión sobre la condición humana.",
                },
                {
                    tipo: "intelectual",
                    puntuacion: 4,
                    descripcion:
                        "La tensión intelectual es menor, pero presente en la búsqueda de soluciones y comprensión.",
                },
            ],
            dominante: "psicologica",
        },
        curva_emocional: {
            segmentos: [
                {
                    nombre: "inicio",
                    intensidad: 4,
                    descripcion: "Introducción a la premisa de la ceguera repentina y la confusión inicial.",
                    porcentaje_fin: 10,
                    porcentaje_inicio: 0,
                },
                {
                    nombre: "desarrollo",
                    intensidad: 6,
                    descripcion:
                        "Aumento de la tensión a medida que la ceguera se propaga y la sociedad comienza a colapsar.",
                    porcentaje_fin: 50,
                    porcentaje_inicio: 11,
                },
                {
                    nombre: "climax_preparacion",
                    intensidad: 8,
                    descripcion:
                        "La situación se vuelve más caótica y peligrosa, preparando el terreno para el clímax.",
                    porcentaje_fin: 75,
                    porcentaje_inicio: 51,
                },
                {
                    nombre: "climax",
                    intensidad: 10,
                    descripcion: "Punto máximo de tensión y conflicto, con escenas de violencia y desesperación.",
                    porcentaje_fin: 90,
                    porcentaje_inicio: 76,
                },
                {
                    nombre: "resolucion",
                    intensidad: 5,
                    descripcion: "Resolución de la trama con un final abierto y reflexivo.",
                    porcentaje_fin: 100,
                    porcentaje_inicio: 91,
                },
            ],
            grafica_puntos: [
                { x: 0, y: 4 },
                { x: 25, y: 6 },
                { x: 50, y: 8 },
                { x: 75, y: 10 },
                { x: 90, y: 8 },
                { x: 100, y: 5 },
            ],
            patron_general: "creciente_con_climax_intenso",
        },
        impacto_en_lectores: {
            descripcion:
                "La novela deja una profunda impresión emocional en los lectores, con una alta probabilidad de perturbación y resonancia duradera.",
            emotividad_general: 9,
            nivel_perturbacion: 8,
            probabilidad_llorar: 7,
            resonancia_duradera: 9,
            dificultad_emocional: 7,
        },
        elementos_especificos: {
            humor: { tipo: "ninguno", presente: false, frecuencia: 0 },
            horror: { tipo: "psicológico", presente: true, intensidad: 8 },
            romance: { presente: true, intensidad: 5 },
            nostalgia: 7,
            alivio_comico: 1,
            tension_sexual: 3,
            momentos_sublimes: 5,
            violencia_emocional: 9,
        },
        emociones_predominantes: [
            {
                emocion: "miedo",
                ranking: 1,
                momentos_clave: ["La propagación de la ceguera", "El colapso de la sociedad", "La violencia en el manicomio"],
                intensidad_promedio: 8,
                porcentaje_presencia: 40,
            },
            {
                emocion: "tristeza",
                ranking: 2,
                momentos_clave: ["La pérdida de la visión", "La desesperación de los personajes", "La reflexión final"],
                intensidad_promedio: 7,
                porcentaje_presencia: 30,
            },
            {
                emocion: "disgusto",
                ranking: 3,
                momentos_clave: ["Las condiciones insalubres", "La degradación moral", "La violencia y el abuso"],
                intensidad_promedio: 6,
                porcentaje_presencia: 20,
            },
        ],
        momentos_emocionales_clave: [
            {
                numero: 1,
                titulo: "La primera ceguera",
                emociones: ["sorpresa", "miedo"],
                intensidad: 7,
                descripcion: "El primer caso de ceguera repentina marca el inicio de la crisis.",
                tipo_evento: "transgresion",
                ubicacion_porcentaje: 5,
            },
            {
                numero: 2,
                titulo: "El internamiento",
                emociones: ["miedo", "tristeza"],
                intensidad: 8,
                descripcion: "Los afectados son internados en un manicomio, aumentando la tensión.",
                tipo_evento: "revelacion",
                ubicacion_porcentaje: 20,
            },
            {
                numero: 3,
                titulo: "El colapso social",
                emociones: ["miedo", "disgusto"],
                intensidad: 9,
                descripcion: "La sociedad comienza a colapsar debido a la propagación de la ceguera.",
                tipo_evento: "catastrofe",
                ubicacion_porcentaje: 40,
            },
            {
                numero: 4,
                titulo: "La violencia en el manicomio",
                emociones: ["miedo", "ira"],
                intensidad: 10,
                descripcion: "Escenas de violencia y abuso en el manicomio, punto máximo de tensión.",
                tipo_evento: "destruccion",
                ubicacion_porcentaje: 60,
            },
            {
                numero: 5,
                titulo: "La reflexión final",
                emociones: ["tristeza", "esperanza"],
                intensidad: 6,
                descripcion: "Reflexión sobre la condición humana y la posibilidad de recuperación.",
                tipo_evento: "victoria_temporal",
                ubicacion_porcentaje: 95,
            },
        ],
    },
    metadata: {
        confianza: 95,
        fecha_analisis: "2023-10-01",
        version_analisis: "1.0",
    },
    cromosoma: 3,
    visualizacion: {
        descripcion_corta:
            "Una obra maestra de la literatura que explora la condición humana a través de una premisa impactante.",
        puntuacion_global: 9,
        caracteristicas_destacadas: [
            "Tensión psicológica constante",
            "Profundidad emocional",
            "Reflexión existencial",
            "Final abierto y ambiguo",
        ],
    },
};

export type EmotionalProfileChromosome = typeof emotionalProfileChromosome;

export const thematicCompositionChromosome = {
    libro: {
        año: 1995,
        autor: "José Saramago",
        titulo: "Ensayo sobre la ceguera",
    },
    nombre: "Composición Temática",
    analisis: {
        ambiguedad_moral: {
            nivel: "compleja",
            puntuacion: 8,
            descripcion:
                "La novela presenta situaciones donde los límites entre el bien y el mal se desdibujan, dejando al lector con preguntas sin resolver.",
            complejidad_personajes:
                "Los personajes muestran una mezcla de altruismo y egoísmo, reflejando la complejidad moral de la naturaleza humana.",
            dilemas_sin_resolucion: true,
        },
        temas_principales: [
            {
                nombre: "La ceguera como metáfora de la condición humana",
                ranking: 1,
                presencia: 10,
                desarrollo: {
                    evolucion:
                        "La sociedad se desmorona a medida que la ceguera se extiende, revelando la fragilidad de las estructuras sociales.",
                    resolucion: "La recuperación de la vista no garantiza la recuperación de la humanidad perdida.",
                    introduccion:
                        "La ceguera comienza a propagarse entre los personajes, causando caos y desorden.",
                },
                descripcion:
                    "La ceguera blanca que afecta a los personajes simboliza la ignorancia, la indiferencia y la pérdida de humanidad en la sociedad.",
                profundidad: 9,
                palabras_clave: ["ceguera", "humanidad", "condición humana", "metáfora"],
                manifestaciones: {
                    simbolos: ["la ceguera blanca", "la ciudad en ruinas"],
                    personajes: ["el médico", "la mujer del médico", "el niño estrábico"],
                    eventos_clave: ["la cuarentena", "el incendio", "la lucha por la comida"],
                },
            },
        ],
        temas_secundarios: [
            {
                nombre: "La fragilidad de la civilización",
                presencia: 8,
                descripcion:
                    "La novela explora cómo rápidamente se desmorona la civilización ante una crisis extrema.",
            },
            {
                nombre: "La solidaridad y la crueldad humana",
                presencia: 7,
                descripcion:
                    "Se contrastan actos de solidaridad y crueldad entre los personajes, mostrando la dualidad de la naturaleza humana.",
            },
        ],
        relevancia_temporal: {
            descripcion:
                "La obra aborda temas universales como la fragilidad de la civilización y la naturaleza humana, que son relevantes en cualquier época.",
            universalidad: 9,
            temas_profeticos: ["pandemias", "colapso social"],
            relevancia_actual: 10,
            refleja_epoca_creacion: true,
        },
        profundidad_filosofica: {
            nivel: "muy_profunda",
            puntuacion: 9,
            descripcion:
                "La obra plantea preguntas profundas sobre la naturaleza humana, la moralidad y la sociedad, invitando a una reflexión existencial y política.",
            corrientes_filosoficas: ["existencialismo", "filosofia_politica"],
        },
        critica_social_politica: {
            estilo: "sutil",
            presente: true,
            intensidad: 8,
            descripcion:
                "La novela critica la indiferencia social y la corrupción política, mostrando cómo estas contribuyen al colapso de la sociedad.",
            objetivo_critica: ["la indiferencia social", "la corrupción política"],
            propone_alternativas: false,
        },
        interconexiones_tematicas: {
            tema_central: "La ceguera como metáfora de la condición humana",
            temas_en_tension: [
                {
                    tema1: "Solidaridad",
                    tema2: "Crueldad",
                    tension:
                        "La tensión entre la solidaridad y la crueldad humana se explora a través de las acciones de los personajes.",
                },
            ],
            temas_complementarios: [
                {
                    tema1: "La ceguera",
                    tema2: "La fragilidad de la civilización",
                    relacion:
                        "La ceguera desencadena el colapso de la civilización, mostrando su fragilidad.",
                },
            ],
        },
    },
    metadata: {
        confianza: 0.95,
        fecha_analisis: "2023-10-04",
        version_analisis: "1.0",
    },
    cromosoma: 4,
    visualizacion: {
        nube_tematica: [
            { peso: 10, tema: "CEGUERA" },
            { peso: 9, tema: "HUMANIDAD" },
            { peso: 8, tema: "CIVILIZACIÓN" },
            { peso: 7, tema: "SOLIDARIDAD" },
            { peso: 7, tema: "CRUELDAD" },
        ],
        descripcion_corta:
            "Una obra maestra que explora la condición humana a través de una metáfora poderosa y perturbadora.",
        puntuacion_global: 9,
        caracteristicas_destacadas: ["metáfora poderosa", "reflexión profunda", "crítica social"],
    },
};

export type ThematicCompositionChromosome = typeof thematicCompositionChromosome;

export const characterDnaChromosome = {
    libro: { año: 1995, autor: "José Saramago", titulo: "Ensayo sobre la ceguera" },
    nombre: "ADN de Personajes",
    analisis: {
        arquetipos: [
            {
                arquetipo: "heroe_tragico",
                personaje: "Médico",
                subversion: false,
                descripcion:
                    "El médico encarna el arquetipo del héroe trágico, enfrentando una caída desde una posición de respeto y autoridad a una de lucha por la supervivencia.",
            },
            {
                arquetipo: "heroe",
                personaje: "Esposa del médico",
                subversion: true,
                descripcion:
                    "La esposa del médico subvierte el arquetipo tradicional del héroe, mostrando fortaleza y liderazgo en un contexto de vulnerabilidad y caos.",
            },
        ],
        diversidad: {
            edad: { ancianos: 10, mediana_edad: 30, jovenes_adultos: 50, ninos_adolescentes: 10 },
            genero: {
                notas:
                    "La representación de género es mayoritariamente masculina, con personajes femeninos fuertes pero en menor cantidad.",
                femenino_porcentaje: 40,
                masculino_porcentaje: 60,
                no_binario_porcentaje: 0,
            },
            otros_aspectos: {
                otros:
                    "La diversidad se centra más en las condiciones y reacciones humanas ante la ceguera que en aspectos demográficos específicos.",
                clase_social:
                    "La novela abarca diversas clases sociales, desde profesionales hasta personas en situación de pobreza.",
                racial_etnica: "La diversidad racial y étnica no es un enfoque principal en la novela.",
            },
            evaluacion_general:
                "La diversidad en la novela es amplia en términos de condiciones humanas y reacciones, pero limitada en términos de representación racial y étnica.",
        },
        relaciones: {
            principales: [
                {
                    tipo: "Matrimonio",
                    evolucion: "cambiante",
                    personajes: ["Médico", "Esposa del médico"],
                    descripcion:
                        "La relación entre el médico y su esposa es central en la novela, evolucionando de una dinámica de dependencia a una de interdependencia y fortaleza mutua.",
                    importancia: 10,
                },
                {
                    tipo: "Liderazgo",
                    evolucion: "cambiante",
                    personajes: ["Médico", "Grupo de ciegos"],
                    descripcion:
                        "La relación del médico con el grupo de ciegos pasa de ser una de autoridad profesional a una de liderazgo y guía en la supervivencia.",
                    importancia: 8,
                },
            ],
            dinamica_general: {
                descripcion:
                    "La dinámica general entre los personajes es de colaboración y supervivencia, con conflictos que surgen de la desesperación y el miedo.",
                nivel_conflicto: 7,
                tipo_predominante: "colaboracion",
                nivel_colaboracion: 8,
            },
        },
        arcos_transformacion: [
            {
                personaje: "Médico",
                tipo_arco: "negativo",
                descripcion:
                    "El médico experimenta una caída drástica en su estatus y condiciones de vida, pero encuentra una nueva forma de liderazgo y propósito en la adversidad.",
                punto_final: ["Liderazgo en la supervivencia", "Adaptación a la nueva realidad (Cap. 10, 90%)"],
                punto_partida: ["Vida profesional estable", "Respetado en la sociedad"],
                punto_intermedio: ["Pérdida de la visión", "Confinamiento en el manicomio (Cap. 3, 30%)"],
                intensidad_cambio: 8,
            },
            {
                personaje: "Esposa del médico",
                tipo_arco: "positivo",
                descripcion:
                    "La esposa del médico evoluciona de ser una persona común a una líder moral y práctica, enfrentando y superando numerosos desafíos éticos y emocionales.",
                punto_final: ["Fortaleza emocional y física", "Liderazgo moral y práctico (Cap. 10, 90%)"],
                punto_partida: ["Vida cotidiana normal", "Dependencia emocional del esposo"],
                punto_intermedio: ["Descubrimiento de su capacidad de ver", "Decisión de quedarse con su esposo (Cap. 2, 20%)"],
                intensidad_cambio: 9,
            },
        ],
        cantidad_distribucion: {
            descripcion:
                "La distribución de personajes en 'Ensayo sobre la ceguera' se centra en un grupo principal de afectados por la ceguera blanca, con múltiples personajes secundarios que enriquecen la trama y el contexto social.",
            principales: 5,
            protagonistas: 2,
            menciones_estimadas: 50,
            secundarios_relevantes: 10,
        },
        funcionalidad_narrativa: {
            descripcion:
                "Los personajes funcionan como vehículos temáticos poderosos, impulsando la trama y reflejando las emociones y dilemas humanos ante una crisis extrema.",
            motores_trama: 8,
            espejos_emocionales: 9,
            vehiculos_tematicos: 9,
        },
        complejidad_psychologica: {
            nivel: "alto",
            puntuacion_general: 9,
            analisis_por_protagonista: [
                {
                    nombre: "Médico",
                    coherencia: "coherente",
                    complejidad: 8,
                    descripcion:
                        "El médico enfrenta una transformación profunda, pasando de ser un profesional respetado a un líder en un mundo caótico, con conflictos internos sobre la moralidad y la supervivencia.",
                    motivaciones: "complejas",
                    conflictos_internos: true,
                },
                {
                    nombre: "Esposa del médico",
                    coherencia: "coherente",
                    complejidad: 9,
                    descripcion:
                        "La esposa del médico es un personaje complejo que lidia con la responsabilidad de ser la única persona que puede ver en un mundo de ciegos, enfrentando dilemas éticos y emocionales.",
                    motivaciones: "complejas",
                    conflictos_internos: true,
                },
            ],
        },
    },
    metadata: { confianza: 0.95, fecha_analisis: "2023-10-01", version_analisis: "1.0" },
    cromosoma: 5,
    visualizacion: {
        descripcion_corta: "Análisis profundo de personajes complejos en un contexto de crisis extrema.",
        puntuacion_global: 9,
        caracteristicas_destacadas: [
            "Alta complejidad psicológica",
            "Arcos de transformación intensos",
            "Diversidad en condiciones humanas",
            "Relaciones dinámicas y colaborativas",
        ],
    },
};

export type CharacterDnaChromosome = typeof characterDnaChromosome;

export const rhythmDensityChromosome = {
    libro: { año: 1995, autor: "José Saramago", titulo: "Ensayo sobre la ceguera" },
    nombre: "Ritmo y Densidad",
    analisis: {
        legibilidad: {
            fluidez: 6,
            descripcion:
                "La obra exige una lectura pausada y reflexiva debido a su alta densidad informativa y complejidad temática.",
            puntos_fatiga: ["Capítulo 4, 40%", "Capítulo 7, 65%", "Capítulo 11, 90%"],
            requiere_pausas: true,
            exigencia_cognitiva: 8,
        },
        tecnicas_ritmo: [
            {
                tecnica: "Diálogos extensos",
                frecuencia: 7,
                descripcion: "Uso de diálogos largos y detallados para desarrollar personajes y avanzar la trama.",
                efectividad: 8,
            },
            {
                tecnica: "Descripciones detalladas",
                frecuencia: 8,
                descripcion:
                    "Descripciones exhaustivas del entorno y los personajes para crear una atmósfera inmersiva.",
                efectividad: 7,
            },
            {
                tecnica: "Reflexiones internas",
                frecuencia: 9,
                descripcion:
                    "Uso de monólogos internos y reflexiones para profundizar en la psicología de los personajes.",
                efectividad: 8,
            },
        ],
        tiempo_lectura: {
            notas:
                "El tiempo de lectura puede variar dependiendo de la densidad de la información y la reflexión requerida por el lector.",
            lector_rapido: { paginas_hora: 50, horas_totales: 6.4 },
            lector_pausado: { paginas_hora: 15, horas_totales: 21.3 },
            lector_promedio: { paginas_hora: 30, horas_totales: 10.7 },
            paginas_totales: 320,
            sesiones_recomendadas: 8,
        },
        variacion_ritmo: {
            patron: "ondulante",
            descripcion:
                "El ritmo varía de manera ondulante, con momentos de alta velocidad intercalados con secciones más pausadas.",
            frecuencia_cambios: "moderada",
            momentos_maxima_lentitud: ["Capítulo 1, 10%", "Capítulo 3, 30%", "Capítulo 12, 95%"],
            momentos_maxima_velocidad: ["Capítulo 5, 45%", "Capítulo 8, 70%", "Capítulo 10, 85%"],
        },
        velocidad_narrativa: {
            nivel: "moderado",
            constancia: "variable",
            descripcion:
                "El ritmo narrativo varía a lo largo de la obra, con momentos de mayor velocidad en los puntos clave de la trama y secciones más pausadas para la descripción y reflexión.",
            por_seccion: [
                {
                    seccion: "inicio",
                    velocidad: 4,
                    descripcion: "Introducción pausada, con descripción detallada de los personajes y el contexto.",
                    porcentaje_fin: 20,
                    porcentaje_inicio: 0,
                },
                {
                    seccion: "desarrollo",
                    velocidad: 5,
                    descripcion:
                        "Aumento gradual de la tensión y el ritmo a medida que se desarrolla la epidemia de ceguera.",
                    porcentaje_fin: 50,
                    porcentaje_inicio: 21,
                },
                {
                    seccion: "pre_climax",
                    velocidad: 6,
                    descripcion: "Ritmo más acelerado con eventos críticos y giros narrativos.",
                    porcentaje_fin: 75,
                    porcentaje_inicio: 51,
                },
                {
                    seccion: "climax",
                    velocidad: 7,
                    descripcion: "Punto culminante de la historia con máxima tensión y acción.",
                    porcentaje_fin: 90,
                    porcentaje_inicio: 76,
                },
                {
                    seccion: "resolucion",
                    velocidad: 4,
                    descripcion: "Resolución más pausada, con reflexiones y cierre de la trama.",
                    porcentaje_fin: 100,
                    porcentaje_inicio: 91,
                },
            ],
            puntuacion_general: 5,
        },
        densidad_informacion: {
            nivel: "densa",
            puntuacion: 8,
            descripcion:
                "La obra presenta una alta densidad de información, con una fuerte carga ideológica y filosófica, así como una detallada construcción del mundo y descripciones ambientales.",
            tipo_informacion_predominante: [
                { tipo: "ideologica_filosofica", porcentaje: 40 },
                { tipo: "worldbuilding", porcentaje: 30 },
                { tipo: "descripcion_ambiental", porcentaje: 20 },
                { tipo: "dialogo", porcentaje: 10 },
            ],
        },
        proporcion_elementos: {
            dialogo: 25,
            grafico: [
                { elemento: "Acción física", porcentaje: 20 },
                { elemento: "Diálogo", porcentaje: 25 },
                { elemento: "Reflexión interna", porcentaje: 30 },
                { elemento: "Descripción", porcentaje: 20 },
                { elemento: "Exposición", porcentaje: 5 },
            ],
            exposicion: 5,
            descripcion: 20,
            accion_fisica: 20,
            reflexion_interna: 30,
        },
    },
    metadata: { confianza: 0.9, fecha_analisis: "2023-10-01", version_analisis: "1.0" },
    cromosoma: 6,
    visualizacion: {
        descripcion_corta:
            "Obra con un ritmo narrativo variable y una alta densidad de información, que requiere una lectura pausada y reflexiva.",
        puntuacion_global: 7,
        caracteristicas_destacadas: [
            "Ritmo ondulante con momentos de alta velocidad y secciones pausadas.",
            "Alta densidad de información ideológica y filosófica.",
            "Uso de diálogos extensos y descripciones detalladas.",
        ],
    },
};

export type RhythmDensityChromosome = typeof rhythmDensityChromosome;

export const linguisticComplexityChromosome = {
    libro: { año: 1995, autor: "José Saramago", titulo: "Ensayo sobre la ceguera" },
    nombre: "Complejidad Lingüística",
    analisis: {
        sintaxis: {
            nivel: "alto",
            descripcion:
                "La sintaxis es compleja, con frecuentes subordinaciones y estructuras oracionales largas y elaboradas. Se destacan los párrafos extensos y la puntuación no convencional, característica del estilo de Saramago.",
            subordinacion: { frecuencia: "muy_frecuente", profundidad: 4 },
            complejidad_sintactica: 9,
            estructuras_especiales: true,
            longitud_promedio_oracion: 25,
        },
        accesibilidad: {
            descripcion:
                "La accesibilidad para lectores no nativos es moderada debido a la complejidad lingüística y sintáctica del texto.",
            traducibilidad: 6,
            lectores_no_nativos: 5,
            barreras_principales: ["complejidad sintáctica", "vocabulario avanzado", "estructuras oracionales largas"],
        },
        nivel_lectura: {
            nivel: "avanzado",
            puntuacion: 8,
            descripcion:
                "La obra presenta una complejidad lingüística significativa, con estructuras sintácticas elaboradas y un vocabulario rico y variado.",
            edad_recomendada_minima: 18,
            nivel_educativo_requerido: "universitario",
        },
        riqueza_lexica: {
            descripcion:
                "La riqueza léxica es notable, con un uso extensivo de términos específicos y variados que enriquecen la narrativa.",
            type_token_ratio: 0.85,
            diversidad_lexica: 9,
            palabras_dificiles: {
                tipos: ["técnicas", "literarias", "coloquiales"],
                ejemplos: ["epidémico", "laberinto", "inefable"],
                porcentaje: 15,
            },
            vocabulario_unico_estimado: 5000,
        },
        registro_variacion: {
            descripcion:
                "La variación en el registro lingüístico es notable, con un uso predominante del registro formal literario en la narrativa y un registro coloquial en los diálogos.",
            registros_presentes: [
                {
                    tipo: "formal_literario",
                    efectividad: 9,
                    contexto_uso: "narrativa principal",
                    frecuencia_porcentaje: 70,
                },
                {
                    tipo: "coloquial",
                    efectividad: 7,
                    contexto_uso: "diálogos entre personajes",
                    frecuencia_porcentaje: 30,
                },
            ],
            variacion_por_contexto: true,
            variacion_por_personaje: true,
        },
        indices_legibilidad: {
            notas:
                "Los índices de legibilidad indican que el texto es complejo y requiere un nivel avanzado de comprensión lectora.",
            gunning_fog_index: 18.2,
            flesch_reading_ease: { puntuacion: 30, interpretacion: "difícil" },
            flesch_kincaid_grade: 12.5,
        },
        innovaciones_linguisticas: {
            neologismos: {
                amount: 5,
                ejemplos: ["ceguera blanca", "contagio visual"],
                proposito: "refuerzan la temática central y añaden profundidad conceptual",
            },
            juegos_palabras: { presente: true, frecuencia: 5, complejidad: 7 },
            impacto_cultural: 8,
            lenguaje_inventado: { nombre: null, alcance: null, presente: false, descripcion: null },
            terminos_trascendentes: ["ceguera blanca", "contagio visual"],
        },
    },
    metadata: { confianza: 0.95, fecha_analisis: "2023-10-01", version_analisis: "1.0" },
    cromosoma: 7,
    visualizacion: {
        descripcion_corta:
            "Obra con alta complejidad lingüística y riqueza léxica, característica del estilo literario de José Saramago.",
        puntuacion_global: 8.5,
        caracteristicas_destacadas: [
            "riqueza léxica",
            "complejidad sintáctica",
            "variación de registros",
            "neologismos temáticos",
        ],
    },
};

export type LinguisticComplexityChromosome = typeof linguisticComplexityChromosome;

export const culturalContextChromosome = {
    libro: { año: 1995, autor: "José Saramago", titulo: "Ensayo sobre la ceguera" },
    nombre: "Contexto Cultural",
    analisis: {
        influencias: {
            politicas: ["Crítica a la sociedad contemporánea", "Reflexión sobre la salud pública"],
            literarias: [
                {
                    name: "Franz Kafka",
                    tipo: "autor",
                    descripcion: "Influencia en la exploración de la alienación y la burocracia.",
                },
                {
                    name: "El proceso",
                    tipo: "obra",
                    descripcion: "Influencia en la narrativa alegórica y la exploración de la condición humana.",
                },
            ],
            personales: "Experiencias personales del autor con la ceguera y la salud.",
            filosoficas: ["Existencialismo", "Nihilismo"],
        },
        legado_impacto: {
            adaptaciones: [{ año: 2008, medio: "pelicula", titulo: "Blindness" }],
            estatus_actual: "Obra fundamental en el canon literario contemporáneo.",
            recepcion_inicial: "Aclamada por la crítica y ganadora del Premio Nobel de Literatura en 1998.",
            evolucion_recepcion: "Considerada una de las obras más importantes de la literatura contemporánea.",
            influencia_cultural: 9,
            obras_influenciadas: [{ año: 2008, tipo: "pelicula", titulo: "Blindness" }],
            conceptos_popularizados: [
                "La ceguera como metáfora de la condición humana",
                "Crítica a la sociedad contemporánea",
            ],
        },
        epoca_narrativa: {
            periodo: "presente",
            año_especifico: null,
            ubicacion_geografica: "Ciudad sin nombre, país indeterminado",
            diferencia_con_publicacion: "La narrativa es contemporánea a la publicación, pero con un enfoque atemporal.",
        },
        epoca_publicacion: {
            año: 1995,
            contexto_social: "Creciente preocupación por los derechos humanos y la salud pública.",
            motivacion_autor: "Reflexión sobre la condición humana y la fragilidad de la sociedad.",
            contexto_politico: "Transición hacia la globalización y fin de la Guerra Fría.",
            eventos_historicos: ["Expansión de la Unión Europea", "Acuerdos de Paz de Dayton", "Atentado de Oklahoma City"],
            contexto_tecnologico: "Avances en tecnología médica y comunicaciones.",
        },
        vigencia_relevancia: {
            nivel: "Alto",
            razones: "La obra aborda temas universales y atemporales que siguen siendo relevantes.",
            puntuacion: 10,
            temas_datados: [],
            temas_vigentes: ["La fragilidad de la sociedad", "La condición humana", "La salud pública"],
            elementos_profeticos: ["La crítica a la sociedad contemporánea", "La reflexión sobre la salud pública"],
        },
        movimiento_literario: {
            subgeneros: ["Alegoría", "Distopía"],
            principales: ["Realismo mágico", "Literatura posmoderna"],
            genero_literario: "Novela",
            subversion_innovacion: "Uso de la ceguera como metáfora de la condición humana y la sociedad.",
            caracteristicas_presentes: ["Narrativa no lineal", "Uso de la alegoría", "Reflexión existencial"],
        },
        significado_historico_literario: {
            lugar_canon: "Obra fundamental en el canon literario contemporáneo.",
            importancia_tematica: "Exploración profunda de la condición humana y la sociedad.",
            representacion_epoca: "Reflejo de las preocupaciones sociales y políticas de la década de 1990.",
            innovaciones_tecnicas: ["Uso de la alegoría", "Narrativa no lineal"],
            posicion_carrera_autor: "Obra cumbre de José Saramago, consolidando su legado literario.",
            puntuacion_importancia: 10,
        },
    },
    metadata: { confianza: "Alta", fecha_analisis: "2023-10-01", version_analisis: "1.0" },
    cromosoma: 8,
    visualizacion: {
        descripcion_corta:
            "Obra maestra de la literatura contemporánea que explora la condición humana a través de una alegoría poderosa.",
        puntuacion_global: 9.5,
        caracteristicas_destacadas: ["Uso de la alegoría", "Narrativa no lineal", "Reflexión existencial"],
    },
};

export type CulturalContextChromosome = typeof culturalContextChromosome;

export const demoChromosomes = {
    narrative_structure: narrativeStructureChromosome,
    literary_style: literaryStyleChromosome,
    emotional_profile: emotionalProfileChromosome,
    thematic_composition: thematicCompositionChromosome,
    character_dna: characterDnaChromosome,
    rhythm_density: rhythmDensityChromosome,
    linguistic_complexity: linguisticComplexityChromosome,
    cultural_context: culturalContextChromosome,
};

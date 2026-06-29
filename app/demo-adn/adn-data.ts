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

export const narrativeStructureChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Estructura Narrativa",
    "analisis": {
        "puntos_giro": [
            {
                "tipo": "incidente_incitador",
                "numero": 1,
                "titulo": "Encuentro con María",
                "ubicacion": {
                    "capitulo": null,
                    "porcentaje": 10
                },
                "descripcion": "El protagonista conoce a María Iribarne, lo que desencadena su obsesión.",
                "importancia": 9
            },
            {
                "tipo": "punto_medio",
                "numero": 2,
                "titulo": "Confesión de Juan Pablo",
                "ubicacion": {
                    "capitulo": null,
                    "porcentaje": 50
                },
                "descripcion": "Juan Pablo confiesa su obsesión y celos hacia María.",
                "importancia": 8
            },
            {
                "tipo": "climax",
                "numero": 3,
                "titulo": "Asesinato de María",
                "ubicacion": {
                    "capitulo": null,
                    "porcentaje": 90
                },
                "descripcion": "Juan Pablo asesina a María en un acto de celos y desesperación.",
                "importancia": 10
            }
        ],
        "division_formal": {
            "capitulos": 0,
            "notas_adicionales": "La narrativa fluye de manera continua con algunas interrupciones para flashbacks.",
            "longitud_capitulos": "variable",
            "partes_principales": 1,
            "capitulos_con_titulo": false,
            "patrones_estructurales": "La novela está dividida en secciones sin capítulos numerados, con una estructura más bien continua."
        },
        "ritmo_narrativo": {
            "inicio": "moderado",
            "desarrollo": "creciente",
            "resolucion": "rapida",
            "descripcion": "El ritmo narrativo es moderado al inicio, se acelera hacia el clímax y tiene una resolución rápida.",
            "variacion_ritmo": 5,
            "ubicacion_climax": 90,
            "velocidad_general": 6
        },
        "tipo_estructura": {
            "principal": "lineal_cronologica",
            "secundarios": [
                "flashbacks_analepsis"
            ]
        },
        "lineas_argumentales": {
            "principales": 1,
            "secundarias": 2,
            "descripcion_tramas": "La trama principal sigue la obsesión del protagonista por María Iribarne, mientras que las secundarias exploran su pasado y su deterioro psicológico.",
            "nivel_entrelazamiento": 4
        },
        "perspectiva_narrativa": {
            "otras": [],
            "principal": "primera_persona_protagonista",
            "narrador_confiable": false,
            "cambios_perspectiva": false
        },
        "complejidad_estructural": {
            "nivel": "compleja",
            "factores": [
                "Uso de flashbacks",
                "Narrativa psicológica intensa",
                "Estructura lineal con interrupciones"
            ],
            "puntuacion": 7
        }
    },
    "metadata": {
        "confianza": 0.9,
        "fecha_analisis": "2023-10-04",
        "version_analisis": "1.0"
    },
    "cromosoma": 1,
    "visualizacion": {
        "descripcion_corta": "Estructura narrativa compleja con una perspectiva en primera persona no confiable.",
        "puntuacion_global": 8,
        "caracteristicas_destacadas": [
            "Uso de flashbacks",
            "Narrativa psicológica intensa",
            "Estructura lineal con interrupciones"
        ]
    }
};
export type NarrativeChromosome = typeof narrativeStructureChromosome;

export const literaryStyleChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Estilo Literario",
    "analisis": {
        "ritmo_prosa": {
            "cadencia": "variable",
            "descripcion": "El ritmo de la prosa es variable, con una cadencia que oscila entre lo fluido y lo entrecortado, reflejando los estados emocionales del protagonista.",
            "musicalidad": 6,
            "uso_repeticiones": "ocasional",
            "longitud_parrafos": "mixtos"
        },
        "tono_general": {
            "seriedad": {
                "descriptor": "muy serio",
                "puntuacion": 9
            },
            "optimismo": {
                "descriptor": "pesimista",
                "puntuacion": 2
            },
            "descripcion": "El tono general de la obra es oscuro y pesimista, con una intensidad emocional que refleja la angustia existencial del protagonista.",
            "luminosidad": {
                "descriptor": "sombrío",
                "puntuacion": 3
            },
            "emocionalidad": {
                "descriptor": "intenso",
                "puntuacion": 8
            },
            "tono_predominante": "oscuro intenso"
        },
        "figuras_retoricas": {
            "ranking": [
                {
                    "nombre": "metáfora",
                    "frecuencia": 9,
                    "ejemplo_tipo": "El túnel como metáfora de la mente del protagonista."
                },
                {
                    "nombre": "símil",
                    "frecuencia": 7,
                    "ejemplo_tipo": "Comparaciones que destacan la soledad y la desesperación."
                },
                {
                    "nombre": "ironía",
                    "frecuencia": 6,
                    "ejemplo_tipo": "Uso de la ironía para resaltar la tragedia."
                }
            ],
            "descripcion": "Las figuras retóricas son utilizadas con frecuencia para enfatizar los temas de soledad, desesperación y angustia existencial."
        },
        "longitud_oraciones": {
            "variacion": "moderada",
            "descripcion": "Las oraciones en 'El túnel' son generalmente de longitud media, con una variación moderada y un uso frecuente de subordinadas que reflejan la complejidad psicológica de los personajes.",
            "predominancia": "medias",
            "uso_subordinadas": "frecuente",
            "puntuacion_complejidad": 7,
            "promedio_palabras_oracion": 12
        },
        "densidad_descriptiva": {
            "nivel": "muy_descriptiva",
            "puntuacion": 9,
            "descripcion": "La obra es muy descriptiva, especialmente en lo que respecta a las descripciones psicológicas y atmosféricas, que son fundamentales para entender la mente del protagonista.",
            "tipos_descripcion": {
                "fisica": 8,
                "sensorial": 7,
                "atmosferica": 9,
                "psicologica": 10
            }
        },
        "registro_linguistico": {
            "principal": "formal",
            "descripcion": "El registro lingüístico es principalmente formal, con algunos pasajes colloquiales y literarios que reflejan la educación y la introspección del protagonista.",
            "secundarios": [
                "colloquial",
                "literario"
            ],
            "caracteristicas_especiales": {
                "anacronismos": false,
                "regionalismos": false,
                "jerga_especifica": false,
                "lenguaje_inventado": false
            }
        },
        "complejidad_vocabulario": {
            "nivel": "rico",
            "puntuacion": 8,
            "descripcion": "El vocabulario utilizado por Sabato es rico y variado, con un uso frecuente de términos filosóficos y psicológicos que requieren un nivel educativo elevado para su completa comprensión.",
            "caracteristicas": {
                "neologismos": false,
                "vocabulario_arcaico": false,
                "terminos_especializados": false,
                "nivel_educativo_requerido": "universitario"
            },
            "ejemplos_vocabulario": [
                "existencial",
                "metempsicosis",
                "epifanía",
                "inefable",
                "transcendental"
            ],
            "porcentaje_palabras_dificiles": 15
        },
        "proporcion_dialogo_narracion": {
            "descripcion": "La narración predomina sobre el diálogo, con un significativo porcentaje dedicado a la reflexión interna, lo que refleja la introspección constante del protagonista.",
            "estilo_dialogo": "naturalista",
            "dialogo_porcentaje": 30,
            "narracion_porcentaje": 50,
            "reflexion_interna_porcentaje": 20
        }
    },
    "metadata": {
        "confianza": 0.95,
        "fecha_analisis": "2023-10-01",
        "version_analisis": "1.0"
    },
    "cromosoma": 2,
    "visualizacion": {
        "descripcion_corta": "Estilo literario rico y complejo, con una prosa introspectiva y descriptiva.",
        "puntuacion_global": 8.5,
        "caracteristicas_destacadas": [
            "vocabulario rico",
            "descripciones psicológicas profundas",
            "tono oscuro e intenso"
        ]
    }
};
export type LiteraryStyleChromosome = typeof literaryStyleChromosome;

export const emotionalProfileChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Perfil Emocional",
    "analisis": {
        "tipo_final": {
            "descripcion": "El final es trágico y devastador, dejando una sensación de vacío y desesperanza.",
            "clasificacion": "tragico_devastador",
            "nivel_catarsis": 9,
            "intensidad_climax": 10,
            "satisfaccion_emocional": 8
        },
        "tipo_tension": {
            "ranking": [
                {
                    "tipo": "psicologica",
                    "puntuacion": 10,
                    "descripcion": "Tensión interna del protagonista y su lucha mental."
                },
                {
                    "tipo": "emocional",
                    "puntuacion": 9,
                    "descripcion": "Conflictos emocionales y relaciones personales."
                },
                {
                    "tipo": "social",
                    "puntuacion": 6,
                    "descripcion": "Interacciones y conflictos con otros personajes."
                },
                {
                    "tipo": "fisica",
                    "puntuacion": 5,
                    "descripcion": "Conflictos físicos y acciones violentas."
                },
                {
                    "tipo": "intelectual",
                    "puntuacion": 4,
                    "descripcion": "Reflexiones y debates internos."
                },
                {
                    "tipo": "existencial",
                    "puntuacion": 8,
                    "descripcion": "Cuestiones sobre la existencia y el propósito de la vida."
                }
            ],
            "dominante": "psicologica"
        },
        "curva_emocional": {
            "segmentos": [
                {
                    "nombre": "inicio",
                    "intensidad": 5,
                    "descripcion": "Introducción al protagonista y su visión del mundo.",
                    "porcentaje_fin": 10,
                    "porcentaje_inicio": 0
                },
                {
                    "nombre": "desarrollo",
                    "intensidad": 7,
                    "descripcion": "Desarrollo de la obsesión y la relación con María.",
                    "porcentaje_fin": 50,
                    "porcentaje_inicio": 10
                },
                {
                    "nombre": "climax_preparacion",
                    "intensidad": 8,
                    "descripcion": "Aumento de la tensión y los celos.",
                    "porcentaje_fin": 75,
                    "porcentaje_inicio": 50
                },
                {
                    "nombre": "climax",
                    "intensidad": 10,
                    "descripcion": "Punto culminante de la obsesión y la violencia.",
                    "porcentaje_fin": 90,
                    "porcentaje_inicio": 75
                },
                {
                    "nombre": "resolucion",
                    "intensidad": 3,
                    "descripcion": "Conclusión trágica y reflexión final.",
                    "porcentaje_fin": 100,
                    "porcentaje_inicio": 90
                }
            ],
            "grafica_puntos": [
                {
                    "x": 0,
                    "y": 5
                },
                {
                    "x": 25,
                    "y": 7
                },
                {
                    "x": 50,
                    "y": 8
                },
                {
                    "x": 75,
                    "y": 10
                },
                {
                    "x": 90,
                    "y": 8
                },
                {
                    "x": 100,
                    "y": 3
                }
            ],
            "patron_general": "descendente"
        },
        "impacto_en_lectores": {
            "descripcion": "La novela deja una profunda impresión emocional en los lectores, con una alta probabilidad de generar lágrimas y una resonancia duradera.",
            "emotividad_general": 9,
            "nivel_perturbacion": 9,
            "probabilidad_llorar": 8,
            "resonancia_duradera": 9,
            "dificultad_emocional": 8
        },
        "elementos_especificos": {
            "humor": {
                "tipo": "ninguno",
                "presente": false,
                "frecuencia": 0
            },
            "horror": {
                "tipo": "psicológico",
                "presente": true,
                "intensidad": 8
            },
            "romance": {
                "presente": true,
                "intensidad": 7
            },
            "nostalgia": 7,
            "alivio_comico": 0,
            "tension_sexual": 6,
            "momentos_sublimes": 5,
            "violencia_emocional": 9
        },
        "emociones_predominantes": [
            {
                "emocion": "tristeza",
                "ranking": 1,
                "momentos_clave": [
                    "Reflexiones sobre la soledad",
                    "La muerte de María"
                ],
                "intensidad_promedio": 8,
                "porcentaje_presencia": 40
            },
            {
                "emocion": "ira",
                "ranking": 2,
                "momentos_clave": [
                    "Celos y obsesión",
                    "El crimen"
                ],
                "intensidad_promedio": 9,
                "porcentaje_presencia": 30
            },
            {
                "emocion": "miedo",
                "ranking": 3,
                "momentos_clave": [
                    "Paranoia y desconfianza",
                    "La persecución"
                ],
                "intensidad_promedio": 7,
                "porcentaje_presencia": 20
            }
        ],
        "momentos_emocionales_clave": [
            {
                "numero": 1,
                "titulo": "La obsesión inicial",
                "emociones": [
                    "anticipacion",
                    "tristeza"
                ],
                "intensidad": 6,
                "descripcion": "El protagonista comienza a obsesionarse con María.",
                "tipo_evento": "revelacion",
                "ubicacion_porcentaje": 15
            },
            {
                "numero": 2,
                "titulo": "El primer encuentro",
                "emociones": [
                    "alegria",
                    "sorpresa"
                ],
                "intensidad": 7,
                "descripcion": "El protagonista conoce a María y se siente atraído por ella.",
                "tipo_evento": "transgresion",
                "ubicacion_porcentaje": 30
            },
            {
                "numero": 3,
                "titulo": "Los celos",
                "emociones": [
                    "ira",
                    "miedo"
                ],
                "intensidad": 8,
                "descripcion": "El protagonista comienza a sentir celos y desconfianza hacia María.",
                "tipo_evento": "catastrofe",
                "ubicacion_porcentaje": 50
            },
            {
                "numero": 4,
                "titulo": "La confrontación",
                "emociones": [
                    "ira",
                    "tristeza"
                ],
                "intensidad": 10,
                "descripcion": "El protagonista confronta a María y la relación se vuelve tensa.",
                "tipo_evento": "destruccion",
                "ubicacion_porcentaje": 75
            },
            {
                "numero": 5,
                "titulo": "El crimen",
                "emociones": [
                    "miedo",
                    "tristeza"
                ],
                "intensidad": 10,
                "descripcion": "El protagonista comete un crimen en un acto de desesperación.",
                "tipo_evento": "derrota_total",
                "ubicacion_porcentaje": 90
            }
        ]
    },
    "metadata": {
        "confianza": 95,
        "fecha_analisis": "2023-10-01",
        "version_analisis": "1.0"
    },
    "cromosoma": 3,
    "visualizacion": {
        "descripcion_corta": "Una novela intensa y emocionalmente cargada que explora la psicología humana.",
        "puntuacion_global": 9,
        "caracteristicas_destacadas": [
            "Profundidad psicológica",
            "Intensidad emocional",
            "Final trágico"
        ]
    }
};
export type EmotionalProfileChromosome = typeof emotionalProfileChromosome;

export const thematicCompositionChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Composición Temática",
    "analisis": {
        "ambiguedad_moral": {
            "nivel": "compleja",
            "puntuacion": 8,
            "descripcion": "La novela presenta una ambigüedad moral significativa, especialmente en relación con las acciones de Castel y las motivaciones detrás de ellas.",
            "complejidad_personajes": "Los personajes de la novela, especialmente Castel, son complejos y multifacéticos, lo que dificulta una evaluación moral simple.",
            "dilemas_sin_resolucion": true
        },
        "temas_principales": [
            {
                "nombre": "La soledad existencial",
                "ranking": 1,
                "presencia": 10,
                "desarrollo": {
                    "evolucion": "A medida que avanza la trama, su soledad se intensifica, llevándolo a obsesionarse con María Iribarne.",
                    "resolucion": "La soledad de Castel lo lleva a cometer un acto extremo, culminando en un final trágico.",
                    "introduccion": "Castel se presenta como un hombre solitario y atormentado, incapaz de conectar con los demás."
                },
                "descripcion": "El protagonista, Juan Pablo Castel, experimenta una profunda soledad que lo lleva a aislarse del mundo y a buscar desesperadamente una conexión humana auténtica.",
                "profundidad": 9,
                "palabras_clave": [
                    "aislamiento",
                    "desesperación",
                    "vacío",
                    "incomprensión"
                ],
                "manifestaciones": {
                    "simbolos": [
                        "El túnel",
                        "La pintura",
                        "La ventana"
                    ],
                    "personajes": [
                        "Juan Pablo Castel"
                    ],
                    "eventos_clave": [
                        "El encuentro con María Iribarne",
                        "La obsesión de Castel",
                        "El crimen final"
                    ]
                }
            },
            {
                "nombre": "La obsesión",
                "ranking": 2,
                "presencia": 9,
                "desarrollo": {
                    "evolucion": "Su obsesión crece a medida que se involucra más en su vida, llevándolo a actuar de manera posesiva y celosa.",
                    "resolucion": "La obsesión de Castel lo lleva a cometer un crimen pasional.",
                    "introduccion": "Castel se obsesiona con María Iribarne desde el momento en que la ve."
                },
                "descripcion": "La obsesión de Castel por María Iribarne lo consume y lo lleva a actuar de manera irracional y destructiva.",
                "profundidad": 8,
                "palabras_clave": [
                    "amor",
                    "posesión",
                    "celos",
                    "locura"
                ],
                "manifestaciones": {
                    "simbolos": [
                        "La pintura de la ventana",
                        "La carta"
                    ],
                    "personajes": [
                        "Juan Pablo Castel",
                        "María Iribarne"
                    ],
                    "eventos_clave": [
                        "El primer encuentro",
                        "La relación amorosa",
                        "El crimen"
                    ]
                }
            }
        ],
        "temas_secundarios": [
            {
                "nombre": "El arte y la creación",
                "presencia": 7,
                "descripcion": "La novela explora el papel del arte y la creación en la vida de Castel, quien es un pintor."
            },
            {
                "nombre": "La culpa y el arrepentimiento",
                "presencia": 6,
                "descripcion": "Castel experimenta sentimientos de culpa y arrepentimiento por sus acciones, especialmente hacia el final de la novela."
            }
        ],
        "relevancia_temporal": {
            "descripcion": "Aunque la novela refleja preocupaciones y temas de la época en que fue escrita, su exploración de la soledad y la obsesión sigue siendo relevante hoy en día.",
            "universalidad": 8,
            "temas_profeticos": [],
            "relevancia_actual": 7,
            "refleja_epoca_creacion": true
        },
        "profundidad_filosofica": {
            "nivel": "muy_profunda",
            "puntuacion": 9,
            "descripcion": "La novela aborda preguntas fundamentales sobre la existencia humana, la soledad, la obsesión y la búsqueda de significado en un mundo aparentemente indiferente.",
            "corrientes_filosoficas": [
                "existencialismo",
                "nihilismo"
            ]
        },
        "critica_social_politica": {
            "estilo": null,
            "presente": false,
            "intensidad": null,
            "descripcion": "La novela no presenta una crítica social o política explícita.",
            "objetivo_critica": [],
            "propone_alternativas": null
        },
        "interconexiones_tematicas": {
            "tema_central": "La soledad existencial",
            "temas_en_tension": [
                {
                    "tema1": "La soledad existencial",
                    "tema2": "La obsesión",
                    "tension": "La soledad de Castel lo lleva a buscar conexión, pero su obsesión lo aísla aún más."
                }
            ],
            "temas_complementarios": [
                {
                    "tema1": "La soledad existencial",
                    "tema2": "La obsesión",
                    "relacion": "La obsesión de Castel por María Iribarne es una manifestación de su soledad y su deseo de conexión humana."
                }
            ]
        }
    },
    "metadata": {
        "confianza": 0.95,
        "fecha_analisis": "2023-10-04",
        "version_analisis": "1.0"
    },
    "cromosoma": 4,
    "visualizacion": {
        "nube_tematica": [
            {
                "peso": 10,
                "tema": "SOLEDAD"
            },
            {
                "peso": 9,
                "tema": "OBSESIÓN"
            },
            {
                "peso": 7,
                "tema": "ARTE"
            },
            {
                "peso": 6,
                "tema": "CULPA"
            }
        ],
        "descripcion_corta": "Una exploración profunda y conmovedora de la soledad y la obsesión.",
        "puntuacion_global": 9,
        "caracteristicas_destacadas": [
            "Exploración profunda de la soledad existencial",
            "Retrato complejo y multifacético del protagonista",
            "Uso simbólico del arte y la pintura"
        ]
    }
};
export type ThematicCompositionChromosome = typeof thematicCompositionChromosome;

export const characterDnaChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "ADN de Personajes",
    "analisis": {
        "arquetipos": [
            {
                "arquetipo": "heroe_tragico",
                "personaje": "Juan Pablo Castel",
                "subversion": false,
                "descripcion": "Juan Pablo Castel encarna el arquetipo del héroe trágico, cuya obsesión y acciones lo llevan a su propia destrucción."
            },
            {
                "arquetipo": "femme_fatale",
                "personaje": "María Iribarne",
                "subversion": false,
                "descripcion": "María Iribarne representa el arquetipo de la femme fatale, cuya presencia y acciones tienen un impacto destructivo en el protagonista."
            }
        ],
        "diversidad": {
            "edad": {
                "ancianos": 10,
                "mediana_edad": 20,
                "jovenes_adultos": 70,
                "ninos_adolescentes": 0
            },
            "genero": {
                "notas": "La representación de género es binaria y refleja los roles de género tradicionales de la época.",
                "femenino_porcentaje": 40,
                "masculino_porcentaje": 60,
                "no_binario_porcentaje": 0
            },
            "otros_aspectos": {
                "otros": "No hay una diversidad significativa en otros aspectos como discapacidad o orientación sexual.",
                "clase_social": "Los personajes pertenecen principalmente a la clase media y alta.",
                "racial_etnica": "La novela no aborda explícitamente la diversidad racial o étnica."
            },
            "evaluacion_general": "La diversidad en la novela es limitada, reflejando el contexto social y cultural de la época en que fue escrita."
        },
        "relaciones": {
            "principales": [
                {
                    "tipo": "Romántica y conflictiva",
                    "evolucion": "cambiante",
                    "personajes": [
                        "Juan Pablo Castel",
                        "María Iribarne"
                    ],
                    "descripcion": "La relación entre Juan Pablo Castel y María Iribarne es central en la novela, marcada por la obsesión, la pasión y el conflicto.",
                    "importancia": 10
                }
            ],
            "dinamica_general": {
                "descripcion": "La dinámica general de las relaciones en la novela está dominada por el conflicto, con poca colaboración o apoyo mutuo.",
                "nivel_conflicto": 9,
                "tipo_predominante": "conflicto",
                "nivel_colaboracion": 2
            }
        },
        "arcos_transformacion": [
            {
                "personaje": "Juan Pablo Castel",
                "tipo_arco": "negativo",
                "descripcion": "El arco de transformación de Juan Pablo Castel es profundamente negativo, marcado por una espiral descendente de obsesión, paranoia y violencia.",
                "punto_final": [
                    "Asesinato de María Iribarne (Capítulo 10, 90%)",
                    "Reflexión final en la prisión (Capítulo 11, 95%)"
                ],
                "punto_partida": [
                    "Aislamiento y obsesión por María Iribarne"
                ],
                "punto_intermedio": [
                    "Desarrollo de una relación intensa y conflictiva con María (Capítulo 5, 50%)",
                    "Aumento de la paranoia y los celos (Capítulo 8, 75%)"
                ],
                "intensidad_cambio": 9
            }
        ],
        "cantidad_distribucion": {
            "descripcion": "La novela se centra en un protagonista principal, Juan Pablo Castel, con un pequeño grupo de personajes principales y secundarios que interactúan con él.",
            "principales": 3,
            "protagonistas": 1,
            "menciones_estimadas": 10,
            "secundarios_relevantes": 5
        },
        "funcionalidad_narrativa": {
            "descripcion": "Los personajes en 'El túnel' son fundamentales para el desarrollo de los temas y la trama, actuando como vehículos temáticos y motores de la narrativa.",
            "motores_trama": 8,
            "espejos_emocionales": 7,
            "vehiculos_tematicos": 9
        },
        "complejidad_psychologica": {
            "nivel": "alto",
            "puntuacion_general": 9,
            "analisis_por_protagonista": [
                {
                    "nombre": "Juan Pablo Castel",
                    "coherencia": "coherente",
                    "complejidad": 9,
                    "descripcion": "Juan Pablo Castel es un personaje profundamente complejo, con una psicología intrincada y conflictos internos intensos. Su obsesión y paranoia lo llevan a una espiral de autodestrucción.",
                    "motivaciones": "complejas",
                    "conflictos_internos": true
                }
            ]
        }
    },
    "metadata": {
        "confianza": 0.95,
        "fecha_analisis": "2023-10-01",
        "version_analisis": "1.0"
    },
    "cromosoma": 5,
    "visualizacion": {
        "descripcion_corta": "Análisis profundo de los personajes en 'El túnel' de Ernesto Sabato, destacando su complejidad psicológica y sus arcos de transformación.",
        "puntuacion_global": 9,
        "caracteristicas_destacadas": [
            "Alta complejidad psicológica",
            "Arcos de transformación intensos",
            "Relaciones conflictivas"
        ]
    }
};
export type CharacterDnaChromosome = typeof characterDnaChromosome;

export const rhythmDensityChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Ritmo y Densidad",
    "analisis": {
        "legibilidad": {
            "fluidez": 6,
            "descripcion": "La obra exige una lectura pausada y reflexiva debido a su densidad psicológica y filosófica.",
            "puntos_fatiga": [
                "Capítulo 15, 70%",
                "Capítulo 22, 88%"
            ],
            "requiere_pausas": true,
            "exigencia_cognitiva": 8
        },
        "tecnicas_ritmo": [
            {
                "tecnica": "Monólogo interior",
                "frecuencia": 8,
                "descripcion": "Uso extensivo de monólogos interiores para profundizar en la psicología del protagonista.",
                "efectividad": 9
            },
            {
                "tecnica": "Flashback",
                "frecuencia": 5,
                "descripcion": "Empleo de flashbacks para revelar eventos pasados y su impacto en el presente.",
                "efectividad": 7
            }
        ],
        "tiempo_lectura": {
            "notas": "El tiempo de lectura puede variar según la profundidad de reflexión que el lector desee realizar.",
            "lector_rapido": {
                "paginas_hora": 40,
                "horas_totales": 5
            },
            "lector_pausado": {
                "paginas_hora": 10,
                "horas_totales": 20
            },
            "lector_promedio": {
                "paginas_hora": 25,
                "horas_totales": 8
            },
            "paginas_totales": 200,
            "sesiones_recomendadas": 8
        },
        "variacion_ritmo": {
            "patron": "ondulante",
            "descripcion": "El ritmo varía de manera ondulante, con momentos de alta velocidad en los puntos de conflicto y mayor lentitud en las reflexiones filosóficas y psicológicas.",
            "frecuencia_cambios": "moderada",
            "momentos_maxima_lentitud": [
                "Capítulo 1, 5%",
                "Capítulo 25, 95%"
            ],
            "momentos_maxima_velocidad": [
                "Capítulo 12, 60%",
                "Capítulo 20, 85%"
            ]
        },
        "velocidad_narrativa": {
            "nivel": "moderado",
            "constancia": "variable",
            "descripcion": "El ritmo narrativo varía según la profundidad psicológica y los eventos clave, con momentos de mayor velocidad en los puntos de conflicto y reflexiones más pausadas en las partes introductorias y conclusivas.",
            "por_seccion": [
                {
                    "seccion": "inicio",
                    "velocidad": 4,
                    "descripcion": "Introducción al protagonista y su visión del mundo, con un ritmo pausado pero intrigante.",
                    "porcentaje_fin": 20,
                    "porcentaje_inicio": 0
                },
                {
                    "seccion": "desarrollo",
                    "velocidad": 5,
                    "descripcion": "Desarrollo de la trama con momentos de reflexión y acción equilibrados.",
                    "porcentaje_fin": 50,
                    "porcentaje_inicio": 21
                },
                {
                    "seccion": "pre_climax",
                    "velocidad": 6,
                    "descripcion": "Aumento de la tensión y el conflicto interno del protagonista.",
                    "porcentaje_fin": 75,
                    "porcentaje_inicio": 51
                },
                {
                    "seccion": "climax",
                    "velocidad": 7,
                    "descripcion": "Momento de mayor intensidad emocional y narrativa.",
                    "porcentaje_fin": 90,
                    "porcentaje_inicio": 76
                },
                {
                    "seccion": "resolucion",
                    "velocidad": 4,
                    "descripcion": "Desenlace reflexivo y pausado, con una resolución impactante.",
                    "porcentaje_fin": 100,
                    "porcentaje_inicio": 91
                }
            ],
            "puntuacion_general": 5
        },
        "densidad_informacion": {
            "nivel": "densa",
            "puntuacion": 8,
            "descripcion": "La obra presenta una alta densidad de información psicológica y filosófica, con profundas reflexiones sobre la naturaleza humana y el arte.",
            "tipo_informacion_predominante": [
                {
                    "tipo": "psicologica",
                    "porcentaje": 50
                },
                {
                    "tipo": "filosofica",
                    "porcentaje": 30
                },
                {
                    "tipo": "descriptiva",
                    "porcentaje": 20
                }
            ]
        },
        "proporcion_elementos": {
            "dialogo": 30,
            "grafico": [
                {
                    "elemento": "Acción física",
                    "porcentaje": 20
                },
                {
                    "elemento": "Diálogo",
                    "porcentaje": 30
                },
                {
                    "elemento": "Reflexión interna",
                    "porcentaje": 35
                },
                {
                    "elemento": "Descripción",
                    "porcentaje": 10
                },
                {
                    "elemento": "Exposición",
                    "porcentaje": 5
                }
            ],
            "exposicion": 5,
            "descripcion": 10,
            "accion_fisica": 20,
            "reflexion_interna": 35
        }
    },
    "metadata": {
        "confianza": 0.9,
        "fecha_analisis": "2023-10-01",
        "version_analisis": "1.0"
    },
    "cromosoma": 6,
    "visualizacion": {
        "descripcion_corta": "El túnel presenta un ritmo narrativo ondulante y una alta densidad de información psicológica y filosófica.",
        "puntuacion_global": 7,
        "caracteristicas_destacadas": [
            "Ritmo variable con momentos de alta velocidad y lentitud reflexiva.",
            "Alta densidad de información psicológica y filosófica.",
            "Uso efectivo de monólogos interiores y flashbacks."
        ]
    }
};
export type RhythmDensityChromosome = typeof rhythmDensityChromosome;

export const linguisticComplexityChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Complejidad Lingüística",
    "analisis": {
        "sintaxis": {
            "nivel": "alto",
            "descripcion": "La sintaxis es compleja, con estructuras subordinadas muy frecuentes y una profundidad significativa en las oraciones. Se observan estructuras sintácticas especiales que añaden profundidad a la narrativa.",
            "subordinacion": {
                "frecuencia": "muy_frecuente",
                "profundidad": 4
            },
            "complejidad_sintactica": 9,
            "estructuras_especiales": true,
            "longitud_promedio_oracion": 25
        },
        "accesibilidad": {
            "descripcion": "La accesibilidad para lectores no nativos es moderada debido a la complejidad sintáctica y al vocabulario técnico utilizado.",
            "traducibilidad": 6,
            "lectores_no_nativos": 5,
            "barreras_principales": [
                "complejidad sintáctica",
                "vocabulario técnico",
                "reflexiones filosóficas"
            ]
        },
        "nivel_lectura": {
            "nivel": "avanzado",
            "puntuacion": 8,
            "descripcion": "La obra presenta una narrativa compleja con profundas reflexiones filosóficas y psicológicas que requieren un nivel de lectura avanzado.",
            "edad_recomendada_minima": 18,
            "nivel_educativo_requerido": "universitario"
        },
        "riqueza_lexica": {
            "descripcion": "El vocabulario es rico y variado, con un uso significativo de términos técnicos y filosóficos que enriquecen la narrativa.",
            "type_token_ratio": 0.85,
            "diversidad_lexica": 9,
            "palabras_dificiles": {
                "tipos": [
                    "técnicas",
                    "filosóficas",
                    "psicológicas"
                ],
                "ejemplos": [
                    "existencialismo",
                    "metempsicosis",
                    "epifanía"
                ],
                "porcentaje": 15
            },
            "vocabulario_unico_estimado": 5000
        },
        "registro_variacion": {
            "descripcion": "La obra presenta una variación significativa en el registro lingüístico, adaptándose al contexto y a los personajes.",
            "registros_presentes": [
                {
                    "tipo": "formal_literario",
                    "efectividad": 9,
                    "contexto_uso": "narrativa principal",
                    "frecuencia_porcentaje": 70
                },
                {
                    "tipo": "coloquial",
                    "efectividad": 7,
                    "contexto_uso": "diálogos",
                    "frecuencia_porcentaje": 30
                }
            ],
            "variacion_por_contexto": true,
            "variacion_por_personaje": true
        },
        "indices_legibilidad": {
            "notas": "Los índices de legibilidad indican que el texto es complejo y requiere un alto nivel de comprensión lectora.",
            "gunning_fog_index": 15.2,
            "flesch_reading_ease": {
                "puntuacion": 40,
                "interpretacion": "difícil"
            },
            "flesch_kincaid_grade": 12.5
        },
        "innovaciones_linguisticas": {
            "neologismos": {
                "amount": 5,
                "ejemplos": [
                    "introspeccionismo",
                    "autodestruccionismo"
                ],
                "proposito": "reflejar la profundidad psicológica y filosófica del protagonista"
            },
            "juegos_palabras": {
                "presente": true,
                "frecuencia": 5,
                "complejidad": 7
            },
            "impacto_cultural": 8,
            "lenguaje_inventado": {
                "nombre": null,
                "alcance": null,
                "presente": false,
                "descripcion": null
            },
            "terminos_trascendentes": [
                "túnel",
                "soledad",
                "existencialismo"
            ]
        }
    },
    "metadata": {
        "confianza": 0.95,
        "fecha_analisis": "2023-10-01",
        "version_analisis": "1.0"
    },
    "cromosoma": 7,
    "visualizacion": {
        "descripcion_corta": "Obra compleja con una riqueza léxica y sintáctica significativa.",
        "puntuacion_global": 8.5,
        "caracteristicas_destacadas": [
            "riqueza léxica",
            "complejidad sintáctica",
            "profundidad filosófica"
        ]
    }
};
export type LinguisticComplexityChromosome = typeof linguisticComplexityChromosome;

export const culturalContextChromosome = {
    "libro": {
        "año": 1948,
        "autor": "Ernesto Sabato",
        "titulo": "El túnel"
    },
    "nombre": "Contexto Cultural",
    "analisis": {
        "influencias": {
            "politicas": [
                "Crítica a la sociedad burguesa",
                "Reflexión sobre la condición humana"
            ],
            "literarias": [
                {
                    "name": "Fiódor Dostoievski",
                    "tipo": "autor",
                    "descripcion": "Influencia en la exploración psicológica y la representación de personajes atormentados."
                },
                {
                    "name": "Existencialismo",
                    "tipo": "tradicion",
                    "descripcion": "Corriente filosófica que influye en la temática de la alienación y la búsqueda de sentido."
                }
            ],
            "personales": "La experiencia personal de Sabato como pintor y su interés en la psicología humana.",
            "filosoficas": [
                "Existencialismo",
                "Nihilismo"
            ]
        },
        "legado_impacto": {
            "adaptaciones": [
                {
                    "año": 1952,
                    "medio": "pelicula",
                    "titulo": "El túnel"
                }
            ],
            "estatus_actual": "Obra clásica de la literatura latinoamericana, estudiada y admirada por su profundidad psicológica y su estilo literario único.",
            "recepcion_inicial": "La novela fue recibida con interés por su profundidad psicológica y su estilo innovador, aunque también generó controversia por su contenido oscuro y perturbador.",
            "evolucion_recepcion": "Con el tiempo, 'El túnel' ha sido reconocido como una obra maestra de la literatura latinoamericana y una contribución significativa al existencialismo literario.",
            "influencia_cultural": 8,
            "obras_influenciadas": [
                {
                    "año": 1961,
                    "tipo": "libro",
                    "titulo": "Sobre héroes y tumbas"
                },
                {
                    "año": 1968,
                    "tipo": "libro",
                    "titulo": "La traición de Rita Hayworth"
                }
            ],
            "conceptos_popularizados": [
                "Alienación existencial",
                "Psicología del arte"
            ]
        },
        "epoca_narrativa": {
            "periodo": "presente",
            "año_especifico": null,
            "ubicacion_geografica": "Buenos Aires, Argentina",
            "diferencia_con_publicacion": "La narrativa se desarrolla en un presente atemporal, reflejando las tensiones y alienación del ser humano en un contexto urbano."
        },
        "epoca_publicacion": {
            "año": 1948,
            "contexto_social": "Sociedad argentina en transformación, con tensiones entre lo tradicional y lo moderno, y una creciente influencia de la cultura europea.",
            "motivacion_autor": "Exploración de la psicología humana y la alienación existencial, influenciada por la filosofía existencialista y la experiencia personal del autor.",
            "contexto_politico": "Argentina bajo el gobierno de Juan Domingo Perón, con un clima político marcado por el populismo y la polarización social.",
            "eventos_historicos": [
                "Fin de la Segunda Guerra Mundial",
                "Inicio de la Guerra Fría",
                "Ascenso del peronismo en Argentina"
            ],
            "contexto_tecnologico": "Avances tecnológicos post-Segunda Guerra Mundial, con una incipiente industrialización en Argentina."
        },
        "vigencia_relevancia": {
            "nivel": "Alto",
            "razones": "La exploración de la psicología humana y la alienación sigue siendo relevante en el contexto actual, donde la soledad y la búsqueda de sentido son temas universales.",
            "puntuacion": 9,
            "temas_datados": [],
            "temas_vigentes": [
                "Alienación",
                "Búsqueda de sentido",
                "Psicología humana"
            ],
            "elementos_profeticos": [
                "La crítica a la sociedad burguesa y su alienación",
                "La reflexión sobre la condición humana y su soledad existencial"
            ]
        },
        "movimiento_literario": {
            "subgeneros": [
                "Existencialista",
                "Drama"
            ],
            "principales": [
                "Existencialismo",
                "Realismo psicológico"
            ],
            "genero_literario": "Novela psicológica",
            "subversion_innovacion": "Sabato subvierte las expectativas del realismo tradicional al profundizar en la mente perturbada del protagonista, creando una narrativa introspectiva y psicológicamente compleja.",
            "caracteristicas_presentes": [
                "Exploración de la psicología del protagonista",
                "Enfoque en la alienación y la soledad",
                "Uso de un narrador en primera persona"
            ]
        },
        "significado_historico_literario": {
            "lugar_canon": "Obra fundamental en el canon de la literatura latinoamericana y una contribución significativa al existencialismo literario.",
            "importancia_tematica": "La novela aborda temas universales como la alienación, la soledad y la búsqueda de sentido, lo que la convierte en una obra significativa en la literatura existencialista.",
            "representacion_epoca": "Refleja las tensiones y alienación del ser humano en un contexto urbano, así como las influencias de la cultura europea en la sociedad argentina.",
            "innovaciones_tecnicas": [
                "Uso de un narrador en primera persona para explorar la psicología del protagonista",
                "Estructura narrativa que refleja la mente perturbada del protagonista"
            ],
            "posicion_carrera_autor": "Primera novela de Ernesto Sabato, que lo consolidó como un escritor importante en la literatura latinoamericana.",
            "puntuacion_importancia": 9
        }
    },
    "metadata": {
        "confianza": "Alta",
        "fecha_analisis": "2023-10-01",
        "version_analisis": "1.0"
    },
    "cromosoma": 8,
    "visualizacion": {
        "descripcion_corta": "El túnel' es una novela psicológica que explora la mente de un pintor atormentado, reflejando temas de alienación y soledad en un contexto urbano.",
        "puntuacion_global": 9,
        "caracteristicas_destacadas": [
            "Profundidad psicológica",
            "Narrativa introspectiva",
            "Exploración de la alienación existencial"
        ]
    }
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

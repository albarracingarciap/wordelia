export type DiscussionGuide = typeof demoDiscussionGuide;

export const demoDiscussionGuide = {
    metadata: {
        marca: "Wordelia",
        tipo_documento: "Guía de Discusión para Clubes de Lectura de Alta Gama",
        instrucciones_formato:
            "Usar Markdown estandar para enfatizar texto, negritas o listas dentro de los strings si es necesario. Evitar el uso de LaTeX para formatos simples.",
    },
    cabecera: {
        titulo_libro: "EL TÚNEL",
        autor: "Ernesto Sábato",
        ano_publicacion: "1948",
        conceptos_clave: [
            "Obsesión patológica",
            "Incomunicación existencial",
            "Ceguera de la razón",
            "Búsqueda de absoluto",
        ],
        idea_central_apertura:
            '> "El túnel" nos encierra en la mente claustrofóbica de Juan Pablo Castel para mostrarnos cómo el anhelo más profundo de ser comprendido puede degenerar en un control destructivo. La novela nos fuerza a explorar los límites de nuestra propia racionalidad y a cuestionar si el amor verdadero puede coexistir con el aislamiento radical del ser humano.',
    },
    como_usar_guia: {
        antes_de_empezar: {
            temas_sensibles: [
                "Violencia psicologica y fisica contra las mujeres",
                "Celos patologicos cronicos (delirio celotipico)",
                "Feminicidio premeditado y confesado",
                "Ideacion suicida y depresion existencial grave",
                "Manipulacion emocional y dinamicas de poder abusivas",
            ],
            norma_conversacion:
                "Analizaremos la psique de los personajes desde una perspectiva estrictamente psicologica y literaria, evitando romantizar las conductas controladoras del protagonista y enfocandonos en desmenuzar los mecanismos de su obsesion a traves del texto.",
        },
        ficha_rapida_sesion: [
            {
                momento: "Bienvenida",
                duracion: "10 min",
                objetivo: "Contexto minimo",
                dinamica:
                    "Ernesto Sabato, la crisis de la posguerra mundial y el existencialismo latinoamericano.",
            },
            {
                momento: "Primera ronda",
                duracion: "15 min",
                objetivo: "Impresiones",
                dinamica:
                    "Cada persona comparte una palabra y una escena impactante (por ejemplo, el encuentro en la ventana de la galeria).",
            },
            {
                momento: "Discusion central",
                duracion: "50 min",
                objetivo: "Profundizar",
                dinamica:
                    "Elegir 2 o 3 temas del mapa conceptual (como la logica paranoica o el simbolo de la ventana).",
            },
            {
                momento: "Actividad",
                duracion: "25 min",
                objetivo: "Participar",
                dinamica:
                    "Deconstruccion matematica de los delirios de Castel e interpretacion colectiva del cuadro.",
            },
            {
                momento: "Conexiones actuales",
                duracion: "10 min",
                objetivo: "Actualizar",
                dinamica:
                    "Paralelismos con el presente (hiperconectividad, dinamicas toxicas en redes) con cautela y respeto.",
            },
            {
                momento: "Cierre",
                duracion: "10 min",
                objetivo: "Sintesis",
                dinamica: "Frase final, valoracion numerica del libro y proxima lectura.",
            },
        ],
        duracion_sugerida: "120 minutos",
        formato: "Club de lectura analítico",
    },
    obra_y_contexto: {
        resumen_analitico: [
            'La novela se abre con una confesion tan directa como brutal: "Bastara decir que soy Juan Pablo Castel, el pintor que mato a Maria Iribarne". Desde ese punto de partida, el propio protagonista relata en primera persona los acontecimientos que lo condujeron al crimen. Castel, un artista solitario y misantropo que desprecia profundamente a la sociedad y a los criticos de arte, experimenta un vuelco absoluto en su monotona existencia cuando descubre a una joven, Maria, contemplando un detalle imperceptible para los demas en uno de sus cuadros: una pequena ventana que muestra a una mujer mirando el mar en una escena de soledad absoluta.',
            "A partir de ese instante, Castel identifica en Maria a la unica persona capaz de comprender su universo interior. Lo que inicia como una busqueda desesperada de comunion espiritual se transforma rapidamente en una persecucion obsesiva gobernada por la sospecha, los celos y los interrogatorios asfixiantes. Castel somete cada palabra, silencio y mirada de Maria a un implacable escrutinio logico, construyendo laberintos mentales de desconfianza que lo aislan cada vez mas, hasta convertir su anhelada conexion en una trampa mortal.",
        ],
        clave_de_lectura:
            "El túnel resulta profundamente perturbadora porque sitúa al lector directamente en la cabina de mandos de una mente psicópata e hiperracional. La genialidad y la incomodidad de la obra radican en que Castel no utiliza la locura caótica para justificar sus actos, sino una lógica matemática hiperbólica, rígida y aparentemente impecable que retuerce la realidad para adaptarla a sus peores sospechas. La tesis de la novela postula que la razón pura, desprovista de empatía y desbocada por el miedo al abandono, se convierte en la herramienta de destrucción definitiva del otro.",
        contexto_creacion_ecos_historicos: [
            "El trauma de la Segunda Guerra Mundial y el Existencialismo: Publicada en 1948, la novela respira el aire de desencanto, absurdo y escepticismo radical hacia la humanidad que caracterizo a la posguerra europea, conectando de forma directa con pensadores como Jean-Paul Sartre y Albert Camus.",
            "La transicion personal de Sabato de la ciencia a la literatura: Antes de dedicarse a las letras, Sabato era un fisico doctorado que trabajo en laboratorios de vanguardia. Su posterior desilusion con la ciencia -al ver como el racionalismo puro engendraba la bomba de destruccion masiva- se refleja directamente en la critica de la novela hacia la logica fria de Castel.",
        ],
    },
    mapa_discusion_rutas: [
        {
            eje_numero: "1",
            titulo: "La paradoja de la hiperracionalidad destructiva",
            linea_conceptual:
                "El uso que hace Castel de la logica analitica y deductiva como el motor principal para alimentar su paranoia y sus celos.",
            preguntas_analiticas: [
                "Como demuestra la novela que una mente puede ser perfectamente logica en sus razonamientos internos pero estar completamente desequilibrada en sus premisas iniciales?",
                "En que momentos los interrogatorios de Castel a Maria dejan de ser conversaciones y se transforman en juicios inquisitoriales?",
            ],
        },
        {
            eje_numero: "2",
            titulo: "La imposibilidad de la comunicación humana",
            linea_conceptual:
                "La tesis existencialista de que los seres humanos estamos condenados a una soledad radical e insalvable, simbolizada en los túneles paralelos.",
            preguntas_analiticas: [
                "Buscaba Castel en Maria a un ser humano real con sus propias complejidades o simplemente un espejo idilico que validara su propio ego artistico?",
                "Que papel juega el misterio y la opacidad de las respuestas de Maria en la desesperacion de Castel por poseer su mente?",
            ],
        },
        {
            eje_numero: "3",
            titulo: "El desprecio a la mediocridad burguesa y el elitismo intelectual",
            linea_conceptual:
                "La misantropia explicita del protagonista hacia los salones de arte, los criticos, la familia de Allende y los circulos sociales.",
            preguntas_analiticas: [
                "Es el desprecio de Castel por la sociedad un sintoma de su superioridad moral o una barrera defensiva para ocultar su incapacidad patologica de encajar en el mundo?",
                "Que critica social realiza Sabato a traves de la caricaturizacion de personajes como el primo Hunter y la frivolidad de la estancia en el campo?",
            ],
        },
        {
            eje_numero: "4",
            titulo: "La ceguera fisica frente a la ceguera emocional",
            linea_conceptual:
                "El fuerte contraste simbolico entre la ceguera real de Allende (el esposo de Maria) y la ceguera emocional de Juan Pablo Castel.",
            preguntas_analiticas: [
                "Por que el protagonista se niega sistematicamente a ver las senales evidentes del sufrimiento de Maria mientras inventa conspiraciones complejas en su mente?",
                "Que significado etico tiene la reaccion final de Allende al enterarse del crimen y calificar a Castel de 'insensato'?",
            ],
        },
        {
            eje_numero: "5",
            titulo: "El arte como unico puente de salvacion fallido",
            linea_conceptual:
                "La pintura como el lenguaje inicial que propicia el encuentro, pero que resulta insuficiente para rescatar a Castel de su aislamiento.",
            preguntas_analiticas: [
                "Por que el detalle de 'Maternidad' (la mujer mirando el mar desde la ventana) es el unico cordon umbilical que une a los protagonistas?",
                "Que simboliza el acto final de Castel de destruir a hachazos sus propias telas antes de entregarse a las autoridades?",
            ],
        },
    ],
    preguntas_poderosas: {
        bloque_tematico_A: {
            titulo_bloque: "Obsesión y Condición Humana",
            preguntas: [
                "1. Si la necesidad de ser comprendidos con absoluta fidelidad es un deseo humano universal, en que punto exacto se cruza la linea que separa el amor romantico e intenso de la obsesion posesiva y totalitaria?",
                "2. En la escena donde Castel insulta cruelmente a Maria en la plaza y luego le pide perdon de rodillas de manera humillante, como opera este ciclo de violencia psicologica para anular la voluntad de la victima?",
                "3. Castel justifica sus sospechas argumentando que Maria engana a un hombre ciego (Allende), por lo que es capaz de enganar a cualquiera. Hasta que punto usamos las debilidades reales o supuestas de los demas para justificar nuestras propias conductas destructivas?",
            ],
        },
        bloque_tematico_B: {
            titulo_bloque: "Psicología, Espacio y Resistencia",
            preguntas: [
                "1. La cabana y los acantilados en la estancia de Hunter representan espacios donde Maria parece respirar con una libertad que Castel no puede tolerar. Por que los entornos abiertos y naturales agudizan la paranoia del pintor en comparacion con su estudio cerrado?",
                "2. Analizando los suenos recurrentes de Castel (como el de la casa donde un hombre lo transforma en un monstruo de bolsillo): como anticipa su subconsciente la perdida total de su dignidad y el fracaso absoluto de su cordura?",
                "3. Maria nunca revela por completo que piensa ni detalla su relacion con los otros hombres. Es este silencio una estrategia de manipulacion afectiva o el ultimo bastion de resistencia psicologica para proteger su intimidad frente a la invasion de Castel?",
            ],
        },
    },
    personajes_tarjetas: [
        {
            nombre: "Juan Pablo Castel",
            analisis:
                "Pintor de renombre, narrador y asesino de Maria. Es un alma atormentada, solitaria e hiperlucida que sufre de una incapacidad cronica para procesar la incertidumbre emocional, lo que lo lleva a asfixiar lo unico que ama.",
            pregunta_discusion:
                "Es Castel un monstruo consciente que manipula su relato desde la carcel para justificarse, o es la victima tragica de un laberinto mental del que fisicamente no podia escapar?",
        },
        {
            nombre: "Maria Iribarne",
            analisis:
                "La mujer esquiva y melancolica que es capaz de descifrar el secreto de la pintura de Castel. Vive atrapada en una red de relaciones ambiguas (Allende, Hunter) y se convierte en el objeto de una obsesion que intuye fatal.",
            pregunta_discusion:
                "Por que Maria regresa una y otra vez al lado de Castel a pesar de sufrir sus constantes humillaciones, agresiones verbales e interrogatorios destructivos?",
        },
        {
            nombre: "Allende",
            analisis:
                "El esposo ciego de Maria. Se presenta como un hombre culto, sereno y profundamente enamorado de su mujer, cuya ceguera fisica contrasta ironicamente con la lucidez distorsionada y paranoica del pintor.",
            pregunta_discusion:
                "Su actitud pasiva ante las ausencias de Maria representa una confianza madura y absoluta o una negacion voluntaria para evitar el colapso de su matrimonio?",
        },
        {
            nombre: "Luis Hunter",
            analisis:
                "El primo de Allende que administra la estancia en el campo. Encarna el tipo de intelectual frivolo, ironico y mundano que Castel detesta con pasion, avivando las sospechas de una infidelidad con Maria.",
            pregunta_discusion:
                "Es la relacion de Hunter con Maria una verdadera aventura amorosa o una fantasia sin bases solidas construida enteramente por los celos neuroticos de Castel?",
        },
        {
            nombre: "Lartigue",
            analisis:
                "Un escritor amigo del circulo de Hunter al que Castel acude e interroga de manera imprevista para conseguir informacion sobre Maria. Su incomodidad delata la tension entre el mundo social y la violencia latente del pintor.",
            pregunta_discusion:
                "Representa Lartigue la hipocresia y el miedo de los circulos artisticos que prefirieron ignorar las senales claras de la locura peligrosa de Castel para evitar conflictos?",
        },
    ],
    simbolos_y_motivos: [
        {
            simbolo: "El Túnel",
            lectura_posible:
                "Representa el aislamiento radical del individuo; la vida de Castel como un trayecto oscuro, amurallado y solitario, donde María era solo un destello exterior transitorio que transcurría fuera de sus muros.",
        },
        {
            simbolo: "La Ventana (En el cuadro)",
            lectura_posible:
                "Simboliza la verdadera esperanza de comunicacion, el acceso al alma escondida de Castel y el deseo de trascender la soledad a traves de la mirada artistica compartida.",
        },
        {
            simbolo: "La Ceguera",
            lectura_posible:
                "Representa la incapacidad de ver la realidad del otro. Contrasta la ceguera fisica y digna de Allende con la ceguera mental y egocentrica de Castel, quien solo es capaz de mirarse a si mismo.",
        },
        {
            simbolo: "El Mar",
            lectura_posible:
                "Simboliza el absoluto, lo infinito, los sentimientos indomables y el misterio de la psique de Maria al que Castel desea acceder desesperadamente por la fuerza.",
        },
        {
            simbolo: "Las Cartas",
            lectura_posible:
                "Representan la comunicacion mediada, fragmentada e incompleta; textos que en lugar de aclarar la verdad actuan como acertijos que disparan la locura interpretativa de Castel.",
        },
    ],
    estructura_y_final: {
        arquitectura_narrativa:
            "La novela adopta una arquitectura de confesion retrospectiva o cronica de un crimen anunciado en formato de diario intimo. La estructura es un circulo cerrado: el lector conoce el desenlace tragico desde la primera linea, lo que elimina el suspense policial y traslada toda la tension hacia el *como* y el *por que* psicologico. El climax se desata en la estancia de Hunter y culmina en el dormitorio de Maria.",
        tres_lecturas_final: [
            {
                enfoque: "Lectura del Destino Inevitable (El tunel cerrado)",
                explicacion:
                    "El asesinato de Maria es la confirmacion tragica de la tesis existencialista. Al matarla, Castel destruye la unica ventana al mundo exterior que poseia, sellando su tunel para siempre. Los muros de la prision fisica solo reflejan los muros permanentes de su mente.",
            },
            {
                enfoque: "Lectura del Castigo de la Razon (La ironia del insensato)",
                explicacion:
                    "Cuando Allende llama 'insensato' a Castel antes de intentar suicidarse, desmantela toda la arquitectura de justificaciones racionales que el pintor construyo. El criminal se queda solo con la revelacion de que sus detallados calculos matematicos fueron simplemente estupidos y crueles.",
            },
            {
                enfoque: "Lectura del Crimen de Posesion Absoluta",
                explicacion:
                    "Castel mata a Maria para congelar su misterio. Incapaz de aceptar que ella pertenezca a otros mundos (Allende, Hunter, la naturaleza), decide que si no puede poseer su mente en exclusiva, el unico modo de detener su angustia es deteniendo la vida de Maria, convirtiendo el feminicidio en el acto egoista definitivo.",
            },
        ],
    },
    conexiones_mundo_actual: [
        "La cultura del acoso digital y el control algoritmico: En la era de las redes sociales, los celos de Castel se han tecnificado. La obsesion contemporanea por rastrear las 'ultimas conexiones', los me gusta y las interacciones digitales emula de forma identica los interrogatorios matematicos de la novela, donde el espacio de misterio del otro es visto como una amenaza.",
        "La paradoja de la hiperconectividad y la soledad existencial: Nunca antes la humanidad estuvo tan conectada tecnologicamente y, sin embargo, los indices de aislamiento psicologico y depresion estan en maximos historicos. El sindrome del 'tunel' de Castel ilustra al ciudadano actual: rodeado de herramientas de comunicacion pero incapaz de entarblar un contacto autentico.",
        "La desconstruccion de los mitos del amor romantico nocivo: La lectura contemporanea de *El tunel* permite etiquetar con precision clinica conductas que en el siglo XX a menudo se minimizaban como 'pasion artistica'. El libro opera hoy como una radiografia nitida de la violencia de genero psicologica, mostrando como la idealizacion extrema del ser amado es la antesala de la dominacion.",
    ],
    actividades_dinamizar: [
        {
            nombre_actividad: "El Juicio a la Logica de Castel",
            descripcion_detallada:
                "El moderador selecciona 2 o 3 pasajes donde Castel realiza un 'razonamiento deductivo' para demostrar que Maria miente (por ejemplo, el tiempo que tardo en responder una carta o su tono de voz al telefono). Los participantes deben actuar como abogados defensores de la realidad, desmontando las falacias argumentativas logicas del pintor y proponiendo explicaciones cotidianas y saludables que Castel omitio deliberadamente.",
        },
        {
            nombre_actividad: "El Taller de la Ventana Oculta",
            descripcion_detallada:
                "Se coloca en el centro de la reunion una reproduccion de un cuadro que simule una escena solitaria (o la descripcion del propio cuadro de Castel). Cada participante debe escribir en un papel anonimo que cree que esta mirando la mujer de la ventana. Luego se leen en voz alta para analizar como cada persona proyecta sus propios miedos, soledades y deseos en el arte, tal como hicieron Juan Pablo y Maria.",
        },
    ],
    cierre_discusion: {
        pregunta_sintesis:
            "1. Si el tunel de la soledad radical es una condicion humana inevitable, creen que el arte y la literatura logran abrir verdaderas ventanas entre nosotros o son solo ilusiones opticas que agudizan nuestro aislamiento?",
        pregunta_vigencia:
            "2. Por que creen que *El tunel* sigue siendo considerada una de las cumbres de la novela psicologica, y que nos dice su vigencia sobre la permanencia de los abismos de la mente humana?",
        evaluacion_relevancia:
            "3. Del 1 al 10, que relevancia tiene hoy esta novela? Justifica tu respuesta evaluando si nuestras dinamicas relacionales actuales han aprendido a detectar a los Juan Pablo Castel a tiempo o si los hemos normalizado.",
        frase_salida: {
            texto: "Y pensar que el iluminar ese trozo de playa no habia hecho sino descubrir la vastedad de la noche que nos rodeaba...",
            fuente: "Juan Pablo Castel",
        },
    },
    notas_moderador_salvavidas: [
        {
            situacion: "Si el grupo esta callado o intimidado:",
            intervencion_sugerida:
                '"Castel nos confiesa el asesinato en la primera linea del libro. Como afecta esta falta de misterio policial a la forma en que juzgamos sus pensamientos a lo largo de la lectura?"',
        },
        {
            situacion: "Si una persona monopoliza el turno:",
            intervencion_sugerida:
                '"Has analizado de forma brillante la misantropia del protagonista; para expandir el debate al resto del grupo, creen los demas que Maria realmente lo enganaba o todo es una construccion mental de el?"',
        },
        {
            situacion: "Si hay un desacuerdo fuerte o polarizacion:",
            intervencion_sugerida:
                '"El debate sobre la culpa moral nos esta encendiendo, pero regresemos a la evidencia del texto: como describe Castel su propia frialdad fisica en el momento exacto en que entra al cuarto de Maria con el cuchillo?"',
        },
    ],
};

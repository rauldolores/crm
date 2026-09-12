import type { Grupo } from "./tipos";

/**
 * Primeros pasos y pantalla por pantalla.
 *
 * Escrito para alguien que nunca ha usado un CRM: primero qué es y para qué
 * sirve, luego cada pantalla con un ejemplo de negocio real (una panadería,
 * un taller, una clínica…), porque la mayoría de quien lo lee no vende
 * software, vende pan.
 */

export const PRIMEROS_PASOS: Grupo = {
  id: "primeros-pasos",
  titulo: "Primeros pasos",
  secciones: [
    {
      id: "que-es-un-crm",
      titulo: "¿Qué es un CRM y para qué me sirve?",
      resumen:
        "Un CRM es la libreta donde apuntas a quién le vendes, qué le has prometido y qué toca hacer después. Solo que compartida, ordenada y que avisa.",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Piensa en cómo llevas hoy a tus clientes: una libreta, el WhatsApp, una hoja de cálculo, la memoria. Funciona hasta que hay más de veinte, hasta que alguien del equipo se va de vacaciones, o hasta que un cliente te dice «quedamos en que me llamabas el martes» y nadie lo apuntó. Un CRM (Customer Relationship Management, «gestión de la relación con los clientes») resuelve exactamente eso: un solo sitio donde está cada persona, cada empresa, cada venta en marcha y cada cosa pendiente.",
        },
        {
          tipo: "parrafo",
          texto:
            "Vinqulia gira alrededor de cuatro ideas. Un contacto es una persona. Una empresa es dónde trabaja (o su propio negocio). Una oportunidad es una venta que estás intentando cerrar. Una tarea es algo que tienes que hacer, con fecha. Todo lo demás (notas, etiquetas, tickets, automatizaciones) cuelga de esas cuatro.",
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: una panadería que vende a restaurantes",
          texto:
            "«La Espiga» reparte pan a 40 restaurantes. Cada restaurante es una empresa; el encargado de compras de cada uno es un contacto. Cuando un restaurante nuevo pide precios, se crea una oportunidad («Suministro semanal – Casa Lola», 900 €/mes) que va avanzando por etapas: primer contacto → propuesta enviada → negociación → ganada. Después de cada llamada se deja una nota («quiere probar el pan de masa madre, mandar muestras el jueves») y una tarea («llevar muestras», jueves 9:00). El viernes, el dueño abre el panel y ve de un vistazo qué ventas hay abiertas, cuánto dinero suman y qué tareas vencen hoy.",
        },
        {
          tipo: "lista",
          items: [
            "Nunca más «¿quién habló con este cliente la última vez?»: la ficha guarda el historial completo.",
            "Ves todas las ventas en marcha en un tablero, y cuánto suman por etapa.",
            "Las tareas con fecha aparecen en el panel y en el calendario; nada se cae.",
            "El equipo comparte la misma información: si alguien falta, otro puede seguir.",
            "Cuando crezcas, el CRM puede hacer cosas solo: crear tareas, enviar correos, avisar a otros sistemas.",
          ],
        },
      ],
    },
    {
      id: "conceptos",
      titulo: "Los conceptos, en una tabla",
      resumen:
        "Las palabras que verás por toda la aplicación y qué significan.",
      bloques: [
        {
          tipo: "tabla",
          cabeceras: ["Palabra", "Qué es", "Ejemplo"],
          filas: [
            [
              "Contacto",
              "Una persona con la que tratas.",
              "Marta García, encargada de compras.",
            ],
            [
              "Empresa",
              "El negocio al que pertenece uno o varios contactos.",
              "Restaurante Casa Lola.",
            ],
            [
              "Oportunidad",
              "Una venta que intentas cerrar. Tiene importe, etapa y fecha prevista.",
              "«Suministro semanal – Casa Lola», 900 €, en negociación.",
            ],
            [
              "Embudo",
              "El camino por el que pasan tus oportunidades, dividido en etapas. Puedes tener varios (ventas nuevas, renovaciones…).",
              "Primer contacto → Propuesta → Negociación → Ganada / Perdida.",
            ],
            [
              "Etapa",
              "Cada paso del embudo. Mover una oportunidad de etapa es arrastrarla en el tablero.",
              "Propuesta enviada.",
            ],
            [
              "Tarea",
              "Algo que hay que hacer, con fecha, tipo y responsable. Cuelga de un contacto.",
              "Llamar a Marta, martes 10:00, tipo «Llamada».",
            ],
            [
              "Nota",
              "Lo que pasó: una llamada, una reunión, un acuerdo. Es el historial del contacto.",
              "«Quiere probar masa madre. Mandar muestras.»",
            ],
            [
              "Estado del contacto",
              "Qué tan cerca está de comprar: frío, templado, caliente, con contrato. Se cambia desde una nota.",
              "Caliente.",
            ],
            [
              "Etiqueta",
              "Una palabra de color para agrupar contactos como tú quieras.",
              "vip, feria-2026, zona-norte.",
            ],
            [
              "Ticket",
              "Una incidencia o petición de soporte de un cliente, con estado abierto/cerrado.",
              "«No le llegó el pedido del lunes».",
            ],
            [
              "Responsable",
              "La persona de tu equipo que gestiona ese contacto, oportunidad o tarea.",
              "Raúl.",
            ],
          ],
        },
      ],
    },
    {
      id: "primer-dia",
      titulo: "Tu primer día: 20 minutos para arrancar",
      resumen:
        "El orden que recomendamos para que el CRM sea útil desde hoy, no dentro de un mes.",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            "Entra en Ajustes y revisa las listas: sectores de empresa, etapas del embudo, categorías de oportunidad, moneda. Vienen con valores razonables; cámbialos a tu vocabulario.",
            "Importa tus contactos. Si los tienes en una hoja de cálculo, expórtala a CSV y súbela desde Importar datos; si son pocos, créalos a mano desde Contactos → Nuevo contacto.",
            "Crea las oportunidades que tienes abiertas ahora mismo, aunque sean tres. Ponles importe: es lo que hace que el panel y los informes digan algo.",
            "Apunta las tareas pendientes de esta semana en los contactos que correspondan.",
            "Invita a tu equipo desde Usuarios. Cada persona entra con su propia cuenta y ve lo mismo que tú.",
            "A partir de ahí, la regla de oro: cada vez que hables con un cliente, deja una nota. Treinta segundos. Es lo que convierte el CRM en memoria.",
          ],
        },
        {
          tipo: "consejo",
          texto:
            "No intentes configurarlo todo el primer día. Automatizaciones, formularios web, plantillas de correo o la API son para cuando ya tengas datos y sepas qué se repite.",
        },
      ],
    },
    {
      id: "navegacion",
      titulo: "Cómo moverte por la aplicación",
      resumen:
        "La barra lateral, la cabecera y lo que hay en cada rincón de la pantalla.",
      bloques: [
        {
          tipo: "lista",
          items: [
            "Barra lateral, bloque «Principal»: las pantallas de trabajo diario (Panel, Contactos, Empresas, Oportunidades, Tareas, Tickets, Usuarios, Informes).",
            "Bloque «Módulos»: las funciones que has activado en el catálogo (Clientes, Afiliados). Si no las ves, están apagadas.",
            "Bloque «Herramientas»: Plantillas de correo e Importar datos.",
            "Pie de la barra: Ayuda, Ajustes (solo administradores) y tu plan con el consumo actual.",
            "Cabecera: el selector de organización (si perteneces a varias), el tema claro/oscuro, el botón de refrescar y tu perfil. El símbolo «?» te trae aquí, a la sección de la pantalla en la que estés.",
            "En el móvil la navegación va abajo: Panel, Contactos, el botón «+» para crear, Tareas y Ajustes.",
          ],
        },
        {
          tipo: "consejo",
          texto:
            "En cualquier lista, el buscador de arriba busca por nombre, empresa, correo o teléfono a la vez. No hace falta elegir el campo.",
        },
      ],
    },
  ],
};

export const PANTALLAS: Grupo = {
  id: "pantallas",
  titulo: "Pantalla por pantalla",
  secciones: [
    {
      id: "panel",
      titulo: "Panel",
      resumen:
        "Tu primera pantalla del día: qué hay abierto, cuánto suma, qué toca hacer y qué ha pasado últimamente.",
      ruta: "/",
      bloques: [
        {
          tipo: "lista",
          items: [
            "Las tres cifras de arriba: contactos, empresas y oportunidades que tienes. Pulsa cualquiera para ir a su lista.",
            "Contactos calientes: los tuyos con estado «caliente», es decir, los que están a punto de comprar. Si está vacío, cambia el estado de un contacto desde una nota (Mostrar opciones).",
            "Ingresos previstos por oportunidades: por mes, lo ganado (suma completa), lo pendiente (ponderado por etapa: una oportunidad en negociación cuenta más que una recién creada) y lo perdido. Necesita que las oportunidades tengan importe.",
            "Próximas tareas: las tuyas, agrupadas por hoy, esta semana y más adelante. Puedes marcarlas hechas desde aquí.",
            "Actividad reciente: qué ha hecho el equipo (notas, contactos nuevos, oportunidades) en orden cronológico.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: lunes por la mañana",
          texto:
            "Ana, del taller Ruiz Hermanos, abre el panel: 47 oportunidades abiertas que suman 184.300 €, tres tareas para hoy (una vencida desde el viernes), y ve que su compañero dejó el sábado una nota sobre Clínica Sanz. Con eso ya sabe por dónde empezar.",
        },
      ],
    },
    {
      id: "contactos",
      titulo: "Contactos",
      resumen:
        "Las personas. La lista para encontrarlos y la ficha para saberlo todo de cada uno.",
      ruta: "/contacts",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La lista muestra nombre, puesto y empresa, etiquetas y cuándo fue la última actividad. A la izquierda, los filtros: por última actividad (hoy, esta semana, antes…), por estado (frío, templado, caliente, con contrato), por etiqueta y por tareas pendientes. Arriba, ordenar, importar CSV, exportar y crear.",
        },
        {
          tipo: "parrafo",
          texto:
            "La ficha de un contacto tiene dos partes. A la izquierda, el historial: el cuadro para añadir una nota y, debajo, todas las notas en orden. A la derecha, los datos: estado, correos y teléfonos (de trabajo, personal, otro), antecedentes, campos personalizados, etiquetas, tareas y tickets. Y las acciones: enviar correo, enviar WhatsApp, exportar a vCard, fusionar con otro contacto.",
        },
        {
          tipo: "pasos",
          titulo: "Dejar una nota después de una llamada",
          pasos: [
            "Abre la ficha del contacto y escribe en «Añade una nota».",
            "Pulsa «Mostrar opciones» para elegir el tipo (llamada, reunión, WhatsApp…), cambiar la fecha, adjuntar un archivo o cambiar el estado del contacto.",
            "Pulsa «Añadir esta nota». Aparece en el historial y en la actividad reciente del panel.",
          ],
        },
        {
          tipo: "lista",
          items: [
            "Selección múltiple: marca varias casillas para etiquetar, exportar o borrar de golpe. Con Mayús pulsada seleccionas un rango.",
            "Puntaje: el CRM calcula un puntaje de interés a partir de la actividad, y lo muestra como frío, tibio o caliente.",
            "Duplicados: al crear o importar un contacto con el mismo correo o un nombre parecido, avisa antes. Si ya tienes dos, «Fusionar con otro contacto» los junta sin perder notas ni tareas.",
            "Etiquetas: crea las que quieras con su color; sirven para filtrar y para acciones masivas.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: una clínica dental",
          texto:
            "Cada paciente es un contacto; la etiqueta «ortodoncia» marca a los que están en tratamiento largo. El filtro «Antes de este mes» + etiqueta «revisión» da la lista de quienes toca llamar para la revisión semestral. Se seleccionan todos y se exportan para la campaña de recordatorios.",
        },
      ],
    },
    {
      id: "empresas",
      titulo: "Empresas",
      resumen:
        "Los negocios con los que tratas. Agrupan a sus contactos y sus oportunidades.",
      ruta: "/companies",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Una empresa reúne a las personas que trabajan en ella y a las oportunidades que tienes con ella. En la ficha ves sus datos (sector, tamaño, web, dirección, redes), sus contactos y sus oportunidades, con pestañas para cada cosa. Si un contacto trabaja solo (un autónomo), puedes crear una empresa con su nombre o dejarlo sin empresa.",
        },
        {
          tipo: "lista",
          items: [
            "El sector y el tamaño se eligen de listas que configuras en Ajustes.",
            "Puedes filtrar por sector, tamaño y responsable, y buscar por nombre.",
            "Con el módulo Clientes activo, la ficha de la empresa gana la pestaña «Cliente»: qué ha comprado, qué tiene contratado y cuándo le vence.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: un despacho de gestoría",
          texto:
            "Gestoría Alcalá lleva 120 empresas cliente. En cada una hay dos o tres contactos (el dueño, el administrativo). Las oportunidades («Ampliación a nóminas», 200 €/mes) se abren sobre la empresa; así en la ficha de la empresa se ve todo lo que se le ha vendido y se le intenta vender.",
        },
      ],
    },
    {
      id: "oportunidades",
      titulo: "Oportunidades",
      resumen:
        "Tus ventas en marcha, en un tablero por etapas que se mueve arrastrando.",
      ruta: "/deals",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cada columna es una etapa del embudo; cada tarjeta, una oportunidad con su nombre, empresa, importe y categoría. Arriba de cada columna, cuántas hay y cuánto suman. Arrastra una tarjeta a otra columna para avanzarla. Si tienes varios embudos (ventas nuevas, renovaciones…), se eligen con las pestañas de arriba.",
        },
        {
          tipo: "pasos",
          titulo: "Crear una oportunidad",
          pasos: [
            "Pulsa «Nueva oportunidad». Pon un nombre que entiendas dentro de tres meses («Suministro semanal – Casa Lola», no «propuesta»).",
            "Elige la empresa y los contactos implicados, el importe, la categoría y la fecha prevista de cierre.",
            "Guarda. Aparece en la primera etapa del embudo. A partir de ahí, notas y tareas se añaden desde su ficha, igual que en un contacto.",
          ],
        },
        {
          tipo: "lista",
          items: [
            "Etapas ganadas y perdidas: en Ajustes marcas cuáles significan «ganada» y cuáles «perdida». Al mover una oportunidad a una etapa perdida, el CRM pregunta el motivo; eso alimenta el informe de motivos de pérdida.",
            "Archivar: una oportunidad cerrada hace tiempo se puede archivar para que no estorbe; sigue en los informes.",
            "El filtro «Solo las empresas que gestiono» deja únicamente las tuyas.",
            "Importe: si lo dejas vacío la tarjeta dice «Sin importe» y esa oportunidad no cuenta en las previsiones. Ponlo siempre, aunque sea aproximado.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: una inmobiliaria",
          texto:
            "Embudo «Ventas» con etapas Visita → Oferta → Arras → Escritura. Cada piso en venta con un comprador interesado es una oportunidad con el precio como importe. El tablero muestra en un vistazo cuánto dinero hay en «Arras», que es lo que casi seguro se cobra este trimestre.",
        },
      ],
    },
    {
      id: "tareas",
      titulo: "Tareas",
      resumen:
        "Lo que hay que hacer, con fecha. En lista o en calendario, tuyas o de todo el equipo.",
      ruta: "/tasks",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Una tarea siempre cuelga de un contacto: «llamar a Marta», «enviar presupuesto a Javier». Tiene tipo (llamada, correo, reunión, seguimiento… los configuras en Ajustes), fecha y hora, y responsable. Se crean desde la ficha del contacto, desde el panel o desde esta pantalla.",
        },
        {
          tipo: "lista",
          items: [
            "Vista lista: agrupadas por vencidas, hoy, mañana, esta semana, más adelante y sin fecha. Marca la casilla para completarla; «Mostrar completadas» enseña también las hechas.",
            "Vista calendario: por mes y día; pulsa un día para ver o crear las de esa fecha.",
            "Las automatizaciones pueden crear tareas solas: «cuando se cree un contacto, crear la tarea “Llamar de bienvenida” para dentro de 2 días».",
          ],
        },
        {
          tipo: "consejo",
          texto:
            "Una tarea sin fecha no aparece en el panel. Si de verdad no tiene plazo, ponle una fecha de revisión de todos modos: es la única forma de que vuelva a aparecer.",
        },
      ],
    },
    {
      id: "tickets",
      titulo: "Tickets",
      resumen:
        "Incidencias y peticiones de tus clientes, con estado, para que ninguna se quede sin responder.",
      ruta: "/tickets",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Un ticket es «un cliente necesita algo»: un pedido que no llegó, una duda, una reclamación. Tiene asunto, contacto y empresa, categoría, estado (abierto o cerrado) y su propio hilo de notas. La lista los muestra con el estado editable en línea, y la ficha del contacto enseña cuántos tiene abiertos.",
        },
        {
          tipo: "lista",
          items: [
            "Los tickets pueden llegar solos desde un formulario web de tipo «Ticket de soporte» pegado en tu página.",
            "También los puede crear un asistente de IA conectado por MCP a partir de una conversación con el cliente.",
            "Cierra el ticket cambiando el estado en la lista; queda en el historial.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: un servicio técnico",
          texto:
            "Cada aviso de avería entra como ticket con la categoría «Producto». El técnico va dejando notas («pieza pedida», «instalada, pendiente de prueba») y al terminar lo cierra. En la ficha del cliente se ve que ha tenido tres avisos este año: buen dato para la renovación del contrato.",
        },
      ],
    },
    {
      id: "usuarios",
      titulo: "Usuarios",
      resumen: "Tu equipo: quién entra, con qué permisos.",
      ruta: "/sales",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cada persona del equipo tiene su cuenta. Un administrador puede invitar usuarios, editarlos y desactivarlos; un usuario normal trabaja con los datos pero no cambia la configuración ni gestiona a los demás. Las cuentas viven en KontrolIA Auth, el acceso único del ecosistema: la misma cuenta sirve para las demás aplicaciones de KontrolIA.",
        },
        {
          tipo: "lista",
          items: [
            "El número de usuarios está limitado por tu plan; el consumo se ve en el pie de la barra lateral.",
            "No se borran usuarios (se perdería quién hizo qué): se desactivan.",
            "Un usuario desactivado no puede entrar, pero sus notas y tareas siguen ahí.",
          ],
        },
      ],
    },
    {
      id: "informes",
      titulo: "Informes",
      resumen: "Dónde se atascan las ventas, quién vende y por qué se pierde.",
      ruta: "/informes",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Sobre las oportunidades creadas en el periodo que elijas (90 días, un año, todo): cuántas hubo, cuántas se ganaron y perdieron, la tasa de conversión, cuántas hay en cada etapa, las ventas ganadas por responsable y los motivos de pérdida. Los informes solo son tan buenos como los datos: importes puestos y motivos anotados al perder.",
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: decidir con datos",
          texto:
            "El informe dice que el 60 % de las pérdidas son «precio» y que casi todas se atascan en «Propuesta enviada». Eso no es una opinión: es el sitio donde revisar la propuesta o llamar a los dos días de enviarla (una automatización lo hace sola).",
        },
      ],
    },
    {
      id: "plantillas-de-correo",
      titulo: "Plantillas de correo",
      resumen:
        "Correos que escribes una vez y reutilizas, con los datos del contacto rellenados solos.",
      ruta: "/email_templates",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Una plantilla tiene asunto y cuerpo, con un editor visual (negritas, listas, enlaces, botón). En el cuerpo puedes insertar campos que se rellenan con cada contacto: su nombre, su empresa, tus campos personalizados (el enlace a su diagnóstico, por ejemplo). Al enviar, el correo sale con un diseño cuidado (cabecera con tu logo, tarjeta centrada) que se ve bien en Gmail y Outlook.",
        },
        {
          tipo: "lista",
          items: [
            "Si configuras un proveedor de IA en Ajustes, puedes pedirle que redacte la plantilla a partir de una frase («correo de bienvenida a un cliente nuevo de la gestoría»).",
            "Las plantillas activas son las que ofrecen las automatizaciones («cuando se cree un contacto, enviar la plantilla Bienvenida»).",
            "Para enviar correo hace falta configurar el servidor de salida en Ajustes → Correo saliente.",
          ],
        },
      ],
    },
    {
      id: "importar-datos",
      titulo: "Importar datos",
      resumen:
        "Trae tus contactos desde una hoja de cálculo en un CSV, sin escribirlos uno a uno.",
      ruta: "/import",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            "Descarga el CSV de ejemplo desde la pantalla de importación: tiene las columnas exactas (nombre, apellidos, correo, teléfono, empresa, etiquetas…).",
            "Rellena tu hoja con esas columnas (en Excel o Google Sheets) y guárdala como CSV.",
            "Súbela. El CRM muestra un resumen: cuántos contactos creará, cuántas empresas nuevas y si detecta duplicados (mismo correo).",
            "Confirma. Las empresas que no existían se crean solas; las etiquetas también.",
          ],
        },
        {
          tipo: "consejo",
          texto:
            "Importar consume del cupo de contactos de tu plan. Si vas justo, limpia la hoja antes (duplicados, contactos sin correo ni teléfono).",
        },
      ],
    },
    {
      id: "perfil",
      titulo: "Tu perfil",
      resumen: "Tu nombre, tu correo y tu contraseña.",
      ruta: "/profile",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Desde el avatar de la cabecera. Aquí ves tus datos, pides el correo para restablecer la contraseña (la cuenta vive en KontrolIA Auth), y encuentras dos direcciones técnicas: la de correo de entrada (reenvía o pon en copia un correo a esa dirección y se guarda como nota en el contacto que corresponda) y la del servidor MCP para conectar un asistente de IA. Cerrar sesión está en el mismo menú.",
        },
      ],
    },
    {
      id: "ajustes",
      titulo: "Ajustes",
      resumen:
        "Adapta el CRM a tu negocio: las listas, la moneda, los campos propios y las herramientas de administración.",
      ruta: "/settings",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Solo lo ve quien administra la organización. Está dividido en bloques:",
        },
        {
          tipo: "tabla",
          cabeceras: ["Bloque", "Qué configuras"],
          filas: [
            [
              "Empresas",
              "Los sectores que se ofrecen al crear una empresa (hostelería, salud, construcción…).",
            ],
            [
              "Oportunidades",
              "Los embudos y sus etapas, cuáles cuentan como ganadas y cuáles como perdidas, los motivos de pérdida, las categorías y la moneda.",
            ],
            [
              "Notas",
              "Los estados de contacto (frío, templado, caliente, con contrato, con su color) y los tipos de actividad (llamada, reunión, WhatsApp…).",
            ],
            ["Tareas", "Los tipos de tarea."],
            [
              "Campos personalizados",
              "Datos propios de tu negocio en contactos, empresas y oportunidades: texto, número, fecha, lista de opciones o casilla. Una inmobiliaria añade «Superficie»; una escuela, «Grado».",
            ],
            [
              "Herramientas",
              "Automatizaciones, Formularios web, API y webhooks, Catálogo de módulos, Correo saliente e Inteligencia artificial. Cada una tiene su sección en esta ayuda.",
            ],
          ],
        },
        {
          tipo: "consejo",
          texto:
            "Los valores de las listas se guardan con los datos: si renombras la etapa «Negociación» a «Cierre», las oportunidades que estaban en ella siguen ahí. Si la borras, las que estaban en ella se quedan sin etapa; muévelas antes.",
        },
      ],
    },
  ],
};

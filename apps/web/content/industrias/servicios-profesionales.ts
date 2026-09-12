import type { Industria } from "./tipos";

/**
 * Servicios profesionales (despachos contables, legales y consultoría).
 *
 * Segunda industria: comprueba que el modelo de contenido aguanta un negocio
 * con otra lógica —aquí lo que se persigue son propuestas, renovaciones de
 * honorarios y relaciones de largo plazo, no pedidos de ruta— sin tocar ni un
 * componente de la plantilla.
 */
export const serviciosProfesionales: Industria = {
  slug: "servicios-profesionales",
  nombre: "Servicios profesionales",
  resumen:
    "Propuestas que no se enfrían, renovaciones de honorarios y cada cliente con su historial.",
  icono: "Briefcase",
  tablero: {
    titulo: "Propuestas y renovaciones",
    montoEnJuego: 742000,
    columnas: [
      {
        titulo: "Contacto inicial",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Constructora Peña",
            empresa: "Contabilidad mensual",
            monto: "$48,000",
            iniciales: "CP",
            color: "#e2766a",
            etiqueta: "Web",
          },
        ],
      },
      {
        titulo: "Propuesta enviada",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Grupo Salinas",
            empresa: "Auditoría anual",
            monto: "$120,000",
            iniciales: "GS",
            color: "#3f8fd0",
            etiqueta: "Correo",
          },
          {
            nombre: "Clínica Aurora",
            empresa: "Asesoría fiscal",
            monto: "$36,000",
            iniciales: "CA",
            color: "#4fb59a",
            etiqueta: "Reunión",
          },
        ],
      },
      {
        titulo: "En negociación",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Transportes Vega",
            empresa: "Nómina y contabilidad",
            monto: "$84,000",
            iniciales: "TV",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Cliente activo",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Ferretería López",
            empresa: "Honorarios anuales",
            monto: "$54,000",
            iniciales: "FL",
            color: "#3f8f7a",
            etiqueta: "Renovación",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para despachos y servicios profesionales",
    titulo: "Tus propuestas se enfrían porque el seguimiento quedó en un correo que nadie volvió a leer.",
    subtitulo:
      "Vinqulia ordena el ciclo completo de un despacho: prospectos, propuestas enviadas, clientes activos y renovaciones de honorarios. Todo con su historial, sus tareas y su fecha de volver a hablar.",
    ctaPrincipal: "Quiero una demo para mi despacho",
    puntos: [
      "Embudo de propuestas con seguimiento",
      "Renovaciones de honorarios programadas",
      "Correo y WhatsApp en el historial",
      "Informes de conversión por socio",
    ],
  },
  problema: {
    titulo: "Cómo trabaja hoy un despacho sin sistema",
    intro:
      "En servicios profesionales el activo es la relación y el tiempo facturable. Los dos se pierden en el mismo lugar: la bandeja de entrada.",
    puntos: [
      {
        titulo: "La propuesta sale y no vuelve a saberse",
        texto:
          "Se envía la cotización por correo y el seguimiento queda a merced de que alguien se acuerde de escribir de nuevo.",
      },
      {
        titulo: "Los prospectos se atienden en el orden en que llegan",
        texto:
          "Sin un embudo no hay forma de saber cuál de las oportunidades abiertas merece el siguiente esfuerzo.",
      },
      {
        titulo: "Las renovaciones se recuerdan tarde",
        texto:
          "El cliente anual, el que cierra ejercicio o el que lleva meses sin servicio: sin fecha programada, la renovación se atiende cuando el cliente se queja.",
      },
      {
        titulo: "El historial vive en correos y carpetas",
        texto:
          "Qué se le prometió a este cliente, con qué alcance y a qué precio: todo está repartido entre correos, archivos y la memoria del socio que lo atendió.",
      },
      {
        titulo: "Los socios no ven el negocio en conjunto",
        texto:
          "Saber cuántas propuestas hay abiertas y cuánto suman exige preguntar uno por uno.",
      },
      {
        titulo: "Los clientes llegan por recomendación y no se registran",
        texto:
          "Cada recomendación que entra por WhatsApp o por un conocido no deja rastro de dónde vino ni de en qué quedó.",
      },
    ],
  },
  dia: {
    titulo: "Un día en el despacho, con Vinqulia",
    intro:
      "El mismo trabajo profesional, pero con el seguimiento dejando de depender de la memoria.",
    momentos: [
      {
        hora: "8:30",
        titulo: "Revisión de pendientes",
        narrativa:
          "El socio abre su día: a quién le debe una respuesta, qué propuesta está por vencer.",
        conVinqulia:
          "Ve sus tareas con fecha, incluidas las que creó una regla automática al pasar una oportunidad de etapa.",
      },
      {
        hora: "10:00",
        titulo: "Reunión con un prospecto nuevo",
        narrativa:
          "Se reúne con una empresa que llegó recomendada y acuerdan que le mandará propuesta.",
        conVinqulia:
          "Registra la nota de la reunión y crea la oportunidad con su monto estimado; la empresa queda con su contacto y su historial.",
      },
      {
        hora: "12:00",
        titulo: "Envío de la propuesta",
        narrativa:
          "Manda la propuesta por correo con el alcance y los honorarios.",
        conVinqulia:
          "Envía el correo desde la ficha del contacto: la respuesta del cliente se archiva sola en esa misma ficha.",
      },
      {
        hora: "15:00",
        titulo: "Seguimiento de una propuesta de la semana pasada",
        narrativa:
          "Nadie contestó la propuesta enviada el martes.",
        conVinqulia:
          "La tarea de seguimiento seguía pendiente y visible; se hace la llamada y se mueve la etapa según la respuesta.",
      },
      {
        hora: "17:00",
        titulo: "Renovación que se acerca",
        narrativa:
          "Un cliente anual está por cumplir su ciclo y conviene proponerle la renovación.",
        conVinqulia:
          "La fecha está registrada como campo de la ficha y como tarea; se adelanta la conversación antes de que el cliente busque otra opción.",
      },
      {
        hora: "Fin de mes",
        titulo: "Cómo viene el despacho",
        narrativa:
          "Los socios quieren ver cuánto entró y cuánto quedó en el aire.",
        conVinqulia:
          "Los informes muestran conversión, cierre por responsable y motivos de pérdida del periodo.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Propuestas enviadas sin seguimiento",
      solucion: "Tarea de seguimiento con fecha, creada al mover la etapa",
      beneficio:
        "Cada propuesta tiene un siguiente paso con fecha, en lugar de esperar a que alguien se acuerde",
    },
    {
      problema: "Prospectos atendidos sin criterio de prioridad",
      solucion: "Embudo por etapas con importe y responsable",
      beneficio:
        "Se ve cuál oportunidad está más cerca de cerrar y cuánto vale antes de decidir a qué dedicar el día",
    },
    {
      problema: "Renovaciones atendidas tarde",
      solucion:
        "Fechas clave como campos personalizados, con tareas programadas",
      beneficio:
        "La renovación se propone a tiempo, cuando todavía es una conversación y no una queja",
    },
    {
      problema: "Historial repartido entre correos y carpetas",
      solucion: "Notas en la ficha, con correo y WhatsApp integrados",
      beneficio:
        "Cualquier socio que retome la cuenta entiende el alcance y lo prometido en minutos",
    },
    {
      problema: "Los socios sin visión conjunta del negocio",
      solucion: "Tablero compartido e informes por responsable",
      beneficio:
        "La junta de socios se hace sobre el embudo real, no sobre lo que cada uno recuerda",
    },
    {
      problema: "Recomendaciones que no se registran",
      solucion: "Formulario público en el sitio y captura manual ordenada",
      beneficio:
        "Todo prospecto entra al mismo embudo, venga de donde venga, con su origen documentado en las notas",
    },
  ],
  casosDeUso: [
    {
      titulo: "Embudo de propuestas por servicio",
      texto:
        "Un embudo para contabilidad mensual, otro para auditoría o proyectos: cada línea de servicio con sus etapas y su ciclo propio.",
      funcionalidad: "Varios embudos con etapas independientes",
    },
    {
      titulo: "Renovaciones de honorarios",
      texto:
        "La fecha de renovación se guarda en la ficha del cliente y se convierte en tarea, para que la conversación ocurra antes del vencimiento.",
      funcionalidad: "Campos personalizados de tipo fecha y tareas con vencimiento",
    },
    {
      titulo: "Correspondencia dentro del historial",
      texto:
        "El correo se envía desde el CRM y la respuesta del cliente se archiva en la misma ficha, sin reenviar nada a mano.",
      funcionalidad: "Correo saliente y entrante ligado al contacto",
    },
    {
      titulo: "Seguimiento de propuestas de alto valor",
      texto:
        "Reglas que crean la tarea de seguimiento al mover una etapa, para que ninguna propuesta se quede sin segundo contacto.",
      funcionalidad: "Automatizaciones por cambio de etapa",
    },
    {
      titulo: "Captación desde el sitio del despacho",
      texto:
        "Un formulario en la web captura al prospecto y lo convierte en contacto con su historial, sin trabajo manual.",
      funcionalidad: "Formularios públicos con enlace o iframe",
    },
    {
      titulo: "Visibilidad por socio",
      texto:
        "Cada oportunidad tiene responsable: el despacho ve qué cerró cada socio y en qué se está perdiendo el negocio.",
      funcionalidad: "Informes de cierre por responsable y motivos de pérdida",
    },
  ],
  casoPractico: {
    escenario:
      "Despacho contable con 4 socios, 90 clientes activos y alrededor de 25 propuestas abiertas al mes.",
    inicial: [
      "Las propuestas se siguen por correo; varias se quedan sin segunda llamada.",
      "Las renovaciones anuales se recuerdan cuando el cliente pregunta por su estado de cuenta.",
      "El historial de cada cliente está repartido entre el buzón de cada socio.",
      "La junta mensual empieza con la pregunta «¿alguien sabe cuántas propuestas hay abiertas?».",
    ],
    conVinqulia: [
      "Cada propuesta vive en el embudo, con importe, responsable y tarea de seguimiento.",
      "Las renovaciones tienen fecha y tarea: se adelantan antes del vencimiento.",
      "El historial de cada cliente está en su ficha, con correos y notas incluidas.",
      "La junta revisa conversión y cierre por socio sobre datos del periodo.",
    ],
    notaSimulacion:
      "Escenario ilustrativo, no un caso real. Plantea un tamaño y un volumen plausibles para un despacho mediano; no presentamos porcentajes de ahorro medidos.",
  },
  paraQuien: {
    si: [
      "Despachos contables, fiscales o legales, y consultoras con ciclo de venta consultivo.",
      "Equipos de 2 a 50 profesionales donde el seguimiento de propuestas es hoy informal.",
      "Quien factura honorarios recurrentes y necesita controlar renovaciones y relación de largo plazo.",
      "Despachos que quieren separar líneas de servicio con embudos distintos.",
      "Equipos que ya usan correo como canal principal y necesitan que el historial quede en la empresa.",
    ],
    no: [
      "Si buscas un gestor documental o un repositorio de expedientes: Vinqulia no lo es.",
      "Si necesitas facturación electrónica o control de horas facturables: no forma parte del producto.",
      "Si tu despacho no da seguimiento a propuestas ni tiene relaciones recurrentes, el retorno de un CRM es bajo.",
      "Si necesitas un portal del cliente para consultar sus documentos: hoy no existe.",
    ],
  },
  beneficios: [
    {
      titulo: "Nada se queda sin siguiente paso",
      resultado:
        "Las tareas y las reglas automáticas garantizan que cada propuesta y cada renovación tengan una fecha de continuación, así el ingreso no depende de la memoria del socio.",
    },
    {
      titulo: "El historial pertenece al despacho",
      resultado:
        "Notas, correos y acuerdos quedan en la ficha del cliente: si un socio sale o cambia de cartera, la relación y su contexto permanecen en la firma.",
    },
    {
      titulo: "Fichas que reflejan tu práctica",
      resultado:
        "Tipo de servicio, fecha de renovación, régimen fiscal o alcance del contrato se agregan como campos propios, sin depender del formato estándar de un CRM genérico.",
    },
    {
      titulo: "Decisiones de la junta con datos",
      resultado:
        "Conversión, cierre por socio y motivos de pérdida permiten ajustar tarifas, alcance o discurso con evidencia del periodo.",
    },
    {
      titulo: "Captación sin trabajo manual",
      resultado:
        "El formulario del sitio crea el contacto y su historial, de modo que la recomendación que llega por la web entra al embudo como cualquier otra.",
    },
    {
      titulo: "Configuración sin desarrollo",
      resultado:
        "Embudos, etapas, moneda y campos se ajustan desde la propia aplicación, así que el despacho no depende de un proyecto técnico para cada cambio interno.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Propuestas seguidas por correo, según la memoria del socio.",
      "Renovaciones que se atienden cuando el cliente reclama.",
      "Historial repartido entre buzones personales.",
      "Sin visibilidad de cuánto hay en negociación.",
      "Captación por recomendación sin registro alguno.",
    ],
    conVinqulia: [
      "Cada propuesta con su etapa, su importe y su tarea de seguimiento.",
      "Renovaciones con fecha programada y responsable.",
      "Historial centralizado por cliente, con correo incluido.",
      "Embudo compartido con el dinero en juego por etapa.",
      "Todo prospecto entra al mismo embudo, con su origen anotado.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Tendremos que cambiar nuestra forma de trabajar?",
      respuesta:
        "Se configura a tu proceso: etapas, embudos por línea de servicio, campos y tipos de tarea se ajustan desde la aplicación. El CRM se adapta al despacho, no al revés.",
    },
    {
      pregunta: "¿Podemos seguir usando nuestro correo actual?",
      respuesta:
        "Sí. El correo del CRM se usa para enviar desde la ficha y archivar la respuesta del cliente automáticamente. Es un canal adicional al que ya usas, no un reemplazo obligatorio.",
    },
    {
      pregunta: "¿Varios socios pueden trabajar con el mismo cliente?",
      respuesta:
        "Sí. Es multiusuario con roles, y tanto las oportunidades como los contactos tienen un responsable asignado, así que se ve quién lleva cada cuenta.",
    },
    {
      pregunta: "¿Sirve para llevar expedientes o documentos?",
      respuesta:
        "Puedes adjuntar archivos a las notas y dejar registro documental del contacto. No es un gestor documental con control de versiones ni un repositorio de expedientes.",
    },
    {
      pregunta: "¿Y si solo quiero controlar las renovaciones?",
      respuesta:
        "Funciona igual: puedes empezar usando la ficha del cliente con su fecha de renovación y una tarea programada, sin montar antes todo el proceso de venta.",
    },
    {
      pregunta: "¿Qué pasa si un socio deja el despacho?",
      respuesta:
        "Sus cuentas y su historial quedan en el CRM. Se reasigna el responsable y quien retome ve qué se prometió, cuándo y en qué quedó.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM le conviene a un despacho contable o legal?",
      respuesta:
        "Uno que entienda ciclos largos y relaciones recurrentes: embudo de propuestas, seguimiento con fechas y control de renovaciones. Eso es lo que Vinqulia resuelve, con campos y embudos adaptables a cada línea de servicio.",
    },
    {
      pregunta: "¿Cómo doy seguimiento a las propuestas que envío?",
      respuesta:
        "Cada propuesta es una oportunidad con etapa, importe y responsable. Al moverla de etapa se puede crear automáticamente la tarea de seguimiento, así ninguna queda sin segundo contacto.",
    },
    {
      pregunta: "¿Puedo programar recordatorios de renovación de honorarios?",
      respuesta:
        "Sí. Guardas la fecha de renovación como campo de la ficha del cliente y programas la tarea correspondiente, para adelantar la conversación antes del vencimiento.",
    },
    {
      pregunta: "¿Se pueden separar los servicios que ofrece el despacho?",
      respuesta:
        "Sí, con varios embudos: contabilidad mensual, auditoría, asesoría fiscal o proyectos pueden tener cada uno sus etapas y su ciclo.",
    },
    {
      pregunta: "¿El correo del cliente queda registrado en el sistema?",
      respuesta:
        "Sí. Los correos enviados desde la ficha quedan ligados al contacto, y con el buzón configurado la respuesta del cliente se archiva en esa misma ficha.",
    },
    {
      pregunta: "¿Podemos medir qué socio cierra más propuestas?",
      respuesta:
        "Los informes muestran cierre por responsable y conversión del periodo, además de los motivos de pérdida registrados.",
    },
    {
      pregunta: "¿Se puede usar sin que nadie del despacho sea técnico?",
      respuesta:
        "Sí. La configuración —etapas, campos, moneda, embudos— se hace desde la propia aplicación. Si prefieres, la puesta en marcha se contrata como implementación guiada.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Gestor documental y expedientes",
      texto:
        "Repositorio con control de versiones, plantillas de contrato y firma electrónica. Hoy no existe en el producto.",
    },
    {
      titulo: "Registro de horas facturables",
      texto:
        "Hoja de tiempos por cliente y proyecto para alimentar la facturación. Hoy no existe.",
    },
    {
      titulo: "Portal del cliente",
      texto:
        "Área donde el cliente consulta documentos, estados de cuenta o avance de su trámite. Hoy no existe.",
    },
    {
      titulo: "Integración con facturación electrónica",
      texto:
        "Emisión de comprobantes desde el CRM. Hoy no existe; se puede abordar como integración con tu sistema de facturación a través de la API.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Deja que tus propuestas dejen de enfriarse",
    subtitulo:
      "Cuéntanos cómo trabaja tu despacho —cuántos socios, qué servicios y cómo dan hoy seguimiento a las propuestas— y te mostramos cómo se vería tu embudo en Vinqulia.",
    boton: "Quiero una demo para mi despacho",
  },
  seo: {
    keywordPrincipal: "CRM para despachos contables",
    keywordsSecundarias: [
      "CRM para servicios profesionales",
      "software para despachos y consultoría",
      "seguimiento de propuestas",
      "CRM para abogados",
      "control de renovación de honorarios",
    ],
    longTail: [
      "cómo dar seguimiento a las propuestas enviadas a clientes",
      "software para despacho contable con seguimiento de clientes",
      "CRM para despacho legal con embudo de propuestas",
      "cómo programar recordatorios de renovación de honorarios",
      "sistema para controlar prospectos en una consultoría",
    ],
    terminosRelacionados: [
      "ciclo de venta consultivo",
      "honorarios recurrentes",
      "propuesta económica",
      "cartera de clientes",
      "seguimiento comercial",
    ],
    intencionComercial:
      "Despachos que ya perdieron propuestas por falta de seguimiento y están evaluando un CRM adaptable a su práctica. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Profesionales que buscan cómo organizar su seguimiento comercial, cómo priorizar prospectos o cómo dejar de perder propuestas. Lo atienden las secciones Problema, Casos de uso y el futuro blog.",
    paginasFuturas: [
      "/guias/crm-para-despachos-como-elegir",
      "/soluciones/seguimiento-de-propuestas",
      "/comparativas/vinqulia-vs-hoja-de-calculo-para-despachos",
      "/blog/como-evitar-que-se-enfrien-las-propuestas",
    ],
  },
};

import type { Industria } from "./tipos";

/**
 * Seguros y servicios financieros.
 *
 * Décima industria. El negocio se sostiene en dos cosas: la prospección por
 * referidos y la renovación de una cartera que vence cada año. Se apoya en
 * funcionalidades verificadas: embudos por ramo, fecha de renovación como
 * campo, tareas y automatizaciones para el seguimiento, notas con adjuntos
 * para la documentación del expediente comercial, WhatsApp y correo en el
 * historial, e informes de conversión y pérdida.
 *
 * Deliberadamente NO se afirma cumplimiento normativo de ningún tipo: el
 * producto es una herramienta de gestión comercial y el cumplimiento depende
 * de los procesos de cada organización.
 *
 * Lo que no existe —cotizador, emisión, comisiones, siniestros, portal del
 * cliente— se declara en oportunidadesFuturas.
 */
export const seguros: Industria = {
  slug: "seguros",
  nombre: "Seguros y servicios financieros",
  resumen:
    "Cartera con fechas de vencimiento a la vista, referidos con seguimiento y renovaciones que no se pierden.",
  icono: "ShieldCheck",
  tablero: {
    titulo: "Prospección y renovaciones",
    montoEnJuego: 1860000,
    columnas: [
      {
        titulo: "Referido",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Gastos médicos · Fam. Duarte",
            empresa: "Referido por cliente",
            monto: "$42,000",
            iniciales: "FD",
            color: "#e2766a",
            etiqueta: "Referido",
          },
          {
            nombre: "Auto · R. Salinas",
            empresa: "Campaña digital",
            monto: "$14,500",
            iniciales: "RS",
            color: "#7d6ae2",
            etiqueta: "Web",
          },
        ],
      },
      {
        titulo: "Cotización enviada",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Vida · M. Peralta",
            empresa: "Comparando opciones",
            monto: "$28,000",
            iniciales: "MP",
            color: "#3f8fd0",
            etiqueta: "Seguimiento",
          },
        ],
      },
      {
        titulo: "En revisión",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Empresarial · Logística RM",
            empresa: "Documentación entregada",
            monto: "$186,000",
            iniciales: "LR",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Póliza vigente",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Renovación · Clínica Aurora",
            empresa: "Vence en 45 días",
            monto: "$96,000",
            iniciales: "CA",
            color: "#3f8f7a",
            etiqueta: "Renueva",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para agentes y promotorías",
    titulo: "Una cartera de seguros vale por lo que renueva, no por lo que se vendió el primer año.",
    subtitulo:
      "Vinqulia organiza las dos mitades del negocio asegurador: la prospección que llega por referidos y la renovación de cada póliza antes de su vencimiento. Con la documentación del expediente comercial, el historial de cada cliente y los ramos medidos por separado.",
    ctaPrincipal: "Quiero una demo para mi agencia",
    puntos: [
      "Renovaciones con fecha a la vista",
      "Ramos en embudos separados",
      "Referidos con seguimiento",
      "Documentación en el historial",
    ],
  },
  problema: {
    titulo: "Cómo se administra hoy una cartera de seguros",
    intro:
      "El negocio asegurador tiene un problema de fechas: todo vence de forma periódica y casi nada se avisa solo. Lo que no se persigue, se renueva con la competencia.",
    puntos: [
      {
        titulo: "Las renovaciones dependen de un calendario personal",
        texto:
          "Cada asesor lleva sus vencimientos en su propia agenda o en una hoja. Cuando la cartera crece, algunos avisos se pasan y la póliza se va sin que nadie haya llamado.",
      },
      {
        titulo: "Los referidos se atienden cuando se puede",
        texto:
          "La principal fuente de negocio es la recomendación, y sin embargo llega por mensaje, se atiende tarde y no queda registro de quién la envió ni del resultado.",
      },
      {
        titulo: "La cartera no se ve en conjunto",
        texto:
          "Saber cuántas pólizas vencen este trimestre o cuánto representan requiere revisar archivos uno por uno, así que la planeación se hace con estimaciones.",
      },
      {
        titulo: "La documentación del expediente se pierde",
        texto:
          "Identificaciones, comprobantes y formatos firmados se guardan en carpetas y correos. Cuando hace falta un documento, encontrarlo cuesta más que pedirlo otra vez.",
      },
      {
        titulo: "Los ramos se miden mezclados",
        texto:
          "Vida, auto, gastos médicos y empresarial tienen ciclos y esfuerzos distintos. Al promediarlos, la dirección no sabe en cuál conviene invertir tiempo.",
      },
      {
        titulo: "Cuando un asesor se va, la cartera se desordena",
        texto:
          "Sin historial compartido, quien retoma las cuentas no sabe qué se ofreció, cuándo vence cada póliza ni con quién se habló.",
      },
    ],
  },
  dia: {
    titulo: "Un día en la agencia, con Vinqulia",
    intro:
      "La jornada de un agente y de su promotoría cuando las fechas y los referidos dejan de vivir en agendas personales.",
    momentos: [
      {
        hora: "8:30",
        titulo: "Qué vence este mes",
        narrativa:
          "Hay que saber qué pólizas se renuevan en las próximas semanas antes de que el cliente reciba la oferta de otro agente.",
        conVinqulia:
          "Una vista guardada lista las oportunidades con fecha de renovación próxima; se contacta a cada cliente con el historial a la vista.",
      },
      {
        hora: "10:00",
        titulo: "Llega un referido",
        narrativa:
          "Un cliente recomienda a su hermano para gastos médicos.",
        conVinqulia:
          "El contacto se crea con el origen anotado y se le asigna responsable; queda claro quién lo refirió, para agradecerlo después.",
      },
      {
        hora: "12:00",
        titulo: "Cotización enviada",
        narrativa:
          "Se envía la propuesta de vida individual y queda de revisarla con la familia.",
        conVinqulia:
          "La oportunidad queda con su importe y una tarea de seguimiento a dos días; si no responde, la tarea sigue visible.",
      },
      {
        hora: "14:00",
        titulo: "Expediente en revisión",
        narrativa:
          "Una cuenta empresarial entregó su documentación y hay que confirmar que está completa.",
        conVinqulia:
          "La etapa y las notas muestran qué se recibió y qué falta; los documentos quedan adjuntos en el historial de la cuenta.",
      },
      {
        hora: "17:00",
        titulo: "Cierre del día",
        narrativa:
          "Quedaron tres llamadas sin hacer y un seguimiento prometido para mañana.",
        conVinqulia:
          "Las tareas vencidas siguen al día siguiente y las reglas crean la siguiente acción al mover de etapa.",
      },
      {
        hora: "Cierre del trimestre",
        titulo: "Qué ramo funciona y qué se pierde",
        narrativa:
          "La promotoría necesita saber la conversión y las causas de no renovación.",
        conVinqulia:
          "Los informes muestran conversión del periodo, cierre por asesor y motivos de pérdida registrados.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Renovaciones que dependen de un calendario personal",
      solucion:
        "Fecha de renovación como campo de la cuenta y tarea programada con antelación",
      beneficio:
        "La conversación de renovación se adelanta al vencimiento, en lugar de descubrirse cuando el cliente ya firmó con otro",
    },
    {
      problema: "Referidos atendidos tarde y sin registro de origen",
      solucion:
        "Alta del contacto con origen anotado y responsable asignado",
      beneficio:
        "Ningún referido se queda sin atender y se puede reconocer a quien lo envió",
    },
    {
      problema: "Cartera que no se ve en conjunto",
      solucion:
        "Tablero por etapas con importe por oportunidad y vistas por vencimiento",
      beneficio:
        "Se planea el trimestre sabiendo cuánto y qué vence, en lugar de estimarlo",
    },
    {
      problema: "Documentación repartida en carpetas y correos",
      solucion:
        "Notas con adjuntos dentro de la ficha del cliente y de la cuenta",
      beneficio:
        "El expediente comercial queda junto a la relación, sin tener que pedir los documentos otra vez",
    },
    {
      problema: "Ramos medidos mezclados",
      solucion: "Embudos separados por ramo, cada uno con sus etapas",
      beneficio:
        "Se ve en qué ramo conviene invertir esfuerzo comercial y en cuál se está perdiendo negocio",
    },
    {
      problema: "Conversaciones que se pierden cuando cambia el asesor",
      solucion:
        "Historial de WhatsApp, correo y notas visible para todo el equipo",
      beneficio:
        "Quien retome la cartera sabe qué se ofreció, a qué precio y cuándo vence cada póliza",
    },
    {
      problema: "Sin dato de por qué no se renueva",
      solucion: "Motivo de pérdida en cada oportunidad cerrada",
      beneficio:
        "Se distingue si se pierde por precio, por servicio o por competencia, y se actúa sobre la causa real",
    },
  ],
  casosDeUso: [
    {
      titulo: "Control de renovaciones",
      texto:
        "Cada póliza lleva su fecha de renovación como campo y su tarea programada, así el equipo contacta al cliente semanas antes del vencimiento.",
      funcionalidad: "Campos personalizados de fecha y tareas con vencimiento",
    },
    {
      titulo: "Un embudo por ramo",
      texto:
        "Vida, auto, gastos médicos y empresarial tienen ciclos y esfuerzos distintos: embudos separados permiten medirlos por separado.",
      funcionalidad: "Varios embudos con etapas independientes",
    },
    {
      titulo: "Prospección por referidos",
      texto:
        "Cada referido entra con su origen anotado y su responsable, lo que permite reconocer al cliente que lo envió y medir qué fuentes rinden.",
      funcionalidad: "Contactos con notas de origen y responsable asignado",
    },
    {
      titulo: "Expediente comercial documentado",
      texto:
        "Identificaciones, formatos y comprobantes se adjuntan a las notas de la cuenta, de modo que el expediente comercial vive junto a la relación.",
      funcionalidad: "Adjuntos en las notas del historial",
    },
    {
      titulo: "Seguimiento de cotizaciones",
      texto:
        "Cada propuesta enviada conserva su tarea de seguimiento, para que la decisión del cliente no dependa de que el agente se acuerde.",
      funcionalidad: "Oportunidades con importe, etapa y tareas",
    },
    {
      titulo: "Comunicación con el cliente",
      texto:
        "El WhatsApp y el correo se envían desde la ficha y quedan registrados en el historial, con lo que se evita repetir la misma información.",
      funcionalidad: "WhatsApp y correo ligados al contacto",
    },
    {
      titulo: "Cierre por asesor y causas de no renovación",
      texto:
        "Los informes muestran conversión del periodo, cierre por responsable y los motivos registrados al perder una oportunidad.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Promotoría con 8 asesores, alrededor de 900 pólizas en cartera y cerca de 60 renovaciones por trimestre.",
    inicial: [
      "Cada asesor lleva sus vencimientos en su propia agenda.",
      "Los referidos llegan por mensaje y se atienden según el día.",
      "El expediente comercial de cada cliente está repartido en carpetas y correos.",
      "La promotoría no puede decir cuánto vence el próximo trimestre sin preguntar a cada asesor.",
    ],
    conVinqulia: [
      "Cada póliza tiene su fecha de renovación y su tarea programada.",
      "El tablero muestra qué hay en prospección y cuánto se renueva en el periodo.",
      "Los referidos entran con origen y responsable desde el primer contacto.",
      "La documentación del expediente comercial queda adjunta en cada cuenta.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No presentamos porcentajes de renovación ni de mejora medidos.",
  },
  paraQuien: {
    si: [
      "Agentes, promotorías y agencias con cartera propia que renueva cada año.",
      "Equipos de 3 a 50 asesores que necesitan ver la cartera en conjunto.",
      "Negocios donde buena parte de la prospección llega por referidos.",
      "Quienes manejan varios ramos con ciclos y esfuerzos distintos.",
      "Promotorías que necesitan el expediente comercial organizado junto a la relación.",
    ],
    no: [
      "Si buscas un cotizador o comparador de planes: Vinqulia no cotiza, la propuesta se elabora fuera y se registra aquí.",
      "Si necesitas emisión de pólizas, endosos o gestión de siniestros: no forma parte del producto.",
      "Si necesitas cálculo y liquidación de comisiones: hoy no existe.",
      "Si necesitas un portal para que el cliente consulte su póliza: hoy no existe.",
    ],
  },
  beneficios: [
    {
      titulo: "Las renovaciones dejan de ser un asunto personal",
      resultado:
        "La fecha de vencimiento y la tarea viven en el sistema, así que la renovación no depende de la agenda de un asesor ni de que siga en la empresa.",
    },
    {
      titulo: "El referido se atiende como lo que es",
      resultado:
        "Con origen y responsable desde el primer contacto, se responde a tiempo y se puede reconocer a quien recomendó, que es la fuente más valiosa.",
    },
    {
      titulo: "Planeación por trimestre",
      resultado:
        "Saber cuánto vence permite organizar el esfuerzo con antelación, en lugar de reaccionar cuando el cliente ya pidió cotización a otro agente.",
    },
    {
      titulo: "El expediente acompaña a la relación",
      resultado:
        "Con la documentación adjunta a la cuenta, el equipo deja de perseguir papeles y de pedir al cliente lo que ya entregó.",
    },
    {
      titulo: "Saber en qué ramo invertir tiempo",
      resultado:
        "Medir cada ramo por separado muestra dónde conviene concentrar la prospección y en cuál se está perdiendo negocio.",
    },
    {
      titulo: "La cartera sobrevive a la rotación",
      resultado:
        "El historial compartido permite que quien retome una cuenta vea de inmediato qué se ofreció, a qué precio y cuándo vence.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Vencimientos en la agenda personal de cada asesor.",
      "Referidos atendidos según el día y sin registro de origen.",
      "Expediente repartido entre carpetas y correos.",
      "Ramos promediados en una sola lista.",
      "Cartera que se desordena cuando cambia un asesor.",
    ],
    conVinqulia: [
      "Fecha de renovación registrada y tarea programada por póliza.",
      "Cada referido con origen, responsable y seguimiento.",
      "Documentación adjunta a la cuenta, junto al historial.",
      "Un embudo por ramo, con su conversión propia.",
      "Historial compartido que cualquiera del equipo puede retomar.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Es un cotizador o comparador de planes?",
      respuesta:
        "No. Vinqulia no cotiza ni compara coberturas: la propuesta se elabora con tus herramientas habituales y aquí se registra la oportunidad, su importe y su seguimiento.",
    },
    {
      pregunta: "¿Emite pólizas o gestiona siniestros?",
      respuesta:
        "No. La emisión y la gestión de siniestros son de la aseguradora. El CRM se ocupa de la relación comercial: prospección, propuesta, documentación y renovación.",
    },
    {
      pregunta: "¿Calcula comisiones?",
      respuesta:
        "No. Hoy no hay cálculo ni liquidación de comisiones. El importe de la operación se registra, pero no se convierte en un cálculo de comisión por asesor.",
    },
    {
      pregunta: "¿Cómo controlo las fechas de renovación?",
      respuesta:
        "Guardando la fecha como campo de la cuenta y programando la tarea correspondiente. Con una vista guardada se ve en segundos qué vence en las próximas semanas.",
    },
    {
      pregunta: "¿Puedo separar los ramos que manejo?",
      respuesta:
        "Sí, con embudos separados por ramo. Cada uno con sus etapas y su propia conversión, porque el esfuerzo de vida no es el mismo que el de auto o empresarial.",
    },
    {
      pregunta: "¿Esto cumple con la normativa de mi sector?",
      respuesta:
        "Vinqulia es una herramienta de gestión comercial y no sustituye tus procesos ni tus controles. No afirmamos cumplimiento normativo de ningún tipo: la adecuación a la regulación aplicable depende de los procesos de cada organización.",
    },
    {
      pregunta: "¿Dónde quedan los documentos de mis clientes?",
      respuesta:
        "Adjuntos a las notas de su ficha, dentro del CRM. Puedes exportar los contactos en CSV y consultar tus datos por la API: la información es de tu organización.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM le conviene a un agente o promotoría de seguros?",
      respuesta:
        "Uno que entienda la cartera como activo renovable: fechas de vencimiento a la vista, seguimiento de referidos, embudos por ramo y el expediente comercial junto a la relación. Eso es lo que Vinqulia resuelve.",
    },
    {
      pregunta: "¿Cómo no se me pasan las renovaciones de mis pólizas?",
      respuesta:
        "Registrando la fecha de renovación como campo de la cuenta y programando la tarea con antelación. Una vista guardada ordena por proximidad de vencimiento, así el trimestre se planea en lugar de improvisarse.",
    },
    {
      pregunta: "¿Puedo registrar de dónde vienen mis referidos?",
      respuesta:
        "Sí. Al crear el contacto se anota el origen —quién recomendó— y se le asigna responsable, de modo que ningún referido quede sin atender y puedas reconocer a quien lo envió.",
    },
    {
      pregunta: "¿Cómo llevo la documentación de cada cliente?",
      respuesta:
        "Adjuntando los archivos a las notas del historial de la cuenta: identificaciones, formatos y comprobantes quedan junto a la relación, sin depender de carpetas y correos.",
    },
    {
      pregunta: "¿Se pueden medir los ramos por separado?",
      respuesta:
        "Sí, con un embudo por ramo. Cada uno muestra su propia conversión y sus motivos de pérdida, lo que ayuda a decidir dónde concentrar el esfuerzo comercial.",
    },
    {
      pregunta: "¿Sirve si tengo asesores en distintas ciudades?",
      respuesta:
        "Sí. Cada cuenta tiene responsable y el historial es compartido, así que la promotoría ve la cartera completa y cada asesor trabaja la suya desde el móvil.",
    },
    {
      pregunta: "¿Se integra con la plataforma de la aseguradora?",
      respuesta:
        "Puede integrarse por API REST y webhooks cuando la plataforma lo permita. El CRM no sustituye a la aseguradora: ordena la parte comercial y de seguimiento.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Cotizador y comparador de planes",
      texto:
        "Cálculo de primas y comparación de coberturas dentro del CRM. Hoy no existe.",
    },
    {
      titulo: "Emisión y endosos",
      texto:
        "Emisión de pólizas y modificación de datos desde el sistema. Hoy no existe; corresponde a la plataforma de la aseguradora.",
    },
    {
      titulo: "Comisiones y liquidaciones",
      texto:
        "Cálculo de comisiones por póliza y por asesor, y liquidaciones periódicas. Hoy no existe.",
    },
    {
      titulo: "Gestión de siniestros",
      texto:
        "Seguimiento de reclamaciones y su estado. Hoy no existe; se puede anotar como ticket, sin el flujo propio de un siniestro.",
    },
    {
      titulo: "Portal del asegurado",
      texto:
        "Área donde el cliente consulta su póliza, sus vencimientos y sus documentos. Hoy no existe.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Que ninguna póliza se renueve con otro agente por no haber llamado a tiempo",
    subtitulo:
      "Cuéntanos cómo administra tu equipo la cartera —cuántos asesores, cuántas pólizas y qué ramos manejan— y te mostramos cómo se verían tus renovaciones en Vinqulia.",
    boton: "Quiero una demo para mi agencia",
  },
  seo: {
    keywordPrincipal: "CRM para agentes de seguros",
    keywordsSecundarias: [
      "CRM para promotorías",
      "software para agencias de seguros",
      "control de renovación de pólizas",
      "CRM para seguros de vida",
      "gestión de cartera de seguros",
    ],
    longTail: [
      "cómo controlar las renovaciones de pólizas de una cartera",
      "software para agentes de seguros con seguimiento de referidos",
      "cómo organizar la documentación de clientes de seguros",
      "CRM para promotoría con varios ramos",
      "cómo medir la conversión de una agencia de seguros",
    ],
    terminosRelacionados: [
      "renovación de póliza",
      "referido",
      "ramo",
      "cartera de seguros",
      "expediente comercial",
      "promotoría",
    ],
    intencionComercial:
      "Agentes y promotorías con cartera propia que necesitan controlar vencimientos y prospección, y están evaluando una herramienta para no perder renovaciones. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Asesores que buscan cómo organizar su cartera, cómo no perder renovaciones o cómo dar seguimiento a referidos. Lo cubren las secciones Problema y Un día en la agencia.",
    paginasFuturas: [
      "/guias/crm-para-agentes-de-seguros",
      "/soluciones/control-de-renovaciones-de-polizas",
      "/soluciones/seguimiento-de-referidos",
      "/comparativas/vinqulia-vs-hoja-de-calculo-para-cartera-de-seguros",
      "/blog/como-evitar-perder-renovaciones",
    ],
  },
};

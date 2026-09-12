import type { Industria } from "./tipos";

/**
 * Agencias y estudios digitales.
 *
 * Séptima industria. El negocio vive de dos cosas: propuestas que se cierran y
 * clientes que renuevan su mensualidad. Se apoya en funcionalidades
 * verificadas: embudos separados para proyecto y retainer, propuestas con
 * importe y fecha estimada de cierre, tareas y automatizaciones para el
 * seguimiento y la renovación, adjuntos en notas, informes por responsable y
 * campos personalizados para el tipo de servicio.
 *
 * Lo que no existe —gestión de proyectos, control de horas, aprobaciones del
 * cliente, facturación— se declara en oportunidadesFuturas.
 */
export const agencias: Industria = {
  slug: "agencias",
  nombre: "Agencias y estudios digitales",
  resumen:
    "Propuestas que se persiguen, retainers que se renuevan a tiempo y cada cliente con su historial de acuerdos.",
  icono: "Megaphone",
  tablero: {
    titulo: "Propuestas y retainers",
    montoEnJuego: 2640000,
    columnas: [
      {
        titulo: "Brief recibido",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Campaña lanzamiento",
            empresa: "Grupo Nova",
            monto: "$180,000",
            iniciales: "GN",
            color: "#e2766a",
            etiqueta: "Proyecto",
          },
          {
            nombre: "Redes sociales",
            empresa: "Clínica Aurora",
            monto: "$28,000",
            iniciales: "CA",
            color: "#7d6ae2",
            etiqueta: "Mensual",
          },
        ],
      },
      {
        titulo: "Propuesta enviada",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Rebranding",
            empresa: "Textiles del Norte",
            monto: "$320,000",
            iniciales: "TN",
            color: "#3f8fd0",
            etiqueta: "Correo",
          },
        ],
      },
      {
        titulo: "En negociación",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Performance anual",
            empresa: "Innova Retail",
            monto: "$540,000",
            iniciales: "IR",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Retainer activo",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Contenido mensual",
            empresa: "Hábitat Build",
            monto: "$45,000",
            iniciales: "HB",
            color: "#3f8f7a",
            etiqueta: "Renueva 1 nov",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para agencias y estudios",
    titulo: "Una agencia no pierde clientes por mal trabajo. Los pierde porque nadie volvió a escribir para renovar.",
    subtitulo:
      "Vinqulia ordena las dos ventas de una agencia: la propuesta de proyecto, que se persigue hasta que se decide, y el retainer mensual, que se renueva antes de su fecha. Con el historial de acuerdos de cada cliente en un mismo lugar.",
    ctaPrincipal: "Quiero una demo para mi agencia",
    puntos: [
      "Propuestas con seguimiento programado",
      "Retainers con fecha de renovación",
      "Proyectos y mensualidades en embudos separados",
      "Cierre por responsable, medido",
    ],
  },
  problema: {
    titulo: "Cómo se vende hoy en la mayoría de agencias",
    intro:
      "En una agencia el trabajo no escasea; escasea el seguimiento. Y sin seguimiento, la propuesta que se envió el martes se convierte en un cliente de la competencia el lunes siguiente.",
    puntos: [
      {
        titulo: "Propuestas que salen y no vuelven a mencionarse",
        texto:
          "Se envía por correo, se responde una vez y luego hay que sacar campañas, atender clientes y perseguir pagos. El hilo se enfría sin que nadie decida cerrarlo.",
      },
      {
        titulo: "Los retainers se renuevan cuando el cliente reclama",
        texto:
          "El contrato mensual vence en algún momento del trimestre y nadie tiene la fecha a la vista. Cuando se nota, ya hubo un mes sin cobrar o el cliente ya pidió propuestas a otros.",
      },
      {
        titulo: "Cada cuenta con demasiados interlocutores sin registro",
        texto:
          "Aprueba el community manager del cliente, valida el gerente de marca y firma el director. Si eso no está escrito, cada revisión empieza desde cero.",
      },
      {
        titulo: "Lo acordado vive en el chat del proyecto",
        texto:
          "Alcances, entregables y cambios de última hora quedan en conversaciones que después nadie encuentra cuando hay una discusión sobre si era parte del proyecto.",
      },
      {
        titulo: "El pipeline solo existe en la junta del lunes",
        texto:
          "Cuánto hay propuesto y cuánto en negociación se reconstruye de memoria en la reunión semanal, y las cifras cambian según quién las diga.",
      },
      {
        titulo: "No se mide de dónde salen los clientes buenos",
        texto:
          "Sin registro de origen ni de resultados por responsable, la agencia no sabe qué tipo de cuenta le conviene perseguir más.",
      },
    ],
  },
  dia: {
    titulo: "Un día en la agencia, con Vinqulia",
    intro:
      "La jornada de un director de cuentas cuando el proceso comercial deja de vivir en la bandeja de entrada.",
    momentos: [
      {
        hora: "9:00",
        titulo: "Propuestas sin respuesta",
        narrativa:
          "Hay tres propuestas enviadas la semana pasada y no se ha recibido contestación.",
        conVinqulia:
          "Una vista guardada lista lo cotizado sin movimiento reciente; cada llamada deja su nota y reprograma la siguiente tarea.",
      },
      {
        hora: "10:30",
        titulo: "Reunión con un cliente nuevo",
        narrativa:
          "Llega una marca con un brief de campaña y un presupuesto por definir.",
        conVinqulia:
          "Registra la nota con lo acordado y crea la oportunidad con su importe estimado y su fecha esperada de decisión.",
      },
      {
        hora: "13:00",
        titulo: "Envío de la propuesta",
        narrativa:
          "Sale la propuesta por correo con el alcance y el desglose de la inversión.",
        conVinqulia:
          "El correo se envía desde la ficha del cliente: la respuesta se archiva sola en la misma cuenta y queda ligada a la propuesta.",
      },
      {
        hora: "15:00",
        titulo: "Renovación que se acerca",
        narrativa:
          "Un cliente de contenido mensual renueva el mes entrante.",
        conVinqulia:
          "La fecha está registrada como campo de la cuenta y el seguimiento programado como tarea: se adelanta la conversación en lugar de esperar el vencimiento.",
      },
      {
        hora: "17:00",
        titulo: "Revisión interna de cuentas",
        narrativa:
          "El equipo revisa cómo viene el mes y qué se va a perseguir esta semana.",
        conVinqulia:
          "El tablero muestra el dinero en juego por etapa y por responsable, sin reconstruir cifras de memoria.",
      },
      {
        hora: "Fin de mes",
        titulo: "Qué se ganó, qué se perdió y por qué",
        narrativa:
          "Dirección quiere saber la conversión y qué tipo de propuesta se cae más.",
        conVinqulia:
          "Los informes muestran conversión del periodo, cierre por responsable y los motivos de pérdida registrados.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Propuestas enviadas que se enfrían sin decisión",
      solucion:
        "Oportunidad con importe y fecha estimada de cierre, con tarea de seguimiento",
      beneficio:
        "Cada propuesta tiene un próximo paso con fecha, en vez de quedar esperando a que el cliente se acuerde",
    },
    {
      problema: "Retainers que se renuevan tarde o se pierden",
      solucion:
        "Fecha de renovación como campo de la cuenta y tarea programada",
      beneficio:
        "La conversación de renovación ocurre antes del vencimiento, cuando el cliente todavía no ha pedido propuestas a otros",
    },
    {
      problema: "Demasiados interlocutores y aprobaciones sin registro",
      solucion:
        "Empresa con varios contactos y notas que documentan cada acuerdo",
      beneficio:
        "El equipo sabe quién aprueba qué y no repite la revisión desde cero en cada ronda",
    },
    {
      problema: "El alcance acordado se discute después",
      solucion:
        "Notas con adjuntos —brief, creatividades, minuta— dentro de la cuenta",
      beneficio:
        "Lo acordado queda junto a la relación comercial y se puede consultar cuando surge la duda",
    },
    {
      problema: "Proyectos y mensualidades mezclados en una misma lista",
      solucion: "Embudos separados con sus propias etapas",
      beneficio:
        "Se mide por separado la venta de proyecto, que es puntual, y el retainer, que es ingreso recurrente",
    },
    {
      problema: "Pipeline reconstruido de memoria cada semana",
      solucion: "Tablero compartido e informes por responsable",
      beneficio:
        "La reunión semanal parte de datos del sistema, no de versiones distintas de la misma cifra",
    },
    {
      problema: "Sin criterio sobre qué tipo de cuenta conviene perseguir",
      solucion:
        "Origen registrado, motivos de pérdida e informes de conversión",
      beneficio:
        "La agencia aprende qué propuestas cierran mejor y ajusta su prospección con esa evidencia",
    },
  ],
  casosDeUso: [
    {
      titulo: "Pipeline de propuestas de proyecto",
      texto:
        "Cada oportunidad recorre brief, propuesta enviada, negociación y cierre, con su importe y su fecha esperada de decisión a la vista del equipo.",
      funcionalidad: "Embudo por etapas con importe y fecha estimada de cierre",
    },
    {
      titulo: "Retainers como ingreso recurrente",
      texto:
        "Las cuentas de mensualidad viven en un embudo propio, con su importe periódico y su fecha de renovación registrada como campo.",
      funcionalidad: "Varios embudos y campos personalizados de fecha",
    },
    {
      titulo: "Renovaciones que no se pasan",
      texto:
        "Una regla crea la tarea de renovación con antelación, así el director de cuentas llega a la conversación antes del vencimiento.",
      funcionalidad: "Automatizaciones que crean tareas por etapa",
    },
    {
      titulo: "Acuerdos y aprobaciones documentadas",
      texto:
        "Minutas, briefs y versiones creativas se adjuntan a las notas de la cuenta, para que el alcance acordado no dependa de la memoria de la reunión.",
      funcionalidad: "Notas tipificadas con adjuntos",
    },
    {
      titulo: "Correspondencia dentro de la cuenta",
      texto:
        "Los correos se envían desde el CRM y la respuesta del cliente se archiva en la misma ficha, sin reenviar nada a mano.",
      funcionalidad: "Correo saliente y entrante ligado al contacto",
    },
    {
      titulo: "Perseguir lo cotizado sin respuesta",
      texto:
        "Una vista compartida con las propuestas sin movimiento reciente convierte la revisión semanal en una lista concreta de llamadas.",
      funcionalidad: "Vistas guardadas compartidas",
    },
    {
      titulo: "Qué tipo de trabajo cierra mejor",
      texto:
        "Conversión del periodo, cierre por responsable y motivos de pérdida permiten ver si lo que frena es precio, alcance o tiempos.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Agencia de 12 personas con 3 directores de cuentas, alrededor de 18 clientes activos y entre 8 y 12 propuestas al mes.",
    inicial: [
      "Las propuestas se siguen por correo, cuando alguien se acuerda.",
      "Las fechas de renovación de los retainers viven en un calendario aparte que nadie revisa.",
      "El alcance acordado con cada marca está repartido entre correos y chats.",
      "La junta del lunes empieza reconstruyendo cuánto hay propuesto.",
    ],
    conVinqulia: [
      "Cada propuesta vive en el embudo con su importe y su tarea de seguimiento.",
      "Cada retainer tiene su fecha de renovación y su tarea programada.",
      "El alcance y las aprobaciones quedan como notas con adjuntos por cuenta.",
      "La junta parte del tablero: dinero en juego por etapa y por responsable.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No afirmamos porcentajes de mejora medidos en agencias.",
  },
  paraQuien: {
    si: [
      "Agencias y estudios con equipo comercial o directores de cuentas dedicados a vender y renovar.",
      "Negocios con mezcla de proyectos puntuales y mensualidades recurrentes.",
      "Estructuras donde varias personas del cliente aprueban y hay que documentarlo.",
      "Agencias de 3 a 50 personas con propuestas abiertas simultáneas.",
      "Quienes quieren medir conversión y no solo sentir que el mes viene bien.",
    ],
    no: [
      "Si buscas gestión de proyectos, tableros de tareas por entregable o control de horas: Vinqulia no es un PM ni un time tracker.",
      "Si necesitas facturación o control de cobranza: no forma parte del producto.",
      "Si necesitas un portal donde el cliente apruebe creatividades: hoy no existe.",
      "Si eres freelance sin propuestas simultáneas ni clientes recurrentes, el valor de un CRM es limitado.",
    ],
  },
  beneficios: [
    {
      titulo: "El ingreso recurrente deja de depender de la memoria",
      resultado:
        "Cada retainer tiene su fecha de renovación y su tarea: se protege la parte del ingreso que más cuesta conseguir y más fácil se pierde por descuido.",
    },
    {
      titulo: "Las propuestas se persiguen con método",
      resultado:
        "Cada propuesta enviada conserva su siguiente paso con fecha, así el equipo persigue donde hay oportunidad real y no por orden de llegada.",
    },
    {
      titulo: "Discutir el alcance deja de ser un problema",
      resultado:
        "Minutas y entregables adjuntos a la cuenta permiten mostrar qué se acordó y cuándo, sin depender de encontrar el chat correcto.",
    },
    {
      titulo: "Decidir con el embudo a la vista",
      resultado:
        "El tablero muestra qué hay en negociación y cuánto vale, de modo que la priorización semanal se hace sobre datos y no sobre intuición.",
    },
    {
      titulo: "Comparar por responsable y por tipo de cuenta",
      resultado:
        "Los informes muestran cierre por persona y motivos de pérdida, lo que ayuda a definir qué propuestas conviene trabajar y cuáles descartar antes.",
    },
    {
      titulo: "Configuración sin desarrollo",
      resultado:
        "Embudos, etapas, campos y moneda se ajustan desde la aplicación, así que cambiar la oferta de servicios no exige un proyecto técnico.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Propuestas seguidas por correo según la memoria del director de cuentas.",
      "Renovaciones de retainer detectadas al revisar el calendario o al notar el hueco.",
      "Alcance acordado repartido entre chats y correos.",
      "Pipeline reconstruido en cada junta semanal.",
      "Sin dato de por qué se pierde una propuesta.",
    ],
    conVinqulia: [
      "Cada propuesta con etapa, importe y tarea de seguimiento.",
      "Renovaciones con fecha registrada y tarea programada.",
      "Acuerdos y aprobaciones como notas con adjuntos por cuenta.",
      "Tablero con el dinero en juego por etapa y responsable.",
      "Motivos de pérdida registrados y medidos por periodo.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Esto reemplaza a nuestra herramienta de gestión de proyectos?",
      respuesta:
        "No. Vinqulia lleva la relación comercial: prospectos, propuestas, renovaciones y seguimiento. La producción y las tareas por entregable siguen en tu herramienta de proyectos; se pueden conectar por API si quieres cruzar información.",
    },
    {
      pregunta: "¿Puedo llevar proyectos y mensualidades a la vez?",
      respuesta:
        "Sí, con embudos separados: un proyecto tiene un ciclo de cierre distinto al de un retainer, y medirlos juntos distorsiona la conversión de ambos.",
    },
    {
      pregunta: "¿Cómo controlo las fechas de renovación?",
      respuesta:
        "Registrando la fecha de renovación como campo de la cuenta y programando la tarea correspondiente. Una regla puede crear esa tarea automáticamente al cerrar una etapa.",
    },
    {
      pregunta: "¿Se puede documentar lo que aprueba cada persona del cliente?",
      respuesta:
        "Sí. Cada cuenta admite varios contactos y cada acuerdo se documenta en notas con adjuntos, así queda el brief, la minuta o la versión aprobada junto a la relación.",
    },
    {
      pregunta: "¿Sirve si trabajamos con clientes de otras ciudades?",
      respuesta:
        "Sí. Los correos se envían desde la ficha y las respuestas se archivan en la misma cuenta; para el día a día se puede usar la interfaz móvil.",
    },
    {
      pregunta: "¿Puedo medir qué director de cuentas cierra mejor?",
      respuesta:
        "Sí, con los informes de cierre por responsable y la conversión del periodo, además de los motivos de pérdida registrados en cada propuesta.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM le conviene a una agencia?",
      respuesta:
        "Uno que entienda dos ciclos distintos: la propuesta de proyecto y el retainer recurrente. Necesita embudos separados, fechas de renovación y seguimiento con tareas. Eso es lo que Vinqulia resuelve.",
    },
    {
      pregunta: "¿Cómo doy seguimiento a las propuestas que envío?",
      respuesta:
        "Cada propuesta es una oportunidad con importe, etapa y fecha estimada de cierre. Al moverla de etapa se puede crear la tarea de seguimiento, y una vista guardada lista lo que lleva días sin respuesta.",
    },
    {
      pregunta: "¿Cómo no se me pasan las renovaciones de mis clientes mensuales?",
      respuesta:
        "Guardando la fecha de renovación como campo de la cuenta y programando la tarea con antelación. Así la conversación ocurre antes del vencimiento y no cuando el cliente pregunta por su contrato.",
    },
    {
      pregunta: "¿Puedo separar la venta de proyectos de la de retainers?",
      respuesta:
        "Sí, en dos embudos con etapas propias. Es la forma de medir cada negocio por separado, porque su ciclo y su valor son distintos.",
    },
    {
      pregunta: "¿Se puede registrar el alcance acordado con un cliente?",
      respuesta:
        "Sí, en notas con adjuntos dentro de la cuenta: brief, minuta de reunión o la versión creativa aprobada quedan junto a la relación comercial.",
    },
    {
      pregunta: "¿Sirve para medir de dónde vienen los mejores clientes?",
      respuesta:
        "Registrando el origen en las notas y midiendo conversión y cierre por responsable y periodo. Los motivos de pérdida completan el panorama de por qué no cierra una propuesta.",
    },
    {
      pregunta: "¿Se integra con nuestras herramientas de trabajo?",
      respuesta:
        "Puede integrarse por API REST y webhooks. Vinqulia no busca reemplazar tus herramientas de producción, sino ordenar la parte comercial que hoy no tiene sistema.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Gestión de proyectos y entregables",
      texto:
        "Tableros de tareas por proyecto, dependencias y control de avance. Hoy no existe en el producto.",
    },
    {
      titulo: "Control de horas y rentabilidad",
      texto:
        "Registro de horas por cuenta para calcular rentabilidad real de cada proyecto. Hoy no existe.",
    },
    {
      titulo: "Portal de aprobaciones del cliente",
      texto:
        "Área donde el cliente aprueba creatividades y ve el avance. Hoy no existe.",
    },
    {
      titulo: "Facturación y cobranza",
      texto:
        "Emisión de facturas y seguimiento de pagos por proyecto o mensualidad. Hoy no existe; se aborda como integración.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Que ninguna propuesta se enfríe ni un retainer se renueve tarde",
    subtitulo:
      "Cuéntanos cómo vende tu agencia —cuántos directores de cuentas, cuántos clientes recurrentes y cómo persiguen hoy las propuestas— y te mostramos cómo se vería tu embudo en Vinqulia.",
    boton: "Quiero una demo para mi agencia",
  },
  seo: {
    keywordPrincipal: "CRM para agencias",
    keywordsSecundarias: [
      "CRM para agencias de marketing",
      "software para estudios digitales",
      "seguimiento de propuestas de agencia",
      "control de renovación de retainers",
      "CRM para agencias de publicidad",
    ],
    longTail: [
      "cómo dar seguimiento a las propuestas que envía una agencia",
      "cómo controlar la renovación de clientes mensuales en una agencia",
      "software para agencias con propuestas y retainers",
      "cómo medir qué director de cuentas cierra más",
      "CRM para agencia con propuestas de proyecto y mensualidad",
    ],
    terminosRelacionados: [
      "retainer",
      "propuesta creativa",
      "brief",
      "director de cuentas",
      "ingreso recurrente",
      "alcance del proyecto",
    ],
    intencionComercial:
      "Agencias con varias propuestas abiertas y clientes recurrentes que están evaluando un CRM adaptado a sus dos ciclos de venta. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Quien busca cómo dar seguimiento a propuestas, cómo controlar renovaciones de mensualidad o cómo medir la conversión de su equipo comercial. Lo cubren las secciones Problema y Un día en la agencia.",
    paginasFuturas: [
      "/guias/crm-para-agencias-como-elegir",
      "/soluciones/control-de-renovaciones",
      "/soluciones/seguimiento-de-propuestas",
      "/comparativas/vinqulia-vs-hoja-de-calculo-para-agencias",
      "/blog/como-evitar-perder-un-cliente-mensual",
    ],
  },
};

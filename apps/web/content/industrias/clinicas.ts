import type { Industria } from "./tipos";

/**
 * Clínicas y consultorios.
 *
 * Sexta industria. El encuadre es deliberadamente comercial: Vinqulia organiza
 * la captación de interesados, el seguimiento de cotizaciones de tratamiento y
 * la reactivación de pacientes. NO es un expediente clínico, ni una agenda
 * médica, ni un sistema de facturación de seguros, y así se declara en la
 * propia página y en oportunidadesFuturas.
 *
 * Funcionalidades citadas, todas verificadas: formularios públicos, embudos por
 * etapas, tareas y automatizaciones, vistas guardadas, campos personalizados,
 * tickets con estado, WhatsApp y correo en el historial, informes e interfaz
 * móvil.
 */
export const clinicas: Industria = {
  slug: "clinicas",
  nombre: "Clínicas y consultorios",
  resumen:
    "Interesados que sí reciben respuesta, cotizaciones de tratamiento con seguimiento y pacientes que vuelven.",
  icono: "Stethoscope",
  tablero: {
    titulo: "Tratamientos y reactivación",
    montoEnJuego: 1180000,
    columnas: [
      {
        titulo: "Interesado nuevo",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Ortodoncia · A. Ríos",
            empresa: "Sede Centro",
            monto: "$38,000",
            iniciales: "AR",
            color: "#e2766a",
            etiqueta: "WhatsApp",
          },
          {
            nombre: "Limpieza · M. Solís",
            empresa: "Sede Norte",
            monto: "$1,800",
            iniciales: "MS",
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
            nombre: "Implante · J. Bautista",
            empresa: "Sede Centro",
            monto: "$52,000",
            iniciales: "JB",
            color: "#3f8fd0",
            etiqueta: "Seguimiento",
          },
        ],
      },
      {
        titulo: "Valoración agendada",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Blanqueamiento · L. Peña",
            empresa: "Sede Sur",
            monto: "$6,500",
            iniciales: "LP",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Tratamiento aceptado",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Ortodoncia · R. Cano",
            empresa: "Sede Norte",
            monto: "$42,000",
            iniciales: "RC",
            color: "#3f8f7a",
            etiqueta: "Inicio",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para clínicas y consultorios",
    titulo: "Quien pregunta por un tratamiento y no recibe respuesta hoy, mañana está agendando en otra clínica.",
    subtitulo:
      "Vinqulia organiza la parte comercial de tu clínica: los interesados que llegan por WhatsApp o desde tu web, el seguimiento de quien ya recibió una cotización y la reactivación de pacientes que dejaron de venir. El expediente clínico se queda donde debe estar: fuera del CRM.",
    ctaPrincipal: "Quiero una demo para mi clínica",
    puntos: [
      "Interesados con responsable asignado",
      "Seguimiento de cotizaciones de tratamiento",
      "Reactivación de pacientes",
      "Varias sedes o especialidades",
    ],
  },
  problema: {
    titulo: "Dónde se pierden los pacientes antes de ser pacientes",
    intro:
      "En una clínica la demanda sí llega; lo que falta es seguimiento. Quien pregunta un precio y no obtiene respuesta rápida casi nunca vuelve a preguntar.",
    puntos: [
      {
        titulo: "Los mensajes llegan a un WhatsApp que contestan cuando pueden",
        texto:
          "Las preguntas entran por el teléfono de recepción, por redes y por la web. Se responden en el hueco entre pacientes, y a media mañana ya hay veinte conversaciones abiertas sin dueño.",
      },
      {
        titulo: "La cotización se manda y no se vuelve a tocar",
        texto:
          "Alguien pidió el precio de un tratamiento, se le envió por mensaje y ese hilo se quedó ahí. Nadie le dio seguimiento a los tres días, que es cuando se decide.",
      },
      {
        titulo: "Los pacientes que dejaron de venir no se buscan",
        texto:
          "Un paciente de ortodoncia que faltó a dos citas o uno que debía volver en seis meses simplemente desaparece del radar. Recuperarlo cuesta menos que conseguir uno nuevo, y no se hace.",
      },
      {
        titulo: "No se sabe por qué no agendaron",
        texto:
          "Si fue el precio, los horarios o la distancia, nadie lo registra. Sin ese dato, la clínica ajusta a ciegas.",
      },
      {
        titulo: "Varias sedes que no se ven entre sí",
        texto:
          "Cada recepción lleva su propio control y la dirección no puede comparar demanda, conversión ni seguimiento entre sedes o especialidades.",
      },
      {
        titulo: "El seguimiento depende de quién esté en recepción",
        texto:
          "Cuando la persona que atendía esa conversación falta o sale del turno, el interesado queda sin respuesta y nadie sabe en qué había quedado.",
      },
    ],
  },
  dia: {
    titulo: "Un día en la clínica, con Vinqulia",
    intro:
      "La jornada de recepción y de la asesora de tratamientos cuando el seguimiento comercial deja de depender del turno.",
    momentos: [
      {
        hora: "8:30",
        titulo: "Los mensajes que llegaron anoche",
        narrativa:
          "Entraron consultas por el formulario de la web y por WhatsApp preguntando por precios de ortodoncia e implantes.",
        conVinqulia:
          "Los interesados ya están creados con su origen anotado. La asesora abre la vista de «nuevos sin contactar» y ve a quién le toca respuesta primero.",
      },
      {
        hora: "9:00",
        titulo: "Respuesta y valoración",
        narrativa:
          "Se responde el precio aproximado y se ofrece una valoración sin costo.",
        conVinqulia:
          "Se envía el WhatsApp desde la ficha y la conversación queda registrada como nota de tipo WhatsApp en el historial del interesado.",
      },
      {
        hora: "11:00",
        titulo: "Cotización de tratamiento",
        narrativa:
          "Un paciente ya valorado recibe el presupuesto de su tratamiento y queda de pensarlo.",
        conVinqulia:
          "La oportunidad queda con su importe y una tarea de seguimiento a tres días; si no responde, la tarea sigue ahí y aparece en la lista del día.",
      },
      {
        hora: "13:00",
        titulo: "Confirmación de valoración",
        narrativa:
          "Hay que confirmar la cita de valoración de mañana.",
        conVinqulia:
          "La tarea de confirmación estaba programada: se hace la llamada y se anota el resultado en la misma ficha.",
      },
      {
        hora: "16:00",
        titulo: "Reactivación",
        narrativa:
          "Hay pacientes que dejaron de venir o que debían volver por control.",
        conVinqulia:
          "Una vista guardada los lista por última actividad; se les contacta y cada llamada deja su nota y su siguiente tarea.",
      },
      {
        hora: "Cierre de mes",
        titulo: "Cuántos interesados y cuántas conversiones por sede",
        narrativa:
          "La dirección quiere comparar demanda y cierre entre sedes y especialidades.",
        conVinqulia:
          "Los informes muestran conversión del periodo y cierre por responsable, con los motivos por los que un tratamiento no se aceptó.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Mensajes sin dueño que se contestan tarde",
      solucion:
        "Cada interesado entra al sistema con responsable asignado y origen registrado",
      beneficio:
        "Se sabe quién atiende cada conversación y ninguna consulta queda esperando a que alguien la vea",
    },
    {
      problema: "Cotizaciones de tratamiento que se enfrían sin seguimiento",
      solucion:
        "Oportunidad con importe y tarea de seguimiento con fecha",
      beneficio:
        "El seguimiento ocurre en el momento en que el paciente decide, no cuando alguien se acuerda",
    },
    {
      problema: "Pacientes que dejan de venir y nadie los busca",
      solucion:
        "Vistas guardadas por última actividad y campanas de reactivación con tareas",
      beneficio:
        "Se recupera al paciente que ya conocía la clínica en lugar de depender solo de captar nuevos",
    },
    {
      problema: "No se registra por qué no se aceptó un tratamiento",
      solucion: "Motivo de pérdida en cada oportunidad cerrada",
      beneficio:
        "Se descubre si el freno es precio, horarios o financiamiento, y se puede actuar sobre ello",
    },
    {
      problema: "Varias sedes sin visión conjunta",
      solucion:
        "Embudos y responsables por sede o especialidad, con informes por responsable",
      beneficio:
        "La dirección compara demanda y conversión entre sedes, en lugar de sumar reportes sueltos",
    },
    {
      problema: "El seguimiento se cae cuando cambia el turno",
      solucion:
        "Historial de conversaciones y tareas abiertas visibles para todo el equipo",
      beneficio:
        "Quien tome la conversación entiende qué se ofreció y en qué quedó, sin preguntar a un compañero",
    },
    {
      problema: "Solicitudes administrativas que se pierden",
      solucion:
        "Tickets con asunto, descripción y estado, ligados al paciente y a la sede",
      beneficio:
        "Cada solicitud tiene seguimiento y antecedente, en lugar de quedar en una nota de papel",
    },
  ],
  casosDeUso: [
    {
      titulo: "Captación desde la web y las redes",
      texto:
        "Un formulario en la web de la clínica crea el interesado con su historial, así la consulta que llega de madrugada ya está en el sistema al abrir.",
      funcionalidad: "Formularios públicos que crean contactos",
    },
    {
      titulo: "Seguimiento de cotizaciones de tratamiento",
      texto:
        "Cada presupuesto vive como oportunidad con su importe y una tarea de seguimiento, para que no se quede en el hilo de mensajes donde se envió.",
      funcionalidad: "Oportunidades con importe, etapas y tareas con fecha",
    },
    {
      titulo: "Reactivación de pacientes",
      texto:
        "Un filtro por última actividad muestra a quién no se le ve desde hace meses, y el contacto deja su nota y su próxima tarea para dar continuidad.",
      funcionalidad: "Vistas guardadas compartidas y notas en la ficha",
    },
    {
      titulo: "Varias sedes o especialidades",
      texto:
        "Cada sede o línea de tratamiento puede tener su embudo y su responsable, para medir por separado sin mezclar la demanda de todas.",
      funcionalidad: "Varios embudos y responsable por cuenta",
    },
    {
      titulo: "Datos del paciente que sí son comerciales",
      texto:
        "Sede de preferencia, tratamiento de interés, cómo llegó y estado de la relación se guardan como campos propios. Los datos clínicos no se registran aquí.",
      funcionalidad: "Campos personalizados (texto, número, fecha, lista)",
    },
    {
      titulo: "Solicitudes y temas administrativos",
      texto:
        "Una solicitud de constancia, una queja por tiempos de espera o un ajuste de horario se registran como ticket con su estado, ligados al paciente.",
      funcionalidad: "Tickets con asunto, descripción y estado configurable",
    },
    {
      titulo: "Qué se convierte y qué no, por asesora",
      texto:
        "Conversión del periodo, cierre por responsable y motivos por los que un tratamiento no se aceptó: sirve para entrenar y para ajustar precios u horarios.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Clínica dental con 2 sedes, 3 asesoras de tratamiento y alrededor de 250 consultas nuevas por mes.",
    inicial: [
      "Las consultas llegan a un WhatsApp que se atiende entre paciente y paciente.",
      "Los presupuestos enviados no tienen seguimiento: se responde si el paciente vuelve a escribir.",
      "Nadie contacta a los pacientes que dejaron de venir.",
      "La dirección no puede comparar la demanda ni la conversión entre sedes.",
    ],
    conVinqulia: [
      "Cada consulta entra al sistema con su sede, su origen y una responsable.",
      "Cada presupuesto tiene su tarea de seguimiento y su motivo si no se acepta.",
      "Una vista de pacientes sin actividad reciente alimenta la reactivación cada semana.",
      "Los informes comparan conversión y cierre por sede y por asesora.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No presentamos porcentajes de mejora ni resultados clínicos.",
  },
  paraQuien: {
    si: [
      "Clínicas y consultorios con una o varias sedes y personal dedicado a atender consultas.",
      "Tratamientos de ticket medio o alto donde el seguimiento decide la aceptación (ortodoncia, implantes, estética, rehabilitación).",
      "Negocios donde las consultas llegan por WhatsApp, redes y formularios de la web.",
      "Clínicas que quieren reactivar pacientes que dejaron de venir.",
      "Direcciones que necesitan comparar demanda y conversión entre sedes o especialidades.",
    ],
    no: [
      "Si buscas expediente clínico o historia del paciente: Vinqulia no es un sistema clínico.",
      "Si necesitas agenda médica de citas con disponibilidad de sillones o consultorios: hoy no existe.",
      "Si necesitas facturación a aseguradoras o emisión de comprobantes: no forma parte del producto.",
      "Si necesitas recordatorios de cita enviados automáticamente al paciente: hoy el envío de WhatsApp es manual desde la ficha.",
    ],
  },
  beneficios: [
    {
      titulo: "Ninguna consulta se queda sin respuesta por turnos",
      resultado:
        "Cada interesado tiene una responsable y un historial, así que cuando cambia el turno la conversación continúa en lugar de reiniciarse.",
    },
    {
      titulo: "El seguimiento de presupuestos deja de ser opcional",
      resultado:
        "Cada cotización lleva su tarea con fecha, y el resultado se anota: aceptada, en espera o rechazada con su motivo.",
    },
    {
      titulo: "Recuperar pacientes cuesta menos que captarlos",
      resultado:
        "Las vistas de reactivación convierten la lista histórica de pacientes en una fuente de consultas, sin gasto adicional en publicidad.",
    },
    {
      titulo: "Decisiones de precio y horario con datos",
      resultado:
        "Los motivos registrados muestran si lo que frena la aceptación es el precio, los horarios o el financiamiento, y se puede actuar sobre eso.",
    },
    {
      titulo: "Comparar sedes o especialidades",
      resultado:
        "Con embudos y responsables separados, la dirección ve qué sede convierte mejor y dónde se está cayendo el seguimiento.",
    },
    {
      titulo: "El límite claro protege a la clínica",
      resultado:
        "El CRM guarda información comercial —contacto, interés, seguimiento— y no datos clínicos, que pertenecen al sistema clínico de la clínica.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Consultas repartidas en el WhatsApp de recepción, sin dueño.",
      "Presupuestos enviados sin seguimiento posterior.",
      "Pacientes inactivos que nadie contacta.",
      "Sin registro de por qué no se aceptó un tratamiento.",
      "Dirección que no puede comparar sedes entre sí.",
    ],
    conVinqulia: [
      "Cada consulta con su origen, su sede y su responsable.",
      "Cada presupuesto con tarea de seguimiento y resultado anotado.",
      "Reactivación semanal desde una vista compartida de inactivos.",
      "Motivo de pérdida registrado en cada tratamiento no aceptado.",
      "Informes de conversión y cierre por sede y por asesora.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Es un software médico o un expediente clínico?",
      respuesta:
        "No. Vinqulia es un CRM: gestiona la relación comercial con el interesado y el paciente —contacto, interés, seguimiento, presupuesto—, no la historia clínica. Los datos clínicos deben permanecer en el sistema clínico de la clínica.",
    },
    {
      pregunta: "¿Puedo agendar citas desde aquí?",
      respuesta:
        "Puedes registrar y dar seguimiento a una valoración con fecha como tarea, y confirmarla. No es una agenda médica con disponibilidad de consultorios ni se sincroniza con la agenda clínica.",
    },
    {
      pregunta: "¿Los recordatorios de cita se envían solos?",
      respuesta:
        "Hoy no. Lo que sí puedes hacer es crear la tarea de confirmación en la fecha adecuada y enviar el WhatsApp desde la ficha, quedando registrado en el historial. El envío automático al paciente es una capacidad futura.",
    },
    {
      pregunta: "¿Sirve para varias sedes?",
      respuesta:
        "Sí. Cada sede o especialidad puede tener su embudo y su responsable, y los informes permiten comparar conversión y cierre entre ellas.",
    },
    {
      pregunta: "¿Puedo usarlo solo para el seguimiento, sin cambiar mi sistema clínico?",
      respuesta:
        "Es justo el uso recomendado: el CRM lleva la parte comercial y el sistema clínico sigue llevando expediente y agenda. Se comunican por API si necesitas cruzar información.",
    },
    {
      pregunta: "¿Qué pasa con los datos de los pacientes?",
      respuesta:
        "El CRM guarda datos de contacto y de relación comercial, no información clínica. Puedes exportar los contactos en CSV y consultar la información por la API: los datos son de tu clínica.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM conviene para una clínica o consultorio?",
      respuesta:
        "Uno enfocado en captación y seguimiento: recibir la consulta, asignarla a una responsable, dar seguimiento al presupuesto y reactivar pacientes inactivos. Vinqulia hace eso y deja el expediente clínico en el sistema que ya usas.",
    },
    {
      pregunta: "¿Cómo doy seguimiento a los pacientes que piden una cotización?",
      respuesta:
        "Cada presupuesto se registra como oportunidad con su importe y una tarea de seguimiento con fecha. Al cerrarla se anota el resultado —aceptado, en espera o rechazado— y el motivo si no se aceptó.",
    },
    {
      pregunta: "¿Cómo puedo reactivar pacientes que dejaron de venir?",
      respuesta:
        "Con una vista compartida que filtra por última actividad: muestra a quién no se le ve desde hace meses. Se contacta y cada llamada deja su nota y su siguiente tarea, para que la reactivación no dependa de la memoria.",
    },
    {
      pregunta: "¿Puedo organizar los mensajes de WhatsApp de los pacientes?",
      respuesta:
        "Sí. El WhatsApp se envía desde la ficha del interesado y la conversación queda registrada como nota en su historial, así no vive únicamente en el teléfono de recepción.",
    },
    {
      pregunta: "¿Sirve para comparar el desempeño entre sucursales?",
      respuesta:
        "Sí. Con embudos y responsables por sede, los informes muestran conversión y cierre de cada una, además de los motivos por los que no se aceptan los tratamientos.",
    },
    {
      pregunta: "¿Registra la historia clínica del paciente?",
      respuesta:
        "No. Vinqulia no es un sistema clínico y no debe usarse para historia clínica. Guarda la relación comercial: cómo llegó, qué le interesó, qué se le cotizó y en qué quedó el seguimiento.",
    },
    {
      pregunta: "¿Puedo probarlo sin dejar mi sistema de citas actual?",
      respuesta:
        "Sí. Muchas clínicas empiezan usando el CRM solo para captación y seguimiento, manteniendo su agenda y su expediente donde ya están.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Agenda de citas con disponibilidad",
      texto:
        "Calendario de consultorios y profesionales con horarios disponibles. Hoy no existe.",
    },
    {
      titulo: "Recordatorios automáticos al paciente",
      texto:
        "Envío programado de recordatorio de cita por WhatsApp o correo sin intervención manual. Hoy el envío es manual desde la ficha.",
    },
    {
      titulo: "Historia clínica y consentimientos",
      texto:
        "Expediente clínico, notas de evolución y consentimientos informados. Queda fuera del alcance de un CRM y hoy no existe en el producto.",
    },
    {
      titulo: "Facturación y aseguradoras",
      texto:
        "Emisión de comprobantes y gestión de coberturas. Hoy no existe; se aborda como integración con el sistema de facturación de la clínica.",
    },
    {
      titulo: "Portal del paciente",
      texto:
        "Área donde el paciente consulta sus citas y documentos. Hoy no existe.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Que la próxima persona que pregunte por tu clínica reciba respuesta el mismo día",
    subtitulo:
      "Cuéntanos cómo llegan hoy las consultas —cuántas sedes, por qué canales y quién las atiende— y te mostramos cómo se vería el seguimiento de tu clínica en Vinqulia.",
    boton: "Quiero una demo para mi clínica",
  },
  seo: {
    keywordPrincipal: "CRM para clínicas",
    keywordsSecundarias: [
      "CRM para consultorios",
      "software de seguimiento de pacientes",
      "CRM para clínica dental",
      "reactivación de pacientes",
      "gestión de pacientes por WhatsApp",
    ],
    longTail: [
      "cómo dar seguimiento a pacientes que piden una cotización",
      "software para reactivar pacientes que dejaron de venir",
      "cómo organizar los mensajes de WhatsApp de una clínica",
      "CRM para clínica con varias sucursales",
      "cómo medir cuántos tratamientos se aceptan en una clínica",
    ],
    terminosRelacionados: [
      "captación de pacientes",
      "cotización de tratamiento",
      "reactivación",
      "seguimiento comercial",
      "asesora de tratamiento",
      "valoración",
    ],
    intencionComercial:
      "Clínicas que reciben más consultas de las que pueden seguir y buscan una herramienta para no perder interesados, sin cambiar su sistema clínico. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Dueños y administradores que investigan cómo reactivar pacientes, cómo responder más rápido o cómo medir la aceptación de tratamientos. Lo cubren las secciones Problema y Un día en la clínica.",
    paginasFuturas: [
      "/guias/crm-para-clinicas-como-elegir",
      "/soluciones/reactivacion-de-pacientes",
      "/soluciones/seguimiento-de-presupuestos-de-tratamiento",
      "/comparativas/crm-vs-agenda-clinica",
      "/blog/como-no-perder-pacientes-que-preguntan-por-whatsapp",
    ],
  },
};

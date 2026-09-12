import type { Industria } from "./tipos";

/**
 * Educación y admisiones.
 *
 * Novena industria. El proceso es un embudo de admisión clásico: muchos
 * interesados, etapas claras y una fecha límite que aprieta. Se apoya en
 * funcionalidades verificadas: formularios públicos para captar, embudos por
 * nivel o programa, tareas con fecha para plazos duros, campos propios (grado
 * de interés, ciclo, escuela de procedencia), WhatsApp y correo en el
 * historial, e informes de conversión y motivos de no inscripción.
 *
 * Lo que no existe —calificaciones, colegiaturas, portal de padres, exámenes
 * en línea— se declara en oportunidadesFuturas.
 */
export const educacion: Industria = {
  slug: "educacion",
  nombre: "Educación y admisiones",
  resumen:
    "Embudo de admisión con etapas, plazos que no se pasan y el motivo por el que una familia no se inscribió.",
  icono: "GraduationCap",
  tablero: {
    titulo: "Proceso de admisión",
    montoEnJuego: 3480000,
    columnas: [
      {
        titulo: "Interesado",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Fam. Herrera · Primaria",
            empresa: "Ingreso 2027",
            monto: "$96,000",
            iniciales: "FH",
            color: "#e2766a",
            etiqueta: "Feria",
          },
          {
            nombre: "A. Robles · Preparatoria",
            empresa: "Ingreso 2027",
            monto: "$128,000",
            iniciales: "AR",
            color: "#7d6ae2",
            etiqueta: "Web",
          },
        ],
      },
      {
        titulo: "Visita agendada",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Fam. Castro · Kínder",
            empresa: "Recorrido sábado",
            monto: "$62,000",
            iniciales: "FC",
            color: "#3f8fd0",
            etiqueta: "Sábado 10:00",
          },
        ],
      },
      {
        titulo: "Examen y documentos",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Fam. Nava · Secundaria",
            empresa: "Falta acta de nacimiento",
            monto: "$84,000",
            iniciales: "FN",
            color: "#b23b2e",
            etiqueta: "Pendiente",
          },
        ],
      },
      {
        titulo: "Inscrito",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Fam. Solís · Primaria",
            empresa: "Inscripción completa",
            monto: "$96,000",
            iniciales: "FS",
            color: "#3f8f7a",
            etiqueta: "Listo",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para escuelas y universidades",
    titulo: "En temporada de admisiones recibes cientos de interesados. El problema no es atraerlos: es no perder a ninguno por falta de seguimiento.",
    subtitulo:
      "Vinqulia organiza el proceso de admisión completo: cada familia o aspirante con su asesor, cada recorrido con su tarea, cada documento pendiente a la vista y cada plazo vigilado. Y al cerrar el ciclo, el dato de por qué no se inscribieron.",
    ctaPrincipal: "Quiero una demo para mi institución",
    puntos: [
      "Embudo de admisión por etapas",
      "Plazos y documentos con tarea",
      "Un embudo por nivel o programa",
      "Motivos de no inscripción, medidos",
    ],
  },
  problema: {
    titulo: "Cómo se lleva hoy el proceso de admisión",
    intro:
      "La admisión es un proceso comercial con fecha límite, pero suele administrarse como una lista de correos y una carpeta de papeles. Y las familias no esperan: se inscriben donde las atendieron mejor y más rápido.",
    puntos: [
      {
        titulo: "La demanda llega en oleadas y desborda",
        texto:
          "Ferias, campañas y recomendaciones concentran cientos de interesados en pocas semanas. Sin un lugar donde vivan ordenados, se atiende a los que llegaron primero y se pierde al resto.",
      },
      {
        titulo: "Los plazos son duros y se pasan desapercibidos",
        texto:
          "La fecha de examen, el cierre de la convocatoria o el límite para entregar documentos no negocian. Si dependen de que alguien revise su agenda, alguna familia se queda fuera y la institución pierde el ingreso.",
      },
      {
        titulo: "Los expedientes de admisión quedan incompletos",
        texto:
          "Al acta le falta una copia, la boleta no llegó, el comprobante de domicilio está vencido. Perseguir papeles uno por uno consume más tiempo que atender a los nuevos interesados.",
      },
      {
        titulo: "Nadie sabe quién atendió a cada familia",
        texto:
          "Si la familia habla con dos personas distintas, recibe dos versiones del proceso. Y cuando alguien del área de admisiones se ausenta, su carpeta se queda sin movimiento.",
      },
      {
        titulo: "Los recorridos se agendan y se olvidan",
        texto:
          "La visita al plantel es el momento en que más se decide, y sin confirmación ni seguimiento posterior, el interés del sábado se apaga el lunes.",
      },
      {
        titulo: "No se sabe por qué no se inscribieron",
        texto:
          "Si fue el costo, la distancia, el horario o que eligieron otra escuela, no queda registro. Sin ese dato, el siguiente ciclo se planea con la misma incertidumbre.",
      },
    ],
  },
  dia: {
    titulo: "Un día en admisiones, con Vinqulia",
    intro:
      "La jornada del equipo de admisiones cuando el proceso deja de depender de correos y carpetas.",
    momentos: [
      {
        hora: "8:30",
        titulo: "Los interesados de ayer",
        narrativa:
          "Anoche entraron consultas por el formulario de la web y de la campaña de la feria del fin de semana.",
        conVinqulia:
          "Todos están creados con su origen y su nivel de interés. Cada asesor abre su vista de «nuevos sin contactar» y sabe a quién le toca responder.",
      },
      {
        hora: "9:30",
        titulo: "Primer contacto con la familia",
        narrativa:
          "Hay que responder el costo, el horario y ofrecer un recorrido por el plantel.",
        conVinqulia:
          "El WhatsApp o el correo se envían desde la ficha y la respuesta queda registrada en el historial de esa familia.",
      },
      {
        hora: "11:00",
        titulo: "Recorrido del sábado por confirmar",
        narrativa:
          "Hay tres visitas agendadas y dos familias no han confirmado.",
        conVinqulia:
          "La tarea de confirmación estaba programada con su fecha: se llama, se anota el resultado y se agenda la siguiente acción.",
      },
      {
        hora: "13:00",
        titulo: "Documentos pendientes",
        narrativa:
          "Una familia ya hizo examen pero le falta el acta de nacimiento para completar el expediente.",
        conVinqulia:
          "La etapa y la nota muestran qué falta; se le recuerda por WhatsApp y queda registrado el compromiso de entrega.",
      },
      {
        hora: "16:00",
        titulo: "Familias que se enfriaron",
        narrativa:
          "Hay interesados de hace tres semanas que nunca agendaron visita.",
        conVinqulia:
          "Una vista guardada los lista por última actividad; se les contacta y cada llamada deja su nota y su próxima tarea.",
      },
      {
        hora: "Fin del ciclo",
        titulo: "Cómo cerró la convocatoria",
        narrativa:
          "La dirección necesita saber la conversión del periodo y por qué se perdieron familias.",
        conVinqulia:
          "Los informes muestran conversión por etapa, cierre por asesor y los motivos de no inscripción registrados.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Cientos de interesados en pocas semanas, sin orden",
      solucion:
        "Formulario público en la web y captura ordenada, con origen y nivel de interés registrados",
      beneficio:
        "Ningún interesado de la temporada se queda sin contacto, aunque el volumen se multiplique",
    },
    {
      problema: "Plazos de examen y convocatoria que se pasan",
      solucion:
        "Tareas con fecha y vista de pendientes del equipo",
      beneficio:
        "Los vencimientos se ven venir, así ninguna familia se queda fuera por un plazo administrativo",
    },
    {
      problema: "Expedientes incompletos que nadie persigue",
      solucion:
        "Etapa de documentación y notas con lo que falta por entregar",
      beneficio:
        "Se sabe en cada momento qué documento falta y a quién hay que recordárselo",
    },
    {
      problema: "Familias atendidas por dos personas con versiones distintas",
      solucion:
        "Responsable asignado por interesado e historial de conversaciones",
      beneficio:
        "Cualquiera del equipo retoma la conversación con el mismo contexto, sin contradecir lo ofrecido",
    },
    {
      problema: "Recorridos agendados que no se confirman",
      solucion:
        "Tareas de confirmación y de seguimiento posterior a la visita",
      beneficio:
        "El interés que generó el recorrido se trabaja en los días siguientes, cuando todavía está vivo",
    },
    {
      problema: "Un solo proceso para niveles con reglas distintas",
      solucion: "Varios embudos, uno por nivel o programa",
      beneficio:
        "Cada nivel se mide con su propio ciclo y sus propias etapas, sin promediar kínder con licenciatura",
    },
    {
      problema: "Sin dato de por qué una familia no se inscribió",
      solucion: "Motivo de pérdida en cada oportunidad cerrada",
      beneficio:
        "La siguiente campaña se planea sabiendo si pesa más el costo, la distancia, el horario o la competencia",
    },
  ],
  casosDeUso: [
    {
      titulo: "Embudo de admisión por etapas",
      texto:
        "Cada aspirante recorre interesado, recorrido agendado, examen, documentación e inscrito, con su importe estimado y su asesor asignado.",
      funcionalidad: "Embudo por etapas con importe y responsable",
    },
    {
      titulo: "Un embudo por nivel o programa",
      texto:
        "Kínder, primaria, licenciatura o posgrado tienen reglas y fechas distintas: cada uno con su embudo y sus etapas permite medirlos por separado.",
      funcionalidad: "Varios embudos con etapas independientes",
    },
    {
      titulo: "Plazos y vencimientos bajo control",
      texto:
        "La fecha del examen, el cierre de convocatoria o el límite de documentos se programan como tareas con fecha y aparecen en la lista del equipo.",
      funcionalidad: "Tareas con vencimiento y vistas de pendientes",
    },
    {
      titulo: "Datos que definen la admisión",
      texto:
        "Grado o programa de interés, ciclo de ingreso, escuela de procedencia o si requiere beca se registran como campos propios del interesado.",
      funcionalidad: "Campos personalizados de texto, número, fecha y lista",
    },
    {
      titulo: "Captación desde la web y las campañas",
      texto:
        "Un formulario en el sitio de la institución crea al interesado con su historial en el momento, sin que nadie lo teclee después.",
      funcionalidad: "Formularios públicos que crean contactos",
    },
    {
      titulo: "Recuperar interesados que se enfriaron",
      texto:
        "Una vista compartida con los aspirantes sin actividad reciente convierte la revisión semanal en una ronda concreta de llamadas.",
      funcionalidad: "Vistas guardadas compartidas",
    },
    {
      titulo: "Conversión y causas de no inscripción",
      texto:
        "Al cerrar el ciclo, los informes muestran conversión por etapa, cierre por asesor y los motivos por los que las familias no se inscribieron.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Colegio privado con 3 niveles educativos, 5 asesores de admisión y alrededor de 600 interesados por ciclo.",
    inicial: [
      "Los interesados se registran en hojas de cálculo separadas por asesor.",
      "Los plazos de examen y documentación se avisan por correo y algunos se pasan.",
      "Los expedientes incompletos se persiguen de forma manual.",
      "Al cerrar el ciclo no hay dato de por qué se perdieron familias.",
    ],
    conVinqulia: [
      "Cada interesado entra al sistema con su origen, su nivel y su asesor.",
      "Los plazos viven como tareas con fecha, visibles para todo el equipo.",
      "La etapa de documentación y las notas muestran qué falta por entregar.",
      "El informe del ciclo muestra conversión, cierre por asesor y motivos de no inscripción.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No presentamos porcentajes de mejora ni resultados de captación medidos.",
  },
  paraQuien: {
    si: [
      "Colegios, universidades e institutos con un proceso de admisión con etapas y plazos.",
      "Equipos de admisión de 2 a 30 personas que atienden volumen alto en temporada.",
      "Instituciones con varios niveles o programas que necesitan medirse por separado.",
      "Escuelas que captan por campañas, ferias y recomendaciones y quieren saber de dónde vienen los inscritos.",
      "Direcciones académicas que necesitan saber por qué no se inscriben las familias.",
    ],
    no: [
      "Si buscas un sistema escolar con calificaciones, kardex o boletas: Vinqulia no lo es.",
      "Si necesitas cobro de colegiaturas o estados de cuenta de alumnos: no forma parte del producto.",
      "Si necesitas portal de padres o gestión de becas: hoy no existe.",
      "Si tu institución no tiene un proceso de admisión con seguimiento, el valor de un CRM es bajo.",
    ],
  },
  beneficios: [
    {
      titulo: "La temporada deja de desbordar al equipo",
      resultado:
        "Con captación ordenada y responsable asignado, el volumen de interesados se reparte con criterio en lugar de atender solo a los primeros que escriben.",
    },
    {
      titulo: "Los plazos no se convierten en pérdidas",
      resultado:
        "Los vencimientos de examen y documentación se ven venir con antelación, así que ninguna familia se queda fuera por un detalle administrativo.",
    },
    {
      titulo: "Los expedientes se completan a tiempo",
      resultado:
        "Saber qué documento falta y a quién recordárselo reduce el tiempo dedicado a perseguir papeles en plena temporada.",
    },
    {
      titulo: "La conversación no depende de quién atienda",
      resultado:
        "El historial por familia permite que cualquier asesor retome el caso con el mismo contexto, sin contradecir lo que ya se ofreció.",
    },
    {
      titulo: "Planeación del siguiente ciclo con datos",
      resultado:
        "Los motivos de no inscripción permiten decidir sobre costos, horarios o comunicación con evidencia del ciclo anterior.",
    },
    {
      titulo: "Comparar niveles y programas",
      resultado:
        "Con embudos separados por nivel, la institución ve en cuál convierte mejor y dónde se está cayendo el seguimiento.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Interesados en hojas de cálculo separadas por asesor.",
      "Plazos avisados por correo, con riesgo de que se pasen.",
      "Documentos incompletos perseguidos manualmente.",
      "Recorridos agendados sin confirmación ni seguimiento.",
      "Sin dato de por qué no se inscribieron las familias.",
    ],
    conVinqulia: [
      "Una sola base de interesados, con origen, nivel y asesor.",
      "Plazos y vencimientos como tareas visibles con fecha.",
      "Etapa de documentación con lo pendiente por familia.",
      "Confirmación y seguimiento posterior del recorrido, programados.",
      "Motivos de no inscripción registrados y medidos por ciclo.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Es un sistema escolar o un CRM?",
      respuesta:
        "Es un CRM. Gestiona el proceso de admisión —interesados, recorridos, plazos, documentos y cierre—, no la vida académica del alumno. Las calificaciones y el kardex siguen en tu sistema escolar.",
    },
    {
      pregunta: "¿Puedo manejar varios niveles o programas?",
      respuesta:
        "Sí, con embudos separados. Cada nivel puede tener sus etapas y sus fechas, y así se mide su conversión sin promediarla con la de los demás.",
    },
    {
      pregunta: "¿Cómo vigilo los plazos de examen y de documentación?",
      respuesta:
        "Con tareas con fecha dentro de la oportunidad del aspirante. Aparecen en la lista del equipo y se pueden consultar por vencimiento, así ninguna convocatoria se pasa desapercibida.",
    },
    {
      pregunta: "¿Puedo registrar qué documentos le faltan a una familia?",
      respuesta:
        "Sí. En la etapa de documentación se anota en las notas qué falta y se programa el recordatorio, de modo que el expediente se complete antes del límite.",
    },
    {
      pregunta: "¿Sirve si el volumen se concentra en dos meses al año?",
      respuesta:
        "Está pensado justo para eso: permite repartir cientos de interesados entre el equipo y dar seguimiento sin que el proceso se caiga por volumen. Fuera de temporada sirve para reactivar a los que no cerraron.",
    },
    {
      pregunta: "¿Se integra con nuestro sistema escolar?",
      respuesta:
        "Puede integrarse por API REST y webhooks. Lo habitual es que el CRM gestione la admisión y el sistema escolar reciba al alumno una vez inscrito.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM conviene para una escuela o universidad?",
      respuesta:
        "Uno que entienda un embudo de admisión con etapas y fechas límite: captar interesados, asignarlos a un asesor, programar recorridos y exámenes, controlar documentación y medir la conversión del ciclo. Eso es lo que Vinqulia resuelve.",
    },
    {
      pregunta: "¿Cómo organizo cientos de interesados en temporada de admisiones?",
      respuesta:
        "Con un formulario que los cree automáticamente, un responsable asignado a cada uno y vistas guardadas por estado —nuevos, sin confirmar, documentación pendiente— para que el equipo trabaje listas concretas en lugar de una bandeja común.",
    },
    {
      pregunta: "¿Puedo dar seguimiento a las familias que visitan el plantel?",
      respuesta:
        "Sí. El recorrido se agenda como tarea, se confirma el día antes y se registra el resultado; el seguimiento posterior se programa en el mismo movimiento.",
    },
    {
      pregunta: "¿Cómo controlo los documentos que faltan por entregar?",
      respuesta:
        "Con una etapa de documentación y notas donde se anota qué falta por familia, además de la tarea de recordatorio. Así el expediente se cierra antes de la fecha límite.",
    },
    {
      pregunta: "¿Puedo medir por qué no se inscriben las familias?",
      respuesta:
        "Sí. Al cerrar una oportunidad se registra el motivo —costo, distancia, horario, otra institución— y el informe de pérdidas muestra cuáles se repiten más en el ciclo.",
    },
    {
      pregunta: "¿Administra calificaciones o colegiaturas?",
      respuesta:
        "No. Vinqulia no lleva calificaciones, boletas ni cobros. Su alcance es el proceso de admisión: desde que la familia pregunta hasta que se inscribe.",
    },
    {
      pregunta: "¿Los asesores de admisión pueden usarlo desde el teléfono?",
      respuesta:
        "Sí. La interfaz móvil permite consultar la ficha del interesado, registrar la llamada o el mensaje y crear la siguiente tarea desde el teléfono.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Sistema escolar: calificaciones y kardex",
      texto:
        "Expediente académico del alumno, boletas y historial. Hoy no existe; pertenece a un sistema escolar.",
    },
    {
      titulo: "Cobro de colegiaturas",
      texto:
        "Generación de cargos, estados de cuenta y seguimiento de pagos. Hoy no existe en el producto.",
    },
    {
      titulo: "Portal de padres y aspirantes",
      texto:
        "Área donde la familia consulta su proceso de admisión o sus pagos. Hoy no existe.",
    },
    {
      titulo: "Exámenes de admisión en línea",
      texto:
        "Aplicación del examen dentro del sistema con calificación automática. Hoy no existe; el examen se agenda y se registra su resultado a mano.",
    },
    {
      titulo: "Gestión de becas",
      texto:
        "Flujo de solicitud, evaluación y asignación de becas. Hoy el dato se puede anotar como campo, pero no hay flujo de aprobación.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Que ninguna familia se pierda por un seguimiento que no se hizo",
    subtitulo:
      "Cuéntanos cómo es tu proceso de admisión —cuántos niveles, cuántos asesores y qué volumen manejan en temporada— y te mostramos cómo se vería tu embudo en Vinqulia.",
    boton: "Quiero una demo para mi institución",
  },
  seo: {
    keywordPrincipal: "CRM para escuelas",
    keywordsSecundarias: [
      "CRM para admisiones escolares",
      "software para proceso de admisión",
      "CRM para universidades",
      "gestión de interesados en colegios",
      "CRM educativo México",
    ],
    longTail: [
      "cómo organizar los interesados en temporada de admisiones",
      "software para seguimiento de aspirantes en una escuela",
      "cómo controlar documentos pendientes de admisión",
      "CRM para colegios con varios niveles educativos",
      "cómo medir la conversión del proceso de admisión",
    ],
    terminosRelacionados: [
      "embudo de admisión",
      "aspirante",
      "recorrido por el plantel",
      "convocatoria",
      "ciclo escolar",
      "asesor de admisiones",
    ],
    intencionComercial:
      "Instituciones educativas que reciben más interesados de los que pueden atender ordenadamente y buscan una herramienta para no perder aspirantes en temporada. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Coordinadores de admisión que investigan cómo organizar el volumen de interesados, cómo vigilar plazos o cómo medir la conversión del ciclo. Lo cubren las secciones Problema y Un día en admisiones.",
    paginasFuturas: [
      "/guias/crm-para-escuelas-como-elegir",
      "/soluciones/embudo-de-admision",
      "/soluciones/control-de-documentacion",
      "/comparativas/crm-vs-hoja-de-calculo-en-admisiones",
      "/blog/como-no-perder-aspirantes-en-temporada",
    ],
  },
};

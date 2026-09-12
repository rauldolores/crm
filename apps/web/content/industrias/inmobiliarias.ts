import type { Industria } from "./tipos";

/**
 * Inmobiliarias y desarrollos inmobiliarios.
 *
 * Tercera industria. Aquí el negocio no es un pedido que se repite, sino un
 * prospecto que se enfría en horas y una visita que hay que agendar. El
 * contenido se apoya en funcionalidades que existen: reparto de leads por
 * responsable, tareas con fecha, varios embudos, campos personalizados,
 * WhatsApp y correo en el historial, informes por asesor y móvil.
 *
 * Lo que NO existe —catálogo de propiedades, publicación en portales, firma
 * de contratos, comisiones— se declara en oportunidadesFuturas.
 */
export const inmobiliarias: Industria = {
  slug: "inmobiliarias",
  nombre: "Inmobiliarias y desarrollos",
  resumen:
    "Cada interesado con su asesor, cada visita con su tarea y venta y renta en embudos separados.",
  icono: "Home",
  tablero: {
    titulo: "Operaciones en curso",
    montoEnJuego: 18400000,
    columnas: [
      {
        titulo: "Contacto nuevo",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Depto. Roma Norte",
            empresa: "Interesado: A. Beltrán",
            monto: "$3,850,000",
            iniciales: "AB",
            color: "#e2766a",
            etiqueta: "Portal",
          },
          {
            nombre: "Renta · Del Valle",
            empresa: "Interesado: M. Ojeda",
            monto: "$18,500",
            iniciales: "MO",
            color: "#7d6ae2",
            etiqueta: "WhatsApp",
          },
        ],
      },
      {
        titulo: "Visita agendada",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Casa Coyoacán",
            empresa: "Interesado: R. Salas",
            monto: "$6,200,000",
            iniciales: "RS",
            color: "#3f8fd0",
            etiqueta: "Sábado 11:00",
          },
          {
            nombre: "Local Nápoles",
            empresa: "Interesado: C. Duarte",
            monto: "$2,400,000",
            iniciales: "CD",
            color: "#4fb59a",
            etiqueta: "Hoy 17:00",
          },
        ],
      },
      {
        titulo: "En negociación",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Depto. Polanco",
            empresa: "Interesado: L. Fajardo",
            monto: "$9,700,000",
            iniciales: "LF",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Apartado",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Renta · Condesa",
            empresa: "Interesado: J. Nava",
            monto: "$22,000",
            iniciales: "JN",
            color: "#3f8f7a",
            etiqueta: "Apartado",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para inmobiliarias",
    titulo: "Decenas de interesados por propiedad y ningún lugar donde ver en qué quedó cada uno.",
    subtitulo:
      "Vinqulia ordena la captación y el seguimiento de tu inmobiliaria: cada prospecto con un asesor asignado, cada visita con su tarea y cada operación con su etapa. Venta y renta separadas en dos embudos, con WhatsApp y correo dentro del historial.",
    ctaPrincipal: "Quiero una demo para mi inmobiliaria",
    puntos: [
      "Reparto de leads entre asesores",
      "Visitas y seguimientos con tarea",
      "Venta y renta en embudos separados",
      "Cierre por asesor, medido",
    ],
  },
  problema: {
    titulo: "Cómo se atiende hoy la demanda en una inmobiliaria",
    intro:
      "En este negocio el activo no es el inventario: es la velocidad con que se atiende a quien pregunta. Y es justo lo primero que se pierde cuando todo pasa por WhatsApp.",
    puntos: [
      {
        titulo: "Los leads llegan de cinco lugares distintos",
        texto:
          "Portales, redes, recomendados y el letrero de la propiedad. Cada canal deja el contacto en un lugar diferente, y nadie tiene la lista completa del día.",
      },
      {
        titulo: "No se sabe quién atiende a cada prospecto",
        texto:
          "El mensaje lo contesta quien lo ve primero. Si dos asesores escriben al mismo interesado, la inmobiliaria queda mal y el prospecto se confunde.",
      },
      {
        titulo: "El interesado se enfría en horas",
        texto:
          "Quien pregunta por una propiedad está viendo tres o cuatro opciones al mismo tiempo. Si la respuesta tarda un día, esa persona ya está en otra oficina.",
      },
      {
        titulo: "Las visitas se agendan de memoria",
        texto:
          "«El sábado a las once con la señora de Coyoacán». Sin registro, la visita se cae o se duplica, y nadie confirma al día siguiente.",
      },
      {
        titulo: "El broker no ve el embudo del equipo",
        texto:
          "Saber cuántos prospectos hay activos, cuántos esperan visita y cuántos se cayeron implica preguntarle a cada asesor por su propia lista.",
      },
      {
        titulo: "Las operaciones se pierden sin dejar rastro",
        texto:
          "No se registra si fue precio, ubicación o financiamiento. Sin ese dato, la inmobiliaria repite el mismo error de precio con la siguiente propiedad.",
      },
    ],
  },
  dia: {
    titulo: "Un día en la inmobiliaria, con Vinqulia",
    intro:
      "Así se ve la jornada de un asesor cuando la captación y el seguimiento viven en el CRM y no en su teléfono.",
    momentos: [
      {
        hora: "8:00",
        titulo: "Los leads que llegaron de noche",
        narrativa:
          "Mientras el equipo dormía entraron consultas desde el formulario de la web y desde el anuncio de la propiedad en renta.",
        conVinqulia:
          "Los contactos ya están creados con su origen anotado. El asesor abre una vista guardada de «nuevos sin contactar» y ve exactamente a quién le toca responder.",
      },
      {
        hora: "9:00",
        titulo: "Primer contacto por WhatsApp",
        narrativa:
          "Hay que responder rápido, porque quien pregunta está comparando opciones en este momento.",
        conVinqulia:
          "Escribe desde la ficha del interesado con la integración de WhatsApp y la conversación queda registrada como nota de tipo WhatsApp en su historial.",
      },
      {
        hora: "11:00",
        titulo: "Se agenda la visita",
        narrativa:
          "El interesado quiere ver el departamento el sábado por la mañana.",
        conVinqulia:
          "Mueve la oportunidad a «Visita agendada» y crea la tarea con la fecha y la hora; queda visible para el asesor y para el broker.",
      },
      {
        hora: "17:00",
        titulo: "Visita realizada",
        narrativa:
          "Termina la visita: le gustó el departamento pero le pareció caro el mantenimiento.",
        conVinqulia:
          "Registra la nota con la objeción concreta y programa el seguimiento a dos días. Si finalmente se pierde, ese motivo queda como motivo de pérdida.",
      },
      {
        hora: "18:30",
        titulo: "El broker revisa al equipo",
        narrativa:
          "Quiere saber cómo va el mes y quién tiene prospectos sin atender.",
        conVinqulia:
          "Abre el tablero: cuántos hay por etapa, cuánto suman las operaciones abiertas y en qué punto está cada asesor.",
      },
      {
        hora: "Fin de mes",
        titulo: "Qué se cerró y por qué se perdió",
        narrativa:
          "La junta con los socios necesita números, no impresiones.",
        conVinqulia:
          "Los informes muestran conversión del periodo, cierre por asesor y los motivos de pérdida más repetidos.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Leads que se reparten de forma improvisada por WhatsApp",
      solucion:
        "Cada contacto y cada oportunidad tienen un responsable, y las reglas automáticas pueden asignarlo al crearse",
      beneficio:
        "Todo prospecto tiene un dueño claro desde el primer minuto y nadie queda sin atender",
    },
    {
      problema: "Respuestas que tardan y prospectos que se van con otra oficina",
      solucion:
        "Formulario público en la web y WhatsApp desde la ficha, con el origen registrado",
      beneficio:
        "El contacto entra al sistema al instante y la respuesta se da con el historial a la vista",
    },
    {
      problema: "No se sabe en qué quedó cada interesado",
      solucion:
        "Notas tipificadas (llamada, WhatsApp, reunión) y tareas con fecha en la ficha",
      beneficio:
        "Cualquier asesor que retome la conversación entiende el caso sin preguntar a un compañero",
    },
    {
      problema: "Visitas que se agendan de memoria",
      solucion: "Tareas con fecha y hora dentro de la oportunidad, con su etapa",
      beneficio:
        "Las visitas de la semana están visibles y el seguimiento posterior no depende del recuerdo",
    },
    {
      problema: "El broker sin visibilidad del equipo",
      solucion: "Tablero compartido por etapas e informes por responsable",
      beneficio:
        "Se detecta a tiempo quién va cargado y quién tiene prospectos detenidos",
    },
    {
      problema: "Venta y renta mezcladas en la misma lista",
      solucion: "Varios embudos, cada uno con sus etapas y su ciclo",
      beneficio:
        "Cada negocio se mide con su propio proceso en lugar de promediarse en una lista común",
    },
    {
      problema: "Operaciones perdidas sin dejar aprendizaje",
      solucion: "Motivos de pérdida e informes de causas",
      beneficio:
        "La próxima conversación de precio o de financiamiento se prepara con lo que ya falló antes",
    },
  ],
  casosDeUso: [
    {
      titulo: "Reparto de leads entre asesores",
      texto:
        "Los contactos que entran por la web quedan asignados a un asesor —manual o por regla—, y el broker ve de un vistazo quién tiene prospectos sin atender.",
      funcionalidad:
        "Responsable en contactos y oportunidades, con automatización de asignación",
    },
    {
      titulo: "Seguimiento de visitas y confirmaciones",
      texto:
        "Cada visita es una tarea con fecha: se confirma el día antes y se registra el resultado después, para que el interesado no quede en el aire.",
      funcionalidad: "Tareas con vencimiento y notas tipificadas",
    },
    {
      titulo: "Venta y renta como dos negocios distintos",
      texto:
        "Dos embudos con etapas propias: lo que se mide en renta no es lo mismo que en venta, y mezclarlos oculta el desempeño de ambos.",
      funcionalidad: "Varios embudos con etapas independientes",
    },
    {
      titulo: "Zona, presupuesto y tipo de propiedad",
      texto:
        "Los criterios del interesado —zona, rango de presupuesto, número de recámaras— se guardan como campos propios de la oportunidad, así el filtro se hace por lo que la persona busca.",
      funcionalidad: "Campos personalizados de texto, número, fecha o lista",
    },
    {
      titulo: "Perseguir lo que se está enfriando",
      texto:
        "Una vista compartida con los prospectos sin contacto reciente convierte «hay que llamarlos» en una lista concreta de trabajo del día.",
      funcionalidad: "Vistas guardadas compartidas",
    },
    {
      titulo: "Cierre por asesor y causas de pérdida",
      texto:
        "El broker mide conversión y cierre por asesor, y revisa los motivos de pérdida más frecuentes para ajustar precio y argumentos.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
    {
      titulo: "Captar propietarios, no solo compradores",
      texto:
        "Un segundo formulario en la web —«vende tu propiedad»— crea el contacto del propietario con su historial, separado de los compradores por etiquetas o embudo propio.",
      funcionalidad: "Formularios públicos y etiquetas",
    },
  ],
  casoPractico: {
    escenario:
      "Inmobiliaria con 6 asesores, venta y renta en la misma cartera, alrededor de 40 consultas nuevas por semana.",
    inicial: [
      "Los leads de portales llegan al WhatsApp de quien los ve primero.",
      "No hay registro de cuántos prospectos se atendieron ni de cuántos se perdieron.",
      "Las visitas se agendan en la agenda personal de cada asesor.",
      "El broker pregunta cada lunes cuántas operaciones hay abiertas y obtiene respuestas distintas.",
    ],
    conVinqulia: [
      "Todo prospecto entra al sistema con su origen y su asesor asignado.",
      "El embudo muestra cuántos hay por etapa y cuánto suman las operaciones abiertas.",
      "Las visitas son tareas con fecha, visibles para el asesor y para el broker.",
      "El informe del periodo muestra conversión y cierre por asesor, con los motivos de pérdida registrados.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No afirmamos porcentajes de mejora medidos en clientes.",
  },
  paraQuien: {
    si: [
      "Inmobiliarias y desarrollos con equipo de 2 a 30 asesores.",
      "Quienes reciben consultas de portales, redes o formularios y hoy las reparten por WhatsApp.",
      "Oficinas que manejan venta y renta y necesitan medirlas por separado.",
      "Brokers que necesitan visibilidad del embudo y del desempeño por asesor.",
      "Equipos que trabajan en la calle y necesitan registrar desde el teléfono.",
    ],
    no: [
      "Si necesitas un catálogo de propiedades con fichas, fotos y portal público: Vinqulia no lo tiene.",
      "Si buscas publicación automática en portales inmobiliarios: hoy no existe.",
      "Si necesitas administración de contratos, escrituración o cálculo de comisiones: no forma parte del producto.",
      "Si eres asesor independiente sin equipo ni prospectos simultáneos, el valor de un CRM es limitado.",
    ],
  },
  beneficios: [
    {
      titulo: "Ningún prospecto sin dueño",
      resultado:
        "Cada contacto y cada operación tienen un asesor asignado y el broker lo ve en el tablero, así que el reparto deja de depender de quién conteste primero.",
    },
    {
      titulo: "Velocidad de respuesta como ventaja",
      resultado:
        "El formulario de la web crea el contacto al instante y el asesor responde desde la ficha por WhatsApp, con la conversación quedando registrada.",
    },
    {
      titulo: "Visitas que no se caen",
      resultado:
        "Las visitas viven como tareas con fecha: se confirman, se registran y dejan el seguimiento programado en el mismo lugar.",
    },
    {
      titulo: "Medición por asesor y por causa",
      resultado:
        "Conversión, cierre por asesor y motivos de pérdida permiten ajustar reparto de leads, argumentos y precios con evidencia del periodo.",
    },
    {
      titulo: "Fichas con los criterios del cliente",
      resultado:
        "Zona, presupuesto y tipo de propiedad como campos propios hacen que buscar en la base sea buscar por lo que la persona realmente quiere.",
    },
    {
      titulo: "La cartera queda en la oficina",
      resultado:
        "El historial de cada interesado vive en el CRM, no en el teléfono de un asesor: cuando alguien sale del equipo, la relación continúa.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Consultas repartidas entre el WhatsApp de cada asesor.",
      "Sin registro de origen ni de resultado de cada lead.",
      "Visitas agendadas en agendas personales.",
      "El broker sin datos: solo la suma de lo que cada uno recuerda.",
      "Operaciones perdidas sin causa documentada.",
    ],
    conVinqulia: [
      "Cada consulta entra al sistema con su origen y su asesor.",
      "Historial completo por interesado, con llamadas, WhatsApp y visitas.",
      "Visitas como tareas con fecha, visibles para todo el equipo.",
      "Tablero e informes por etapa, asesor y periodo.",
      "Motivo de pérdida registrado en cada operación caída.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Podemos usarlo para venta y renta al mismo tiempo?",
      respuesta:
        "Sí. Son dos embudos independientes, cada uno con sus etapas, para que el desempeño de venta no se mezcle con el de renta.",
    },
    {
      pregunta: "¿Cómo se reparten los leads que llegan de la web?",
      respuesta:
        "El formulario público crea el contacto automáticamente y una regla puede asignarle responsable al crearse. También se puede asignar a mano y reasignar cuando alguien está de vacaciones.",
    },
    {
      pregunta: "¿Sirve si no tengo catálogo de propiedades cargado?",
      respuesta:
        "Vinqulia no es un catálogo inmobiliario. La propiedad de interés se registra como campo de la oportunidad —con su zona, tipo y precio— y el seguimiento vive en la operación, no en una ficha de inmueble.",
    },
    {
      pregunta: "¿Los asesores pueden usarlo desde el celular en la calle?",
      respuesta:
        "Sí. La interfaz móvil permite consultar la cartera, registrar la nota de la visita y crear la siguiente tarea desde el teléfono.",
    },
    {
      pregunta: "¿Tenemos que dejar de usar WhatsApp como hoy?",
      respuesta:
        "No. Vinqulia se conecta con WhatsApp para enviar desde la ficha y dejar la conversación registrada. El cambio es que deja de ser información que vive solo en un teléfono.",
    },
    {
      pregunta: "¿Puedo saber qué asesor cierra más operaciones?",
      respuesta:
        "Sí: los informes muestran cierre por responsable y conversión del periodo, con los motivos de pérdida que se hayan registrado.",
    },
    {
      pregunta: "¿Se puede publicar automáticamente en portales?",
      respuesta:
        "No. Hoy no existe conexión con portales inmobiliarios; lo que sí puedes hacer es capturar en el CRM los leads que esos portales te envíen a tu web o a tu WhatsApp.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM conviene para una inmobiliaria?",
      respuesta:
        "Uno que aguante el ritmo del sector: captar de varios canales, repartir prospectos entre asesores, agendar visitas y medir cierre por asesor. Vinqulia se configura sobre ese proceso, con embudos distintos para venta y renta.",
    },
    {
      pregunta: "¿Cómo organizo los leads que llegan de los portales inmobiliarios?",
      respuesta:
        "Dirigiendo el tráfico del portal a un formulario de tu web y de ahí al CRM, donde cada consulta crea un contacto con su origen anotado y su asesor asignado. Así todas las consultas entran al mismo embudo en lugar de repartirse entre teléfonos.",
    },
    {
      pregunta: "¿Cómo asigno prospectos a varios asesores?",
      respuesta:
        "Cada contacto y cada oportunidad tienen un responsable. Puedes asignarlo a mano, reasignarlo cuando alguien se ausenta, y crear una regla que lo haga automáticamente al crearse el contacto.",
    },
    {
      pregunta: "¿Puedo llevar el seguimiento de las visitas a propiedades?",
      respuesta:
        "Sí. Cada visita se registra como tarea con fecha y hora dentro de la oportunidad, y después se anota su resultado y el seguimiento siguiente.",
    },
    {
      pregunta: "¿Se puede usar para venta y para renta a la vez?",
      respuesta:
        "Sí, con dos embudos independientes que comparten la misma base de contactos. Es la forma de que cada negocio tenga sus etapas y sus métricas.",
    },
    {
      pregunta: "¿Hay catálogo de propiedades o portal público para clientes?",
      respuesta:
        "No. Vinqulia no incluye catálogo de inmuebles ni portal público con fichas y fotos. Si lo necesitas, hoy sería un desarrollo aparte integrable por API.",
    },
    {
      pregunta: "¿Cómo mido el desempeño de cada asesor?",
      respuesta:
        "Con los informes de cierre por responsable y la conversión del periodo, más el tablero compartido donde se ve qué tiene abierto cada quien.",
    },
    {
      pregunta: "¿Qué pasa con los datos de los interesados si dejamos de usar el CRM?",
      respuesta:
        "Puedes exportar los contactos en CSV y consultar la información por la API. Los datos son de tu inmobiliaria, no un rehén del proveedor.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Catálogo de propiedades",
      texto:
        "Fichas de inmuebles con fotos, características y disponibilidad, y portal público para mostrarlas. Hoy no existe.",
    },
    {
      titulo: "Publicación automática en portales",
      texto:
        "Envío del inventario a portales inmobiliarios y recepción de sus leads. Hoy no existe; se puede abordar como integración a medida.",
    },
    {
      titulo: "Agenda sincronizada con calendario",
      texto:
        "Visitas sincronizadas con Google Calendar o Outlook. Hoy las tareas viven en el CRM, sin sincronización de dos vías.",
    },
    {
      titulo: "Comisiones y reparto",
      texto:
        "Cálculo de comisiones por operación y reparto entre asesores. Hoy no existe; el dato se puede anotar como campo, pero no se calcula.",
    },
    {
      titulo: "Firma electrónica y contratos",
      texto:
        "Generación y firma de contratos desde la operación. Hoy no existe.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Deja de perder interesados por no saber quién los atiende",
    subtitulo:
      "Cuéntanos cómo capta y reparte leads tu inmobiliaria —cuántos asesores, por dónde llegan, si manejas venta y renta— y te mostramos cómo se vería tu embudo en Vinqulia.",
    boton: "Quiero una demo para mi inmobiliaria",
  },
  seo: {
    keywordPrincipal: "CRM para inmobiliarias",
    keywordsSecundarias: [
      "software para inmobiliarias",
      "CRM inmobiliario México",
      "gestión de leads inmobiliarios",
      "CRM para asesores inmobiliarios",
      "control de prospectos inmobiliaria",
    ],
    longTail: [
      "cómo organizar los leads que llegan de portales inmobiliarios",
      "CRM para inmobiliaria con WhatsApp",
      "cómo asignar prospectos a varios asesores",
      "software para dar seguimiento a visitas inmobiliarias",
      "cómo medir el cierre por asesor en una inmobiliaria",
    ],
    terminosRelacionados: [
      "lead inmobiliario",
      "asesor inmobiliario",
      "broker",
      "captación de propiedades",
      "visita a propiedad",
      "venta y renta",
    ],
    intencionComercial:
      "Inmobiliarias que ya reciben más consultas de las que pueden atender ordenadamente y están comparando CRM para repartir leads y medir a su equipo. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Brokers y asesores que buscan cómo organizar los leads de portales, cómo dar seguimiento a visitas o cómo repartir prospectos con criterio. Lo atienden las secciones Problema, Un día en la operación y el futuro blog.",
    paginasFuturas: [
      "/guias/crm-para-inmobiliarias-como-elegir",
      "/soluciones/reparto-de-leads-entre-asesores",
      "/soluciones/seguimiento-de-visitas",
      "/comparativas/vinqulia-vs-excel-para-inmobiliarias",
      "/blog/como-atender-los-leads-de-portales-inmobiliarios",
    ],
  },
};

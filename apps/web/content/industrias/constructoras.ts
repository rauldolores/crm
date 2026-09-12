import type { Industria } from "./tipos";

/**
 * Constructoras, contratistas y proveedores de materiales.
 *
 * Cuarta industria. Aquí la venta es por obra o por proyecto: ciclo largo,
 * varios interlocutores en la misma empresa y una fecha estimada de cierre que
 * importa. Se apoya en funcionalidades verificadas: empresas con varios
 * contactos, fecha estimada de cierre de la oportunidad, campos
 * personalizados, notas con adjuntos, varios embudos e informes de pérdida.
 *
 * Lo que no existe —licitaciones, inventario, facturación, avance de obra— se
 * declara en oportunidadesFuturas.
 */
export const constructoras: Industria = {
  slug: "constructoras",
  nombre: "Constructoras y materiales",
  resumen:
    "Cotizaciones por obra con fecha estimada de cierre, varios contactos por empresa y seguimiento que no se pierde entre visitas.",
  icono: "HardHat",
  tablero: {
    titulo: "Obras y suministros",
    montoEnJuego: 9420000,
    columnas: [
      {
        titulo: "Cotización",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Obra Torre Norte",
            empresa: "Constructora Peña",
            monto: "$1,850,000",
            iniciales: "CP",
            color: "#e2766a",
            etiqueta: "Concreto",
          },
          {
            nombre: "Nave industrial",
            empresa: "Grupo Aldama",
            monto: "$640,000",
            iniciales: "GA",
            color: "#7d6ae2",
            etiqueta: "Acero",
          },
        ],
      },
      {
        titulo: "Revisión técnica",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Fraccionamiento Sur",
            empresa: "Desarrollos Vigía",
            monto: "$2,300,000",
            iniciales: "DV",
            color: "#3f8fd0",
            etiqueta: "Volumen",
          },
        ],
      },
      {
        titulo: "Negociación",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Ampliación bodega",
            empresa: "Logística RM",
            monto: "$980,000",
            iniciales: "LR",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Adjudicada",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Suministro fase 2",
            empresa: "Constructora Vela",
            monto: "$1,420,000",
            iniciales: "CV",
            color: "#3f8f7a",
            etiqueta: "Cierre 30 sep",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para constructoras y proveedores",
    titulo: "Cada obra tiene su comprador, su residente y su almacenista. Y ninguno de los tres es la misma persona a la que le cotizaste.",
    subtitulo:
      "Vinqulia organiza la venta por proyecto: la empresa constructora con todos sus contactos, cada cotización con su fecha estimada de cierre y el histórico de lo que se ofreció y a qué precio. Todo el equipo ve qué obras están abiertas y cuáles están por resolverse.",
    ctaPrincipal: "Quiero una demo para mi constructora",
    puntos: [
      "Varios contactos por empresa constructora",
      "Fecha estimada de cierre por obra",
      "Campos propios: tipo de obra y volumen",
      "Informes de conversión por vendedor",
    ],
  },
  problema: {
    titulo: "Cómo se vende hoy a una obra",
    intro:
      "En este negocio casi nunca se le vende a una persona: se le vende a una empresa donde cambia el interlocutor según la etapa. Si eso no está registrado, cada cotización empieza de nuevo.",
    puntos: [
      {
        titulo: "Cinco personas en la misma empresa y una sola carpeta",
        texto:
          "El comprador pide, el residente técnico revisa, el almacenista recibe y el director firma. Si todo vive en un contacto genérico, no se sabe con quién se habló ni qué se acordó.",
      },
      {
        titulo: "Cotizaciones que se revisan tres veces",
        texto:
          "Se cotiza, se ajustan volúmenes, se vuelve a cotizar. Sin un lugar donde queden las versiones, la última palabra la tiene el correo más reciente.",
      },
      {
        titulo: "La fecha en que se decide nadie la tiene anotada",
        texto:
          "Una obra arranca en una fecha concreta y la compra de materiales se decide antes. Si no está registrado cuándo, el seguimiento llega tarde.",
      },
      {
        titulo: "Las visitas a obra no dejan rastro",
        texto:
          "El vendedor va, habla con el residente, promete volver el jueves. Sin registro de la visita, el compromiso se queda en su memoria.",
      },
      {
        titulo: "La dirección no ve el embudo de obras",
        texto:
          "Saber cuánto hay cotizado y cuánto por adjudicar exige juntar los archivos de cada vendedor al final del mes.",
      },
      {
        titulo: "Se pierde por precio y no se sabe por qué más",
        texto:
          "Sin motivos de pérdida registrados, la empresa repite el mismo error de alcance o de condiciones en la siguiente licitación.",
      },
    ],
  },
  dia: {
    titulo: "Un día vendiendo a obras, con Vinqulia",
    intro:
      "La jornada de un vendedor técnico cuando la información de cada obra deja de estar repartida entre correos y carpetas.",
    momentos: [
      {
        hora: "8:30",
        titulo: "Preparar la visita a obra",
        narrativa:
          "Hay que ir a la Torre Norte a revisar el volumen que pidió el residente técnico.",
        conVinqulia:
          "Abre la empresa constructora y ve sus contactos, la cotización en curso y lo que se habló en la visita anterior, sin pedirle el archivo a nadie.",
      },
      {
        hora: "10:00",
        titulo: "La visita",
        narrativa:
          "El residente ajusta cantidades y pide revisar el precio por volumen.",
        conVinqulia:
          "Registra la nota de tipo Reunión con lo acordado y adjunta la foto de la lista de volúmenes que le entregaron.",
      },
      {
        hora: "12:00",
        titulo: "Nueva versión de la cotización",
        narrativa:
          "Se reenvía la propuesta con los volúmenes corregidos.",
        conVinqulia:
          "Mueve la oportunidad a «Revisión técnica» y actualiza el importe. La fecha estimada de cierre queda visible para todo el equipo.",
      },
      {
        hora: "16:00",
        titulo: "Seguimiento de lo cotizado",
        narrativa:
          "Hay tres cotizaciones de la semana pasada sin respuesta.",
        conVinqulia:
          "Una vista guardada de «cotizado sin respuesta» las lista; se hacen las llamadas y cada una deja su nota y su próxima tarea.",
      },
      {
        hora: "18:00",
        titulo: "Revisión con la dirección",
        narrativa:
          "Cuánto hay cotizado, cuánto en negociación y qué se adjudica este mes.",
        conVinqulia:
          "El tablero y los informes responden por etapa, por vendedor y por periodo, sin armar un reporte a mano.",
      },
      {
        hora: "Cierre del proyecto",
        titulo: "Por qué se ganó o se perdió una obra",
        narrativa:
          "Se adjudicó a otro proveedor y hay que entender la causa.",
        conVinqulia:
          "La oportunidad se marca como perdida con su motivo: precio, alcance, tiempos o competencia. Ese dato alimenta el informe de pérdidas.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Varios interlocutores por empresa sin registro de quién decide",
      solucion:
        "La empresa constructora como ficha central, con todos sus contactos y su responsable",
      beneficio:
        "Se sabe con quién se habló, quién revisa y quién firma, sin depender de la memoria del vendedor",
    },
    {
      problema: "Versiones de cotización que se pierden entre correos",
      solucion:
        "Notas con adjuntos y el importe actualizado en la oportunidad",
      beneficio:
        "El historial de lo ofrecido queda junto a la operación, con el archivo que respalda cada versión",
    },
    {
      problema: "Fechas de decisión que nadie tiene anotadas",
      solucion: "Fecha estimada de cierre en cada oportunidad",
      beneficio:
        "El seguimiento se programa con la fecha de la obra a la vista y no cuando ya se compró en otro lado",
    },
    {
      problema: "Visitas a obra que no dejan rastro",
      solucion: "Notas tipificadas (reunión, llamada) con fecha y autor",
      beneficio:
        "Cualquier compañero puede retomar la obra y saber qué se prometió en la última visita",
    },
    {
      problema: "Licitaciones y venta directa mezcladas",
      solucion: "Embudos separados, cada uno con sus etapas y su ciclo",
      beneficio:
        "Cada tipo de venta se mide con su propio proceso en lugar de promediarse",
    },
    {
      problema: "La dirección sin cifras del embudo",
      solucion: "Tablero por etapas e informes de conversión y cierre",
      beneficio:
        "La revisión mensual se hace sobre datos del periodo, no sobre archivos reunidos a última hora",
    },
    {
      problema: "Pérdidas que se repiten",
      solucion: "Motivo de pérdida obligatorio en cada operación caída",
      beneficio:
        "Se corrige el alcance, las condiciones o el precio con evidencia de lo que ha fallado antes",
    },
  ],
  casosDeUso: [
    {
      titulo: "Una empresa, varios interlocutores",
      texto:
        "La constructora es la ficha central: dentro viven el comprador, el residente técnico y el almacenista, cada uno con su teléfono y su correo, y con un responsable comercial asignado.",
      funcionalidad: "Empresas con varios contactos vinculados y responsable",
    },
    {
      titulo: "Cotizaciones por obra con fecha de decisión",
      texto:
        "Cada obra es una oportunidad con su importe y su fecha estimada de cierre, para programar el seguimiento antes de que se decida la compra.",
      funcionalidad: "Importe y fecha estimada de cierre en la oportunidad",
    },
    {
      titulo: "Licitaciones y venta directa por separado",
      texto:
        "Dos embudos con etapas distintas: una licitación pasa por bases, revisión técnica y adjudicación; una venta directa no necesita ese recorrido.",
      funcionalidad: "Varios embudos con etapas independientes",
    },
    {
      titulo: "Tipo de obra, volumen y condiciones",
      texto:
        "Tipo de proyecto, volumen estimado, condiciones de pago o crédito se registran como campos propios de la operación, no en el asunto de un correo.",
      funcionalidad: "Campos personalizados por tipo (texto, número, fecha, lista)",
    },
    {
      titulo: "Evidencia de la visita técnica",
      texto:
        "Las listas de volumen, planos o fotografías que se entregan en obra se adjuntan a la nota de la reunión, dentro de la misma operación.",
      funcionalidad: "Adjuntos en las notas del historial",
    },
    {
      titulo: "Perseguir lo cotizado sin respuesta",
      texto:
        "Una vista compartida con las cotizaciones que llevan días sin movimiento convierte la revisión del lunes en una lista concreta de llamadas.",
      funcionalidad: "Vistas guardadas compartidas",
    },
    {
      titulo: "Quién cierra y por qué se pierde",
      texto:
        "Conversión del periodo, cierre por vendedor y causas de pérdida, para ajustar precios y alcances con datos y no con impresiones.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Proveedor de materiales de construcción con 5 vendedores técnicos y alrededor de 30 obras activas al mismo tiempo.",
    inicial: [
      "Cada cotización vive en el correo del vendedor que la hizo.",
      "No hay forma de saber cuánto está cotizado ni cuándo se decide cada obra.",
      "Las visitas técnicas no se registran: solo existen en la memoria del vendedor.",
      "Cuando alguien se va, sus obras en curso quedan sin contexto para el resto.",
    ],
    conVinqulia: [
      "Cada constructora tiene su ficha con sus interlocutores y su vendedor asignado.",
      "Las oportunidades muestran importe y fecha estimada de cierre, por etapa.",
      "Las visitas y los acuerdos quedan como notas con sus adjuntos.",
      "El informe del periodo muestra conversión, cierre por vendedor y motivos de pérdida.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No presentamos porcentajes de ahorro medidos.",
  },
  paraQuien: {
    si: [
      "Constructoras, contratistas y proveedores de materiales con venta por proyecto.",
      "Equipos comerciales de 3 a 50 personas que visitan obra y cotizan por volumen.",
      "Negocios donde la decisión de compra la toman varias personas de la misma empresa.",
      "Quienes manejan licitación pública o privada además de venta directa.",
      "Empresas que necesitan saber cuánto hay cotizado y cuándo se resuelve cada obra.",
    ],
    no: [
      "Si buscas control de inventario, almacén o existencias: Vinqulia no es un ERP.",
      "Si necesitas facturación, timbrado o control de obra y avance físico: no forma parte del producto.",
      "Si tu venta es puramente transaccional de mostrador, sin ciclo de proyecto, el valor de un CRM es menor.",
      "Si necesitas gestión de licitaciones públicas con expediente documental completo: hoy no existe.",
    ],
  },
  beneficios: [
    {
      titulo: "La empresa por encima de la persona",
      resultado:
        "Cuando el comprador cambia de trabajo o de puesto, la relación con la constructora permanece en el CRM con todo su historial.",
    },
    {
      titulo: "Seguimiento atado a la fecha de decisión",
      resultado:
        "Con la fecha estimada de cierre en cada obra, el equipo prioriza las que se resuelven primero en lugar de trabajar por orden de llegada.",
    },
    {
      titulo: "El contexto técnico queda en la operación",
      resultado:
        "Acuerdos, volúmenes y documentos adjuntos viven juntos, así que quien retome la cuenta no arranca preguntando qué se cotizó.",
    },
    {
      titulo: "Separar licitación de venta directa",
      resultado:
        "Cada tipo de venta se mide con su propio proceso, lo que evita que una licitación larga distorsione la tasa de cierre de la venta directa.",
    },
    {
      titulo: "Aprender de las obras perdidas",
      resultado:
        "Los motivos de pérdida registrados muestran si el problema es precio, alcance o tiempos, y permiten corregir la próxima propuesta.",
    },
    {
      titulo: "Configuración sin desarrollo",
      resultado:
        "Etapas, embudos, campos y moneda se ajustan desde la aplicación: cambiar el proceso de cotización no exige un proyecto técnico.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Carpetas y correos por obra, cada una con su versión de la cotización.",
      "Un contacto genérico por empresa, sin saber quién decide.",
      "Fechas de arranque y de compra que nadie tiene anotadas.",
      "Visitas técnicas sin registro.",
      "Reporte mensual armado juntando archivos.",
    ],
    conVinqulia: [
      "Cada obra como oportunidad, con su importe y su fecha estimada de cierre.",
      "La constructora con todos sus interlocutores y su responsable comercial.",
      "Seguimiento programado con la fecha de decisión a la vista.",
      "Visitas registradas como notas, con sus adjuntos.",
      "Embudo e informes consultables en pantalla, actualizados.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Podemos guardar planos, listas de volumen o cotizaciones en PDF?",
      respuesta:
        "Sí, como adjuntos dentro de las notas del historial, junto al acuerdo al que corresponden. No es un gestor documental con control de versiones ni un repositorio de planos.",
    },
    {
      pregunta: "¿Cómo llevamos varias personas de la misma constructora?",
      respuesta:
        "La empresa es la ficha central y dentro se registran todos sus contactos —comprador, residente, almacén— cada uno con sus datos. La operación queda vinculada a la empresa y a su responsable.",
    },
    {
      pregunta: "¿Sirve para licitaciones y para venta directa?",
      respuesta:
        "Sí, con embudos separados: cada uno con sus etapas. Así la licitación tiene su recorrido propio y la venta directa el suyo, y ambas se miden por separado.",
    },
    {
      pregunta: "¿Se puede ver cuánto está cotizado y cuándo se resuelve?",
      respuesta:
        "Cada oportunidad tiene importe y fecha estimada de cierre. El tablero muestra el dinero en juego por etapa, y la fecha permite ordenar el seguimiento por urgencia.",
    },
    {
      pregunta: "¿Los vendedores pueden registrar la visita desde la obra?",
      respuesta:
        "Sí. La interfaz móvil permite consultar la ficha, registrar la nota con adjuntos y crear la siguiente tarea desde el teléfono.",
    },
    {
      pregunta: "¿Lleva inventario o control de existencias?",
      respuesta:
        "No. Vinqulia es un CRM: gestiona la relación y el proceso de venta, no el almacén. Si necesitas inventario, se integra con tu sistema actual o se aborda como desarrollo aparte.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM le conviene a una constructora o proveedor de materiales?",
      respuesta:
        "Uno que entienda venta por proyecto: empresas con varios interlocutores, oportunidades con importe y fecha estimada de cierre, seguimiento de visitas técnicas e informes de conversión por vendedor. Eso es lo que Vinqulia resuelve.",
    },
    {
      pregunta: "¿Cómo doy seguimiento a una cotización de obra?",
      respuesta:
        "La cotización vive como oportunidad con su importe, su etapa y su fecha estimada de cierre. Cada contacto con el cliente deja una nota y programa la siguiente tarea, así nada queda esperando a que alguien se acuerde.",
    },
    {
      pregunta: "¿Puedo registrar a varios contactos de la misma empresa constructora?",
      respuesta:
        "Sí. La empresa es la ficha central y admite todos los contactos que necesites —comprador, residente técnico, almacén, dirección— cada uno con sus propios datos.",
    },
    {
      pregunta: "¿Se puede manejar licitaciones y venta directa en el mismo CRM?",
      respuesta:
        "Sí, en embudos distintos con etapas propias. Eso permite medir la tasa de cierre de cada tipo de venta sin mezclarlas.",
    },
    {
      pregunta: "¿Puedo adjuntar archivos a una operación?",
      respuesta:
        "Sí, adjuntando archivos a las notas del historial: listas de volumen, fotografías de obra o documentos que respalden lo acordado en una visita.",
    },
    {
      pregunta: "¿Cómo sé por qué se pierden las obras?",
      respuesta:
        "Cada oportunidad perdida se cierra con un motivo —precio, alcance, tiempos, competencia— y el informe de pérdidas muestra cuáles se repiten más en el periodo.",
    },
    {
      pregunta: "¿Funciona si varios vendedores cubren zonas distintas?",
      respuesta:
        "Sí. Cada cliente y cada oportunidad tienen un responsable, y se pueden crear vistas guardadas por zona, por vendedor o por tipo de obra para que cada quien trabaje su lista.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Inventario y almacén",
      texto:
        "Existencias, entradas y salidas por almacén o por obra. Hoy no existe en el producto.",
    },
    {
      titulo: "Gestión de licitaciones y expedientes",
      texto:
        "Seguimiento documental de bases, requisitos y entregables de una licitación pública. Hoy no existe.",
    },
    {
      titulo: "Facturación y control de obra",
      texto:
        "Emisión de facturas, estimaciones y avance físico de obra. Hoy no existe; puede abordarse como integración con tu sistema de facturación o de obra.",
    },
    {
      titulo: "Precios por volumen y listas dinámicas",
      texto:
        "Cálculo automático de precio según volumen solicitado. Hoy el precio se guarda en la operación, pero no se calcula por reglas de volumen.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Que ninguna obra se decida sin que tu equipo se entere a tiempo",
    subtitulo:
      "Cuéntanos cómo cotizan tu equipo —cuántos vendedores, qué tipo de obras y con cuántos interlocutores por empresa— y te mostramos cómo se vería tu embudo de proyectos en Vinqulia.",
    boton: "Quiero una demo para mi constructora",
  },
  seo: {
    keywordPrincipal: "CRM para constructoras",
    keywordsSecundarias: [
      "software para proveedores de materiales de construcción",
      "CRM para contratistas",
      "seguimiento de cotizaciones de obra",
      "CRM para ventas por proyecto",
      "control de oportunidades de construcción",
    ],
    longTail: [
      "cómo dar seguimiento a cotizaciones de materiales de construcción",
      "software para constructoras con varios clientes por obra",
      "CRM para licitaciones y venta directa",
      "cómo saber cuánto está cotizado en una constructora",
      "registrar visitas a obra en un CRM",
    ],
    terminosRelacionados: [
      "venta por proyecto",
      "residente de obra",
      "lista de volúmenes",
      "adjudicación",
      "suministro de materiales",
      "ciclo de venta largo",
    ],
    intencionComercial:
      "Proveedores y constructoras con varias obras abiertas que necesitan controlar cotizaciones, interlocutores y fechas de decisión, y están comparando CRM para lograrlo. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Quien busca cómo ordenar cotizaciones de obra, cómo registrar visitas técnicas o cómo medir el cierre por vendedor en el sector construcción. Lo cubren las secciones Problema y Un día en la operación.",
    paginasFuturas: [
      "/guias/crm-para-constructoras-como-elegir",
      "/soluciones/seguimiento-de-cotizaciones-de-obra",
      "/soluciones/multiples-contactos-por-empresa",
      "/comparativas/vinqulia-vs-excel-para-proveedores-de-materiales",
      "/blog/como-evitar-perder-cotizaciones-de-obra",
    ],
  },
};

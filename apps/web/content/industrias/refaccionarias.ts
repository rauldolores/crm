import type { Industria } from "./tipos";

/**
 * Refaccionarias y autopartes.
 *
 * Octava industria. Aquí conviven dos ventas muy distintas: el mostrador, que
 * es inmediato, y el taller, que es una relación recurrente con crédito y
 * pedidos por WhatsApp. El contenido se centra en la segunda, que es donde un
 * CRM aporta: cartera de talleres con responsable, campos propios (marcas que
 * atiende, número de parte habitual, condiciones), tareas de recompra,
 * WhatsApp en el historial e informes de recompra y pérdida.
 *
 * Lo que no existe —catálogo de partes, búsqueda por VIN, inventario, crédito
 * y cobranza, facturación— se declara en oportunidadesFuturas.
 */
export const refaccionarias: Industria = {
  slug: "refaccionarias",
  nombre: "Refaccionarias y autopartes",
  resumen:
    "Talleres con responsable, recompra programada y pedidos de WhatsApp que dejan de perderse en el chat.",
  icono: "Car",
  tablero: {
    titulo: "Pedidos de talleres",
    montoEnJuego: 486000,
    columnas: [
      {
        titulo: "Cotización",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Juego de balatas",
            empresa: "Taller Ramírez",
            monto: "$4,800",
            iniciales: "TR",
            color: "#e2766a",
            etiqueta: "WhatsApp",
          },
          {
            nombre: "Kit de clutch",
            empresa: "Servicio Méndez",
            monto: "$12,400",
            iniciales: "SM",
            color: "#7d6ae2",
            etiqueta: "Pedido",
          },
        ],
      },
      {
        titulo: "Confirmado",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Filtros y aceite",
            empresa: "Taller La Curva",
            monto: "$3,200",
            iniciales: "LC",
            color: "#3f8fd0",
            etiqueta: "Recurrente",
          },
        ],
      },
      {
        titulo: "Listo para entrega",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Suspensión completa",
            empresa: "Automotriz Vega",
            monto: "$18,900",
            iniciales: "AV",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Pedido recurrente",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Suministro mensual",
            empresa: "Taller El Águila",
            monto: "$9,600",
            iniciales: "EA",
            color: "#3f8f7a",
            etiqueta: "Cada 30 días",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para refaccionarias",
    titulo: "El mostrador se atiende solo. El taller que compraba cada mes y dejó de venir es el que nadie nota.",
    subtitulo:
      "Vinqulia concentra tu cartera de talleres y clientes de mayoreo: quién compra qué, cada cuánto suele pedir, qué marcas atiende y con qué condiciones. Con los pedidos de WhatsApp registrados, la recompra programada y el seguimiento en manos de una persona.",
    ctaPrincipal: "Quiero una demo para mi refaccionaria",
    puntos: [
      "Cartera de talleres con responsable",
      "Pedidos de WhatsApp registrados",
      "Recompra programada por cliente",
      "Marcas y condiciones como campos propios",
    ],
  },
  problema: {
    titulo: "Cómo se atiende hoy la venta a talleres",
    intro:
      "En una refaccionaria el volumen del mostrador tapa todo lo demás. La relación con los talleres, que es la que sostiene el mes, termina dependiendo de quién contestó el teléfono.",
    puntos: [
      {
        titulo: "Los pedidos llegan por WhatsApp y ahí se quedan",
        texto:
          "El mecánico manda la lista de lo que necesita, a veces con foto del número de parte. Se surte y se cobra, pero no queda registro de quién pidió qué ni de cada cuánto lo pide.",
      },
      {
        titulo: "La cartera de talleres no está en ningún sistema",
        texto:
          "Cada vendedor de mostrador conoce a sus talleres de memoria. Cuando falta o cambia de turno, el cliente pregunta y nadie sabe qué condición tenía ni qué le surtieron la última vez.",
      },
      {
        titulo: "Los talleres que dejan de comprar no se detectan",
        texto:
          "Un taller que pedía cada tres semanas y lleva dos meses sin aparecer simplemente desaparece del radar, y no se enteran hasta que ya se surte en otro lado.",
      },
      {
        titulo: "No se sabe qué marcas atiende cada taller",
        texto:
          "Ofrecer una refacción de la marca equivocada es perder la venta. Sin registro de qué autos trabaja cada taller, cada cotización empieza con las mismas preguntas.",
      },
      {
        titulo: "El crédito informal se maneja de memoria",
        texto:
          "Quién paga de contado, quién a ocho días y quién está atrasado vive en una libreta o en la cabeza del dueño, no en la ficha del cliente.",
      },
      {
        titulo: "Sin visibilidad de qué talleres sostienen el negocio",
        texto:
          "Saber cuáles son las cuentas que más compran y cuáles están cayendo exige revisar tickets de papel, si es que se conservan.",
      },
    ],
  },
  dia: {
    titulo: "Un día en la refaccionaria, con Vinqulia",
    intro:
      "La jornada del área de mostrador y de venta a talleres cuando los pedidos recurrentes dejan de ser un chat sin memoria.",
    momentos: [
      {
        hora: "8:30",
        titulo: "Los pedidos que llegaron anoche",
        narrativa:
          "Tres talleres mandaron su lista por WhatsApp después del cierre, con fotos de los números de parte.",
        conVinqulia:
          "Cada pedido se registra en la ficha del taller: se envía el WhatsApp desde el CRM y la conversación queda como nota de tipo WhatsApp en su historial.",
      },
      {
        hora: "10:00",
        titulo: "Cotización de un pedido grande",
        narrativa:
          "Un taller pregunta por un juego de suspensión y pide precio para decidir.",
        conVinqulia:
          "Se crea la oportunidad con su importe y una tarea de seguimiento para el día siguiente; si el taller no confirma, la tarea sigue visible.",
      },
      {
        hora: "12:00",
        titulo: "Pedido confirmado",
        narrativa:
          "El taller aprueba la compra y hay que surtir.",
        conVinqulia:
          "La oportunidad pasa a «Listo para entrega»: el pedido deja de ser un mensaje suelto y queda con su etapa y su importe.",
      },
      {
        hora: "14:00",
        titulo: "Revisar quién dejó de comprar",
        narrativa:
          "El encargado quiere saber qué talleres bajaron su ritmo antes de que se pierdan.",
        conVinqulia:
          "Una vista guardada lista los clientes sin actividad reciente; se llama a cada uno y la llamada deja nota y próxima tarea.",
      },
      {
        hora: "16:00",
        titulo: "Cliente nuevo desde la web",
        narrativa:
          "Llegó una consulta por el formulario del sitio buscando surtido para un taller nuevo.",
        conVinqulia:
          "El contactó ya está creado con su historial; se le asigna un responsable y se le atiende como a cualquier cuenta.",
      },
      {
        hora: "Fin de mes",
        titulo: "Qué talleres sostienen la venta",
        narrativa:
          "El dueño quiere saber qué cuentas crecieron y cuáles se están perdiendo.",
        conVinqulia:
          "Los informes muestran conversión del periodo, cierre por responsable y motivos de pérdida sobre las oportunidades registradas.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Pedidos de WhatsApp que no dejan historial",
      solucion:
        "Envío de WhatsApp desde la ficha y la conversación guardada como nota del cliente",
      beneficio:
        "Se sabe qué pidió cada taller, cuándo y en qué quedó, sin depender del teléfono de quien atendió",
    },
    {
      problema: "Cartera de talleres que solo existe en la memoria",
      solucion:
        "Clientes y empresas con responsable asignado y su historial completo",
      beneficio:
        "Cualquier vendedor puede atender a un taller aunque no sea su cliente habitual",
    },
    {
      problema: "Talleres que dejan de comprar sin que nadie lo note",
      solucion:
        "Vistas guardadas por última actividad y tareas de reactivación",
      beneficio:
        "La cuenta que baja su ritmo se detecta a tiempo, cuando todavía se puede recuperar",
    },
    {
      problema: "Ofrecer refacciones de la marca equivocada",
      solucion:
        "Campos personalizados: marcas que atiende el taller, tipo de vehículo, número de parte habitual",
      beneficio:
        "La cotización parte de lo que el taller realmente trabaja, sin repetir las mismas preguntas cada vez",
    },
    {
      problema: "Crédito y condiciones manejados de memoria",
      solucion:
        "Condiciones de pago y crédito registradas como campos de la ficha del cliente",
      beneficio:
        "Quien atienda la cuenta ve a qué se comprometió el cliente, sin preguntar al dueño",
    },
    {
      problema: "Recompra que se descubre cuando el cliente ya no aparece",
      solucion:
        "Tareas de reposición con fecha y reglas que las crean al cerrar una operación",
      beneficio:
        "El equipo contacta al taller en su ritmo habitual en lugar de esperar a que llegue por su cuenta",
    },
    {
      problema: "Sin visibilidad de qué cuentas sostienen el negocio",
      solucion: "Tablero por etapas e informes de cierre y pérdida",
      beneficio:
        "El dueño ve qué talleres crecen y cuáles se están cayendo antes de perderlos",
    },
  ],
  casosDeUso: [
    {
      titulo: "Cartera de talleres con responsable",
      texto:
        "Cada taller es una cuenta con su contacto, su responsable y su historial, para que la relación no dependa de quién esté en el mostrador ese día.",
      funcionalidad: "Contactos y empresas con responsable asignado",
    },
    {
      titulo: "Pedidos por WhatsApp con registro",
      texto:
        "El pedido se envía desde la ficha del taller y la conversación queda como nota, así la lista de refacciones tiene antecedente en el sistema.",
      funcionalidad: "Integración de WhatsApp y notas tipificadas",
    },
    {
      titulo: "Marcas y condiciones por cliente",
      texto:
        "Las marcas que atiende cada taller, su tipo de vehículo habitual y sus condiciones de pago se guardan como campos propios de la cuenta.",
      funcionalidad: "Campos personalizados de texto, número y lista",
    },
    {
      titulo: "Recompra y pedidos recurrentes",
      texto:
        "Un taller que compra cada mes se atiende con tarea programada; una regla puede crear la siguiente tarea al cerrar el pedido.",
      funcionalidad: "Tareas con vencimiento y automatizaciones por etapa",
    },
    {
      titulo: "Recuperar al taller que se enfrió",
      texto:
        "Una vista compartida con los clientes sin actividad reciente convierte la revisión semanal en una lista concreta de llamadas y mensajes.",
      funcionalidad: "Vistas guardadas compartidas",
    },
    {
      titulo: "Cotizaciones grandes con seguimiento",
      texto:
        "Un pedido de suspensión o clutch es una oportunidad con importe y seguimiento, no un mensaje que se pierde entre conversaciones.",
      funcionalidad: "Oportunidades con importe, etapas y tareas",
    },
    {
      titulo: "Consulta nueva desde la web",
      texto:
        "El formulario del sitio crea el contacto del taller nuevo con su historial, listo para asignarle responsable.",
      funcionalidad: "Formularios públicos que crean contactos",
    },
  ],
  casoPractico: {
    escenario:
      "Refaccionaria con 2 sucursales, 4 personas en mostrador y alrededor de 90 talleres como clientes recurrentes.",
    inicial: [
      "Los pedidos llegan por WhatsApp y solo quedan en el teléfono que atendió.",
      "Cada vendedor conoce a sus talleres de memoria, sin ficha ni antecedente.",
      "No hay aviso de que un taller lleva semanas sin comprar.",
      "Las condiciones de crédito se manejan en una libreta.",
    ],
    conVinqulia: [
      "Cada taller es una cuenta con su contacto, su responsable y su historial de pedidos.",
      "Los pedidos por WhatsApp quedan registrados como nota en la ficha.",
      "Una vista de clientes sin actividad reciente alimenta la reactivación semanal.",
      "Marcas que atiende, tipo de vehículo y condiciones de pago quedan como campos de la cuenta.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No presentamos porcentajes de mejora medidos.",
  },
  paraQuien: {
    si: [
      "Refaccionarias y distribuidores de autopartes con cartera de talleres o clientes de mayoreo.",
      "Negocios donde una parte importante de la venta es recurrente y se coordina por WhatsApp.",
      "Quienes necesitan registrar marcas, tipos de vehículo y condiciones de cada cliente.",
      "Refaccionarias con varias sucursales que quieren una sola cartera compartida.",
      "Dueños que quieren saber qué talleres sostienen el negocio y cuáles están cayendo.",
    ],
    no: [
      "Si buscas catálogo de partes con números, equivalencias o búsqueda por VIN: Vinqulia no lo tiene.",
      "Si necesitas control de inventario y existencias por almacén: no forma parte del producto.",
      "Si necesitas crédito, cobranza o estados de cuenta: hoy no existe; el dato se registra, pero no se gestiona.",
      "Si tu venta es casi toda de mostrador, sin cartera que dar seguimiento, el valor de un CRM es bajo.",
    ],
  },
  beneficios: [
    {
      titulo: "La cartera de talleres deja de ser personal",
      resultado:
        "Cada cuenta tiene responsable e historial, así que el conocimiento de quién compra qué se queda en el negocio y no en la memoria de un vendedor.",
    },
    {
      titulo: "Los pedidos recurrentes se anticipan",
      resultado:
        "Con tareas de reposición programadas, el equipo contacta al taller en su ritmo habitual en lugar de esperar a que llegue por su cuenta.",
    },
    {
      titulo: "Cotizar deja de requerir las mismas preguntas",
      resultado:
        "Las marcas que atiende el taller y su tipo de vehículo quedan registrados, así la oferta parte de lo que realmente trabaja el cliente.",
    },
    {
      titulo: "El crédito informal queda por escrito",
      resultado:
        "Las condiciones acordadas con cada cuenta quedan visibles para todo el equipo, sin depender de una libreta o de la memoria del dueño.",
    },
    {
      titulo: "Se detecta la caída antes de perder la cuenta",
      resultado:
        "Las vistas de clientes sin actividad reciente permiten llamar al taller que bajó su ritmo cuando todavía se puede recuperar.",
    },
    {
      titulo: "Saber qué cuentas sostienen el negocio",
      resultado:
        "El tablero y los informes muestran qué talleres están activos y cuánto representan, en lugar de depender de tickets de papel.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Pedidos por WhatsApp que solo viven en el teléfono de turno.",
      "Cartera de talleres conocida de memoria por cada vendedor.",
      "Sin aviso de que un taller dejó de comprar.",
      "Crédito y condiciones en una libreta.",
      "Sin dato de qué cuentas crecen y cuáles caen.",
    ],
    conVinqulia: [
      "Cada pedido registrado en la ficha del taller, con su conversación.",
      "Cartera compartida con responsable e historial por cuenta.",
      "Reactivación semanal desde una vista de clientes inactivos.",
      "Condiciones y marcas como campos de la ficha.",
      "Tablero e informes de conversión, cierre y pérdida.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Tiene catálogo de refacciones o búsqueda por número de parte?",
      respuesta:
        "No. Vinqulia no es un catálogo de autopartes. Lo que puedes hacer es registrar en la ficha del taller el número de parte o la referencia habitual, para tenerlo a mano al cotizar.",
    },
    {
      pregunta: "¿Lleva inventario o existencias?",
      respuesta:
        "No. El control de existencias pertenece a tu sistema de inventario o a tu ERP. Vinqulia lleva la relación comercial: quién compra, qué pide y cada cuánto.",
    },
    {
      pregunta: "¿Cómo registro los pedidos que me llegan por WhatsApp?",
      respuesta:
        "Enviando el mensaje desde la ficha del taller con la integración de WhatsApp, de modo que la conversación queda como nota en su historial, junto al resto de su actividad.",
    },
    {
      pregunta: "¿Puedo saber qué talleres llevan tiempo sin comprar?",
      respuesta:
        "Sí. Una vista guardada filtra por última actividad y muestra los clientes sin movimiento reciente, que es justo la lista de reactivación de la semana.",
    },
    {
      pregunta: "¿Sirve para dos sucursales?",
      respuesta:
        "Sí. Puedes usar una sola base compartida y distinguir sucursal con campos propios, o trabajar por organizaciones separadas si cada sucursal opera como negocio independiente.",
    },
    {
      pregunta: "¿Lleva el control de crédito y cobranza?",
      respuesta:
        "No. Puedes registrar las condiciones de pago acordadas con cada cliente, pero el CRM no calcula saldos ni da seguimiento a cobranza. Eso pertenece a tu sistema de facturación o de cartera.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM le conviene a una refaccionaria?",
      respuesta:
        "Uno que entienda la venta recurrente a talleres: cartera con responsable, pedidos por WhatsApp registrados, datos del cliente como marcas y condiciones, y aviso cuando un cliente deja de comprar. Eso es lo que Vinqulia resuelve.",
    },
    {
      pregunta: "¿Cómo organizo los pedidos que me llegan por WhatsApp?",
      respuesta:
        "Enviando el pedido desde la ficha del cliente y dejando la conversación como nota. Así el pedido queda con antecedente y se puede consultar qué se surtió y cuándo.",
    },
    {
      pregunta: "¿Cómo sé qué talleres dejaron de comprarme?",
      respuesta:
        "Con una vista guardada que ordena por última actividad: los clientes sin movimiento reciente aparecen juntos y se pueden atender en una sola ronda de llamadas o mensajes.",
    },
    {
      pregunta: "¿Puedo registrar las marcas que atiende cada taller?",
      respuesta:
        "Sí, con campos personalizados en la ficha del cliente: marcas que trabaja, tipo de vehículo habitual y las refacciones que pide con más frecuencia.",
    },
    {
      pregunta: "¿Sirve para coordinar varias sucursales?",
      respuesta:
        "Sí. La cartera puede ser compartida entre sucursales, con campos que indiquen el origen, o separarse por organizaciones si cada punto opera de forma independiente.",
    },
    {
      pregunta: "¿Se puede programar el recordatorio de recompra?",
      respuesta:
        "Sí, con tareas con fecha y reglas que se disparan al cerrar una etapa o crear una oportunidad. Así el aviso de reposición no depende de que alguien se acuerde.",
    },
    {
      pregunta: "¿Se integra con mi sistema de inventario o facturación?",
      respuesta:
        "Puede integrarse por API REST y webhooks. El CRM no reemplaza tu inventario ni tu facturación: se ocupa de la relación con el cliente y del seguimiento comercial.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Catálogo de refacciones",
      texto:
        "Productos con número de parte, equivalencias y compatibilidad por vehículo. Hoy no existe.",
    },
    {
      titulo: "Búsqueda por VIN o por vehículo",
      texto:
        "Identificación del vehículo para sugerir la refacción correcta. Hoy no existe.",
    },
    {
      titulo: "Inventario y existencias",
      texto:
        "Control de stock por almacén y sucursal con entradas y salidas. Hoy no existe en el producto.",
    },
    {
      titulo: "Crédito y cobranza",
      texto:
        "Saldos por cliente, límites de crédito y estados de cuenta. Hoy no existe; se puede abordar como integración con tu sistema de cartera.",
    },
    {
      titulo: "Pedidos en línea para talleres",
      texto:
        "Portal donde el taller consulta disponibilidad y levanta su pedido. Hoy lo más cercano es el formulario público, que crea el contacto pero no levanta pedidos.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Deja de perder talleres por no saber que dejaron de comprar",
    subtitulo:
      "Cuéntanos cómo vendes hoy —cuántos talleres atiendes, por dónde llegan los pedidos y cómo llevas las condiciones de cada cliente— y te mostramos cómo se vería tu cartera en Vinqulia.",
    boton: "Quiero una demo para mi refaccionaria",
  },
  seo: {
    keywordPrincipal: "CRM para refaccionarias",
    keywordsSecundarias: [
      "CRM para autopartes",
      "software para refaccionarias",
      "control de clientes taller",
      "CRM para distribución de autopartes",
      "seguimiento de pedidos de refacciones",
    ],
    longTail: [
      "cómo saber qué talleres dejaron de comprarme",
      "software para llevar la cartera de talleres de una refaccionaria",
      "cómo registrar pedidos de refacciones que llegan por WhatsApp",
      "CRM para refaccionaria con varias sucursales",
      "cómo programar la recompra de un taller",
    ],
    terminosRelacionados: [
      "taller mecánico",
      "mayoreo de autopartes",
      "número de parte",
      "recompra",
      "cartera de clientes",
      "condiciones de crédito",
    ],
    intencionComercial:
      "Refaccionarias con cartera de talleres que necesitan ordenar pedidos, recuperar clientes inactivos y medir su venta recurrente. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Dueños y encargados que buscan cómo organizar los pedidos por WhatsApp, cómo saber qué clientes dejaron de comprar o cómo registrar las condiciones de cada taller. Lo cubren las secciones Problema y Un día en la operación.",
    paginasFuturas: [
      "/guias/crm-para-refaccionarias-como-elegir",
      "/soluciones/reactivacion-de-talleres",
      "/soluciones/seguimiento-de-pedidos-recurrentes",
      "/comparativas/vinqulia-vs-libreta-de-clientes",
      "/blog/como-recuperar-un-taller-que-dejo-de-comprar",
    ],
  },
};

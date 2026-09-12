import type { Industria } from "./tipos";

/**
 * Manufactura e industria.
 *
 * Quinta industria. El negocio aquí no es captar: es no perder de vista a las
 * cuentas que ya compran. Se apoya en funcionalidades verificadas: empresas
 * con varios interlocutores, campos personalizados para especificaciones,
 * tareas y automatizaciones para la recompra, tickets ligados a contacto y
 * empresa, adjuntos en notas e informes de conversión y pérdida.
 *
 * Lo que no existe —inventario, planeación de producción, logística de
 * entregas, expediente de calidad con certificados— se declara aparte.
 */
export const manufactura: Industria = {
  slug: "manufactura",
  nombre: "Manufactura e industria",
  resumen:
    "Cuentas clave con responsable, reposición programada y reclamos de calidad con historial.",
  icono: "Factory",
  tablero: {
    titulo: "Cuentas y requisiciones",
    montoEnJuego: 3260000,
    columnas: [
      {
        titulo: "Requisición recibida",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Requisición 4471",
            empresa: "Autopartes Méndez",
            monto: "$420,000",
            iniciales: "AM",
            color: "#e2766a",
            etiqueta: "Acero",
          },
          {
            nombre: "Reposición trimestral",
            empresa: "Envases del Bajío",
            monto: "$185,000",
            iniciales: "EB",
            color: "#7d6ae2",
            etiqueta: "Insumo",
          },
        ],
      },
      {
        titulo: "Muestra en revisión",
        color: "bg-sky-400",
        tarjetas: [
          {
            nombre: "Prueba de resistencia",
            empresa: "Grupo Selva",
            monto: "$310,000",
            iniciales: "GS",
            color: "#3f8fd0",
            etiqueta: "Ingeniería",
          },
        ],
      },
      {
        titulo: "Negociación",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Contrato anual",
            empresa: "Cementos Vela",
            monto: "$980,000",
            iniciales: "CV",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Cuenta activa",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Suministro mensual",
            empresa: "Herramental Norte",
            monto: "$265,000",
            iniciales: "HN",
            color: "#3f8f7a",
            etiqueta: "Recurrente",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para manufactura e industria",
    titulo: "Tus cuentas clave compran cada mes. Perder de vista a una no se nota hasta que ya compró con otro proveedor.",
    subtitulo:
      "Vinqulia concentra la relación con clientes industriales y distribuidores: quién decide, qué especificación manejan, cuándo suelen reponer y qué quedó pendiente de la última visita. Con seguimiento, tickets de calidad y el historial de cada planta en un solo lugar.",
    ctaPrincipal: "Quiero una demo para mi empresa industrial",
    puntos: [
      "Cuentas clave con responsable",
      "Especificaciones y volúmenes como campos propios",
      "Reposición y recompra con tareas",
      "Reclamos de calidad con historial",
    ],
  },
  problema: {
    titulo: "Cómo se administra hoy la cartera industrial",
    intro:
      "En manufactura el cliente no se conquista una vez: se conserva mes a mes. Y lo que se pierde no es una venta, es una cuenta entera.",
    puntos: [
      {
        titulo: "Cada vendedor técnico con su cartera en la cabeza",
        texto:
          "Quién compra, cuánto y cada cuándo vive en la experiencia de una persona. Si esa persona falta o se va, la cuenta queda a la deriva.",
      },
      {
        titulo: "Las especificaciones viven en correos antiguos",
        texto:
          "Medidas, materiales, tolerancias y condiciones de empaque se buscan en el hilo de correo donde se acordaron, o se preguntan de nuevo al cliente.",
      },
      {
        titulo: "La recompra depende de que el cliente llame",
        texto:
          "Nadie avisa que a esta planta ya le tocaba reponer. El pedido se descubre cuando el comprador escribe, y a veces ya escribió a otro proveedor.",
      },
      {
        titulo: "Requisiciones que se contestan tarde",
        texto:
          "La requisición llega por correo, pasa por ingeniería y se responde cuando se puede. En un proceso industrial, el proveedor que cotiza primero suele llevar ventaja.",
      },
      {
        titulo: "Muestras y aprobaciones sin seguimiento",
        texto:
          "Se manda la muestra, se prueba en planta y nadie sabe si fue aprobada, rechazada o si quedó en un cajón.",
      },
      {
        titulo: "Los reclamos de calidad no dejan historial",
        texto:
          "Cuando un lote sale mal, el reclamo se atiende por teléfono y se olvida. El mismo problema vuelve al siguiente pedido sin que nadie lo relacione.",
      },
    ],
  },
  dia: {
    titulo: "Un día en la operación industrial, con Vinqulia",
    intro:
      "La jornada de un vendedor técnico y de su jefe de ventas cuando las cuentas y las requisiciones dejan de estar repartidas en correos.",
    momentos: [
      {
        hora: "7:30",
        titulo: "Qué cuentas hay que atender hoy",
        narrativa:
          "Hay cuentas que no compran desde hace semanas y otras que ya deberían estar reponiendo.",
        conVinqulia:
          "Una vista guardada lista las cuentas sin movimiento reciente y las reposiciones esperadas, con las tareas del día ordenadas por vencimiento.",
      },
      {
        hora: "9:00",
        titulo: "Visita técnica a planta",
        narrativa:
          "Revisa con el jefe de mantenimiento el desempeño del último lote entregado.",
        conVinqulia:
          "Registra la nota con lo acordado y adjunta la hoja de datos que le entregaron, dentro de la ficha de la empresa.",
      },
      {
        hora: "11:00",
        titulo: "Llega una requisición",
        narrativa:
          "Compras pide cotizar un volumen mayor al habitual para el próximo trimestre.",
        conVinqulia:
          "Crea la oportunidad con la especificación y el volumen anual como campos de la operación, y programa la fecha de entrega de la cotización.",
      },
      {
        hora: "13:00",
        titulo: "Seguimiento de una muestra enviada",
        narrativa:
          "La muestra de la semana pasada sigue en pruebas en el laboratorio del cliente.",
        conVinqulia:
          "Mueve la etapa a «Muestra en revisión» y deja la tarea de seguimiento; la regla automática genera la siguiente si pasa de etapa.",
      },
      {
        hora: "16:00",
        titulo: "Reclamo de calidad",
        narrativa:
          "Una planta reporta que el lote llegó con una variación de medida.",
        conVinqulia:
          "Abre un ticket ligado al contacto y a la empresa, con su descripción y su estado, para que el caso tenga seguimiento y no se pierda en una llamada.",
      },
      {
        hora: "Cierre de mes",
        titulo: "Qué cuentas crecieron y cuáles se enfriaron",
        narrativa:
          "La dirección necesita ver la cartera completa, no solo lo que se vendió.",
        conVinqulia:
          "Los informes muestran conversión, cierre por responsable y motivos de pérdida, sobre las oportunidades del periodo.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Cuentas clave que dependen de una sola persona",
      solucion:
        "Empresas con su ficha completa, varios interlocutores y un responsable comercial asignado",
      beneficio:
        "La relación pertenece a la empresa y no a la memoria de un vendedor; cualquier compañero puede retomarla",
    },
    {
      problema: "Especificaciones técnicas que se buscan en correos viejos",
      solucion:
        "Campos personalizados para especificación, volumen y condiciones, más adjuntos en las notas",
      beneficio:
        "Lo acordado con cada planta queda escrito y consultable en la misma ficha donde se cotiza",
    },
    {
      problema: "Recompra que se descubre cuando el cliente ya llamó",
      solucion:
        "Tareas de reposición con fecha y reglas que las crean al cerrar una operación",
      beneficio:
        "El equipo se adelanta al pedido en lugar de reaccionar cuando llega, o cuando ya no llega",
    },
    {
      problema: "Requisiciones que se contestan tarde",
      solucion:
        "Cada requisición como oportunidad con su fecha de entrega y su responsable",
      beneficio:
        "Se ve qué cotizaciones están por vencerse y se prioriza lo que el cliente espera primero",
    },
    {
      problema: "Muestras y aprobaciones perdidas en el proceso",
      solucion: "Etapas específicas para muestra enviada y aprobación técnica",
      beneficio:
        "Se sabe en qué punto está cada prueba y quién debe moverla para que no quede detenida",
    },
    {
      problema: "Reclamos de calidad sin historial",
      solucion:
        "Tickets ligados al contacto y a la empresa, con asunto, descripción y estado",
      beneficio:
        "El caso queda registrado y relacionado con la cuenta: si se repite, se ve el antecedente",
    },
    {
      problema: "La dirección sin visión de la cartera industrial",
      solucion: "Tablero por etapas e informes de conversión y pérdida",
      beneficio:
        "Se detecta a tiempo qué cuentas se están enfriando, antes de perderlas",
    },
  ],
  casosDeUso: [
    {
      titulo: "Cuentas clave con varios interlocutores",
      texto:
        "La planta o el cliente industrial es la ficha central, con compras, ingeniería, calidad y almacén registrados por separado, y con un responsable comercial que responde por la cuenta.",
      funcionalidad: "Empresas con varios contactos vinculados y responsable",
    },
    {
      titulo: "Requisiciones y cotizaciones técnicas",
      texto:
        "Cada requisición se convierte en oportunidad con su especificación, su volumen y su fecha de entrega comprometida, para que el equipo sepa qué tiene que salir hoy.",
      funcionalidad: "Campos personalizados, importe y fecha estimada de cierre",
    },
    {
      titulo: "Muestras y aprobación técnica",
      texto:
        "Un embudo que contempla el envío de muestra, su revisión por ingeniería y la aprobación: etapas distintas de las de una venta directa.",
      funcionalidad: "Varios embudos con etapas configurables",
    },
    {
      titulo: "Recompra programada",
      texto:
        "Cuando una operación se cierra, una regla crea la tarea de reposición en la fecha habitual del cliente, para que el pedido siguiente no dependa de que alguien se acuerde.",
      funcionalidad:
        "Automatizaciones que crean tareas al crear una oportunidad o cambiar de etapa",
    },
    {
      titulo: "Reclamos y seguimiento de calidad",
      texto:
        "Los reportes de calidad o devoluciones se registran como tickets con su estado, ligados a la persona y a la empresa, y se pueden repasar antes de la siguiente entrega.",
      funcionalidad: "Tickets con asunto, descripción y estado configurable",
    },
    {
      titulo: "Cuentas que se están enfriando",
      texto:
        "Una vista compartida con las cuentas sin actividad reciente convierte el repaso semanal de cartera en una lista concreta de llamadas.",
      funcionalidad: "Vistas guardadas compartidas",
    },
    {
      titulo: "Desempeño y causas de pérdida",
      texto:
        "Conversión del periodo, cierre por vendedor y motivos de pérdida: si el problema es precio, plazo o especificación, queda registrado y se puede corregir.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Fabricante de componentes con 4 vendedores técnicos y cerca de 120 cuentas industriales activas.",
    inicial: [
      "La cartera de cada vendedor vive en su computadora y en su memoria.",
      "Las especificaciones acordadas con cada planta se buscan en correos antiguos.",
      "No hay aviso de que a una cuenta ya le tocaba reponer.",
      "Los reclamos de calidad se atienden por teléfono y no dejan antecedente.",
    ],
    conVinqulia: [
      "Cada planta es una ficha con sus interlocutores y su responsable comercial.",
      "Especificaciones, volúmenes y condiciones quedan como campos de la operación.",
      "Las reposiciones se programan con tarea y las crea una regla al cerrar la operación.",
      "Los reclamos quedan como tickets ligados a la cuenta, con su estado y su descripción.",
    ],
    notaSimulacion:
      "Escenario ilustrativo de tamaño y volumen, no un caso real. No afirmamos porcentajes de mejora medidos en clientes.",
  },
  paraQuien: {
    si: [
      "Fabricantes con venta directa a plantas industriales o a distribuidores.",
      "Equipos comerciales de 3 a 50 personas, con carteras de cuentas recurrentes.",
      "Negocios donde la decisión de compra pasa por compras, ingeniería y calidad.",
      "Empresas que cotizan por especificación y volumen, no por catálogo de mostrador.",
      "Quienes necesitan dejar registro de reclamos de calidad relacionados con la cuenta.",
    ],
    no: [
      "Si necesitas planeación de producción, MRP o control de inventario: Vinqulia no es un ERP.",
      "Si necesitas logística, entregas programadas o rastreo de embarques: no forma parte del producto.",
      "Si buscas un expediente de calidad con certificados y trazabilidad por lote: hoy no existe.",
      "Si tu venta es de mostrador y sin cuentas recurrentes, el valor de un CRM es menor.",
    ],
  },
  beneficios: [
    {
      titulo: "La cartera deja de ser personal",
      resultado:
        "Cuando un vendedor técnico cambia de función, la cuenta permanece en el CRM con sus especificaciones, su historial y sus pendientes.",
    },
    {
      titulo: "La recompra se anticipa",
      resultado:
        "Con tareas de reposición programadas y reglas automáticas, el equipo contacta al cliente antes de que el pedido llegue por su cuenta.",
    },
    {
      titulo: "Cotizar deja de ser una carrera contra el reloj",
      resultado:
        "Las requisiciones tienen fecha de entrega y responsable, así que se ve de un vistazo qué cotizaciones están por vencerse.",
    },
    {
      titulo: "El contexto técnico junto a la venta",
      resultado:
        "Especificaciones y documentos quedan en la operación, de modo que quien cotiza no depende de encontrar el correo donde se acordó todo.",
    },
    {
      titulo: "Calidad deja de resolverse por teléfono",
      resultado:
        "Los reclamos quedan como tickets con estado y antecedente, lo que permite relacionar un problema con la cuenta antes de la siguiente entrega.",
    },
    {
      titulo: "Visibilidad de cuentas, no solo de ventas",
      resultado:
        "El tablero y los informes muestran qué cuentas están activas y cuáles se están enfriando, no únicamente lo que se facturó.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Cartera de cuentas en archivos y en la memoria del vendedor técnico.",
      "Especificaciones que se buscan en hilos de correo antiguos.",
      "Reposición que se descubre cuando el cliente escribe.",
      "Requisiciones atendidas por orden de llegada al correo.",
      "Reclamos de calidad atendidos por teléfono, sin antecedente.",
    ],
    conVinqulia: [
      "Cada planta con su ficha, sus interlocutores y su responsable.",
      "Especificaciones y condiciones como campos de la operación.",
      "Reposiciones programadas y creadas por reglas automáticas.",
      "Requisiciones con fecha de entrega y prioridad visible.",
      "Reclamos como tickets con estado, ligados a la cuenta.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Lleva inventario o planeación de producción?",
      respuesta:
        "No. Vinqulia es un CRM: administra la relación comercial y el seguimiento, no el almacén ni la planta. Si necesitas esas funciones, se integran con tu ERP o se abordan como desarrollo aparte.",
    },
    {
      pregunta: "¿Podemos registrar reclamos de calidad y devoluciones?",
      respuesta:
        "Sí, como tickets con asunto, descripción y estado, ligados al contacto y a la empresa. No es un módulo de calidad con certificados ni trazabilidad por lote.",
    },
    {
      pregunta: "¿Cómo controlamos las cuentas de cada vendedor técnico?",
      respuesta:
        "Cada cliente y cada oportunidad tienen un responsable. El jefe de ventas ve toda la cartera, puede reasignar cuentas y revisar qué tiene abierto cada vendedor.",
    },
    {
      pregunta: "¿Se pueden guardar especificaciones técnicas por cliente?",
      respuesta:
        "Sí. Puedes crear campos propios —especificación, volumen anual, condiciones de empaque— en la ficha de la empresa o en la operación, y adjuntar documentos a las notas.",
    },
    {
      pregunta: "¿Sirve para venta directa y para distribuidores a la vez?",
      respuesta:
        "Sí, con embudos separados: la venta a planta suele tener etapas técnicas que la venta a distribuidor no necesita, y conviene medirlas por separado.",
    },
    {
      pregunta: "¿Los vendedores pueden registrar desde la planta?",
      respuesta:
        "Sí. La interfaz móvil permite consultar la cuenta, anotar lo acordado, adjuntar un documento y crear la siguiente tarea desde el teléfono.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM le conviene a una empresa manufacturera?",
      respuesta:
        "Uno pensado para relaciones recurrentes: cuentas con varios interlocutores, seguimiento de requisiciones y muestras, control de recompra y registro de reclamos. Eso es lo que Vinqulia resuelve para un equipo comercial industrial.",
    },
    {
      pregunta: "¿Cómo llevo el control de mis cuentas clave?",
      respuesta:
        "Cada cuenta es una empresa con sus contactos y un responsable comercial. El tablero muestra las oportunidades abiertas por cuenta y una vista guardada permite detectar las que llevan tiempo sin movimiento.",
    },
    {
      pregunta: "¿Cómo doy seguimiento a una requisición o cotización técnica?",
      respuesta:
        "Como una oportunidad con su especificación, su importe y su fecha de entrega comprometida. Cada contacto con el cliente deja nota y programa la siguiente tarea, así la requisición no se queda esperando.",
    },
    {
      pregunta: "¿Puedo programar el aviso de recompra de un cliente industrial?",
      respuesta:
        "Sí. Con tareas con fecha y reglas automáticas que se disparan al crear una oportunidad o al cambiar de etapa, el aviso de reposición queda programado sin depender de la memoria.",
    },
    {
      pregunta: "¿Se puede registrar un reclamo de calidad ligado al cliente?",
      respuesta:
        "Sí, con tickets que tienen asunto, descripción y estado, y que quedan vinculados al contacto y a la empresa. Así el antecedente está disponible antes de la siguiente entrega.",
    },
    {
      pregunta: "¿Cómo mido el desempeño de cada vendedor técnico?",
      respuesta:
        "Con los informes de cierre por responsable y la conversión del periodo, más el tablero compartido donde se ve qué tiene abierto cada quien y qué se perdió.",
    },
    {
      pregunta: "¿Se integra con nuestro ERP?",
      respuesta:
        "Puede integrarse por API REST y webhooks. El CRM no reemplaza al ERP: lleva la relación comercial, y el ERP sigue llevando inventario, producción y facturación.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Inventario y almacén",
      texto:
        "Existencias por producto y almacén, con entradas y salidas. Hoy no existe en el producto.",
    },
    {
      titulo: "Planeación de producción",
      texto:
        "Órdenes de producción, capacidad y MRP. Hoy no existe; pertenece al terreno de un ERP.",
    },
    {
      titulo: "Logística y entregas",
      texto:
        "Programación de embarques, rastreo y comprobantes de entrega. Hoy no existe.",
    },
    {
      titulo: "Módulo de calidad",
      texto:
        "Certificados de material, trazabilidad por lote y no conformidades con flujo de aprobación. Hoy no existe; el reclamo se puede registrar como ticket, sin ese alcance.",
    },
    {
      titulo: "Catálogo de productos con precios",
      texto:
        "Listas de producto y precios consultables desde el CRM. Hoy el precio se anota en la operación, no se calcula desde un catálogo.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Que ninguna cuenta clave se enfríe sin que tu equipo lo note",
    subtitulo:
      "Cuéntanos cómo vende tu equipo —cuántos vendedores técnicos, cuántas cuentas recurrentes y cómo cotizan hoy— y te mostramos cómo se vería tu cartera industrial en Vinqulia.",
    boton: "Quiero una demo para mi empresa industrial",
  },
  seo: {
    keywordPrincipal: "CRM para manufactura",
    keywordsSecundarias: [
      "CRM industrial",
      "software para empresas manufactureras",
      "gestión de cuentas clave B2B",
      "CRM para proveedores industriales",
      "seguimiento de requisiciones y cotizaciones",
    ],
    longTail: [
      "cómo llevar el control de cuentas clave en una empresa industrial",
      "software para dar seguimiento a cotizaciones técnicas",
      "cómo programar la recompra de un cliente industrial",
      "CRM con tickets de calidad y devoluciones",
      "cómo medir el cierre por vendedor técnico",
    ],
    terminosRelacionados: [
      "cuenta clave",
      "requisición",
      "vendedor técnico",
      "especificación de producto",
      "recompra",
      "ciclo de venta industrial",
    ],
    intencionComercial:
      "Empresas industriales con cartera recurrente que necesitan control sobre cuentas, requisiciones y recompra, y están evaluando un CRM que no sea un ERP. El CTA principal apunta a esa intención.",
    intencionInformativa:
      "Quien busca cómo organizar la cartera industrial, cómo dar seguimiento a muestras y aprobaciones o cómo documentar reclamos de calidad. Lo cubren las secciones Problema y Un día en la operación.",
    paginasFuturas: [
      "/guias/crm-para-empresas-industriales",
      "/soluciones/gestion-de-cuentas-clave",
      "/soluciones/seguimiento-de-requisiciones",
      "/comparativas/vinqulia-vs-excel-para-cartera-industrial",
      "/blog/como-evitar-perder-una-cuenta-clave",
    ],
  },
};

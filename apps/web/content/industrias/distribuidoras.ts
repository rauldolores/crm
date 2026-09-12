import type { Industria } from "./tipos";

/**
 * Distribuidoras y mayoristas: la página modelo de la sección de industrias.
 *
 * Todo el contenido sale de funcionalidades verificadas del producto
 * (tablero por etapas, notas con tipo WhatsApp/correo, tareas con responsable,
 * automatizaciones, informes, formularios públicos, campos personalizados,
 * importación, móvil). Lo que el producto NO hace se declara aparte, en
 * oportunidadesFuturas.
 */
export const distribuidoras: Industria = {
  slug: "distribuidoras",
  nombre: "Distribuidoras y mayoristas",
  resumen:
    "Carteras por vendedor, pedidos en negociación y seguimiento de ruta en un solo tablero.",
  icono: "Truck",
  tablero: {
    titulo: "Pedidos en curso",
    montoEnJuego: 486300,
    columnas: [
      {
        titulo: "Prospección",
        color: "bg-amber-400",
        tarjetas: [
          {
            nombre: "Abarrotes Don Chuy",
            empresa: "Zona Centro",
            monto: "$18,400",
            iniciales: "DC",
            color: "#e2766a",
            etiqueta: "Ruta",
          },
          {
            nombre: "Mini Super La Luz",
            empresa: "Zona Norte",
            monto: "$7,900",
            iniciales: "ML",
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
            nombre: "Restaurante El Fogón",
            empresa: "Zona Sur",
            monto: "$31,200",
            iniciales: "EF",
            color: "#3f8fd0",
            etiqueta: "Correo",
          },
          {
            nombre: "Tienda Doña Mary",
            empresa: "Zona Centro",
            monto: "$12,600",
            iniciales: "DM",
            color: "#4fb59a",
            etiqueta: "WhatsApp",
          },
        ],
      },
      {
        titulo: "Pedido confirmado",
        color: "bg-brand-500",
        tarjetas: [
          {
            nombre: "Comercial Vela",
            empresa: "Mayoreo",
            monto: "$64,800",
            iniciales: "CV",
            color: "#b23b2e",
            etiqueta: "Caliente",
          },
        ],
      },
      {
        titulo: "Entregado",
        color: "bg-emerald-500",
        tarjetas: [
          {
            nombre: "Super Ramos",
            empresa: "Cadena 4 tiendas",
            monto: "$39,500",
            iniciales: "SR",
            color: "#3f8f7a",
            etiqueta: "Recurrente",
          },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "CRM para distribuidoras",
    titulo: "Tu distribuidora vende por WhatsApp, teléfono y ruta. El control no debería vivir en el Excel de cada vendedor.",
    subtitulo:
      "Vinqulia reúne la cartera de clientes, los pedidos en negociación y el seguimiento en un solo tablero. Cada vendedor ve su ruta y sus pendientes; el gerente ve el embudo completo y las conversaciones quedan en la ficha del cliente.",
    ctaPrincipal: "Quiero una demo para mi distribuidora",
    puntos: [
      "Cartera por vendedor y por zona",
      "WhatsApp y correo dentro del historial",
      "Tablero de pedidos por etapa",
      "Informes de cierre por vendedor",
    ],
  },
  problema: {
    titulo: "Cómo se opera hoy en la mayoría de distribuidoras",
    intro:
      "No falta trabajo: falta que el trabajo quede registrado en algún lugar que no sea la memoria del vendedor.",
    puntos: [
      {
        titulo: "Una cartera distinta por vendedor",
        texto:
          "Cada vendedor administra su Excel con sus clientes, sus precios y sus pendientes. Cuando alguien falta, nadie más sabe qué quedó comprometido con esa cuenta.",
      },
      {
        titulo: "Los pedidos llegan por WhatsApp y ahí se quedan",
        texto:
          "El cliente confirma un pedido por mensaje. Si nadie lo pasa al sistema, el pedido existe solo en ese chat y en la cabeza de quien lo leyó.",
      },
      {
        titulo: "El seguimiento depende de la memoria",
        texto:
          "«Le hablo la próxima semana», «le mandé la cotización el martes». Sin registro, el seguimiento se vuelve una promesa personal, no un proceso.",
      },
      {
        titulo: "La gerencia se enteró al cierre de mes",
        texto:
          "Sin un embudo visible, saber cuánto hay en negociación implica juntar reportes hechos a mano por cada vendedor.",
      },
      {
        titulo: "Los clientes que dejan de comprar no se notan",
        texto:
          "Una cuenta baja su frecuencia poco a poco y nadie lo detecta hasta que ya compra con la competencia.",
      },
      {
        titulo: "La relación se va con el vendedor",
        texto:
          "Cuando alguien deja la empresa, se lleva el historial: a quién le cotizó, a qué precio y en qué quedó. La empresa conserva el nombre del cliente, no la relación.",
      },
    ],
  },
  dia: {
    titulo: "Un día en una distribuidora, con Vinqulia",
    intro:
      "Así se ve una jornada normal de venta de ruta y mostrador cuando el proceso vive en el CRM.",
    momentos: [
      {
        hora: "7:00",
        titulo: "Salida a ruta",
        narrativa:
          "El vendedor abre su lista de tareas del día y revisa su cartera: a quién le toca visita, quién tiene un pendiente y con quién quedó de hablar.",
        conVinqulia:
          "Ve las tareas con fecha y responsable, y sus clientes asignados. Nada depende de que recuerde el recorrido.",
      },
      {
        hora: "9:30",
        titulo: "Visita a la tienda 1",
        narrativa:
          "Termina la visita y anota qué pidieron, qué se quejaron del precio y cuándo volver.",
        conVinqulia:
          "Registra una nota con su tipo (Reunión o Llamada) y deja la próxima tarea puesta antes de salir del estacionamiento.",
      },
      {
        hora: "11:00",
        titulo: "Pedido por WhatsApp",
        narrativa:
          "El cliente de siempre manda su pedido por WhatsApp, como todos los meses.",
        conVinqulia:
          "El mensaje se envía desde la ficha del cliente con la integración de WhatsApp, y la conversación queda como nota de tipo WhatsApp en su historial.",
      },
      {
        hora: "13:00",
        titulo: "Cotización pendiente",
        narrativa:
          "Envía la cotización a una tienda nueva y quedan de confirmar el volumen.",
        conVinqulia:
          "Mueve la oportunidad a «Cotización enviada» en el tablero y programa una tarea de seguimiento a dos días: si no responde, la tarea sigue ahí.",
      },
      {
        hora: "16:00",
        titulo: "El gerente revisa el embudo",
        narrativa:
          "Necesita saber cómo viene la semana sin pedirle reportes a nadie.",
        conVinqulia:
          "Abre el tablero: cuánto hay en prospección, cuánto cotizado, cuánto confirmado, por vendedor y en su moneda.",
      },
      {
        hora: "18:00",
        titulo: "Cierre del día",
        narrativa:
          "Quedaron tareas sin hacer y un cliente que pidió que lo llamaran mañana.",
        conVinqulia:
          "Las tareas vencidas siguen visibles al día siguiente y las reglas automáticas asignan o crean la siguiente tarea sin que nadie lo pida.",
      },
    ],
  },
  problemaSolucion: [
    {
      problema: "Cada vendedor con su propio Excel de clientes",
      solucion:
        "Contactos y empresas en una sola base, con un responsable asignado",
      beneficio:
        "Cualquiera consulta la cartera completa sin pedir archivos ni esperar a que alguien los mande",
    },
    {
      problema: "Pedidos confirmados por WhatsApp que no quedan registrados",
      solucion:
        "Envío de WhatsApp desde la ficha y la conversación guardada como nota del contacto",
      beneficio:
        "El pedido y su contexto quedan en el historial del cliente, no en el teléfono de una persona",
    },
    {
      problema: "Seguimientos que dependen de que el vendedor se acuerde",
      solucion:
        "Tareas con vencimiento y responsable, más automatizaciones que las crean solas",
      beneficio:
        "Ningún pendiente se pierde cuando el día se complica o alguien falta",
    },
    {
      problema: "La gerencia sin visibilidad real del embudo",
      solucion: "Tablero de oportunidades por etapas e informes de conversión",
      beneficio:
        "Se decide con el embudo a la vista durante la semana, no con reportes armados a mano al cierre del mes",
    },
    {
      problema: "Clientes que dejan de comprar sin que nadie lo note",
      solucion:
        "Notas con estado (frío, templado, caliente) y actividad reciente visible en cada ficha",
      beneficio:
        "La cuenta que se enfría se detecta a tiempo, no cuando ya compró en otro lado",
    },
    {
      problema: "La cartera se va cuando se va el vendedor",
      solucion:
        "Todo el historial vive en el CRM, con notas, tareas y oportunidades",
      beneficio:
        "La relación queda en la empresa: quien entre a esa cuenta ve qué se prometió y en qué quedó",
    },
    {
      problema: "Condiciones y listas de precios que solo conoce el vendedor",
      solucion:
        "Campos personalizados (zona, lista de precios, condiciones) en la ficha del cliente",
      beneficio:
        "Las condiciones de cada cuenta quedan escritas y consultables por el resto del equipo",
    },
  ],
  casosDeUso: [
    {
      titulo: "Cartera por vendedor y por zona",
      texto:
        "Cada cliente y cada empresa tiene un responsable. El vendedor ve lo suyo; el gerente ve todo y puede reasignar cuentas cuando alguien entra o sale del equipo.",
      funcionalidad: "Responsable en contactos y empresas, con permisos por rol",
    },
    {
      titulo: "Pedidos en negociación, por etapas",
      texto:
        "Los pedidos dejan de ser un chat suelto: entran al tablero, se mueven de etapa y se ve cuánto dinero está en juego.",
      funcionalidad: "Tablero Kanban con etapas configurables y varios embudos",
    },
    {
      titulo: "Pedidos que llegan solos desde la web",
      texto:
        "Un formulario en el sitio de la distribuidora captura al cliente nuevo y lo convierte en contacto con su historial, sin que nadie lo teclee.",
      funcionalidad: "Formularios públicos (enlace o iframe) que crean contactos",
    },
    {
      titulo: "Seguimiento post-venta y recompra",
      texto:
        "Cuando un pedido se entrega, queda la tarea de confirmar que llegó bien y la de volver a ofrecer en la fecha habitual del cliente.",
      funcionalidad:
        "Automatizaciones: al cambiar de etapa, crear tarea o asignar responsable",
    },
    {
      titulo: "Radio de acción de la ruta en el teléfono",
      texto:
        "El vendedor consulta su cartera, registra la visita y crea la tarea desde la calle, no al volver a la oficina.",
      funcionalidad: "Interfaz móvil pensada para el teléfono",
    },
    {
      titulo: "Saber quién cierra y por qué se pierde",
      texto:
        "Cierre por vendedor, conversión y motivos de pérdida. Sirve para corregir el discurso y para descubrir en qué zona se está perdiendo el negocio.",
      funcionalidad: "Informes de conversión, cierre por responsable y pérdidas",
    },
  ],
  casoPractico: {
    escenario:
      "Distribuidora de abarrotes con 3 vendedores de ruta, 2 sucursales y cerca de 400 clientes activos.",
    inicial: [
      "Cada vendedor lleva su Excel; unir la información toma medio día al cerrar la semana.",
      "Los pedidos se confirman por WhatsApp y se traspasan «cuando haya tiempo».",
      "Nadie sabe cuántas oportunidades hay abiertas ni cuánto suman.",
      "Cuando un vendedor se va, su cartera tarda semanas en reconstruirse.",
    ],
    conVinqulia: [
      "Una sola base de clientes y empresas, con responsable por cuenta y por zona.",
      "El tablero muestra el dinero en juego por etapa y por vendedor en todo momento.",
      "Cada pedido confirmado por WhatsApp deja su nota y su tarea de seguimiento.",
      "El reporte semanal se consulta en pantalla, no se arma a mano.",
    ],
    notaSimulacion:
      "Escenario ilustrativo, no un caso real ni una promesa de resultado. Sirve para mostrar cómo se reparte el trabajo entre áreas; no afirmamos porcentajes de ahorro medidos.",
  },
  paraQuien: {
    si: [
      "Distribuidoras con equipo de venta de ruta, televenta o mostrador mayorista.",
      "Equipos comerciales de 3 a 50 personas, con carteras repartidas por zona o por línea de producto.",
      "Negocios donde la venta es recurrente y el seguimiento pesa más que el cierre de una sola operación.",
      "Quien hoy coordina la venta por WhatsApp y quiere que ese canal deje rastro.",
      "Distribuidoras que van a migrar desde hojas de cálculo o desde un CRM que nadie usa porque no se adaptó a la operación.",
    ],
    no: [
      "Si lo que necesitas es facturación o timbrado fiscal: Vinqulia no emite facturas, es un CRM.",
      "Si buscas inventario, almacén o control de existencias: eso es un ERP o un WMS, no este producto.",
      "Si tu venta es 100% de mostrador sin cartera ni seguimiento posterior, el valor de un CRM es bajo.",
      "Si necesitas optimización automática de rutas o geolocalización de vendedores: hoy no existe (ver oportunidades futuras).",
    ],
  },
  beneficios: [
    {
      titulo: "Multiusuario con permisos",
      resultado:
        "Varios vendedores y coordinadores trabajan al mismo tiempo sobre la misma base, cada uno viendo lo que le corresponde y con la información centralizada en un solo lugar.",
    },
    {
      titulo: "Campos personalizados",
      resultado:
        "Zona, lista de precios, número de sucursal o límite de crédito se agregan como campos propios, para que la ficha refleje cómo opera tu distribuidora y no un formato ajeno.",
    },
    {
      titulo: "Automatizaciones",
      resultado:
        "Algunas tareas del proceso se crean solas —por ejemplo, al crear un contacto o al mover una etapa—, así que el seguimiento ocurre aunque el día venga cargado.",
    },
    {
      titulo: "Informes de embudo y pérdida",
      resultado:
        "La gerencia discute con datos de conversión, cierre por vendedor y motivos de pérdida, en lugar de opiniones recogidas de pasillo.",
    },
    {
      titulo: "Historial de conversaciones",
      resultado:
        "WhatsApp y correo quedan en la ficha del cliente con su tipo y su fecha: cuando alguien nuevo toma la cuenta, entiende la relación en minutos.",
    },
    {
      titulo: "Importación con detección de duplicados",
      resultado:
        "Tu base actual entra desde CSV o JSON avisando de posibles duplicados antes de crearlos, así no arrastras el desorden del Excel al sistema nuevo.",
    },
  ],
  comparacion: {
    titulo: "Trabajar como antes vs. trabajar con Vinqulia",
    tradicional: [
      "Un Excel por vendedor, unidos a mano al final de la semana.",
      "Pedidos confirmados por WhatsApp que solo existen en ese chat.",
      "Reportes armados a mano para la junta del lunes.",
      "Cartera que se va cuando se va el vendedor.",
      "Sin datos para saber por qué se pierde un cliente.",
    ],
    conVinqulia: [
      "Una base única de clientes y empresas, con responsable asignado.",
      "Cada pedido entra al tablero y deja su historial en la ficha.",
      "El embudo se consulta en pantalla, actualizado.",
      "El historial queda en la empresa, no en el teléfono de una persona.",
      "Motivos de pérdida y conversión por vendedor, medidos.",
    ],
  },
  objeciones: [
    {
      pregunta: "¿Tenemos que dejar de usar WhatsApp?",
      respuesta:
        "No. Vinqulia se integra con WhatsApp para enviar mensajes desde la ficha del cliente y dejar la conversación registrada. Si además quieres que el correo entrante se archive solo, se configura el buzón del CRM.",
    },
    {
      pregunta: "¿Podemos conservar nuestra información actual?",
      respuesta:
        "Sí. Tu base de contactos y empresas entra desde CSV o JSON, y el sistema detecta posibles duplicados durante la importación para que decidas si fusionas antes de crear registros nuevos.",
    },
    {
      pregunta: "¿Varios vendedores pueden usarlo a la vez?",
      respuesta:
        "Sí. Es multiusuario: cada persona entra con su cuenta y su rol, y los contactos, empresas y oportunidades tienen un responsable asignado.",
    },
    {
      pregunta: "¿Sirve si trabajamos por sucursales o zonas?",
      respuesta:
        "Puedes separar por zona o sucursal con campos personalizados y con responsables distintos por cuenta. Y si una sucursal necesita operar como negocio aparte, el CRM admite trabajar por organizaciones independientes.",
    },
    {
      pregunta: "¿Es complicado cambiar de sistema?",
      respuesta:
        "La migración se hace contigo: importamos la base, configuramos etapas, campos y moneda, y capacitamos al equipo. Puedes empezar con un embudo simple y ajustarlo después.",
    },
    {
      pregunta: "¿Se puede usar desde el celular en la ruta?",
      respuesta:
        "Sí. Hay una interfaz móvil pensada para el teléfono: consultar cartera, registrar notas y crear tareas desde la calle.",
    },
    {
      pregunta: "¿Podemos facturar desde Vinqulia?",
      respuesta:
        "No. Vinqulia es un CRM: gestiona la relación y el proceso comercial, no emite facturas ni lleva inventario. Preferimos decirlo antes que venderte algo que no es.",
    },
  ],
  faq: [
    {
      pregunta: "¿Qué CRM conviene para una distribuidora?",
      respuesta:
        "El que se adapta a cómo vendes: cartera por vendedor, pedidos por etapas, seguimiento de ruta y los canales que ya usas (WhatsApp, teléfono, correo). Vinqulia está pensado para equipos comerciales que venden de forma recurrente y necesitan control sin perder agilidad.",
    },
    {
      pregunta: "¿Cómo controlo la cartera de clientes de varios vendedores?",
      respuesta:
        "Cada contacto y cada empresa tiene un responsable. El vendedor ve su cartera y sus tareas; el coordinador ve todo el equipo y puede reasignar cuentas cuando alguien entra o sale.",
    },
    {
      pregunta: "¿Se puede registrar WhatsApp en el CRM?",
      respuesta:
        "Sí. Los mensajes se envían desde la ficha del contacto y quedan como nota de tipo WhatsApp en su historial, junto al resto de la actividad.",
    },
    {
      pregunta: "¿Cómo doy seguimiento a pedidos recurrentes?",
      respuesta:
        "Con tareas con vencimiento y responsable, y con automatizaciones que las crean según lo que ocurra en el embudo: al crear una oportunidad o al cambiar de etapa, por ejemplo.",
    },
    {
      pregunta: "¿Puedo importar mi base de clientes desde Excel?",
      respuesta:
        "Sí, desde CSV o JSON. Durante la importación el sistema señala posibles duplicados para que los revises antes de crearlos.",
    },
    {
      pregunta: "¿Cómo sé qué vendedor cierra más?",
      respuesta:
        "Los informes muestran cierre por responsable y la tasa de conversión del periodo, además del embudo por etapa y los motivos de pérdida.",
    },
    {
      pregunta: "¿Funciona para venta por ruta y por mostrador mayorista?",
      respuesta:
        "Sí, y se pueden separar con embudos distintos: por ejemplo, uno para cuentas nuevas y otro para recompra de clientes actuales.",
    },
    {
      pregunta: "¿Qué pasa con mis datos si dejo de usarlo?",
      respuesta:
        "Puedes exportar contactos en CSV y consultar tus datos por la API del CRM. Los datos son de tu organización, no un rehén del proveedor.",
    },
  ],
  oportunidadesFuturas: [
    {
      titulo: "Inventario y almacén",
      texto:
        "Control de existencias, entradas y salidas por sucursal. Hoy no existe: Vinqulia no lleva inventario.",
    },
    {
      titulo: "Facturación y cobranza",
      texto:
        "Emisión de facturas, estados de cuenta y seguimiento de pagos. Hoy no existe en el CRM; se puede construir como integración con tu sistema de facturación.",
    },
    {
      titulo: "Rutas y visitas geolocalizadas",
      texto:
        "Planeación de ruta, check-in por ubicación y evidencia fotográfica de la visita. Hoy no existe.",
    },
    {
      titulo: "Portal del cliente para levantar pedidos",
      texto:
        "Un área donde el propio cliente consulte precios y levante su pedido. Hoy lo más cercano es el formulario público de captación, que crea el contacto pero no levanta pedidos.",
    },
  ],
  cta: {
    eyebrow: "Siguiente paso",
    titulo: "Empieza a controlar la cartera de tu distribuidora",
    subtitulo:
      "Cuéntanos cómo vende hoy tu equipo —cuántos vendedores, qué zonas, por dónde llegan los pedidos— y te mostramos cómo se vería tu operación dentro de Vinqulia.",
    boton: "Quiero una demo para mi distribuidora",
  },
  seo: {
    keywordPrincipal: "CRM para distribuidoras",
    keywordsSecundarias: [
      "software para distribuidoras",
      "CRM para mayoristas",
      "control de cartera de clientes",
      "CRM con WhatsApp para ventas",
      "sistema para vendedores de ruta",
    ],
    longTail: [
      "cómo controlar la cartera de clientes de varios vendedores",
      "CRM para distribuidora con vendedores de ruta",
      "registrar WhatsApp de clientes en un CRM",
      "software para dar seguimiento a pedidos de mayoreo",
      "cómo saber qué vendedor cierra más ventas",
    ],
    terminosRelacionados: [
      "venta de ruta",
      "televenta",
      "mostrador mayorista",
      "recompra",
      "cartera de clientes",
      "cuota de venta",
    ],
    intencionComercial:
      "Empresas que ya decidieron ordenar su operación comercial y están comparando CRM: buscan ver el embudo, controlar carteras y centralizar WhatsApp. Es la intención que convierte y a la que apunta el CTA principal.",
    intencionInformativa:
      "Quien todavía diagnostica: cómo controlar vendedores de ruta, cómo dar seguimiento a pedidos recurrentes, qué hacer con los pedidos que llegan por WhatsApp. Se atiende con las secciones Problema y Casos de uso, y más adelante con el blog.",
    paginasFuturas: [
      "/guias/crm-para-distribuidoras-como-elegir",
      "/comparativas/vinqulia-vs-excel-para-cartera-de-clientes",
      "/soluciones/seguimiento-de-pedidos-recurrentes",
      "/blog/como-controlar-vendedores-de-ruta",
    ],
  },
};

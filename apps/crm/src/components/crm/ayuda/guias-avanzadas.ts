import type { Grupo } from "./tipos";

/**
 * Módulos y funciones avanzadas.
 *
 * Aquí está todo lo que el sistema sabe hacer más allá del uso diario:
 * automatizaciones, formularios, correo, IA, API, webhooks, MCP. Cada
 * sección dice qué es, cuándo conviene y cómo se activa, con el mismo
 * lenguaje llano que el resto y sin dar por sabido nada técnico.
 */

export const MODULOS: Grupo = {
  id: "modulos",
  titulo: "Módulos",
  secciones: [
    {
      id: "catalogo-de-modulos",
      titulo: "Catálogo de módulos",
      resumen:
        "Funciones que se activan o apagan por organización. Apagar un módulo no borra sus datos, solo lo oculta.",
      ruta: "/modulos/catalogo",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "En Ajustes → Herramientas → Catálogo de módulos hay un interruptor por módulo. Al activarlo aparece en la barra lateral, bajo «Módulos», y en las fichas relacionadas. Hoy hay dos: Clientes y Afiliados. Iremos añadiendo más; si tu sector necesita uno propio, mira la sección «Funcionalidades a tu medida».",
        },
      ],
    },
    {
      id: "clientes",
      titulo: "Clientes: lo que pasa después de la venta",
      resumen:
        "Qué ha comprado cada cliente, qué tiene contratado y cuándo le vence. Para vender lo siguiente y no dejar caer renovaciones.",
      ruta: "/customer_summary",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Un CRM normal acompaña hasta que se cierra la venta y ahí se acaba. Este módulo sigue: un cliente ES una empresa (no una entidad aparte, para no tener la misma dos veces) a la que se le añaden una etapa de ciclo de vida (prospecto, cliente activo, en riesgo, perdido), sus contratos o suscripciones (con periodicidad, importe y fecha de renovación) y sus compras puntuales.",
        },
        {
          tipo: "lista",
          items: [
            "La pantalla Clientes lista las empresas con total comprado, importe recurrente y próxima renovación; se filtra por etapa.",
            "En la ficha de la empresa, la pestaña «Cliente» permite añadir contratos y registrar compras a mano.",
            "Si tienes un sistema de facturación, tienda o ERP, puede registrar cada venta solo por la API (sección «Clientes por API»).",
            "La fecha «Renueva o vence el» de un contrato es la que usan las automatizaciones para avisar con antelación.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: una empresa de mantenimiento",
          texto:
            "Cada cliente tiene un contrato anual de mantenimiento con fecha de renovación. Una automatización «faltan 30 días para que se renueve un contrato → crear la tarea “Llamar para renovar”» hace que ningún contrato caduque sin que alguien lo haya llamado.",
        },
      ],
    },
    {
      id: "afiliados",
      titulo: "Afiliados: quien revende tus servicios",
      resumen:
        "Contactos que traen clientes a cambio de una comisión, con su código de referido y lo que han generado.",
      ruta: "/affiliates",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Se configura en Ajustes → Módulos → Afiliados: eliges qué embudo es el de afiliación y qué etapas cuentan como «afiliación completa». Cuando una oportunidad de ese embudo se gana, el contacto se convierte en afiliado con un código de referido y una comisión por defecto (ajustable por afiliado). Si le das una URL plantilla (https://tudominio.com?ref={id}), cada afiliado ve su enlace listo en su ficha.",
        },
        {
          tipo: "lista",
          items: [
            "En la ficha del afiliado: clientes traídos, oportunidades ganadas, importe ganado y comisión calculada.",
            "Vinculando el afiliado con una cuenta de KontrolIA Auth, puede entrar y ver solo las empresas y contactos que gestiona.",
          ],
        },
      ],
    },
  ],
};

export const AVANZADO: Grupo = {
  id: "avanzado",
  titulo: "Funciones avanzadas",
  secciones: [
    {
      id: "automatizaciones",
      titulo: "Automatizaciones",
      resumen:
        "Reglas «cuando pase esto, haz aquello» que el CRM aplica solo, sin que nadie tenga que acordarse.",
      ruta: "/automatizaciones",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Una regla tiene un «cuando» y un «entonces». Se aplica tanto si el cambio lo haces tú en la aplicación como si entra por una importación, un formulario web o desde otro sistema por la API. Todas se ven y se activan o pausan desde Ajustes → Herramientas → Automatizaciones.",
        },
        {
          tipo: "tabla",
          cabeceras: ["Cuando…", "Entonces…"],
          filas: [
            [
              "Se crea un contacto",
              "Crear una tarea (con texto, tipo y días hasta el vencimiento) · Asignar un responsable · Enviar el correo de una plantilla",
            ],
            ["Se crea una oportunidad", "Lo mismo"],
            ["Una oportunidad llega a la etapa «X»", "Lo mismo"],
            [
              "Faltan N días para que se renueve un contrato (módulo Clientes)",
              "Crear una tarea o enviar un correo al contacto de esa empresa con actividad más reciente. Se revisa una vez al día y no se repite.",
            ],
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Tres reglas que casi todos acaban poniendo",
          texto:
            "1) «Se crea un contacto → enviar la plantilla Bienvenida». 2) «Una oportunidad llega a Propuesta enviada → crear la tarea “Llamar para resolver dudas” para dentro de 2 días». 3) «Faltan 30 días para una renovación → crear la tarea “Proponer renovación”».",
        },
        {
          tipo: "consejo",
          texto:
            "Para enviar correos desde una regla necesitas antes un servidor de correo saliente configurado y una plantilla activa.",
        },
      ],
    },
    {
      id: "formularios-web",
      titulo: "Formularios web",
      resumen:
        "Un enlace o un iframe para tu página: cada envío crea un contacto o abre un ticket, sin que nadie lo copie a mano.",
      ruta: "/formularios",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            "En Ajustes → Herramientas → Formularios web, pulsa «Agregar», ponle nombre y elige el tipo: «Captación de contactos» (crea un contacto) o «Ticket de soporte» (abre un ticket).",
            "Copia el enlace (para compartirlo o enlazarlo desde un botón) o el iframe (para incrustarlo dentro de una página tuya).",
            "Pégalo en tu web. Cada envío entra en el CRM al instante, y si tienes una automatización «se crea un contacto → …», se dispara.",
          ],
        },
        {
          tipo: "lista",
          items: [
            "Puedes tener varios formularios (uno por página, por campaña o por servicio) y desactivar cualquiera sin borrarlo.",
            "Si prefieres tu propio formulario con tu diseño, envíalo a la API con una clave de API (sección «API y claves»).",
          ],
        },
      ],
    },
    {
      id: "correo-saliente",
      titulo: "Correo saliente",
      resumen:
        "Por qué servidor salen los correos que envía el CRM. Sin él, no se puede enviar correo desde las fichas ni desde las automatizaciones.",
      ruta: "/correo",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cada organización envía desde su propio dominio. En Ajustes → Herramientas → Correo saliente eliges el proveedor (Resend, Postmark o SendGrid), pegas la clave de API que te da ese proveedor y pones el remitente (nombre y una dirección de un dominio verificado allí). La clave se guarda cifrada y no vuelve a mostrarse. Hay un botón para enviarte una prueba antes de usarlo de verdad.",
        },
        {
          tipo: "consejo",
          texto:
            "Si no tienes cuenta en ninguno de los tres, Resend es el más sencillo de dar de alta y tiene plan gratuito. Verificar el dominio (unos registros DNS) es lo único que lleva un rato; el proveedor te guía.",
        },
      ],
    },
    {
      id: "inteligencia-artificial",
      titulo: "Inteligencia artificial",
      resumen:
        "Con qué proveedor de IA se redactan las plantillas de correo. La clave es tuya y el consumo se paga en tu cuenta del proveedor.",
      ruta: "/inteligencia-artificial",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "En Ajustes → Herramientas → Inteligencia artificial eliges proveedor (Claude, OpenAI o DeepSeek), pegas tu clave y, si quieres, un modelo concreto (por defecto usa el recomendado). A partir de ahí, en Plantillas de correo aparece «Generar con IA»: describes el correo en una frase y te lo redacta con los campos del contacto ya colocados. Tú lo revisas y lo guardas.",
        },
        {
          tipo: "parrafo",
          texto:
            "Aparte de redactar plantillas, un asistente de IA (como Claude) puede trabajar directamente con tus datos del CRM por conversación, gracias al servidor MCP: ver la sección «Asistentes de IA (MCP)».",
        },
      ],
    },
    {
      id: "api-y-claves",
      titulo: "API y claves de API",
      resumen:
        "Para que otro programa lea o escriba en tu CRM: tu web, tu sistema de facturación, un bot, una herramienta de automatización.",
      ruta: "/integraciones",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Todo lo que ves en pantalla está disponible por una API REST: contactos, empresas, oportunidades, tareas, notas, tickets y etiquetas. Una integración externa se identifica con una clave de API, que se crea en Ajustes → Herramientas → API y webhooks (solo administradores). La clave tiene los mismos permisos que un usuario, así que trátala como una contraseña: se muestra una sola vez, y se puede desactivar o borrar cuando quieras.",
        },
        {
          tipo: "lista",
          items: [
            "La misma pantalla documenta la dirección base, los filtros, cómo crear y modificar, y un ejemplo real de cada recurso.",
            "Los adjuntos de notas se suben aparte (hasta 10 MB) y se enlazan a la nota.",
            "Todo queda aislado a tu organización automáticamente: una clave no puede ver datos de otra.",
          ],
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: registrar cada alta de tu tienda online",
          texto:
            "Tu tienda, al crear un cliente, hace una petición a la API con nombre, correo y teléfono. En el CRM aparece como contacto nuevo en segundos y, si tienes la automatización de bienvenida, recibe el correo. Nadie copia nada.",
        },
      ],
    },
    {
      id: "webhooks",
      titulo: "Webhooks: que el CRM avise a tus otros sistemas",
      resumen:
        "Una URL tuya a la que el CRM manda un aviso cada vez que se crea, cambia o elimina algo. Conecta n8n, Zapier, Make o tu propio servidor.",
      ruta: "/integraciones",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Es lo contrario de la API: en vez de que tu sistema pregunte, el CRM le avisa. Eliges qué eventos quieres (por ejemplo, solo «contacto creado» y «oportunidad ganada») y cada aviso llega firmado, para que tu sistema compruebe que es legítimo. Si tu servidor no responde, se reintenta hasta cinco veces con esperas crecientes.",
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: avisar por Slack cuando se gana una venta",
          texto:
            "Un flujo de n8n escucha el webhook «oportunidad actualizada», comprueba que la etapa es «Ganada» y publica en el canal de ventas: «Ana ha cerrado Casa Lola por 10.800 €/año». Cero trabajo manual.",
        },
      ],
    },
    {
      id: "asistentes-de-ia",
      titulo: "Asistentes de IA (MCP)",
      resumen:
        "Conecta Claude u otro asistente a tu CRM y pídele las cosas en lenguaje natural: «¿qué tareas tengo hoy?», «crea una oportunidad con Casa Lola por 900 € al mes».",
      ruta: "/profile",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Vinqulia expone un servidor MCP (Model Context Protocol, el estándar con el que los asistentes de IA usan herramientas). La dirección está en tu perfil. Al conectarla, el asistente dispone de unas cuarenta herramientas concretas: buscar y ver contactos, crear notas y tareas, ver el historial completo de un contacto, resumir el embudo, mover oportunidades, abrir tickets, usar plantillas de correo, consultar clientes y sus contratos. Todo con tus permisos y solo sobre tu organización.",
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplo: al volver de una reunión",
          texto:
            "«Acabo de reunirme con Marta García de Casa Lola: quieren empezar en octubre con 900 € al mes, y me pidió una muestra de pan sin gluten. Apúntalo.» El asistente deja la nota en la ficha de Marta, crea la oportunidad en el embudo de ventas y una tarea «Enviar muestra sin gluten» para mañana.",
        },
        {
          tipo: "consejo",
          texto:
            "Es la forma más rápida de mantener el CRM al día desde el móvil: dictar al asistente en vez de rellenar formularios.",
        },
      ],
    },
    {
      id: "clientes-por-api",
      titulo: "Clientes por API: conectar tu facturación",
      resumen:
        "Con el módulo Clientes activo, tu sistema de facturación, ERP o tienda registra cada venta y cada contrato en el CRM.",
      ruta: "/integraciones",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "No hace falta conocer los identificadores del CRM: la venta llega con el RFC/NIF, el correo o tu propio identificador del cliente, y el CRM la asigna a la empresa correcta. Si no la encuentra, no inventa una (responde con un error claro), para que nunca acabes con la misma empresa tres veces. Reenviar la misma venta la actualiza en vez de duplicarla, así un reintento no ensucia los datos. Los contratos y suscripciones se registran igual, y al renovarse o cambiar de importe se vuelven a enviar.",
        },
      ],
    },
    {
      id: "vistas-guardadas",
      titulo: "Vistas guardadas",
      resumen:
        "Guarda una combinación de filtros y orden con un nombre, para toda la organización.",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "En cualquier lista, aplica los filtros y el orden que quieras y pulsa «Vistas → Guardar vista actual…». Le pones nombre («Calientes sin llamar esta semana», «Oportunidades de más de 5.000 €») y queda disponible para todo el equipo en el mismo botón.",
        },
      ],
    },
    {
      id: "campos-personalizados",
      titulo: "Campos personalizados",
      resumen:
        "Los datos que son solo de tu negocio, en contactos, empresas y oportunidades.",
      ruta: "/settings",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Desde Ajustes → Campos personalizados añades campos de tipo texto, número, fecha, lista de opciones o casilla. Aparecen en el formulario y en la ficha, se pueden importar por CSV, exportar, usar en las plantillas de correo y leer o escribir por la API. Un valor que sea una dirección web se muestra como enlace.",
        },
        {
          tipo: "ejemplo",
          titulo: "Ejemplos por sector",
          texto:
            "Inmobiliaria: «Superficie (m²)», «Zona» (lista). Escuela: «Grado», «Fecha de matrícula». Taller: «Matrícula del vehículo», «Kilómetros». Clínica: «Número de historia», «Alergias» (texto).",
        },
      ],
    },
    {
      id: "fusion-y-duplicados",
      titulo: "Duplicados y fusión de contactos",
      resumen:
        "Cómo evita el CRM que la misma persona esté dos veces, y qué hacer si ya lo está.",
      bloques: [
        {
          tipo: "lista",
          items: [
            "Al crear un contacto, si ya existe uno con el mismo correo o un nombre parecido, aparece un aviso con el enlace al existente.",
            "Al importar, el resumen previo marca los duplicados por correo antes de confirmar.",
            "Si ya tienes dos fichas de la misma persona, abre la que sobra y usa «Fusionar con otro contacto»: eliges la que se conserva y el CRM traslada notas, tareas, etiquetas y datos que faltaban. No se puede deshacer, así que revisa qué se va a fusionar antes de confirmar.",
          ],
        },
      ],
    },
    {
      id: "plan-y-facturacion",
      titulo: "Plan y facturación",
      resumen:
        "Tu plan, lo que llevas consumido y cómo cambiarlo. Los cobros van por Stripe; aquí nunca se guardan tarjetas.",
      ruta: "/facturacion",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cada plan tiene límites (contactos, usuarios, embudos). El consumo se ve siempre en el pie de la barra lateral y al detalle en Plan y facturación, donde también están los planes disponibles y el acceso a gestionar la suscripción o el método de pago. Borrar libera cupo. Solo un administrador puede cambiar de plan.",
        },
        {
          tipo: "parrafo",
          texto:
            "El plan Enterprise no tiene precio fijo: infraestructura propia, SSO, integraciones a medida, despliegues personalizados, SLA y equipos grandes se cotizan según el proyecto. Pídelo desde esa misma pantalla o desde «Funcionalidades a tu medida», aquí abajo.",
        },
      ],
    },
  ],
};

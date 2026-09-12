import type { Pregunta } from "./tipos";

/**
 * Preguntas frecuentes. Respuestas cortas; cuando hay más que decir, la
 * pregunta enlaza a la sección de la guía que lo cuenta entero.
 */
export const PREGUNTAS_FRECUENTES: Pregunta[] = [
  {
    pregunta: "¿Cuál es la diferencia entre un contacto y una empresa?",
    respuesta:
      "El contacto es la persona (Marta García); la empresa es el negocio (Restaurante Casa Lola). Una empresa puede tener varios contactos. Si tratas con autónomos, cada uno puede ser contacto y empresa a la vez, o solo contacto.",
    seccion: "conceptos",
  },
  {
    pregunta: "¿Qué es una oportunidad? ¿Es lo mismo que un cliente?",
    respuesta:
      "No. Una oportunidad es una venta concreta que intentas cerrar (con importe y etapa). Un cliente es una empresa a la que ya le has vendido. Una empresa puede tener varias oportunidades a lo largo del tiempo.",
    seccion: "oportunidades",
  },
  {
    pregunta:
      "¿Por qué el panel dice que no hay importes en las oportunidades?",
    respuesta:
      "Porque las oportunidades abiertas no tienen importe. Edítalas y pon una cifra, aunque sea aproximada: sin importe no hay previsión ni informes.",
    seccion: "panel",
  },
  {
    pregunta: "¿Cómo cambio el estado de un contacto a «caliente»?",
    respuesta:
      "Desde la ficha del contacto: escribe una nota, pulsa «Mostrar opciones» y elige el estado. Se guarda con la nota, así queda constancia de por qué cambió.",
    seccion: "contactos",
  },
  {
    pregunta: "¿Puedo importar mis contactos desde Excel?",
    respuesta:
      "Sí. Guarda la hoja como CSV con las columnas del ejemplo que se descarga en Importar datos, súbela y confirma el resumen. Las empresas y etiquetas que no existan se crean solas.",
    seccion: "importar-datos",
  },
  {
    pregunta: "He creado dos veces a la misma persona. ¿Qué hago?",
    respuesta:
      "Abre la ficha que sobra y usa «Fusionar con otro contacto». Eliges la que se conserva y se trasladan notas, tareas y etiquetas. No se puede deshacer.",
    seccion: "fusion-y-duplicados",
  },
  {
    pregunta: "¿Cómo cambio las etapas del embudo o la moneda?",
    respuesta:
      "En Ajustes → Oportunidades (solo administradores). Puedes tener varios embudos, cada uno con sus etapas, y marcar cuáles significan ganada o perdida.",
    seccion: "ajustes",
  },
  {
    pregunta: "¿Por qué los importes salen en dólares si vendo en euros?",
    respuesta:
      "La moneda se elige en Ajustes → Oportunidades → Moneda. Cámbiala a EUR y todos los importes se muestran con €.",
    seccion: "ajustes",
  },
  {
    pregunta: "¿Puedo enviar correos desde el CRM?",
    respuesta:
      "Sí, desde la ficha del contacto (botón «Enviar correo») y desde las automatizaciones con una plantilla. Antes hay que configurar el servidor de salida en Ajustes → Correo saliente con tu propio dominio.",
    seccion: "correo-saliente",
  },
  {
    pregunta: "¿Y WhatsApp?",
    respuesta:
      "Desde la ficha del contacto, «Enviar WhatsApp» abre el mensaje al teléfono del contacto. Es un envío manual, uno a uno.",
    seccion: "contactos",
  },
  {
    pregunta: "¿Cómo hago que el CRM cree tareas o envíe correos solo?",
    respuesta:
      "Con una automatización: «cuando se cree un contacto / una oportunidad llegue a una etapa / falten N días para una renovación → crear tarea, asignar responsable o enviar plantilla». Se configuran en Ajustes → Automatizaciones.",
    seccion: "automatizaciones",
  },
  {
    pregunta: "¿Puedo poner un formulario en mi web que cree contactos?",
    respuesta:
      "Sí. En Ajustes → Formularios web creas uno, copias el enlace o el iframe y lo pegas en tu página. Cada envío entra como contacto (o como ticket, según el tipo).",
    seccion: "formularios-web",
  },
  {
    pregunta: "¿Qué ve un usuario normal que no vea un administrador?",
    respuesta:
      "Ambos ven todos los datos de la organización. Solo el administrador entra en Ajustes (listas, campos, automatizaciones, integraciones), gestiona usuarios y cambia de plan.",
    seccion: "usuarios",
  },
  {
    pregunta: "¿Puedo borrar un usuario?",
    respuesta:
      "No, se desactiva. Así se conserva quién dejó cada nota y cada tarea. Un usuario desactivado no puede entrar.",
    seccion: "usuarios",
  },
  {
    pregunta: "¿Qué pasa si llego al límite de contactos de mi plan?",
    respuesta:
      "El CRM avisa y no deja crear más hasta que subas de plan o borres contactos (borrar libera cupo). El consumo se ve siempre en el pie de la barra lateral.",
    seccion: "plan-y-facturacion",
  },
  {
    pregunta: "¿Mis datos están separados de los de otras empresas?",
    respuesta:
      "Sí. Cada organización tiene sus datos aislados: ni un usuario, ni una clave de API, ni un asistente de IA pueden ver los de otra organización.",
    seccion: "api-y-claves",
  },
  {
    pregunta: "¿Se puede conectar con mi programa de facturación o mi tienda?",
    respuesta:
      "Sí, por la API (tu sistema escribe en el CRM) y por webhooks (el CRM avisa a tu sistema). Con el módulo Clientes, la facturación puede registrar cada venta y contrato. Si necesitas que lo hagamos nosotros, pídelo en «Funcionalidades a tu medida».",
    seccion: "api-y-claves",
  },
  {
    pregunta: "¿Puedo usar Claude u otro asistente de IA con mis datos?",
    respuesta:
      "Sí. En tu perfil está la dirección del servidor MCP; al conectarla, el asistente puede consultar y actualizar el CRM por conversación con tus permisos.",
    seccion: "asistentes-de-ia",
  },
  {
    pregunta: "¿Funciona en el móvil?",
    respuesta:
      "Sí, con una navegación pensada para pantalla pequeña: Panel, Contactos, crear, Tareas y Ajustes abajo. Las fichas se organizan en pestañas (notas, tareas, detalles).",
    seccion: "navegacion",
  },
  {
    pregunta: "¿Cómo cambio a modo oscuro?",
    respuesta:
      "Con el icono del sol/luna de la cabecera: claro, oscuro o el del sistema.",
    seccion: "navegacion",
  },
  {
    pregunta: "Necesito algo que el CRM no hace. ¿Se puede?",
    respuesta:
      "Casi siempre. Cuéntanoslo en «Funcionalidades a tu medida» (aquí abajo): integraciones, módulos por sector, informes especiales, SSO, infraestructura propia… Te respondemos con una propuesta.",
    seccion: "funcionalidades-a-medida",
  },
];

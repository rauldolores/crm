import { RESPONSABLE, URL_APP, URL_SITIO } from "../lib/sitio";

/**
 * Textos legales de Vinqulia: aviso de privacidad (con la estructura que
 * pide la LFPDPPP: identidad y domicilio del responsable, datos que se
 * tratan, finalidades, transferencias, derechos ARCO y cambios) y términos
 * del servicio (cuenta, planes, prueba, cancelación y reembolsos, datos del
 * cliente, disponibilidad, responsabilidad).
 *
 * Son datos, no JSX, para que se lean y revisen como un documento. Cada
 * sección es un título más párrafos; las listas van como párrafos que
 * empiezan por «• ». Revisión legal pendiente: son un punto de partida
 * honesto, no una opinión jurídica.
 */

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
}

export interface DocumentoLegal {
  slug: string;
  titulo: string;
  descripcion: string;
  secciones: SeccionLegal[];
}

const responsable = RESPONSABLE.razonSocial;
const domicilio = RESPONSABLE.domicilio
  ? ` con domicilio en ${RESPONSABLE.domicilio},`
  : "";

export const AVISO_DE_PRIVACIDAD: DocumentoLegal = {
  slug: "aviso-de-privacidad",
  titulo: "Aviso de privacidad",
  descripcion:
    "Qué datos personales trata Vinqulia, para qué, con quién los comparte y cómo ejercer tus derechos ARCO.",
  secciones: [
    {
      titulo: "Responsable",
      parrafos: [
        `${responsable} (en adelante «Kontrolia»),${domicilio} es responsable del tratamiento de los datos personales que se recaban a través del sitio ${URL_SITIO} y de la aplicación Vinqulia (${URL_APP}), en los términos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento.`,
        `Para cualquier asunto relacionado con este aviso puedes escribir a ${RESPONSABLE.correoPrivacidad}.`,
      ],
    },
    {
      titulo: "Datos que se tratan",
      parrafos: [
        "Al pedir una demo, registrarte o usar la aplicación podemos tratar: nombre, correo electrónico, teléfono, empresa, puesto, datos de facturación (razón social, RFC y domicilio fiscal) y datos técnicos de uso (dirección IP, navegador, páginas visitadas, registros de actividad).",
        "No recabamos datos personales sensibles. No guardamos datos de tarjetas: los pagos los procesa Stripe en sus propias páginas.",
        "Vinqulia es una herramienta en la que tu organización registra datos de sus propios clientes y contactos. Respecto de esos datos, tu organización es la responsable y Kontrolia actúa como encargado: los trata únicamente para prestarte el servicio, conforme a tus instrucciones, y no los usa con fines propios.",
      ],
    },
    {
      titulo: "Finalidades",
      parrafos: [
        "• Necesarias: crear y administrar tu cuenta y tu organización; prestar el servicio contratado; atender tu solicitud de demo o de contacto; facturar y cobrar; dar soporte; enviar avisos operativos (cambios en el servicio, seguridad, facturación); cumplir obligaciones legales.",
        "• Secundarias: enviarte información comercial sobre Vinqulia y otros productos de Kontrolia, y medir el uso del sitio para mejorarlo. Puedes oponerte a estas finalidades en cualquier momento escribiendo al correo indicado arriba; no afecta al servicio.",
      ],
    },
    {
      titulo: "Transferencias y encargados",
      parrafos: [
        "Solo compartimos datos con proveedores que necesitamos para operar el servicio y que actúan por cuenta de Kontrolia: infraestructura y bases de datos (Vercel, Supabase), procesamiento de pagos (Stripe), envío de correo (Resend u otro proveedor que configures), mensajería (Twilio, si activas WhatsApp) y proveedores de inteligencia artificial cuando usas funciones que los requieren. Algunos están fuera de México; en todos los casos se rigen por contratos y medidas de seguridad equivalentes a las de este aviso.",
        "No vendemos ni cedemos datos personales a terceros con fines distintos. Podremos comunicarlos cuando lo exija una autoridad competente.",
      ],
    },
    {
      titulo: "Conservación y seguridad",
      parrafos: [
        "Conservamos los datos mientras tengas cuenta y, después, el tiempo que exijan las obligaciones fiscales y legales. Al cancelar tu organización puedes pedir la exportación o la eliminación de sus datos.",
        "Aplicamos medidas administrativas, técnicas y físicas razonables: cifrado en tránsito, control de acceso por organización, registro de actividad y copias de seguridad.",
      ],
    },
    {
      titulo: "Derechos ARCO y revocación",
      parrafos: [
        `Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, así como revocar tu consentimiento o limitar su uso, escribiendo a ${RESPONSABLE.correoPrivacidad} con tu nombre, el correo con el que te registraste y el derecho que quieres ejercer. Responderemos en un plazo máximo de 20 días hábiles.`,
        "Si consideras que tu derecho a la protección de datos ha sido vulnerado puedes acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).",
      ],
    },
    {
      titulo: "Cookies",
      parrafos: [
        "El sitio usa cookies y tecnologías similares estrictamente necesarias para funcionar (sesión, preferencias) y, en su caso, de medición de uso. Puedes deshabilitarlas en tu navegador; la aplicación necesita las de sesión para funcionar.",
      ],
    },
    {
      titulo: "Cambios a este aviso",
      parrafos: [
        `Publicaremos cualquier cambio en esta misma página. Última actualización: ${RESPONSABLE.actualizado}.`,
      ],
    },
  ],
};

export const TERMINOS: DocumentoLegal = {
  slug: "terminos",
  titulo: "Términos y condiciones del servicio",
  descripcion:
    "Condiciones de uso de Vinqulia: cuenta, planes y pagos, prueba gratis, cancelación y reembolsos, tus datos y responsabilidades.",
  secciones: [
    {
      titulo: "El servicio",
      parrafos: [
        `Vinqulia es un software de gestión comercial (CRM) que ${responsable} («Kontrolia») ofrece como servicio en línea en ${URL_APP}. Al crear una cuenta o usar el servicio aceptas estos términos y el aviso de privacidad.`,
      ],
    },
    {
      titulo: "Cuenta y organización",
      parrafos: [
        "Quien crea una organización es su propietario y responde por los usuarios que invite. Eres responsable de la confidencialidad de tus credenciales y de todo lo que se haga desde tu cuenta. Debes tener capacidad legal para contratar en nombre de tu empresa.",
      ],
    },
    {
      titulo: "Planes, precios y pagos",
      parrafos: [
        "Los planes, sus límites (usuarios, contactos, embudos) y precios son los publicados en la sección de precios y en la propia aplicación, en pesos mexicanos más el IVA aplicable. El cobro es por adelantado, mensual o anual según elijas, mediante Stripe. Al contratar aceptas el cargo recurrente hasta que canceles.",
        "Podemos cambiar los precios avisándote con al menos 30 días de anticipación; el cambio aplica a partir de tu siguiente periodo de facturación.",
        "Los límites del plan se aplican en la aplicación: al alcanzarlos podrás subir de plan o esperar al siguiente periodo, sin perder tus datos.",
      ],
    },
    {
      titulo: "Prueba gratis",
      parrafos: [
        "El plan Impulso incluye un periodo de prueba de 30 días. Para iniciarla se registra una tarjeta, pero no se hace ningún cargo durante la prueba; puedes cancelar sin costo antes de que termine y, si no cancelas, el primer cobro se realiza al concluir.",
      ],
    },
    {
      titulo: "Cancelación y reembolsos",
      parrafos: [
        "Puedes cancelar en cualquier momento desde Plan y facturación (portal de facturación). La cancelación surte efecto al final del periodo ya pagado: conservas el acceso hasta entonces y no se generan cargos nuevos.",
        "Los periodos ya cobrados no son reembolsables, salvo que la ley aplicable disponga otra cosa o que el servicio no haya estado disponible por causas imputables a Kontrolia durante una parte sustancial del periodo, en cuyo caso reembolsaremos la parte proporcional.",
        "Tras la cancelación conservamos tus datos 30 días para que puedas exportarlos; después se eliminan.",
      ],
    },
    {
      titulo: "Tus datos",
      parrafos: [
        "Los datos que tu organización registra en Vinqulia son tuyos. Kontrolia los trata solo para prestarte el servicio, no los vende ni los usa con otros fines, y puedes exportarlos en cualquier momento (CSV y API). Tú eres responsable de tener base legal para tratar los datos de tus contactos.",
      ],
    },
    {
      titulo: "Uso aceptable",
      parrafos: [
        "No puedes usar el servicio para enviar comunicaciones no solicitadas masivas, para actividades ilícitas, para vulnerar derechos de terceros ni para intentar acceder a datos de otras organizaciones. Podemos suspender una cuenta que incumpla estas condiciones, avisándote salvo que la gravedad lo impida.",
      ],
    },
    {
      titulo: "Disponibilidad y soporte",
      parrafos: [
        "Trabajamos para que el servicio esté disponible de forma continua, pero puede haber interrupciones por mantenimiento, fallos de proveedores o causas fuera de nuestro control. El soporte se presta por los canales indicados en la página de contacto, en horario hábil de México. Los niveles de servicio (SLA) con compromiso contractual solo existen en el plan Enterprise.",
      ],
    },
    {
      titulo: "Propiedad intelectual",
      parrafos: [
        "El software, la marca Vinqulia y los materiales del sitio son de Kontrolia. Te otorgamos una licencia de uso no exclusiva e intransferible mientras dure tu suscripción. No puedes copiar, revender ni hacer ingeniería inversa del servicio.",
      ],
    },
    {
      titulo: "Limitación de responsabilidad",
      parrafos: [
        "El servicio se presta «tal cual». En la medida que la ley lo permita, la responsabilidad total de Kontrolia frente a ti se limita al importe que hayas pagado por el servicio en los 12 meses anteriores al hecho que la origine, y no cubre daños indirectos, lucro cesante ni pérdida de datos que no hayas exportado.",
      ],
    },
    {
      titulo: "Cambios y ley aplicable",
      parrafos: [
        "Podemos actualizar estos términos; publicaremos la versión vigente en esta página y, si el cambio es relevante, te avisaremos por correo. Seguir usando el servicio tras el aviso implica aceptarlos.",
        `Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Última actualización: ${RESPONSABLE.actualizado}.`,
      ],
    },
  ],
};

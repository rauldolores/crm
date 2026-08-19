import type { ConfigurationContextValue } from "./ConfigurationContext";
// Los logos se importan como recurso del modulo y no con una ruta relativa,
// que se rompe en rutas anidadas y bajo un subdirectorio de despliegue.
import darkModeLogo from "./logos/logo_vinqulia_dark.svg";
import lightModeLogo from "./logos/logo_vinqulia_light.svg";

/**
 * Next devuelve un objeto al importar una imagen (`{ src, width, height }`),
 * mientras que Vite devolvia directamente la URL. Como estos valores acaban en
 * el atributo `src` de una etiqueta `img`, sin normalizar se convertian en la
 * cadena "[object Object]" y el navegador pedia esa ruta inexistente.
 */
const urlDelRecurso = (recurso: unknown): string =>
  typeof recurso === "string"
    ? recurso
    : ((recurso as { src?: string })?.src ?? "");

export const defaultDarkModeLogo = urlDelRecurso(darkModeLogo);
export const defaultLightModeLogo = urlDelRecurso(lightModeLogo);

export const defaultCurrency = "USD";

export const defaultTitle = "Vinqulia";

// En todas estas listas `value` es la clave que se guarda en la base de datos y
// `label` es lo único que ve el usuario. Al traducir se cambian solo las
// etiquetas: tocar los valores obligaría a migrar los datos existentes.
export const defaultCompanySectors = [
  { value: "communication-services", label: "Servicios de comunicación" },
  { value: "consumer-discretionary", label: "Consumo discrecional" },
  { value: "consumer-staples", label: "Consumo básico" },
  { value: "energy", label: "Energía" },
  { value: "financials", label: "Finanzas" },
  { value: "health-care", label: "Salud" },
  { value: "industrials", label: "Industria" },
  { value: "information-technology", label: "Tecnología de la información" },
  { value: "materials", label: "Materiales" },
  { value: "real-estate", label: "Inmobiliario" },
  { value: "utilities", label: "Servicios públicos" },
];

export const defaultDealStages = [
  { value: "opportunity", label: "Oportunidad" },
  { value: "proposal-sent", label: "Propuesta enviada" },
  { value: "in-negociation", label: "En negociación" },
  { value: "won", label: "Ganada" },
  { value: "lost", label: "Perdida" },
  { value: "delayed", label: "Aplazada" },
];

export const defaultDealPipelineStatuses = ["won"];

export const defaultDealLostStages = ["lost"];

/**
 * El embudo por defecto se llama «ventas»: es también el valor que reciben
 * las oportunidades creadas antes de que existieran los embudos múltiples
 * (valor por defecto de la columna `pipeline` en la base).
 */
export const defaultDealPipelines = [
  {
    value: "ventas",
    label: "Ventas",
    stages: defaultDealStages,
    pipelineStatuses: defaultDealPipelineStatuses,
    lostStages: defaultDealLostStages,
  },
];

// Motivos de pérdida de fábrica. Sirven para cualquier giro; cada
// organización los ajusta desde Ajustes.
export const defaultDealLossReasons = [
  { value: "price", label: "Precio" },
  { value: "competitor", label: "Se fue con la competencia" },
  { value: "timing", label: "No era el momento" },
  { value: "no-budget", label: "Sin presupuesto" },
  { value: "no-response", label: "Dejó de responder" },
  { value: "other", label: "Otro" },
];

export const defaultDealCategories = [
  { value: "other", label: "Otro" },
  { value: "copywriting", label: "Redacción" },
  { value: "print-project", label: "Proyecto de impresión" },
  { value: "ui-design", label: "Diseño de interfaz" },
  { value: "website-design", label: "Diseño web" },
];

export const defaultNoteStatuses = [
  { value: "cold", label: "Frío", color: "#7dbde8" },
  { value: "warm", label: "Templado", color: "#e8cb7d" },
  { value: "hot", label: "Caliente", color: "#e88b7d" },
  { value: "in-contract", label: "Con contrato", color: "#a4e87d" },
];

// Tipos de actividad de fábrica. El icono de cada uno vive en el código
// (ver getActivityTypeIcon en notes/noteModel.ts), no aquí: un tipo que la
// organización agregue o renombre desde Ajustes usa el icono genérico.
export const defaultNoteTypes = [
  { value: "note", label: "Nota" },
  { value: "call", label: "Llamada" },
  { value: "meeting", label: "Reunión" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Correo" },
  { value: "web", label: "Formulario web" },
];

export const defaultTaskTypes = [
  { value: "none", label: "Ninguno" },
  { value: "email", label: "Correo electrónico" },
  { value: "demo", label: "Demostración" },
  { value: "lunch", label: "Comida" },
  { value: "meeting", label: "Reunión" },
  { value: "follow-up", label: "Seguimiento" },
  { value: "thank-you", label: "Agradecimiento" },
  { value: "ship", label: "Entrega" },
  { value: "call", label: "Llamada" },
];

export const defaultConfiguration: ConfigurationContextValue = {
  companySectors: defaultCompanySectors,
  currency: defaultCurrency,
  dealCategories: defaultDealCategories,
  dealPipelineStatuses: defaultDealPipelineStatuses,
  dealStages: defaultDealStages,
  dealPipelines: defaultDealPipelines,
  dealLossReasons: defaultDealLossReasons,
  noteStatuses: defaultNoteStatuses,
  noteTypes: defaultNoteTypes,
  taskTypes: defaultTaskTypes,
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
  // Sin campos personalizados de fábrica: cada organización define los suyos
  // desde Ajustes según su industria.
  contactCustomFields: [],
  companyCustomFields: [],
  dealCustomFields: [],
};

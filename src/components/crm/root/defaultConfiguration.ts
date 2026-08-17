import type { ConfigurationContextValue } from "./ConfigurationContext";
// Los logos se importan como recurso del modulo y no con una ruta relativa,
// que se rompe en rutas anidadas y bajo un subdirectorio de despliegue.
import darkModeLogo from "./logos/logo_kontrolia_crm_dark.svg";
import lightModeLogo from "./logos/logo_kontrolia_crm_light.svg";

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

export const defaultTitle = "Kontrolia CRM";

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
  noteStatuses: defaultNoteStatuses,
  taskTypes: defaultTaskTypes,
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
};

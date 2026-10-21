/**
 * Plantillas de WhatsApp: la forma con la que las usa el CRM y las
 * operaciones puras sobre ellas. Sin red ni secretos, para que las compartan
 * el servidor (que las envía y deja la nota) y el diálogo (que enseña la
 * vista previa): así lo que ves antes de enviar es exactamente lo que llega.
 *
 * Por qué existen: WhatsApp solo deja escribirle a alguien con texto libre
 * durante las 24 horas siguientes a su último mensaje. Fuera de esa ventana
 * —y un primer contacto en frío siempre está fuera— solo se puede enviar una
 * plantilla aprobada por Meta. Las plantillas se crean y se aprueban en
 * Twilio; aquí solo se eligen y se rellenan.
 */

export interface VariableDePlantilla {
  /** Como aparece en el cuerpo, sin llaves: «1» para {{1}}. */
  clave: string;
  /** El valor de muestra que se dio en Twilio. Solo orienta: nunca se envía. */
  ejemplo: string;
}

export interface PlantillaDeWhatsapp {
  /** Content SID de Twilio (HX…). */
  sid: string;
  nombre: string;
  idioma: string;
  /** MARKETING, UTILITY… tal como la clasificó Meta. */
  categoria: string | null;
  cuerpo: string;
  variables: VariableDePlantilla[];
}

/** Si el contacto puede recibir texto libre ahora mismo. */
export interface VentanaDeConversacion {
  abierta: boolean;
  /** Fecha del último mensaje que nos escribió, si lo hay. */
  ultimoMensaje: string | null;
  /**
   * false cuando no se pudo preguntar a Twilio. Entonces `abierta` es false
   * a propósito: ante la duda se pide una plantilla, que llega siempre.
   */
  comprobada: boolean;
}

export interface OpcionesDeWhatsapp {
  ventana: VentanaDeConversacion;
  plantillas: PlantillaDeWhatsapp[];
  /** Por qué no hay plantillas que elegir, cuando no es que no existan. */
  errorDePlantillas: string | null;
}

export type ContenidoDeWhatsapp =
  | { mensaje: string }
  | { plantilla: { sid: string; variables: Record<string, string> } };

/** Content SID de una plantilla: HX y 32 caracteres hexadecimales. */
export const SID_DE_PLANTILLA = /^HX[0-9a-fA-F]{32}$/;

const marcador = () => /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

/** Las claves de los {{marcadores}} del cuerpo, sin repetir y en orden de aparición. */
export function clavesDelCuerpo(cuerpo: string): string[] {
  return [...new Set([...cuerpo.matchAll(marcador())].map((m) => m[1]))];
}

/**
 * Lo mismo que hace Meta con el valor de una variable: sin saltos de línea,
 * tabuladores ni rachas de espacios, que rechaza en los parámetros de una
 * plantilla.
 */
export function limpiarValor(valor: string): string {
  return valor.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
}

/**
 * El cuerpo con cada {{marcador}} sustituido. Lo que falte se deja tal cual,
 * con sus llaves: en la vista previa salta a la vista, y el servidor no
 * envía nunca una plantilla incompleta (Twilio usaría el valor de muestra y
 * le llegaría un «Juan» a quien no se llama así).
 */
export function rellenarPlantilla(
  cuerpo: string,
  valores: Record<string, string>,
): string {
  return cuerpo.replace(marcador(), (completo, clave: string) => {
    const valor = limpiarValor(valores[clave] ?? "");
    return valor || completo;
  });
}

/** Las variables que aún no tienen valor, en el orden de la plantilla. */
export function variablesSinRellenar(
  plantilla: Pick<PlantillaDeWhatsapp, "variables">,
  valores: Record<string, string>,
): string[] {
  return plantilla.variables
    .map(({ clave }) => clave)
    .filter((clave) => !limpiarValor(valores[clave] ?? ""));
}

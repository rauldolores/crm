import type {
  PlantillaDeWhatsapp,
  VariableDePlantilla,
} from "@/lib/whatsapp/plantillas";
import { clavesDelCuerpo, SID_DE_PLANTILLA } from "@/lib/whatsapp/plantillas";

import { autorizacionDeTwilio } from "../twilioWhatsapp";

/**
 * Las plantillas de WhatsApp aprobadas de la cuenta de Twilio del despliegue.
 *
 * Se crean y se mandan a aprobar en Twilio (Content Template Builder), no
 * aquí: la aprobación es de Meta y tarda de minutos a un día, y construir esa
 * pantalla en el CRM sería duplicar la de Twilio. Este módulo solo las lee.
 *
 * Son de la cuenta, no de la organización, igual que el número de WhatsApp,
 * que también es uno solo para todo el despliegue (ver el webhook entrante).
 */

const API = "https://content.twilio.com/v1/ContentAndApprovals?PageSize=500";

/** Tope de páginas a recorrer: 2.500 plantillas, más que de sobra. */
const MAX_PAGINAS = 5;

type Resultado =
  | { ok: true; plantillas: PlantillaDeWhatsapp[] }
  | { ok: false; mensaje: string };

const comoObjeto = (valor: unknown): Record<string, unknown> =>
  valor && typeof valor === "object" ? (valor as Record<string, unknown>) : {};

/**
 * El texto de la plantilla. Cada tipo de contenido (twilio/text,
 * twilio/media, twilio/quick-reply…) lo guarda en su propio objeto; casi todos
 * en `body`, y las tarjetas en `title`.
 */
function cuerpoDe(tipos: Record<string, unknown>): string {
  for (const tipo of Object.values(tipos)) {
    const { body, title } = comoObjeto(tipo);
    if (typeof body === "string" && body.trim()) return body;
    if (typeof title === "string" && title.trim()) return title;
  }
  return "";
}

/** Claves numéricas en orden numérico ({{2}} antes que {{10}}); el resto, como vengan. */
const ordenarClaves = (claves: string[]) =>
  claves.every((clave) => /^\d+$/.test(clave))
    ? [...claves].sort((a, b) => Number(a) - Number(b))
    : claves;

/**
 * Una plantilla tal como la devuelve Twilio, o `null` si no se puede usar:
 * sin aprobar, sin texto o con un SID que no lo es.
 *
 * El estado de aprobación se busca en `approval_requests` y, por si la API
 * lo anida por canal como hace /ApprovalRequests, también en su `whatsapp`.
 */
export function leerPlantilla(dato: unknown): PlantillaDeWhatsapp | null {
  const fila = comoObjeto(dato);
  const sid = typeof fila.sid === "string" ? fila.sid : "";
  if (!SID_DE_PLANTILLA.test(sid)) return null;

  const solicitud = comoObjeto(fila.approval_requests);
  const aprobacion =
    "whatsapp" in solicitud ? comoObjeto(solicitud.whatsapp) : solicitud;
  if (aprobacion.status !== "approved") return null;

  const cuerpo = cuerpoDe(comoObjeto(fila.types));
  if (!cuerpo) return null;

  const ejemplos = comoObjeto(fila.variables);
  const claves = ordenarClaves([
    ...new Set([...clavesDelCuerpo(cuerpo), ...Object.keys(ejemplos)]),
  ]);
  const variables: VariableDePlantilla[] = claves.map((clave) => ({
    clave,
    ejemplo: typeof ejemplos[clave] === "string" ? (ejemplos[clave] as string) : "",
  }));

  return {
    sid,
    nombre:
      typeof fila.friendly_name === "string" && fila.friendly_name
        ? fila.friendly_name
        : sid,
    idioma: typeof fila.language === "string" ? fila.language : "",
    categoria:
      typeof aprobacion.category === "string" ? aprobacion.category : null,
    cuerpo,
    variables,
  };
}

/**
 * La URL de la página siguiente, solo si sigue en content.twilio.com: la
 * petición lleva las credenciales de la cuenta en la cabecera, y seguir a
 * ciegas una URL que viene en la respuesta podría mandárselas a otro sitio.
 */
export function paginaSiguiente(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor) return null;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && url.host === "content.twilio.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function listarPlantillasAprobadas(): Promise<Resultado> {
  const autorizacion = autorizacionDeTwilio();
  if (!autorizacion) {
    return {
      ok: false,
      mensaje: "Falta configurar TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN.",
    };
  }

  const plantillas: PlantillaDeWhatsapp[] = [];
  let url: string | null = API;

  for (let pagina = 0; url && pagina < MAX_PAGINAS; pagina++) {
    const respuesta: Response | null = await fetch(url, {
      headers: { Authorization: autorizacion },
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);

    if (!respuesta) {
      return { ok: false, mensaje: "No se pudo contactar con Twilio." };
    }
    if (!respuesta.ok) {
      return {
        ok: false,
        mensaje: `Twilio respondió ${respuesta.status} al pedir las plantillas.`,
      };
    }

    const datos = comoObjeto(await respuesta.json().catch(() => null));
    const contenidos = Array.isArray(datos.contents) ? datos.contents : [];
    for (const contenido of contenidos) {
      const plantilla = leerPlantilla(contenido);
      if (plantilla) plantillas.push(plantilla);
    }

    url = paginaSiguiente(comoObjeto(datos.meta).next_page_url);
  }

  return {
    ok: true,
    plantillas: [...plantillas].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  };
}

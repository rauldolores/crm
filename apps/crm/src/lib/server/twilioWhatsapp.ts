/**
 * Cliente mínimo de la API de mensajería de Twilio para WhatsApp, para uso
 * EXCLUSIVO en servidor. Twilio expone WhatsApp con la misma API que SMS,
 * anteponiendo el prefijo `whatsapp:` al número.
 */

interface ResultadoDeEnvio {
  ok: boolean;
  mensaje?: string;
}

/** true cuando las tres variables de Twilio están configuradas. */
export function envioDeWhatsappConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM,
  );
}

/**
 * Código de país que se asume para un número de 10 dígitos escrito sin él.
 * Vinqulia se vende en México (MXN, SAT, CFDI), donde todos los números
 * tienen 10 dígitos, y así los teclea la gente en la ficha. Sin esto,
 * «5512345678» salía como «+5512345678», que es un número de Brasil: el
 * mensaje no le llegaba al contacto, o le llegaba a otra persona.
 */
const CODIGO_DE_PAIS_POR_DEFECTO = "+52";
const DIGITOS_DE_UN_NUMERO_NACIONAL = 10;

/**
 * Normaliza a dígitos + signo `+` (formato E.164, el que usa Twilio). Lo que
 * ya trae `+` o un código de país se respeta tal cual; solo un número
 * nacional de 10 dígitos recibe el código de México.
 */
export function normalizarTelefono(numero: string): string {
  const limpio = numero.replace(/[^\d+]/g, "");
  if (limpio.startsWith("+")) return limpio;
  return limpio.length === DIGITOS_DE_UN_NUMERO_NACIONAL
    ? `${CODIGO_DE_PAIS_POR_DEFECTO}${limpio}`
    : `+${limpio}`;
}

/**
 * Cabecera de autenticación de la cuenta de Twilio, la misma para la API de
 * mensajes y para la de plantillas (Content API). `null` sin credenciales.
 */
export function autorizacionDeTwilio(): string | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  return sid && token ? `Basic ${btoa(`${sid}:${token}`)}` : null;
}

/**
 * Texto libre o plantilla: Twilio no admite los dos a la vez. Con `ContentSid`
 * se omite `Body`, y las variables viajan como un JSON en texto
 * (`{"1": "Ana"}`).
 */
type Contenido =
  | { Body: string }
  | { ContentSid: string; ContentVariables: string };

/** Texto libre: solo llega dentro de la ventana de 24 h (ver `whatsapp/ventana`). */
export const enviarWhatsapp = (
  paraNumero: string,
  mensaje: string,
): Promise<ResultadoDeEnvio> => publicarMensaje(paraNumero, { Body: mensaje });

/** Plantilla aprobada: la única forma de iniciar una conversación. */
export const enviarPlantillaWhatsapp = (
  paraNumero: string,
  sid: string,
  valores: Record<string, string>,
): Promise<ResultadoDeEnvio> =>
  publicarMensaje(paraNumero, {
    ContentSid: sid,
    ContentVariables: JSON.stringify(valores),
  });

async function publicarMensaje(
  paraNumero: string,
  contenido: Contenido,
): Promise<ResultadoDeEnvio> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const desde = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !desde) {
    return {
      ok: false,
      mensaje:
        "Falta configurar TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM para enviar WhatsApp desde el CRM.",
    };
  }

  const cuerpo = new URLSearchParams({
    From: `whatsapp:${normalizarTelefono(desde)}`,
    To: `whatsapp:${normalizarTelefono(paraNumero)}`,
    ...contenido,
  });

  const respuesta = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: cuerpo,
    },
  ).catch(() => null);

  if (!respuesta) {
    return { ok: false, mensaje: "No se pudo contactar con Twilio." };
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    return {
      ok: false,
      mensaje:
        (datos as { message?: string }).message ||
        `Twilio respondió ${respuesta.status}.`,
    };
  }

  return { ok: true };
}

/**
 * Verifica la firma X-Twilio-Signature de una petición entrante: HMAC-SHA1
 * con el auth token, sobre la URL exacta del webhook (configurada en el panel
 * de Twilio) más cada par clave+valor del cuerpo, ordenado alfabéticamente y
 * concatenado sin separador. Sin esto, cualquiera podría enviar peticiones al
 * webhook y hacerse pasar por un contacto real.
 */
export async function firmaDeTwilioValida(
  urlDelWebhook: string,
  parametros: URLSearchParams,
  firmaRecibida: string | null,
): Promise<boolean> {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !firmaRecibida) return false;

  const claves = Array.from(parametros.keys()).sort();
  const base =
    urlDelWebhook + claves.map((clave) => clave + parametros.get(clave)).join("");

  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign(
    "HMAC",
    clave,
    new TextEncoder().encode(base),
  );
  const firmaCalculada = btoa(
    String.fromCharCode(...new Uint8Array(firma)),
  );

  return firmaCalculada === firmaRecibida;
}

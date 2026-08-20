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

/** Normaliza a dígitos + signo `+`, para comparar dos números tal cual los guarda Twilio (formato E.164). */
export function normalizarTelefono(numero: string): string {
  const limpio = numero.replace(/[^\d+]/g, "");
  return limpio.startsWith("+") ? limpio : `+${limpio}`;
}

export async function enviarWhatsapp(
  paraNumero: string,
  mensaje: string,
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
    Body: mensaje,
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

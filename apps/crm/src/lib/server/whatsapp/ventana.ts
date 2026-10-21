import type { VentanaDeConversacion } from "@/lib/whatsapp/plantillas";

import { autorizacionDeTwilio, normalizarTelefono } from "../twilioWhatsapp";

/**
 * ¿Puede este contacto recibir texto libre por WhatsApp ahora mismo?
 *
 * WhatsApp lo permite durante las 24 horas siguientes al último mensaje que
 * el contacto nos escribió; fuera de esa ventana solo pasa una plantilla
 * aprobada. Peor aún, Twilio acepta el envío igualmente y el fallo llega
 * después, por detrás: el CRM daría el mensaje por enviado y no lo estaría.
 * Por eso se comprueba ANTES de enviar.
 *
 * Se le pregunta a Twilio y no a las notas del CRM porque las notas de
 * WhatsApp entrantes y salientes se guardan igual (mismo tipo, mismo
 * responsable): desde la base no se distingue quién escribió a quién.
 *
 * Y no se filtra por el número exacto del contacto, sino por sus últimos 8
 * dígitos, la misma regla con la que el webhook entrante le asigna los
 * mensajes: WhatsApp entrega los móviles de México como +521…, mientras que
 * en la ficha suele estar +52… o los 10 dígitos a secas. Con un filtro exacto
 * casi nunca encontraría su respuesta, y el CRM pediría plantilla en plena
 * conversación.
 */

const VENTANA_MS = 24 * 60 * 60 * 1000;

/** Los mismos que usa `app/api/whatsapp/webhook` para reconocer al contacto. */
const DIGITOS_PARA_RECONOCER = 8;

/** Lo máximo que deja pedir Twilio en una página: los mensajes de un día. */
const MENSAJES_POR_PAGINA = 1000;

const SIN_COMPROBAR: VentanaDeConversacion = {
  abierta: false,
  ultimoMensaje: null,
  comprobada: false,
};

/** true si el último mensaje entrante es de hace menos de 24 horas. */
export function ventanaAbierta(
  ultimoMensaje: Date | null,
  ahora: Date = new Date(),
): boolean {
  if (!ultimoMensaje || Number.isNaN(ultimoMensaje.getTime())) return false;
  const transcurrido = ahora.getTime() - ultimoMensaje.getTime();
  return transcurrido >= 0 && transcurrido < VENTANA_MS;
}

/** La cola de dígitos con la que se reconoce un número, o "" si no da para ello. */
export function digitosParaReconocer(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  return digitos.length >= DIGITOS_PARA_RECONOCER
    ? digitos.slice(-DIGITOS_PARA_RECONOCER)
    : "";
}

/**
 * La fecha del mensaje más reciente que escribió ESE contacto, de una
 * respuesta de Twilio que trae los de todo el número. Se descarta lo que no
 * sea entrante: escribirle nosotros no abre ninguna ventana.
 */
export function ultimoMensajeEntrante(
  datos: unknown,
  numeroDelContacto: string,
): Date | null {
  const cola = digitosParaReconocer(numeroDelContacto);
  const mensajes = (datos as { messages?: unknown } | null)?.messages;
  if (!cola || !Array.isArray(mensajes)) return null;

  let ultimo: Date | null = null;
  for (const mensaje of mensajes) {
    const { direction, from, date_sent } = (mensaje ?? {}) as {
      direction?: unknown;
      from?: unknown;
      date_sent?: unknown;
    };
    if (direction !== "inbound") continue;
    if (typeof from !== "string" || digitosParaReconocer(from) !== cola) continue;
    if (typeof date_sent !== "string") continue;

    const fecha = new Date(date_sent);
    if (Number.isNaN(fecha.getTime())) continue;
    if (!ultimo || fecha > ultimo) ultimo = fecha;
  }
  return ultimo;
}

/** El día (UTC, AAAA-MM-DD) desde el que hay que mirar para cubrir 24 horas. */
const desdeAyer = (ahora: Date) =>
  new Date(ahora.getTime() - VENTANA_MS).toISOString().slice(0, 10);

export async function ventanaDeConversacion(
  numeroDelContacto: string,
  ahora: Date = new Date(),
): Promise<VentanaDeConversacion> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const nuestroNumero = process.env.TWILIO_WHATSAPP_FROM;
  const autorizacion = autorizacionDeTwilio();
  if (!sid || !nuestroNumero || !autorizacion) return SIN_COMPROBAR;

  // Todo lo que llegó a nuestro número desde ayer (DateSent> incluye ese
  // día); de ahí se saca lo de este contacto.
  const consulta = new URLSearchParams({
    To: `whatsapp:${normalizarTelefono(nuestroNumero)}`,
    "DateSent>": desdeAyer(ahora),
    PageSize: String(MENSAJES_POR_PAGINA),
  });

  const respuesta = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?${consulta}`,
    {
      headers: { Authorization: autorizacion },
      signal: AbortSignal.timeout(10000),
    },
  ).catch(() => null);

  if (!respuesta?.ok) return SIN_COMPROBAR;

  const ultimo = ultimoMensajeEntrante(
    await respuesta.json().catch(() => null),
    numeroDelContacto,
  );
  return {
    abierta: ventanaAbierta(ultimo, ahora),
    ultimoMensaje: ultimo?.toISOString() ?? null,
    comprobada: true,
  };
}

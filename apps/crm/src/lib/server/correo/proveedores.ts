/**
 * Envío de correo contra los proveedores soportados, para uso EXCLUSIVO en
 * servidor: aquí se maneja la clave del proveedor, que nunca debe llegar al
 * navegador.
 *
 * Los tres hablan HTTP y se llaman con `fetch`, sin SDK: cada uno serían más
 * dependencias que auditar y mantener, para un POST con tres campos.
 *
 * Para añadir un proveedor nuevo basta con sumar su entrada a PROVEEDORES;
 * el resto del CRM no se entera de cuál está configurado.
 */

export const PROVEEDORES_DE_CORREO = [
  "resend",
  "postmark",
  "sendgrid",
] as const;

export type ProveedorDeCorreo = (typeof PROVEEDORES_DE_CORREO)[number];

export const esProveedorDeCorreo = (
  valor: unknown,
): valor is ProveedorDeCorreo =>
  typeof valor === "string" &&
  (PROVEEDORES_DE_CORREO as readonly string[]).includes(valor);

/** Cuenta del proveedor con la que sale un correo. */
export interface CuentaDeEnvio {
  provider: ProveedorDeCorreo;
  apiKey: string;
  fromEmail: string;
  fromName?: string | null;
}

export interface MensajeDeCorreo {
  para: string;
  asunto: string;
  textoPlano: string;
  /** Versión HTML, cuando el mensaje viene de una plantilla. */
  html?: string;
  /** Reply-To con hash de hilo, para que una respuesta se archive sola. */
  responderA?: string;
}

export interface ResultadoDeEnvio {
  ok: boolean;
  mensaje?: string;
}

/** "Nombre <correo@dominio>" cuando hay nombre; si no, la dirección sola. */
const remitente = ({ fromEmail, fromName }: CuentaDeEnvio): string =>
  fromName ? `${fromName} <${fromEmail}>` : fromEmail;

interface Peticion {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

const peticionPorProveedor: Record<
  ProveedorDeCorreo,
  (cuenta: CuentaDeEnvio, mensaje: MensajeDeCorreo) => Peticion
> = {
  resend: (cuenta, mensaje) => ({
    url: "https://api.resend.com/emails",
    headers: { Authorization: `Bearer ${cuenta.apiKey}` },
    body: {
      from: remitente(cuenta),
      to: [mensaje.para],
      subject: mensaje.asunto,
      text: mensaje.textoPlano,
      html: mensaje.html,
      reply_to: mensaje.responderA,
    },
  }),

  postmark: (cuenta, mensaje) => ({
    url: "https://api.postmarkapp.com/email",
    headers: { "X-Postmark-Server-Token": cuenta.apiKey },
    body: {
      From: remitente(cuenta),
      To: mensaje.para,
      ReplyTo: mensaje.responderA,
      Subject: mensaje.asunto,
      TextBody: mensaje.textoPlano,
      HtmlBody: mensaje.html,
      MessageStream: "outbound",
    },
  }),

  sendgrid: (cuenta, mensaje) => ({
    url: "https://api.sendgrid.com/v3/mail/send",
    headers: { Authorization: `Bearer ${cuenta.apiKey}` },
    body: {
      personalizations: [{ to: [{ email: mensaje.para }] }],
      from: { email: cuenta.fromEmail, name: cuenta.fromName ?? undefined },
      reply_to: mensaje.responderA ? { email: mensaje.responderA } : undefined,
      subject: mensaje.asunto,
      content: [
        { type: "text/plain", value: mensaje.textoPlano },
        ...(mensaje.html ? [{ type: "text/html", value: mensaje.html }] : []),
      ],
    },
  }),
};

/**
 * El mensaje de error del proveedor, si lo trae. Cada uno lo pone en un sitio
 * distinto, y lo que el administrador necesita leer es «el dominio no está
 * verificado», no «HTTP 422».
 */
const mensajeDeError = (estado: number, cuerpo: unknown): string => {
  const c = cuerpo as
    | {
        message?: string;
        Message?: string;
        error?: { message?: string };
        errors?: { message?: string }[];
      }
    | null
    | undefined;
  return (
    c?.message ||
    c?.Message ||
    c?.error?.message ||
    c?.errors?.[0]?.message ||
    `El proveedor de correo respondió ${estado}.`
  );
};

export async function enviarConProveedor(
  cuenta: CuentaDeEnvio,
  mensaje: MensajeDeCorreo,
): Promise<ResultadoDeEnvio> {
  const peticion = peticionPorProveedor[cuenta.provider](cuenta, mensaje);

  const respuesta = await fetch(peticion.url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...peticion.headers,
    },
    body: JSON.stringify(peticion.body),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  if (!respuesta) {
    return {
      ok: false,
      mensaje: "No se pudo contactar con el proveedor de correo.",
    };
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    return { ok: false, mensaje: mensajeDeError(respuesta.status, cuerpo) };
  }

  return { ok: true };
}

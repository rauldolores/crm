import { z } from "zod";

/**
 * Del correo recibido tal como lo devuelve Resend
 * (GET /emails/receiving/:id) a lo que guarda la bandeja
 * (crm.registrar_correo_entrante). Sin red ni base: se prueba solo.
 */

const Cabeceras = z
  .record(z.string(), z.union([z.string(), z.array(z.string())]))
  .catch({});

export const CorreoDeResend = z.object({
  id: z.string(),
  from: z.string(),
  to: z.array(z.string()).catch([]),
  cc: z.array(z.string()).nullish().catch([]),
  received_for: z.array(z.string()).nullish().catch([]),
  subject: z.string().nullish(),
  text: z.string().nullish(),
  html: z.string().nullish(),
  message_id: z.string().nullish(),
  created_at: z.string().nullish(),
  headers: Cabeceras.nullish(),
  attachments: z
    .array(
      z.object({
        filename: z.string().nullish(),
        content_type: z.string().nullish(),
        size: z.number().nullish(),
      }),
    )
    .nullish()
    .catch([]),
});

export type CorreoDeResend = z.infer<typeof CorreoDeResend>;

/** Lo que recibe crm.registrar_correo_entrante. */
export interface CorreoEntrante {
  provider_id: string;
  message_id: string | null;
  in_reply_to: string | null;
  references: string[];
  from_email: string;
  from_name: string | null;
  to: string[];
  cc: string[];
  subject: string | null;
  text: string;
  automatic: boolean;
  attachments: { filename: string; content_type: string | null; size: number | null }[];
  sent_at: string | null;
}

/** «Ana López <ana@x.com>» → { correo, nombre }. */
export const separarDireccion = (
  valor: string,
): { correo: string; nombre: string | null } => {
  const conNombre = valor.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (conNombre) {
    return {
      correo: conNombre[2].trim().toLowerCase(),
      nombre: conNombre[1].trim() || null,
    };
  }
  return { correo: valor.trim().toLowerCase(), nombre: null };
};

/** Busca una cabecera sin importar mayúsculas; si viene repetida, la primera. */
const cabecera = (
  cabeceras: Record<string, string | string[]> | null | undefined,
  nombre: string,
): string | null => {
  if (!cabeceras) return null;
  const clave = Object.keys(cabeceras).find(
    (k) => k.toLowerCase() === nombre,
  );
  if (!clave) return null;
  const valor = cabeceras[clave];
  return (Array.isArray(valor) ? valor[0] : valor)?.trim() || null;
};

/** «<a@x> <b@y>» → ["<a@x>", "<b@y>"]. */
const idsDeMensaje = (valor: string | null): string[] =>
  valor?.match(/<[^<>\s]+>/g) ?? [];

const REMITENTES_AUTOMATICOS =
  /^(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounces?)([+.-]|@)/i;

/**
 * ¿Lo mandó una máquina? Fuera de oficina, rebotes, boletines: se guardan,
 * pero no piden que alguien del equipo conteste. Por las cabeceras que las
 * normas (RFC 3834) y la práctica reservan para eso.
 */
export const esAutomatico = (
  cabeceras: Record<string, string | string[]> | null | undefined,
  remitente: string,
): boolean => {
  const autoSubmitted = cabecera(cabeceras, "auto-submitted")?.toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;
  if (cabecera(cabeceras, "x-autoreply") || cabecera(cabeceras, "x-autorespond"))
    return true;
  const precedence = cabecera(cabeceras, "precedence")?.toLowerCase();
  if (precedence && ["bulk", "junk", "list", "auto_reply"].includes(precedence))
    return true;
  if (cabecera(cabeceras, "list-id") || cabecera(cabeceras, "list-unsubscribe"))
    return true;
  if (
    cabecera(cabeceras, "content-type")
      ?.toLowerCase()
      .startsWith("multipart/report")
  )
    return true;
  return REMITENTES_AUTOMATICOS.test(remitente);
};

/**
 * Texto legible de un HTML, para cuando el correo no trae versión de texto.
 * No se guarda HTML: la bandeja muestra texto y así no hay nada que sanear.
 */
export const htmlATexto = (html: string): string =>
  html
    .replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const aCorreoEntrante = (correo: CorreoDeResend): CorreoEntrante => {
  const { correo: remitente, nombre } = separarDireccion(
    cabecera(correo.headers, "from") ?? correo.from,
  );
  const respuestaA = idsDeMensaje(cabecera(correo.headers, "in-reply-to"))[0];
  return {
    provider_id: correo.id,
    message_id:
      correo.message_id ?? cabecera(correo.headers, "message-id") ?? null,
    in_reply_to: respuestaA ?? null,
    references: idsDeMensaje(cabecera(correo.headers, "references")),
    from_email: remitente,
    from_name: nombre,
    to: correo.to.map((d) => separarDireccion(d).correo),
    cc: (correo.cc ?? []).map((d) => separarDireccion(d).correo),
    subject: correo.subject ?? null,
    text: correo.text?.trim() || (correo.html ? htmlATexto(correo.html) : ""),
    automatic: esAutomatico(correo.headers, remitente),
    attachments: (correo.attachments ?? []).map((a) => ({
      filename: a.filename ?? "adjunto",
      content_type: a.content_type ?? null,
      size: a.size ?? null,
    })),
    sent_at: correo.created_at ?? null,
  };
};

/**
 * ¿Va este correo a la bandeja de la organización? Una cuenta de Resend
 * avisa de TODO lo que recibe, también de otras direcciones suyas.
 */
export const vaALaBandeja = (
  correo: Pick<CorreoDeResend, "to" | "cc" | "received_for">,
  bandeja: string,
): boolean => {
  const buscada = bandeja.trim().toLowerCase();
  return [...correo.to, ...(correo.cc ?? []), ...(correo.received_for ?? [])]
    .map((d) => separarDireccion(d).correo)
    .includes(buscada);
};

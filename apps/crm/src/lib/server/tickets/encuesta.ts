import { getServiceClient } from "../supabase-service";

/**
 * Encuesta de satisfacción de un ticket: una pregunta (1 a 5) y un
 * comentario opcional, desde un enlace público sin sesión. El token de 64
 * hex es la única llave y solo abre ESTE ticket, nunca una lista.
 */

export interface EncuestaDeTicket {
  id: number;
  subject: string;
  status: string;
  /** Nombre y logo de la organización, para que el cliente sepa quién pregunta. */
  organizacion: { nombre: string; logo: string | null };
  contacto: string;
  respondida: boolean;
  rating: number | null;
}

export const enlaceDeEncuesta = (origen: string, token: string): string =>
  `${origen.replace(/\/$/, "")}/encuesta/${token}`;

export async function encuestaPorToken(
  token: string,
): Promise<EncuestaDeTicket | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const supabase = getServiceClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, organization_id, subject, status, contact_id, satisfaction_rating, satisfaction_at",
    )
    .eq("survey_token", token)
    .maybeSingle();
  if (!ticket) return null;

  const [configuracion, contacto] = await Promise.all([
    supabase
      .from("configuration")
      .select("config")
      .eq("organization_id", ticket.organization_id)
      .maybeSingle(),
    supabase
      .from("contacts")
      .select("first_name")
      .eq("id", ticket.contact_id)
      .maybeSingle(),
  ]);
  const config = (configuracion.data?.config ?? {}) as {
    title?: string;
    lightModeLogo?: string;
    quoteIssuer?: { name?: string; logo_url?: string };
  };

  return {
    id: ticket.id as number,
    subject: ticket.subject as string,
    status: ticket.status as string,
    organizacion: {
      nombre: config.quoteIssuer?.name || config.title || "",
      logo: config.quoteIssuer?.logo_url || config.lightModeLogo || null,
    },
    contacto: (contacto.data?.first_name as string | null) ?? "",
    respondida: ticket.satisfaction_at != null,
    rating: (ticket.satisfaction_rating as number | null) ?? null,
  };
}

/** Guarda la respuesta. Solo se responde una vez: la segunda ya no cambia nada. */
export async function registrarSatisfaccion(
  token: string,
  rating: number,
  comentario: string,
): Promise<{ ok: true } | { ok: false; status: number; mensaje: string }> {
  if (!/^[a-f0-9]{64}$/.test(token) || rating < 1 || rating > 5) {
    return { ok: false, status: 400, mensaje: "Datos no válidos." };
  }
  const supabase = getServiceClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, satisfaction_at")
    .eq("survey_token", token)
    .maybeSingle();
  if (!ticket) {
    return { ok: false, status: 404, mensaje: "Esta encuesta no existe." };
  }
  if (ticket.satisfaction_at) {
    return {
      ok: false,
      status: 409,
      mensaje: "Esta encuesta ya fue respondida. ¡Gracias!",
    };
  }
  const { error } = await supabase
    .from("tickets")
    .update({
      satisfaction_rating: rating,
      satisfaction_comment: comentario.trim().slice(0, 1000) || null,
      satisfaction_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);
  if (error) {
    return { ok: false, status: 500, mensaje: "No se pudo guardar." };
  }
  return { ok: true };
}

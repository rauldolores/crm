import {
  aCorreoEntrante,
  CorreoDeResend,
  vaALaBandeja,
} from "@/lib/server/bandeja/correoRecibido";
import {
  ajustesDeBandeja,
  anotarRecepcion,
  claveParaLeer,
} from "@/lib/server/bandeja/configuracion";
import { firmaDeResendValida } from "@/lib/server/bandeja/firma";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Receptor del aviso `email.received` de Resend: cada correo que llega a la
 * dirección de la bandeja entra como mensaje de una conversación.
 *
 * El aviso solo trae metadatos (remitente, destinatarios, asunto); el cuerpo
 * y las cabeceras de hilo se piden después a la API de Resend con la clave
 * de la organización. La organización va en la ruta porque cada una crea su
 * propio webhook en su cuenta de Resend, con su propio secreto.
 *
 * Respuestas: 200 guardado o ignorado (otro tipo de aviso, otra dirección de
 * la misma cuenta); 401 firma inválida; 404 bandeja sin configurar; 502 no
 * se pudo leer el correo en Resend — con un código distinto de 2xx Resend
 * reintenta, que es lo que se quiere.
 */

export const runtime = "nodejs";

type Contexto = { params: Promise<{ organizacion: string }> };

const esError = (estado: number, mensaje: string) =>
  Response.json({ ok: false, message: mensaje }, { status: estado });

interface Aviso {
  type?: string;
  data?: {
    email_id?: string;
    to?: string[];
    cc?: string[];
    received_for?: string[];
  };
}

export async function POST(peticion: Request, { params }: Contexto) {
  const { organizacion } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(organizacion)) {
    return esError(404, "Bandeja no encontrada.");
  }

  // El cuerpo CRUDO: la firma se calcula sobre el texto exacto que llegó.
  const cuerpo = await peticion.text();

  const ajustes = await ajustesDeBandeja(organizacion);
  if (!ajustes?.active || !ajustes.webhookSecret) {
    return esError(404, "Bandeja no encontrada.");
  }

  const firmada = firmaDeResendValida(
    cuerpo,
    {
      id: peticion.headers.get("svix-id"),
      timestamp: peticion.headers.get("svix-timestamp"),
      signature: peticion.headers.get("svix-signature"),
    },
    ajustes.webhookSecret,
  );
  if (!firmada) {
    await anotarRecepcion(
      organizacion,
      "Llegó un aviso con una firma que no coincide: revisa el secreto del webhook.",
    );
    return esError(401, "Firma del aviso inválida o vencida.");
  }

  let aviso: Aviso;
  try {
    aviso = JSON.parse(cuerpo) as Aviso;
  } catch {
    return esError(400, "El cuerpo no es JSON válido.");
  }

  const datos = aviso.data;
  if (aviso.type !== "email.received" || !datos?.email_id) {
    return Response.json({ ok: true, ignored: "evento" });
  }
  if (
    !vaALaBandeja(
      { to: datos.to ?? [], cc: datos.cc, received_for: datos.received_for },
      ajustes.inboxEmail,
    )
  ) {
    return Response.json({ ok: true, ignored: "otra-direccion" });
  }

  const clave = await claveParaLeer(organizacion, ajustes);
  if (!clave) {
    await anotarRecepcion(
      organizacion,
      "Llegó un correo pero no hay clave de Resend para leerlo.",
    );
    return esError(502, "Sin clave para leer el correo.");
  }

  const respuesta = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(datos.email_id)}`,
    {
      headers: { Authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(15000),
    },
  ).catch(() => null);

  if (!respuesta?.ok) {
    const motivo =
      respuesta?.status === 401 || respuesta?.status === 403
        ? "Resend no deja leer el correo con esta clave: necesita acceso completo, no solo de envío."
        : "No se pudo leer el correo en Resend.";
    await anotarRecepcion(organizacion, motivo);
    return esError(502, motivo);
  }

  const leido = CorreoDeResend.safeParse(
    await respuesta.json().catch(() => null),
  );
  if (!leido.success) {
    await anotarRecepcion(organizacion, "Resend devolvió un correo ilegible.");
    return esError(502, "Correo ilegible.");
  }

  const { data, error } = await getServiceClient().rpc(
    "registrar_correo_entrante",
    { organizacion, correo: aCorreoEntrante(leido.data) },
  );
  if (error) {
    console.error("bandeja: no se pudo guardar el correo", {
      organizacion,
      emailId: datos.email_id,
      error: error.message,
    });
    await anotarRecepcion(organizacion, "No se pudo guardar el correo.");
    return esError(500, "No se pudo guardar el correo.");
  }

  await anotarRecepcion(organizacion, null);
  return Response.json({ ok: true, ...(data as object) });
}

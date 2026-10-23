import { ajustesDeBandeja } from "@/lib/server/bandeja/configuracion";
import {
  asuntoDeRespuesta,
  cabecerasDeHilo,
} from "@/lib/server/bandeja/responder";
import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { cuentaDeEnvioDeOrganizacion } from "@/lib/server/correo/configuracion";
import { enviarCorreoDeOrganizacion } from "@/lib/server/correo/enviar";
import {
  elegirProyecto,
  proyectosDeLaEmpresaDelContacto,
  proyectosDeOrganizacion,
} from "@/lib/server/correo/proyectos";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Contestar una conversación de la bandeja desde el CRM.
 *
 * Sale desde la dirección del proyecto al que el cliente escribió (la de
 * la conversación), como respuesta en el mismo hilo (In-Reply-To /
 * References): así su siguiente correo vuelve a la misma dirección y a la
 * misma conversación. Si el proyecto no tiene dirección propia, sale por el
 * correo general con la de la bandeja como Reply-To. Queda como mensaje de
 * la conversación y,
 * si hay contacto, como nota de correo en su ficha. Quien contesta una
 * conversación de la pila compartida se queda con ella.
 */

const MAX_CUERPO = 20000;

type Contexto = { params: Promise<{ id: string }> };

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request, { params }: Contexto) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth.sesion;

  const conversacionId = Number((await params).id);
  if (!Number.isFinite(conversacionId)) {
    return esError(404, "Conversación no encontrada.");
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    texto?: unknown;
  } | null;
  const texto =
    typeof cuerpo?.texto === "string"
      ? cuerpo.texto.trim().slice(0, MAX_CUERPO)
      : "";
  if (!texto) return esError(400, "Escribe la respuesta.");

  const db = getServiceClient();
  const { data: conversacion } = await db
    .from("conversations")
    .select("id, contact_id, counterpart, subject, sales_id, project")
    .eq("id", conversacionId)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!conversacion) return esError(404, "Conversación no encontrada.");

  const cuenta = await cuentaDeEnvioDeOrganizacion(organizacionId);
  if (!cuenta) {
    return esError(
      501,
      "El envío de correo no está configurado. Pide a quien administra el CRM que lo configure en Ajustes → Correo saliente.",
    );
  }

  const { data: ultimo } = await db
    .from("conversation_messages")
    .select("message_id, reference_ids")
    .eq("conversation_id", conversacionId)
    .eq("direction", "in")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const asunto = asuntoDeRespuesta(conversacion.subject as string | null);
  const cabeceras = cabecerasDeHilo(ultimo);
  const eleccion = elegirProyecto(
    await proyectosDeOrganizacion(organizacionId),
    {
      fijo: [conversacion.project as string | null],
      deLaEmpresa: conversacion.contact_id
        ? await proyectosDeLaEmpresaDelContacto(
            organizacionId,
            Number(conversacion.contact_id),
          )
        : [],
    },
  );
  const proyecto = eleccion.tipo === "proyecto" ? eleccion.proyecto : null;
  const bandeja = proyecto?.email
    ? null
    : await ajustesDeBandeja(organizacionId);
  const resultado = await enviarCorreoDeOrganizacion(
    organizacionId,
    {
      para: conversacion.counterpart as string,
      asunto,
      textoPlano: texto,
      cabeceras,
      responderA: bandeja?.inboxEmail ?? undefined,
    },
    proyecto,
  );
  if (!resultado.ok) {
    return esError(502, resultado.mensaje || "No se pudo enviar el correo.");
  }

  const comercial = await comercialDeLaSesion(organizacionId, usuarioId);
  const ahora = new Date().toISOString();

  const { error } = await db.from("conversation_messages").insert({
    organization_id: organizacionId,
    conversation_id: conversacionId,
    direction: "out",
    from_email: proyecto?.email ?? cuenta.fromEmail,
    from_name: proyecto?.email
      ? (proyecto.fromName ?? proyecto.label)
      : (cuenta.fromName ?? null),
    to_emails: [conversacion.counterpart],
    subject: asunto,
    body_text: texto,
    in_reply_to: cabeceras?.["In-Reply-To"] ?? null,
    reference_ids: cabeceras?.References.split(" ") ?? [],
    sales_id: comercial,
    sent_at: ahora,
  });
  if (error) {
    // El correo ya salió: no se responde con error (se reintentaría y el
    // cliente lo recibiría dos veces). Se avisa en el registro.
    console.error("bandeja: respuesta enviada pero no guardada", {
      conversacionId,
      error: error.message,
    });
  }

  await db
    .from("conversations")
    .update({
      status: "answered",
      unread: false,
      last_message_at: ahora,
      last_message_preview: texto.replace(/\s+/g, " ").slice(0, 200),
      ...(conversacion.sales_id == null && comercial != null
        ? { sales_id: comercial }
        : {}),
    })
    .eq("id", conversacionId)
    .eq("organization_id", organizacionId);

  if (conversacion.contact_id != null) {
    await db.from("contact_notes").insert({
      organization_id: organizacionId,
      contact_id: conversacion.contact_id,
      text: `${asunto}\n\n${texto}`,
      type: "email",
      sales_id: comercial ?? conversacion.sales_id,
      date: ahora,
    });
  }

  return Response.json({ ok: true });
}

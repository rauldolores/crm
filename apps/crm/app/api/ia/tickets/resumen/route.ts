import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { cuentaDeIaDeOrganizacion } from "@/lib/server/ia/configuracion";
import { generarConIa } from "@/lib/server/ia/proveedores";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Resumen por IA del hilo de un ticket: qué pide el cliente, qué se ha
 * hecho y qué falta. Para quien llega a un ticket con veinte notas y tiene
 * que responder en cinco minutos. No se guarda solo: la pantalla ofrece
 * dejarlo como nota si vale la pena.
 */

const INSTRUCCIONES = `Eres el asistente de un equipo de soporte al cliente. Te pasan un ticket con su hilo de notas (en orden cronológico) y devuelves un resumen en español de México, con tuteo, para alguien que va a atenderlo ahora mismo.

Devuelve SOLO texto plano con esta estructura, sin títulos adicionales ni markdown:
Qué pide: una o dos frases.
Qué se ha hecho: viñetas cortas empezando por «- », en orden. Si no hay nada, «- Nada todavía».
Qué falta: viñetas cortas empezando por «- » con el siguiente paso concreto.

Sé concreto: fechas, importes y nombres que aparezcan en las notas. No inventes nada que no esté en el hilo. Máximo 120 palabras.`;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  const cuenta = await cuentaDeIaDeOrganizacion(organizacionId);
  if (!cuenta) {
    return esError(
      501,
      "No hay un proveedor de IA configurado. Configúralo en Ajustes → Inteligencia artificial.",
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    ticketId?: number;
  } | null;
  const ticketId = Number(cuerpo?.ticketId);
  if (!ticketId) return esError(400, "Falta el ticket.");

  const supabase = getServiceClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, organization_id, subject, description, status, priority, created_at",
    )
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket || ticket.organization_id !== organizacionId) {
    return esError(404, "Ticket no encontrado.");
  }

  const { data: notas } = await supabase
    .from("ticket_notes")
    .select("date, type, text, sales_id")
    .eq("ticket_id", ticketId)
    .order("date", { ascending: true })
    .limit(200);

  const hilo = (notas ?? [])
    .map((n) => {
      const cuando = String(n.date).slice(0, 16);
      const quien = n.sales_id ? "Equipo" : "Sistema";
      const texto = String(n.text ?? "").slice(0, 1500);
      return `[${cuando}] ${quien} (${n.type}): ${texto}`;
    })
    .join("\n");

  const descripcion = ticket.description
    ? `Descripción inicial:\n${String(ticket.description).slice(0, 3000)}`
    : "";
  const peticionAlModelo = [
    `Ticket #${ticket.id} · ${ticket.subject}`,
    `Estado: ${ticket.status} · Prioridad: ${ticket.priority} · Creado: ${String(ticket.created_at).slice(0, 10)}`,
    descripcion,
    "",
    hilo ? `Hilo de notas:\n${hilo}` : "Hilo de notas: (sin notas todavía)",
  ].join("\n");

  const resultado = await generarConIa(cuenta, INSTRUCCIONES, peticionAlModelo);
  if (!resultado.ok || !resultado.texto) {
    return esError(502, resultado.mensaje || "No se pudo generar el resumen.");
  }
  return Response.json({ resumen: resultado.texto.trim() });
}

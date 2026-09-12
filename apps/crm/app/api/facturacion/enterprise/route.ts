import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import { enviarCorreoDeOrganizacion } from "@/lib/server/correo/enviar";

/**
 * "Quiero ser contactado" del plan Enterprise: no es un plan real de
 * KontrolIA Auth (no tiene precio, no pasa por Stripe), así que no hay
 * checkout que iniciar — solo avisar a ventas por correo.
 *
 * Reutiliza el mismo envío que "enviar correo a un contacto"
 * (enviarCorreoDeOrganizacion), pero el destinatario aquí es fijo: la
 * bandeja comercial de KontrolIA, no un contacto de la organización que
 * escribe.
 */

const MAX_NOMBRE = 200;
const MAX_MENSAJE = 4000;

const CORREO_DE_VENTAS = "ventas@kontrolia.io";

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    nombre?: string;
    mensaje?: string;
  } | null;

  const nombre = (cuerpo?.nombre ?? "").trim().slice(0, MAX_NOMBRE);
  const mensaje = (cuerpo?.mensaje ?? "").trim().slice(0, MAX_MENSAJE);

  if (!nombre || !mensaje) {
    return Response.json(
      { message: "Faltan datos: nombre y mensaje son obligatorios." },
      { status: 400 },
    );
  }

  const { organizacionId, usuarioId } = auth.sesion;
  const supabase = getServiceClient();

  const { data: comercial } = await supabase
    .from("sales")
    .select("email")
    .eq("user_id", usuarioId)
    .eq("organization_id", organizacionId)
    .maybeSingle();

  const correoDeQuienPide = (comercial?.email as string | null) ?? undefined;

  const resultado = await enviarCorreoDeOrganizacion(organizacionId, {
    para: CORREO_DE_VENTAS,
    asunto: `Plan Enterprise — ${nombre}`,
    textoPlano: [
      `${nombre} pidió que lo contactemos sobre el plan Enterprise.`,
      correoDeQuienPide ? `Correo: ${correoDeQuienPide}` : null,
      `Organización (id): ${organizacionId}`,
      "",
      mensaje,
    ]
      .filter((linea) => linea !== null)
      .join("\n"),
    // Así quien conteste desde ventas@kontrolia.io le responde directo a la
    // persona, sin tener que copiar el correo del cuerpo del mensaje.
    responderA: correoDeQuienPide,
  });

  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje || "No se pudo enviar el mensaje." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}

import { hayClasificador } from "@/lib/server/ia/clasificador";
import { cuentaDeIaDeOrganizacion } from "@/lib/server/ia/configuracion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import type { Opcion } from "@/lib/server/tickets/clasificacion";
import {
  clasificarTicket,
  PRIORIDADES_DE_FABRICA,
} from "@/lib/server/tickets/clasificacion";

/**
 * Sugerencia de prioridad y categoría para un ticket a partir de su asunto y
 * descripción, con las listas que la organización configuró en Ajustes →
 * Tickets. Devuelve valores de esas listas (nunca inventados) para que quien
 * captura decida: los campos quedan editables.
 *
 * El cómo vive en `lib/server/tickets/clasificacion`, que comparte con el
 * formulario público de soporte — donde el mismo ticket entra sin que nadie
 * pueda pulsar un botón.
 */

const MAX_TEXTO = 4000;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  // Sin modelo de decisión en el despliegue ni proveedor de texto en la
  // organización no hay nada que intentar, y el aviso es accionable: lo
  // segundo sí lo configura el cliente.
  if (!hayClasificador() && !(await cuentaDeIaDeOrganizacion(organizacionId))) {
    return esError(
      501,
      "No hay un proveedor de IA configurado. Configúralo en Ajustes → Inteligencia artificial.",
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    subject?: string;
    description?: string;
  } | null;
  const subject = (cuerpo?.subject ?? "").trim().slice(0, 300);
  const description = (cuerpo?.description ?? "").trim().slice(0, MAX_TEXTO);
  if (!subject && !description) {
    return esError(400, "Escribe el asunto o la descripción primero.");
  }

  const { data: configuracion } = await getServiceClient()
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const config = (configuracion?.config ?? {}) as {
    ticketPriorities?: Opcion[];
    ticketCategories?: Opcion[];
  };
  const prioridades = Array.isArray(config.ticketPriorities)
    ? config.ticketPriorities
    : PRIORIDADES_DE_FABRICA;
  const categorias = Array.isArray(config.ticketCategories)
    ? config.ticketCategories
    : [];

  const sugerencia = await clasificarTicket(
    organizacionId,
    { subject, description },
    prioridades,
    categorias,
  );
  if (!sugerencia) return esError(502, "No se pudo clasificar el ticket.");

  return Response.json(sugerencia);
}

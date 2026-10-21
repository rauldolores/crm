import { getServiceClient } from "../supabase-service";

/**
 * El contacto al que se va a escribir, con el teléfono al que se envía: el
 * primero de su ficha, igual que el botón. Se lee con la clave de servicio,
 * así que la organización se comprueba aquí a mano — un id de otra
 * organización responde «no encontrado», no «prohibido», para no confirmar
 * que existe.
 */

export type ContactoParaWhatsapp =
  | { ok: true; id: number; salesId: number | null; telefono: string }
  | { ok: false; estado: number; mensaje: string };

export async function contactoParaWhatsapp(
  organizacionId: string,
  contactId: unknown,
): Promise<ContactoParaWhatsapp> {
  const id = Number(contactId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, estado: 400, mensaje: "Falta el contacto." };
  }

  const { data: contacto } = await getServiceClient()
    .from("contacts")
    .select("id, organization_id, phone_jsonb, sales_id")
    .eq("id", id)
    .maybeSingle();

  if (!contacto || contacto.organization_id !== organizacionId) {
    return { ok: false, estado: 404, mensaje: "Contacto no encontrado." };
  }

  const telefono = ((contacto.phone_jsonb ?? []) as { number?: string }[])[0]
    ?.number;
  if (!telefono) {
    return {
      ok: false,
      estado: 400,
      mensaje: "Este contacto no tiene un teléfono registrado.",
    };
  }

  return {
    ok: true,
    id: contacto.id as number,
    salesId: (contacto.sales_id as number | null) ?? null,
    telefono,
  };
}

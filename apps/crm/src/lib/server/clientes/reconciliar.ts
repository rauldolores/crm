import { getServiceClient } from "../supabase-service";
import { dominioDe, normalizarRfc } from "./normalizar";

/**
 * Encuentra la empresa del CRM a la que pertenece un dato que llega de un
 * sistema externo.
 *
 * Un ERP, una tienda o Faqturia no conocen el `id 42` de Vinqulia. Mandan
 * «el cliente con RFC XAXX010101000», «pedidos@acme.com» o «nuestro cliente
 * CLI-77». Si esto no se resuelve bien, la integración funciona en la demo
 * y falla en producción: compras huérfanas o empresas duplicadas.
 *
 * Orden de búsqueda, del más fiable al menos:
 *   1. referencia externa ya vinculada (una sincronización anterior)
 *   2. identificación fiscal (RFC): es única por empresa
 *   3. dominio del correo: «pedidos@acme.com» → acme.com → la empresa cuyo
 *      sitio web es acme.com
 *
 * NUNCA crea una empresa a ciegas. Si no encuentra ninguna, lo dice y el
 * llamante decide. Crear automáticamente es como se llenan los CRM de
 * «Acme», «ACME SA» y «Acme S.A. de C.V.» apuntando a la misma empresa.
 */

export interface PistaDeCliente {
  /** Identificador del cliente en el sistema de origen. */
  externalId?: string | null;
  /** RFC u otra identificación fiscal. */
  taxId?: string | null;
  email?: string | null;
  /** Nombre, solo para sugerir; no se busca por nombre a propósito. */
  name?: string | null;
}

export type Reconciliacion =
  | { ok: true; companyId: number; por: "referencia" | "rfc" | "dominio" }
  | { ok: false; motivo: string };

export async function reconciliarEmpresa(
  organizacionId: string,
  origen: string,
  pista: PistaDeCliente,
): Promise<Reconciliacion> {
  const supabase = getServiceClient();

  // 1. Ya vinculada por una sincronización anterior. El vínculo se guarda en
  //    custom_fields para no añadir una columna por cada sistema que exista.
  if (pista.externalId) {
    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("organization_id", organizacionId)
      .contains("custom_fields", { [`ref_${origen}`]: pista.externalId })
      .limit(1)
      .maybeSingle();
    if (data) return { ok: true, companyId: data.id as number, por: "referencia" };
  }

  // 2. RFC. Se compara normalizado porque cada sistema lo escribe a su
  //    manera (con guiones, en minúsculas, con espacios).
  if (pista.taxId) {
    const rfc = normalizarRfc(pista.taxId);
    if (rfc) {
      const { data } = await supabase
        .from("companies")
        .select("id, tax_identifier")
        .eq("organization_id", organizacionId)
        .not("tax_identifier", "is", null);
      const encontrada = (data ?? []).find(
        (empresa) =>
          normalizarRfc((empresa.tax_identifier as string) ?? "") === rfc,
      );
      if (encontrada) {
        await vincular(organizacionId, encontrada.id as number, origen, pista.externalId);
        return { ok: true, companyId: encontrada.id as number, por: "rfc" };
      }
    }
  }

  // 3. Dominio del correo contra el sitio web de la empresa.
  if (pista.email) {
    const dominio = dominioDe(pista.email);
    if (dominio) {
      const { data } = await supabase
        .from("companies")
        .select("id")
        .eq("organization_id", organizacionId)
        .ilike("website", `%${dominio}%`)
        .limit(2);
      // Con más de una coincidencia no se adivina: mejor pedir el RFC.
      if (data?.length === 1) {
        await vincular(organizacionId, data[0].id as number, origen, pista.externalId);
        return { ok: true, companyId: data[0].id as number, por: "dominio" };
      }
    }
  }

  return {
    ok: false,
    motivo:
      "No se encontró una empresa con esa identificación fiscal, referencia externa ni dominio de correo. Da de alta la empresa en el CRM (o completa su RFC) y vuelve a intentarlo.",
  };
}

/**
 * Guarda el vínculo con el sistema de origen para que la siguiente vez se
 * resuelva por referencia, sin volver a pasar por RFC ni dominio.
 */
async function vincular(
  organizacionId: string,
  companyId: number,
  origen: string,
  externalId?: string | null,
): Promise<void> {
  if (!externalId) return;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("companies")
    .select("custom_fields")
    .eq("id", companyId)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const actuales = (data?.custom_fields as Record<string, unknown>) ?? {};
  await supabase
    .from("companies")
    .update({ custom_fields: { ...actuales, [`ref_${origen}`]: externalId } })
    .eq("id", companyId)
    .eq("organization_id", organizacionId);
}

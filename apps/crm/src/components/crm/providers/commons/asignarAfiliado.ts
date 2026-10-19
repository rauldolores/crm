import type { DataProvider, Identifier } from "ra-core";

import type { AffiliateAttribution, Company } from "../../types";

/** Qué pasó con la atribución (lo que devuelve crm.asignar_afiliado). */
export type ResultadoDeAsignacionDeAfiliado =
  | "asignada"
  | "reasignada"
  | "retirada"
  | "rechazada"
  | "sin_cambios";

/**
 * Asignación manual de afiliado en el cliente, para el proveedor de
 * demostración (FakeRest). Replica las reglas de crm.asignar_afiliado: con
 * Supabase lo hace la base en una transacción, por /api/afiliados/asignar.
 */
export const asignarAfiliado = async (
  companyId: Identifier,
  affiliateId: Identifier | null,
  reason: string | undefined,
  dataProvider: DataProvider,
): Promise<{ resultado: ResultadoDeAsignacionDeAfiliado }> => {
  const { data: empresa } = await dataProvider.getOne<Company>("companies", {
    id: companyId,
  });
  const actual = empresa.referred_by_affiliate_id ?? null;
  if (actual === affiliateId) return { resultado: "sin_cambios" };

  const motivo = reason?.trim() || null;
  if (actual != null && !motivo) {
    throw new Error(
      "Hace falta un motivo para cambiar o quitar el afiliado de un cliente",
    );
  }

  const { data: historial } = await dataProvider
    .getList<AffiliateAttribution>("affiliate_attributions", {
      filter: { company_id: companyId, status: "vigente" },
      pagination: { page: 1, perPage: 10 },
      sort: { field: "id", order: "ASC" },
    })
    .catch(() => ({ data: [] as AffiliateAttribution[] }));
  const ahora = new Date().toISOString();
  for (const fila of historial) {
    await dataProvider.update("affiliate_attributions", {
      id: fila.id,
      data: {
        status: affiliateId == null ? "retirada" : "reemplazada",
        ended_at: ahora,
        end_reason: motivo,
      },
      previousData: fila,
    });
  }

  await dataProvider.update("companies", {
    id: companyId,
    data: { referred_by_affiliate_id: affiliateId },
    previousData: empresa,
  });

  if (affiliateId == null) return { resultado: "retirada" };

  await dataProvider.create("affiliate_attributions", {
    data: {
      company_id: companyId,
      affiliate_id: affiliateId,
      source: "manual",
      status: "vigente",
      reason: motivo,
      created_at: ahora,
    },
  });
  return { resultado: actual == null ? "asignada" : "reasignada" };
};

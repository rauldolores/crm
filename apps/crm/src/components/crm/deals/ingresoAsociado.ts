import type { DataProvider } from "ra-core";

import type { Deal } from "../types";

/**
 * ¿Hay algo detrás de esta oportunidad que represente dinero entrando?
 *
 * Vale cualquiera de las tres cosas, porque cada organización cierra de una
 * manera: una cotización aceptada de la propia oportunidad, o —de la empresa
 * a la que pertenece— un contrato vigente o una compra registrada. No se
 * exige que el importe cuadre: eso es cosa de quien vende, no del CRM.
 *
 * Las tres consultas van en paralelo y piden una sola fila: solo interesa si
 * existe alguna.
 */

export type MotivoDeIngreso = "quote" | "contract" | "purchase";

const hayAlguna = async (
  dataProvider: DataProvider,
  recurso: string,
  filter: Record<string, unknown>,
): Promise<boolean> => {
  try {
    const { data } = await dataProvider.getList(recurso, {
      filter,
      pagination: { page: 1, perPage: 1 },
      sort: { field: "id", order: "DESC" },
    });
    return data.length > 0;
  } catch {
    // Si la consulta falla (permisos, red), no se bloquea el movimiento: la
    // regla es una ayuda, no un guardián de la integridad de los datos.
    return true;
  }
};

export const ingresoAsociado = async (
  dataProvider: DataProvider,
  oportunidad: Deal,
): Promise<MotivoDeIngreso | null> => {
  const empresa = oportunidad.company_id;
  const [cotizacion, contrato, compra] = await Promise.all([
    hayAlguna(dataProvider, "quotes", {
      deal_id: oportunidad.id,
      status: "accepted",
    }),
    empresa
      ? hayAlguna(dataProvider, "contracts", {
          company_id: empresa,
          "status@neq": "cancelled",
        })
      : Promise.resolve(false),
    empresa
      ? hayAlguna(dataProvider, "purchases", {
          company_id: empresa,
          "status@neq": "cancelled",
        })
      : Promise.resolve(false),
  ]);

  if (cotizacion) return "quote";
  if (contrato) return "contract";
  if (compra) return "purchase";
  return null;
};

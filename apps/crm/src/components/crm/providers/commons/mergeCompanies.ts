import type { DataProvider, Identifier } from "ra-core";

import type { Company } from "../../types";

const TODO = { page: 1, perPage: 1000 };

/**
 * Fusión de empresas en el cliente, para el proveedor de demostración
 * (FakeRest): lo que apunta a la perdedora pasa a la ganadora, la ficha se
 * combina (la ganadora manda) y la perdedora se elimina. Con Supabase lo
 * hace crm.merge_companies en una transacción, por /api/empresas/fusionar.
 */
export const mergeCompanies = async (
  loserId: Identifier,
  winnerId: Identifier,
  dataProvider: DataProvider,
): Promise<{ winnerId: Identifier }> => {
  const [{ data: winner }, { data: loser }] = await Promise.all([
    dataProvider.getOne<Company>("companies", { id: winnerId }),
    dataProvider.getOne<Company>("companies", { id: loserId }),
  ]);
  if (!winner || !loser) throw new Error("Empresa no encontrada");

  // 1. Todo lo que apunta a la perdedora pasa a la ganadora.
  const reasignar = async (recurso: string) => {
    const { data } = await dataProvider.getList(recurso, {
      filter: { company_id: loserId },
      pagination: TODO,
      sort: { field: "id", order: "ASC" },
    });
    await Promise.all(
      data.map((fila) =>
        dataProvider.update(recurso, {
          id: fila.id,
          data: { company_id: winnerId },
          previousData: fila,
        }),
      ),
    );
  };
  for (const recurso of ["contacts", "deals", "tickets", "quotes"]) {
    // Una colección que la base de prueba no tiene cuenta como vacía.
    await reasignar(recurso).catch(() => undefined);
  }

  // 2. Ficha: la ganadora manda; lo que le falte lo aporta la perdedora.
  const campos = [
    "sector",
    "size",
    "linkedin_url",
    "website",
    "phone_number",
    "address",
    "zipcode",
    "city",
    "state_abbr",
    "country",
    "sales_id",
    "description",
    "revenue",
    "tax_identifier",
    "tax_regime",
    "cfdi_use",
    "logo",
  ] as const;
  const combinada = Object.fromEntries(
    campos.map((campo) => [campo, winner[campo] ?? loser[campo] ?? null]),
  );
  await dataProvider.update<Company>("companies", {
    id: winnerId,
    data: {
      ...combinada,
      context_links: [
        ...(winner.context_links ?? []),
        ...(loser.context_links ?? []),
      ],
      custom_fields: { ...loser.custom_fields, ...winner.custom_fields },
      // Los contadores los mantiene el proveedor de demostración a mano.
      nb_contacts: (winner.nb_contacts ?? 0) + (loser.nb_contacts ?? 0),
      nb_deals: (winner.nb_deals ?? 0) + (loser.nb_deals ?? 0),
      nb_tickets: (winner.nb_tickets ?? 0) + (loser.nb_tickets ?? 0),
      nb_tickets_open:
        (winner.nb_tickets_open ?? 0) + (loser.nb_tickets_open ?? 0),
      created_at:
        winner.created_at < loser.created_at
          ? winner.created_at
          : loser.created_at,
    },
    previousData: winner,
  });

  // 3. Adiós a la perdedora.
  await dataProvider.delete("companies", { id: loserId, previousData: loser });
  return { winnerId };
};

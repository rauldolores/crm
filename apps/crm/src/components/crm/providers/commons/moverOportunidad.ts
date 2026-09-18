import type { DataProvider } from "ra-core";

import type { Deal } from "../../types";

/** A dónde va la tarjeta: etapa y posición final (0 = arriba). */
export type DestinoDeOportunidad = {
  stage: string;
  /** Sin valor: al final de la etapa. */
  index?: number;
};

const TODA_LA_COLUMNA = { page: 1, perPage: 1000 };

const columna = (dataProvider: DataProvider, deal: Deal, stage: string) =>
  dataProvider
    .getList<Deal>("deals", {
      sort: { field: "index", order: "ASC" },
      pagination: TODA_LA_COLUMNA,
      filter: { stage, pipeline: deal.pipeline, "archived_at@is": null },
    })
    .then((r) => r.data);

/**
 * Reordena el tablero desde el cliente, una actualización por tarjeta
 * desplazada. Es la versión para el proveedor de demostración (FakeRest):
 * con Supabase lo hace la base en una transacción (crm.move_deal, por
 * /api/oportunidades/mover), que es lo que aguanta cientos de tarjetas.
 */
export const moverOportunidadEnCliente = async (
  dataProvider: DataProvider,
  deal: Deal,
  destino: DestinoDeOportunidad,
  motivoDePerdida?: string,
): Promise<void> => {
  const origen = deal.index ?? 0;

  if (deal.stage === destino.stage) {
    const tarjetas = await columna(dataProvider, deal, deal.stage);
    const indiceFinal = Math.min(
      destino.index ?? tarjetas.length,
      Math.max(tarjetas.length - 1, 0),
    );
    const desplazadas =
      indiceFinal < origen
        ? tarjetas
            .filter((d) => d.index >= indiceFinal && d.index < origen)
            .map((d) => ({ ...d, index: d.index + 1 }))
        : tarjetas
            .filter((d) => d.index > origen && d.index <= indiceFinal)
            .map((d) => ({ ...d, index: d.index - 1 }));
    await Promise.all([
      ...desplazadas
        .filter((d) => d.id !== deal.id)
        .map((d) =>
          dataProvider.update("deals", {
            id: d.id,
            data: { index: d.index },
            previousData: d,
          }),
        ),
      dataProvider.update("deals", {
        id: deal.id,
        data: { index: indiceFinal },
        previousData: deal,
      }),
    ]);
    return;
  }

  const [enOrigen, enDestino] = await Promise.all([
    columna(dataProvider, deal, deal.stage),
    columna(dataProvider, deal, destino.stage),
  ]);
  const indiceFinal = Math.min(
    destino.index ?? enDestino.length,
    enDestino.length,
  );

  await Promise.all([
    ...enOrigen
      .filter((d) => d.id !== deal.id && d.index > origen)
      .map((d) =>
        dataProvider.update("deals", {
          id: d.id,
          data: { index: d.index - 1 },
          previousData: d,
        }),
      ),
    ...enDestino
      .filter((d) => d.index >= indiceFinal)
      .map((d) =>
        dataProvider.update("deals", {
          id: d.id,
          data: { index: d.index + 1 },
          previousData: d,
        }),
      ),
    dataProvider.update("deals", {
      id: deal.id,
      data: {
        index: indiceFinal,
        stage: destino.stage,
        ...(motivoDePerdida ? { loss_reason: motivoDePerdida } : {}),
      },
      previousData: deal,
    }),
  ]);
};

/**
 * Hace sitio arriba de la etapa a una oportunidad recién creada (índice 0):
 * las demás bajan una posición. Con Supabase lo hace el disparador
 * crm.place_new_deal; esto es para el proveedor de demostración.
 */
export const hacerSitioAOportunidadNueva = async (
  dataProvider: DataProvider,
  deal: Deal,
): Promise<void> => {
  const tarjetas = await columna(dataProvider, deal, deal.stage);
  await Promise.all(
    tarjetas
      .filter((d) => d.id !== deal.id)
      .map((d) =>
        dataProvider.update("deals", {
          id: d.id,
          data: { index: (d.index ?? 0) + 1 },
          previousData: d,
        }),
      ),
  );
};

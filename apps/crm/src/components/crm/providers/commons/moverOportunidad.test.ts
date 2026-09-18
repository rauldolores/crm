import { createDataProvider } from "@/components/crm/providers/fakerest";
import { createCrmDb } from "@/test/StoryWrapper";

import type { Deal } from "../../types";

const oportunidad = (overrides: Partial<Deal>): Deal => ({
  amount: 1000,
  archived_at: undefined,
  category: "other",
  company_id: 1,
  contact_ids: [1],
  created_at: "2026-01-05T10:00:00.000Z",
  description: "",
  expected_closing_date: "2026-02-05",
  id: 1,
  index: 0,
  name: "Una oportunidad",
  pipeline: "ventas",
  sales_id: 1,
  stage: "opportunity",
  updated_at: "2026-01-05T10:00:00.000Z",
  ...overrides,
});

const crearProveedor = () =>
  createDataProvider({
    latency: 0,
    silent: true,
    db: createCrmDb({
      companies: [{ id: 1, name: "Acme" }] as never,
      deals: [
        oportunidad({ id: 1, name: "A", index: 0 }),
        oportunidad({ id: 2, name: "B", index: 1 }),
        oportunidad({ id: 3, name: "C", index: 2 }),
        oportunidad({ id: 4, name: "D", stage: "won", index: 0 }),
        // Archivada en la misma etapa: no está en el tablero y no se mueve.
        oportunidad({
          id: 5,
          name: "Vieja",
          index: 1,
          archived_at: "2025-12-01T00:00:00.000Z",
        }),
      ],
    }),
  });

const columna = async (
  dataProvider: ReturnType<typeof createDataProvider>,
  stage: string,
) => {
  const { data } = await dataProvider.getList<Deal>("deals", {
    filter: { stage, "archived_at@is": null },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "index", order: "ASC" },
  });
  return data.map((d) => `${d.name}${d.index}`);
};

describe("moverOportunidad (proveedor de demostración)", () => {
  it("sube una tarjeta dentro de su etapa y desplaza a las que estaban encima", async () => {
    // Arrange
    const dataProvider = crearProveedor();
    const { data: c } = await dataProvider.getOne<Deal>("deals", { id: 3 });

    // Act
    await dataProvider.moverOportunidad(c, { stage: "opportunity", index: 0 });

    // Assert
    expect(await columna(dataProvider, "opportunity")).toEqual([
      "C0",
      "A1",
      "B2",
    ]);
  });

  it("baja una tarjeta al final de su etapa", async () => {
    const dataProvider = crearProveedor();
    const { data: a } = await dataProvider.getOne<Deal>("deals", { id: 1 });

    await dataProvider.moverOportunidad(a, { stage: "opportunity", index: 2 });

    expect(await columna(dataProvider, "opportunity")).toEqual([
      "B0",
      "C1",
      "A2",
    ]);
  });

  it("cambia de etapa cerrando el hueco de origen y haciendo sitio en destino", async () => {
    const dataProvider = crearProveedor();
    const { data: b } = await dataProvider.getOne<Deal>("deals", { id: 2 });

    await dataProvider.moverOportunidad(
      b,
      { stage: "won", index: 0 },
      undefined,
    );

    expect(await columna(dataProvider, "opportunity")).toEqual(["A0", "C1"]);
    expect(await columna(dataProvider, "won")).toEqual(["B0", "D1"]);
  });

  it("guarda el motivo al mover a una etapa de pérdida y no toca las archivadas", async () => {
    const dataProvider = crearProveedor();
    const { data: a } = await dataProvider.getOne<Deal>("deals", { id: 1 });

    await dataProvider.moverOportunidad(a, { stage: "lost" }, "price");

    const { data: movida } = await dataProvider.getOne<Deal>("deals", {
      id: 1,
    });
    expect(movida).toMatchObject({
      stage: "lost",
      index: 0,
      loss_reason: "price",
    });
    const { data: archivada } = await dataProvider.getOne<Deal>("deals", {
      id: 5,
    });
    expect(archivada).toMatchObject({ stage: "opportunity", index: 1 });
  });

  it("coloca la oportunidad nueva arriba de su etapa y baja a las demás", async () => {
    const dataProvider = crearProveedor();

    await dataProvider.create("deals", {
      data: oportunidad({ id: 9, name: "Nueva", index: 0 }),
    });

    expect(await columna(dataProvider, "opportunity")).toEqual([
      "Nueva0",
      "A1",
      "B2",
      "C3",
    ]);
  });
});

import { createDataProvider } from "@/components/crm/providers/fakerest";
import { createCrmDb } from "@/test/StoryWrapper";

import type { AffiliateAttribution, Company } from "../../types";

const crearProveedor = (referido: number | null = null) =>
  createDataProvider({
    latency: 0,
    silent: true,
    db: createCrmDb({
      companies: [
        { id: 1, name: "Cliente SA", referred_by_affiliate_id: referido },
      ] as never,
      affiliates: [
        { id: 7, referral_code: "ana", active: true },
        { id: 8, referral_code: "beto", active: true },
      ] as never,
      affiliate_attributions: [] as never,
    }),
  });

const vigentes = async (
  dataProvider: ReturnType<typeof crearProveedor>,
): Promise<AffiliateAttribution[]> =>
  (
    await dataProvider.getList<AffiliateAttribution>("affiliate_attributions", {
      filter: { company_id: 1, status: "vigente" },
      pagination: { page: 1, perPage: 10 },
      sort: { field: "id", order: "ASC" },
    })
  ).data;

describe("asignarAfiliado (proveedor de demostración)", () => {
  it("liga una empresa sin afiliado y deja su atribución vigente", async () => {
    // Arrange
    const dataProvider = crearProveedor();

    // Act
    const { resultado } = await dataProvider.asignarAfiliado(1, 7);

    // Assert
    expect(resultado).toBe("asignada");
    const { data: empresa } = await dataProvider.getOne<Company>("companies", {
      id: 1,
    });
    expect(empresa.referred_by_affiliate_id).toBe(7);
    const filas = await vigentes(dataProvider);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ affiliate_id: 7, source: "manual" });
  });

  it("no deja cambiar de afiliado sin motivo", async () => {
    // Arrange
    const dataProvider = crearProveedor(7);

    // Act + Assert
    await expect(dataProvider.asignarAfiliado(1, 8, "  ")).rejects.toThrow(
      /motivo/,
    );
    const { data: empresa } = await dataProvider.getOne<Company>("companies", {
      id: 1,
    });
    expect(empresa.referred_by_affiliate_id).toBe(7);
  });

  it("al reasignar con motivo cierra la atribución anterior y abre la nueva", async () => {
    // Arrange
    const dataProvider = crearProveedor();
    await dataProvider.asignarAfiliado(1, 7);

    // Act
    const { resultado } = await dataProvider.asignarAfiliado(
      1,
      8,
      "Error de captura",
    );

    // Assert
    expect(resultado).toBe("reasignada");
    const filas = await vigentes(dataProvider);
    expect(filas).toHaveLength(1);
    expect(filas[0].affiliate_id).toBe(8);
    const { data: todas } = await dataProvider.getList<AffiliateAttribution>(
      "affiliate_attributions",
      {
        filter: { company_id: 1, status: "reemplazada" },
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
      },
    );
    expect(todas[0]).toMatchObject({
      affiliate_id: 7,
      end_reason: "Error de captura",
    });
  });

  it("quitar el afiliado deja la empresa sin afiliado y ninguna atribución vigente", async () => {
    // Arrange
    const dataProvider = crearProveedor();
    await dataProvider.asignarAfiliado(1, 7);

    // Act
    const { resultado } = await dataProvider.asignarAfiliado(
      1,
      null,
      "Ya no aplica",
    );

    // Assert
    expect(resultado).toBe("retirada");
    const { data: empresa } = await dataProvider.getOne<Company>("companies", {
      id: 1,
    });
    expect(empresa.referred_by_affiliate_id).toBeNull();
    expect(await vigentes(dataProvider)).toHaveLength(0);
  });
});

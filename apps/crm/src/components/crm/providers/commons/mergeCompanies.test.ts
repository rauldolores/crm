import { createDataProvider } from "@/components/crm/providers/fakerest";
import { createCrmDb } from "@/test/StoryWrapper";

import type { Company, Contact, Deal } from "../../types";

const crearProveedor = () =>
  createDataProvider({
    latency: 0,
    silent: true,
    db: createCrmDb({
      companies: [
        {
          id: 1,
          name: "Acme SA",
          city: null,
          website: "acme.com",
          context_links: ["https://acme.com/a"],
          custom_fields: { x: 1, y: 1 },
          created_at: "2026-01-01T00:00:00.000Z",
          nb_contacts: 0,
          nb_deals: 1,
        },
        {
          id: 2,
          name: "ACME S.A. de C.V.",
          city: "Monterrey",
          website: null,
          context_links: ["https://acme.com/b"],
          custom_fields: { y: 2, z: 3 },
          created_at: "2024-01-01T00:00:00.000Z",
          nb_contacts: 1,
          nb_deals: 1,
        },
      ] as never,
      contacts: [{ id: 10, first_name: "Ana", company_id: 2 }] as never,
      deals: [
        { id: 20, name: "Licencia", company_id: 2, stage: "opportunity" },
        { id: 21, name: "Soporte", company_id: 1, stage: "opportunity" },
      ] as never,
    }),
  });

describe("mergeCompanies (proveedor de demostración)", () => {
  it("pasa contactos y oportunidades a la ganadora, combina la ficha y elimina a la perdedora", async () => {
    // Arrange
    const dataProvider = crearProveedor();

    // Act: la 2 (perdedora) se fusiona en la 1 (ganadora).
    await dataProvider.mergeCompanies(2, 1);

    // Assert: lo que apuntaba a la 2 apunta a la 1…
    const { data: ana } = await dataProvider.getOne<Contact>("contacts", {
      id: 10,
    });
    expect(ana.company_id).toBe(1);
    const { data: licencia } = await dataProvider.getOne<Deal>("deals", {
      id: 20,
    });
    expect(licencia.company_id).toBe(1);

    // …la ganadora manda pero hereda lo que le faltaba…
    const { data: ganadora } = await dataProvider.getOne<Company>("companies", {
      id: 1,
    });
    expect(ganadora).toMatchObject({
      name: "Acme SA",
      website: "acme.com",
      city: "Monterrey",
      context_links: ["https://acme.com/a", "https://acme.com/b"],
      custom_fields: { x: 1, y: 1, z: 3 },
      created_at: "2024-01-01T00:00:00.000Z",
      nb_contacts: 1,
      nb_deals: 2,
    });

    // …y la perdedora ya no existe.
    await expect(
      dataProvider.getOne("companies", { id: 2 }),
    ).rejects.toBeDefined();
  });
});

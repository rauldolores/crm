import { describe, expect, it } from "vitest";

import type { Company, Deal, Sale, Tag } from "../types";
import { filaDeEmpresa, filaDeOportunidad } from "./exportadores";

const sales = {
  1: { id: 1, first_name: "Ana", last_name: "Ruiz" } as Sale,
};
const tags = {
  7: { id: 7, name: "Cliente clave", color: "#fde68a" } as Tag,
  8: { id: 8, name: "Proveedor", color: "#bfdbfe" } as Tag,
};
const campos = [
  { value: "rfc", label: "RFC", type: "text" as const },
  { value: "vip", label: "VIP", type: "checkbox" as const },
];

describe("filaDeEmpresa", () => {
  it("pone nombres en vez de ids y aplana los campos personalizados", () => {
    // Arrange
    const empresa = {
      id: 1,
      name: "Acme",
      sales_id: 1,
      tags: [7, 8],
      logo: { src: "x" },
      nb_contacts: 3,
      custom_fields: { rfc: "ACM010101", vip: true },
    } as unknown as Company;

    // Act
    const fila = filaDeEmpresa(empresa, { sales, tags }, campos);

    // Assert
    expect(fila).toMatchObject({
      name: "Acme",
      sales: "Ana Ruiz",
      tags: "Cliente clave, Proveedor",
      RFC: "ACM010101",
      VIP: "Sí",
    });
    expect(fila).not.toHaveProperty("logo");
    expect(fila).not.toHaveProperty("nb_contacts");
    expect(fila).not.toHaveProperty("custom_fields");
  });

  it("aguanta una empresa sin responsable ni etiquetas", () => {
    const fila = filaDeEmpresa(
      { id: 2, name: "Sola", tags: null } as unknown as Company,
      { sales, tags },
      [],
    );
    expect(fila).toMatchObject({ sales: undefined, tags: "" });
  });
});

describe("filaDeOportunidad", () => {
  it("traduce embudo y etapa a sus etiquetas y resuelve empresa, responsable y etiquetas", () => {
    const embudos = [
      {
        value: "ventas",
        label: "Ventas",
        stages: [{ value: "proposal-sent", label: "Propuesta enviada" }],
        pipelineStatuses: [],
        lostStages: [],
      },
    ];
    const fila = filaDeOportunidad(
      {
        id: 1,
        name: "Licencia",
        pipeline: "ventas",
        stage: "proposal-sent",
        company_id: 5,
        sales_id: 1,
        tags: [7],
      } as unknown as Deal,
      { companies: { 5: { id: 5, name: "Acme" } as Company }, sales, tags },
      [],
      embudos,
    );
    expect(fila).toMatchObject({
      pipeline: "Ventas",
      stage: "Propuesta enviada",
      company: "Acme",
      sales: "Ana Ruiz",
      tags: "Cliente clave",
    });
  });
});

import { describe, expect, it } from "vitest";

import { conceptoDeFaqturia, facturaDeFaqturia } from "./faqturia";

const ajustes = { clave_prod_serv: "81112100", clave_unidad: "E48" };

describe("conceptoDeFaqturia", () => {
  it("manda el IVA como traslado 002 con la tasa de la línea", () => {
    expect(
      conceptoDeFaqturia(
        {
          descripcion: "Licencia",
          cantidad: 1,
          precioUnitario: 1000,
          descuento: 0,
          tasaIva: 0.16,
          sku: "LIC-1",
        },
        ajustes,
      ),
    ).toEqual({
      descripcion: "Licencia",
      cantidad: 1,
      precio_unitario: 1000,
      descuento: 0,
      clave_sat: "81112100",
      clave_unidad_sat: "E48",
      identificador_externo: "LIC-1",
      impuestos: { traslados: [{ impuesto: "002", tasaOCuota: 0.16 }] },
    });
  });

  it("sin IVA no manda impuestos, para que el proveedor no los calcule", () => {
    const concepto = conceptoDeFaqturia(
      {
        descripcion: "Exento",
        cantidad: 1,
        precioUnitario: 10,
        descuento: 0,
        tasaIva: 0,
        sku: null,
      },
      ajustes,
    );
    expect(concepto).not.toHaveProperty("impuestos");
    expect(concepto).not.toHaveProperty("identificador_externo");
  });
});

describe("facturaDeFaqturia", () => {
  const base = {
    id: "inv_1",
    uuid: "AAAA-BBBB",
    serie: "A",
    folio: "00000007",
    total: "1160.00",
    status: "timbrada",
    fecha_timbrado: "2026-09-18T10:00:00Z",
  };

  it("una timbrada queda stamped con su UUID, folio y total numérico", () => {
    const factura = facturaDeFaqturia(base, { timbrada: true, moneda: "MXN" });
    expect(factura.status).toBe("stamped");
    expect(factura.total).toBe(1160);
    expect(factura.currency).toBe("MXN");
    expect(factura.issuedAt).toBe("2026-09-18T10:00:00Z");
  });

  it("una creada sin timbrar queda draft y conserva el motivo", () => {
    const factura = facturaDeFaqturia(
      { ...base, uuid: null, status: "draft" },
      { timbrada: false, moneda: "MXN", error: "PAC sin respuesta" },
    );
    expect(factura.status).toBe("draft");
    expect(factura.error).toBe("PAC sin respuesta");
  });

  it("una cancelada en el proveedor queda cancelled aunque tenga UUID", () => {
    expect(
      facturaDeFaqturia(
        { ...base, status: "cancelada" },
        { timbrada: false, moneda: "MXN" },
      ).status,
    ).toBe("cancelled");
  });
});

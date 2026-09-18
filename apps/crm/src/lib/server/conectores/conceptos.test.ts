import { describe, expect, it } from "vitest";

import { lineasAFacturar, validarReceptor } from "./conceptos";

describe("lineasAFacturar", () => {
  it("convierte el descuento en importe y la tasa de IVA en fracción", () => {
    const [linea] = lineasAFacturar([
      {
        description: "Licencia anual",
        quantity: 2,
        unit_price: 1000,
        discount_pct: 10,
        tax_rate: 16,
        product_ref: "LIC-1",
      },
    ]);

    expect(linea).toEqual({
      descripcion: "Licencia anual",
      cantidad: 2,
      precioUnitario: 1000,
      descuento: 200,
      tasaIva: 0.16,
      sku: "LIC-1",
    });
  });

  it("deja sin IVA y sin SKU la línea que no los tiene", () => {
    const [linea] = lineasAFacturar([
      {
        description: "Servicio exento",
        quantity: 1,
        unit_price: 500,
        discount_pct: 0,
        tax_rate: 0,
        product_ref: null,
      },
    ]);
    expect(linea.tasaIva).toBe(0);
    expect(linea.descuento).toBe(0);
    expect(linea.sku).toBeNull();
  });
});

describe("validarReceptor", () => {
  const valido = {
    razonSocial: "Tecmilenio SC",
    rfc: "tec010101ab1",
    regimenFiscal: "601",
    usoCfdi: "G03",
    codigoPostal: "64000",
    email: "",
  };

  it("normaliza el RFC a mayúsculas y el correo vacío a null", () => {
    expect(validarReceptor(valido)).toEqual({
      ...valido,
      rfc: "TEC010101AB1",
      email: null,
    });
  });

  it.each([
    ["RFC", { rfc: "123" }, /RFC/],
    ["código postal", { codigoPostal: "6400" }, /código postal/],
    ["régimen", { regimenFiscal: "" }, /régimen/],
    ["razón social", { razonSocial: " " }, /razón social/],
  ])(
    "rechaza un %s inválido con un mensaje para la persona",
    (_, cambio, mensaje) => {
      expect(() => validarReceptor({ ...valido, ...cambio })).toThrow(mensaje);
    },
  );
});

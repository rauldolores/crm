import { describe, expect, it } from "vitest";

import { afterEach, vi } from "vitest";

import {
  ConectorFaqturia,
  conceptoDeFaqturia,
  facturaDeFaqturia,
} from "./faqturia";

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


describe("buscarEnCatalogoDelSat", () => {
  const conector = () =>
    new ConectorFaqturia({
      settings: { base_url: "https://app.faqturia.com" },
      secret: "ktrl_live_xxx",
    });

  const responder = (cuerpo: unknown) => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => cuerpo,
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pide una página corta y manda el texto como search", async () => {
    const fetchMock = responder({ data: [] });

    await conector().buscarEnCatalogoDelSat(
      "productos-servicios",
      "  servicios de internet  ",
    );

    const [url, init] = fetchMock.mock.calls[0];
    // Nunca el catálogo entero: son más de 52.000 filas.
    expect(String(url)).toBe(
      "https://app.faqturia.com/api/external/catalogs/productos-servicios?pageSize=25&search=servicios+de+internet",
    );
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe(
      "ktrl_live_xxx",
    );
  });

  it("sin texto no manda search, para traer la primera página", async () => {
    const fetchMock = responder({ data: [] });

    await conector().buscarEnCatalogoDelSat("unidades", "   ");

    expect(String(fetchMock.mock.calls[0][0])).not.toContain("search=");
  });

  it("normaliza las dos formas: descripcion en productos, nombre en unidades", async () => {
    responder({
      data: [
        { clave: "81112100", descripcion: "Servicios de internet" },
        { clave: "KGM", nombre: "Kilogramo", simbolo: "kg" },
        { descripcion: "sin clave, se descarta" },
      ],
    });

    expect(
      await conector().buscarEnCatalogoDelSat("productos-servicios", "x"),
    ).toEqual([
      {
        clave: "81112100",
        descripcion: "Servicios de internet",
        simbolo: null,
      },
      { clave: "KGM", descripcion: "Kilogramo", simbolo: "kg" },
    ]);
  });

  it("convierte un error del proveedor en un mensaje para la persona", async () => {
    // 401, 403 y 429 los traduce `pedir()` antes de llegar aquí; esto cubre
    // el resto, que es donde decide este método.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        json: async () => ({ error: { message: "La base está en obras." } }),
      }),
    );

    await expect(
      conector().buscarEnCatalogoDelSat("unidades", "kilo"),
    ).rejects.toThrow("La base está en obras.");
  });

  it("sin mensaje del proveedor, dice algo que se entiende", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 500, json: async () => ({}) }),
    );

    await expect(
      conector().buscarEnCatalogoDelSat("unidades", "kilo"),
    ).rejects.toThrow("Faqturia no pudo darnos el catálogo del SAT.");
  });
});

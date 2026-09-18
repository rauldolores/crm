import { describe, expect, it } from "vitest";

import {
  normalizarDominio,
  productosDeShopify,
  siguientePagina,
} from "./shopify";

describe("productosDeShopify", () => {
  it("una variante por producto: nombre limpio, SKU, precio y descripción sin HTML", () => {
    const [producto] = productosDeShopify(
      [
        {
          id: 1,
          title: "Silla ergonómica",
          body_html: "<p>Respaldo <b>de malla</b></p>",
          status: "active",
          variants: [
            { id: 11, title: "Default Title", sku: "SIL-01", price: "2499.00" },
          ],
          images: [{ src: "https://cdn/silla.jpg" }],
        },
      ],
      "MXN",
    );

    expect(producto).toEqual({
      externalId: "1:11",
      sku: "SIL-01",
      name: "Silla ergonómica",
      description: "Respaldo de malla",
      unitPrice: 2499,
      currency: "MXN",
      active: true,
      imageUrl: "https://cdn/silla.jpg",
    });
  });

  it("varias variantes: una fila por variante con el nombre compuesto, e inactivas si el producto lo está", () => {
    const productos = productosDeShopify(
      [
        {
          id: 2,
          title: "Playera",
          body_html: null,
          status: "draft",
          variants: [
            { id: 21, title: "Chica", sku: "", price: "199" },
            { id: 22, title: "Grande", sku: null, price: "219" },
          ],
        },
      ],
      "USD",
    );

    expect(productos.map((p) => p.name)).toEqual([
      "Playera — Chica",
      "Playera — Grande",
    ]);
    expect(productos.every((p) => !p.active)).toBe(true);
    expect(productos[0].sku).toBeNull();
    expect(productos[1].unitPrice).toBe(219);
  });
});

describe("siguientePagina", () => {
  it("saca la URL con rel=next de la cabecera Link", () => {
    const link =
      '<https://x.myshopify.com/admin/api/2025-07/products.json?page_info=abc>; rel="previous", <https://x.myshopify.com/admin/api/2025-07/products.json?page_info=def>; rel="next"';
    expect(siguientePagina(link)).toBe(
      "https://x.myshopify.com/admin/api/2025-07/products.json?page_info=def",
    );
  });

  it("devuelve null cuando no hay más páginas", () => {
    expect(siguientePagina(null)).toBeNull();
    expect(siguientePagina('<https://x/a>; rel="previous"')).toBeNull();
  });
});

describe("normalizarDominio", () => {
  it("acepta la dirección con o sin https y con ruta", () => {
    expect(normalizarDominio(" https://MiTienda.myshopify.com/admin ")).toBe(
      "mitienda.myshopify.com",
    );
  });
});

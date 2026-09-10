import { describe, expect, it } from "vitest";

import { dominioDe, normalizarRfc } from "./normalizar";

describe("normalizarRfc", () => {
  it("iguala las formas en que cada sistema escribe el mismo RFC", () => {
    // Si no, la factura de «XAXX-010101-000» no se atribuye a «XAXX010101000»
    // y acaba huérfana.
    expect(normalizarRfc("XAXX-010101-000")).toBe("XAXX010101000");
    expect(normalizarRfc("xaxx010101000")).toBe("XAXX010101000");
    expect(normalizarRfc("  XAXX 010101 000 ")).toBe("XAXX010101000");
  });

  it("conserva la eñe y el ampersand, que sí forman parte de un RFC", () => {
    expect(normalizarRfc("ñ&a010101abc")).toBe("Ñ&A010101ABC");
  });
});

describe("dominioDe", () => {
  it("saca el dominio de un correo corporativo", () => {
    expect(dominioDe("Pedidos@Acme.com")).toBe("acme.com");
  });

  it("descarta los correos de proveedores genéricos", () => {
    // Un @gmail.com lo tiene cualquiera: atribuir por él mezclaría clientes.
    expect(dominioDe("alguien@gmail.com")).toBeNull();
    expect(dominioDe("alguien@hotmail.com")).toBeNull();
  });

  it("devuelve null ante algo que no es un correo", () => {
    expect(dominioDe("sin-arroba")).toBeNull();
  });
});

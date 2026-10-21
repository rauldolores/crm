import { describe, expect, it } from "vitest";

import { normalizarTelefono } from "./twilioWhatsapp";

describe("normalizarTelefono", () => {
  it("le pone el código de México a un número de 10 dígitos sin él", () => {
    // Antes salía +5512345678, que es Brasil.
    expect(normalizarTelefono("5512345678")).toBe("+525512345678");
  });

  it("lo mismo aunque esté escrito con espacios, guiones o paréntesis", () => {
    expect(normalizarTelefono("55 1234 5678")).toBe("+525512345678");
    expect(normalizarTelefono("(55) 1234-5678")).toBe("+525512345678");
  });

  it("respeta un número que ya trae el +", () => {
    expect(normalizarTelefono("+52 55 1234 5678")).toBe("+525512345678");
    expect(normalizarTelefono("+5215512345678")).toBe("+5215512345678");
    expect(normalizarTelefono("+1 415 555 1234")).toBe("+14155551234");
  });

  it("respeta un código de país escrito sin el +", () => {
    expect(normalizarTelefono("525512345678")).toBe("+525512345678");
    expect(normalizarTelefono("5215512345678")).toBe("+5215512345678");
  });

  it("deja vacío lo que no tiene dígitos, como antes", () => {
    expect(normalizarTelefono("")).toBe("+");
    expect(normalizarTelefono("sin número")).toBe("+");
  });
});

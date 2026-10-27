import { describe, expect, it } from "vitest";

import { enlaceDeWhatsapp } from "./telefono";

describe("enlaceDeWhatsapp", () => {
  it("abre el chat de un número de 10 dígitos en México, no en Brasil", () => {
    expect(enlaceDeWhatsapp("55 1234 5678")).toBe(
      "https://wa.me/525512345678",
    );
  });

  it("respeta el código de país que ya trae el número", () => {
    expect(enlaceDeWhatsapp("+1 (415) 555-1234")).toBe(
      "https://wa.me/14155551234",
    );
  });
});

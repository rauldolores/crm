import { describe, expect, test } from "vitest";

import { exigeAdministrador } from "./soloAdministrador";

describe("exigeAdministrador", () => {
  test("editar la comisión de un afiliado exige ser administrador", () => {
    expect(exigeAdministrador("affiliates", "PATCH", false)).toBe(true);
  });

  test("también crear y borrar, y lo mismo con las tasas por producto", () => {
    expect(exigeAdministrador("affiliates", "POST", false)).toBe(true);
    expect(exigeAdministrador("affiliates", "DELETE", false)).toBe(true);
    expect(exigeAdministrador("affiliate_rates", "POST", false)).toBe(true);
    expect(exigeAdministrador("affiliate_rates", "DELETE", false)).toBe(true);
  });

  test("leer sigue abierto a cualquiera con sesión", () => {
    expect(exigeAdministrador("affiliates", "GET", false)).toBe(false);
    expect(exigeAdministrador("affiliate_rates", "HEAD", false)).toBe(false);
  });

  test("una clave de API pasa: solo un administrador puede crearlas", () => {
    expect(exigeAdministrador("affiliates", "PATCH", true)).toBe(false);
  });

  test("no toca el resto del CRM", () => {
    expect(exigeAdministrador("contacts", "PATCH", false)).toBe(false);
    expect(exigeAdministrador("deals", "POST", false)).toBe(false);
    // Las atribuciones ya son de solo lectura por otra regla del puente.
    expect(exigeAdministrador("affiliate_attributions", "POST", false)).toBe(
      false,
    );
  });
});

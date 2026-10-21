import { describe, expect, it } from "vitest";

import { quitarCamposProtegidos } from "./camposProtegidos";

describe("quitarCamposProtegidos", () => {
  it("quita billing_enabled de un contrato", () => {
    expect(
      JSON.parse(
        quitarCamposProtegidos(
          "contracts",
          JSON.stringify({ name: "X", billing_enabled: true }),
        ),
      ),
    ).toEqual({ name: "X" });
  });

  it("quita los días de gracia, que solo escribe KontrolIA Auth", () => {
    expect(
      JSON.parse(
        quitarCamposProtegidos(
          "contracts",
          JSON.stringify({
            name: "X",
            in_grace: true,
            grace_until: "2027-01-10T00:00:00Z",
          }),
        ),
      ),
    ).toEqual({ name: "X" });
  });

  it("quita el contrato y la fecha de una oportunidad de renovación", () => {
    expect(
      JSON.parse(
        quitarCamposProtegidos(
          "deals",
          JSON.stringify({
            name: "X",
            contract_id: 4,
            renewal_for: "2027-01-10",
          }),
        ),
      ),
    ).toEqual({ name: "X" });
  });

  it("también en una lista", () => {
    expect(
      JSON.parse(
        quitarCamposProtegidos(
          "contracts",
          JSON.stringify([{ billing_enabled: true, amount: 1 }]),
        ),
      ),
    ).toEqual([{ amount: 1 }]);
  });

  it("no toca otros recursos ni un cuerpo que no es JSON", () => {
    const cuerpo = JSON.stringify({ billing_enabled: true });
    expect(quitarCamposProtegidos("companies", cuerpo)).toBe(cuerpo);
    expect(quitarCamposProtegidos("contracts", "no-json")).toBe("no-json");
  });
});

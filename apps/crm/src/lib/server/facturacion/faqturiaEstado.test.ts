import { describe, expect, it } from "vitest";

import { cambiosDesdeFaqturia, DetalleDeFaqturia } from "./faqturiaEstado";

const AHORA = "2027-01-10T12:00:00.000Z";

const detalle = (cambios: Record<string, unknown>) =>
  DetalleDeFaqturia.parse({
    id: "inv-1",
    status: "timbrada",
    uuid: "UUID-1",
    serie: "A",
    folio: "10",
    total: "11600",
    monto_pagado: 0,
    ...cambios,
  });

const sinPagar = {
  billing_status: "stamped",
  payment_status: "unpaid" as const,
  paid_amount: 0,
  paid_at: null,
  total: 11600,
};

describe("cambiosDesdeFaqturia", () => {
  it("timbrada: queda timbrada y sin pagar", () => {
    const cambios = cambiosDesdeFaqturia(detalle({}), sinPagar, AHORA);
    expect(cambios.status).toBe("stamped");
    expect(cambios.billing_status).toBe("stamped");
    expect(cambios.uuid).toBe("UUID-1");
    expect(cambios.payment_status).toBeUndefined();
  });

  it("pagada: pago completo con fecha", () => {
    const cambios = cambiosDesdeFaqturia(
      detalle({ status: "pagada", monto_pagado: 11600, fecha_pago: "2027-01-09" }),
      sinPagar,
      AHORA,
    );
    expect(cambios.payment_status).toBe("paid");
    expect(cambios.paid_amount).toBe(11600);
    expect(cambios.paid_at).toBe("2027-01-09");
  });

  it("parcialmente pagada: pago parcial", () => {
    const cambios = cambiosDesdeFaqturia(
      detalle({ status: "parcialmente_pagada", monto_pagado: 5000 }),
      sinPagar,
      AHORA,
    );
    expect(cambios.payment_status).toBe("partial");
    expect(cambios.paid_amount).toBe(5000);
    expect(cambios.paid_at).toBeUndefined();
  });

  it("el pago no retrocede (cobro con tarjeta ya pagado)", () => {
    const cambios = cambiosDesdeFaqturia(
      detalle({ status: "timbrada", monto_pagado: 0 }),
      { ...sinPagar, payment_status: "paid", paid_amount: 11600, paid_at: AHORA },
      AHORA,
    );
    expect(cambios.payment_status).toBeUndefined();
    expect(cambios.paid_amount).toBeUndefined();
  });

  it("cancelada manda, y no se revive con un aviso atrasado", () => {
    expect(
      cambiosDesdeFaqturia(detalle({ status: "cancelada" }), sinPagar, AHORA)
        .billing_status,
    ).toBe("cancelled");
    const atrasado = cambiosDesdeFaqturia(
      detalle({ status: "timbrada" }),
      { ...sinPagar, billing_status: "cancelled" },
      AHORA,
    );
    expect(atrasado.billing_status).toBeUndefined();
    expect(atrasado.status).toBeUndefined();
  });

  it("un «creada» atrasado no regresa a borrador una timbrada", () => {
    const cambios = cambiosDesdeFaqturia(
      detalle({ status: "draft", uuid: null }),
      sinPagar,
      AHORA,
    );
    expect(cambios.status).toBeUndefined();
  });
});

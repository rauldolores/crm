import { describe, expect, test } from "vitest";

import { asuntoDeRespuesta, cabecerasDeHilo } from "./responder";

describe("asuntoDeRespuesta", () => {
  test("antepone «Re:» una sola vez", () => {
    expect(asuntoDeRespuesta("Cotización")).toBe("Re: Cotización");
    expect(asuntoDeRespuesta("RE: Cotización")).toBe("RE: Cotización");
  });

  test("un correo sin asunto se contesta igual", () => {
    expect(asuntoDeRespuesta(null)).toBe("Re:");
  });
});

describe("cabecerasDeHilo", () => {
  test("cita el último mensaje y conserva la cadena del hilo", () => {
    expect(
      cabecerasDeHilo({
        message_id: "<m2@acme.mx>",
        reference_ids: ["<m0@x>", "<m1@x>"],
      }),
    ).toEqual({
      "In-Reply-To": "<m2@acme.mx>",
      References: "<m0@x> <m1@x> <m2@acme.mx>",
    });
  });

  test("sin Message-ID del cliente no hay hilo que citar", () => {
    expect(cabecerasDeHilo({ message_id: null, reference_ids: [] })).toBe(
      undefined,
    );
    expect(cabecerasDeHilo(null)).toBe(undefined);
  });

  test("una cadena muy larga se recorta por delante", () => {
    const largas = Array.from({ length: 30 }, (_, i) => `<m${i}@x>`);
    const cabeceras = cabecerasDeHilo({
      message_id: "<ultimo@x>",
      reference_ids: largas,
    });

    const referencias = cabeceras?.References.split(" ") ?? [];
    expect(referencias).toHaveLength(20);
    expect(referencias.at(-1)).toBe("<ultimo@x>");
  });
});

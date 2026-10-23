import { describe, expect, test } from "vitest";

import { separarCita } from "./cita";

describe("separarCita", () => {
  test("pliega el hilo citado por Gmail en español", () => {
    const { propio, citado } = separarCita(
      [
        "Sí, me interesa. ¿Cuándo hablamos?",
        "",
        "El jue, 23 oct 2026 a las 10:02, Ana <ana@aduaniax.com> escribió:",
        "> Hola Laura,",
      ].join("\n"),
    );

    expect(propio).toBe("Sí, me interesa. ¿Cuándo hablamos?");
    expect(citado).toMatch(/^El jue/);
  });

  test("pliega la cita de Outlook", () => {
    const { propio, citado } = separarCita(
      "Gracias.\n\nDe: Ana <ana@aduaniax.com>\nEnviado: jueves",
    );

    expect(propio).toBe("Gracias.");
    expect(citado).toMatch(/^De: Ana/);
  });

  test("un correo sin cita queda entero", () => {
    expect(separarCita("Hola,\nquiero información.")).toEqual({
      propio: "Hola,\nquiero información.",
      citado: null,
    });
  });

  test("si todo es cita, se muestra todo", () => {
    expect(separarCita("> solo cita\n> más cita").citado).toBeNull();
  });
});

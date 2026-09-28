import { describe, expect, test } from "vitest";

import {
  CAMPOS_DE_CONTACTO,
  cabecerasDesconocidas,
  esCabeceraConocida,
} from "./camposDeContacto";

/** Las cabeceras del CSV de ejemplo que se ofrece para descargar. */
const DEL_EJEMPLO = [
  "first_name",
  "last_name",
  "gender",
  "title",
  "background",
  "first_seen",
  "last_seen",
  "has_newsletter",
  "status",
  "tags",
  "linkedin_url",
  "company",
  "email_work",
  "email_home",
  "email_other",
  "phone_work",
  "phone_home",
  "phone_other",
];

describe("camposDeContacto", () => {
  test("el CSV de ejemplo se importa sin pasar por el mapeo", () => {
    // Es el caso más común —reimportar lo que el propio CRM exportó— y no
    // debe preguntar nada. Si esta prueba falla, el catálogo y el archivo de
    // ejemplo se desincronizaron.
    expect(cabecerasDesconocidas(DEL_EJEMPLO)).toEqual([]);
  });

  test("reconoce una cabecera con espacios alrededor", () => {
    expect(esCabeceraConocida("  email_work ")).toBe(true);
  });

  test("señala las cabeceras de otro sistema, y descarta las vacías", () => {
    expect(
      cabecerasDesconocidas(["first_name", "Correo", "", "  ", "Teléfono"]),
    ).toEqual(["Correo", "Teléfono"]);
  });

  test("cada campo lleva etiqueta y pista, que es lo que lee el modelo", () => {
    for (const campo of CAMPOS_DE_CONTACTO) {
      expect(campo.label.trim()).not.toBe("");
      expect(campo.pista.trim()).not.toBe("");
    }
  });

  test("no hay campos repetidos", () => {
    const valores = CAMPOS_DE_CONTACTO.map((c) => c.value);
    expect(new Set(valores).size).toBe(valores.length);
  });
});

import { describe, expect, test } from "vitest";

import {
  etiquetaDeProyecto,
  limpiarProyectos,
  validarProyectos,
} from "./proyectos";

describe("limpiarProyectos", () => {
  test("genera el value del nombre y conserva el que ya tenía", () => {
    const { projects } = limpiarProyectos(
      [
        { label: "AduaniaX", email: " Hola@AduaniaX.com " },
        { value: "kontrolia", label: "Kontrolia (nuevo nombre)" },
      ],
      "kontrolia",
    );

    expect(projects).toEqual([
      {
        value: "aduaniax",
        label: "AduaniaX",
        email: "hola@aduaniax.com",
        fromName: null,
      },
      {
        value: "kontrolia",
        label: "Kontrolia (nuevo nombre)",
        email: null,
        fromName: null,
      },
    ]);
  });

  test("siempre hay un predeterminado si hay proyectos", () => {
    expect(
      limpiarProyectos([{ label: "A" }, { label: "B" }], "borrado")
        .defaultProject,
    ).toBe("a");
    expect(limpiarProyectos([], "x").defaultProject).toBe("");
  });

  test("descarta filas vacías", () => {
    expect(limpiarProyectos([{ label: "  " }, {}], "").projects).toEqual([]);
  });
});

describe("validarProyectos", () => {
  test("rechaza direcciones inválidas o repetidas", () => {
    expect(validarProyectos([{ label: "A", email: "no-es-correo" }])).toBe(
      "crm.projects.invalid_email",
    );
    expect(
      validarProyectos([
        { label: "A", email: "hola@a.com" },
        { label: "B", email: "HOLA@a.com" },
      ]),
    ).toBe("crm.projects.repeated_email");
  });

  test("un proyecto sin dirección es válido", () => {
    expect(validarProyectos([{ label: "A" }])).toBeUndefined();
  });
});

describe("etiquetaDeProyecto", () => {
  test("muestra el nombre, o el value si el proyecto ya no existe", () => {
    const proyectos = [{ value: "aduaniax", label: "AduaniaX" }];
    expect(etiquetaDeProyecto(proyectos, "aduaniax")).toBe("AduaniaX");
    expect(etiquetaDeProyecto(proyectos, "viejo")).toBe("viejo");
    expect(etiquetaDeProyecto(proyectos, null)).toBeNull();
  });
});

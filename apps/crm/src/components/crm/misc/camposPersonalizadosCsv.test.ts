import { describe, expect, it } from "vitest";

import {
  aplanarCamposPersonalizados,
  leerCamposPersonalizadosDeFila,
} from "./camposPersonalizadosCsv";
import type { CustomFieldDefinition } from "../types";

const campos: CustomFieldDefinition[] = [
  { value: "superficie", label: "Superficie (m2)", type: "number" },
  { value: "amueblado", label: "Amueblado", type: "checkbox" },
  { value: "entrega", label: "Fecha de entrega", type: "date" },
  {
    value: "origen",
    label: "Origen",
    type: "list",
    options: ["Feria", "Sitio web"],
  },
];

describe("aplanarCamposPersonalizados", () => {
  it("usa la etiqueta del campo como encabezado de columna", () => {
    // Arrange
    const valores = { superficie: 120, origen: "Feria" };

    // Act
    const columnas = aplanarCamposPersonalizados(campos, valores);

    // Assert
    expect(columnas["Superficie (m2)"]).toBe(120);
    expect(columnas["Origen"]).toBe("Feria");
  });

  it("exporta las casillas como Sí o No", () => {
    expect(
      aplanarCamposPersonalizados(campos, { amueblado: true })["Amueblado"],
    ).toBe("Sí");
    expect(
      aplanarCamposPersonalizados(campos, { amueblado: false })["Amueblado"],
    ).toBe("No");
  });

  it("deja la columna vacía cuando la ficha no tiene valor", () => {
    const columnas = aplanarCamposPersonalizados(campos, {});

    expect(columnas["Superficie (m2)"]).toBeUndefined();
    expect(Object.keys(columnas)).toHaveLength(campos.length);
  });
});

describe("leerCamposPersonalizadosDeFila", () => {
  it("acepta la etiqueta como encabezado, como sale en la exportación", () => {
    const valores = leerCamposPersonalizadosDeFila(campos, {
      "Superficie (m2)": "120",
      Origen: "Feria",
    });

    expect(valores).toEqual({ superficie: 120, origen: "Feria" });
  });

  it("acepta también la clave interna como encabezado", () => {
    const valores = leerCamposPersonalizadosDeFila(campos, {
      superficie: "80",
    });

    expect(valores).toEqual({ superficie: 80 });
  });

  it("interpreta números con coma decimal", () => {
    const valores = leerCamposPersonalizadosDeFila(campos, {
      "Superficie (m2)": "85,5",
    });

    expect(valores).toEqual({ superficie: 85.5 });
  });

  it("interpreta las variantes comunes de las casillas", () => {
    expect(leerCamposPersonalizadosDeFila(campos, { Amueblado: "Sí" })).toEqual(
      { amueblado: true },
    );
    expect(leerCamposPersonalizadosDeFila(campos, { Amueblado: "no" })).toEqual(
      { amueblado: false },
    );
    expect(
      leerCamposPersonalizadosDeFila(campos, { Amueblado: "true" }),
    ).toEqual({ amueblado: true });
  });

  it("ignora números inválidos en lugar de guardar basura", () => {
    const valores = leerCamposPersonalizadosDeFila(campos, {
      "Superficie (m2)": "mucha",
    });

    expect(valores).toBeUndefined();
  });

  it("devuelve undefined cuando la fila no trae ningún campo", () => {
    expect(leerCamposPersonalizadosDeFila(campos, { otra_columna: "x" })).toBe(
      undefined,
    );
  });
});

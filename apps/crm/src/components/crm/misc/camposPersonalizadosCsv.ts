import type { CustomFieldDefinition, CustomFieldValues } from "../types";

/**
 * Puente entre los campos personalizados y los archivos CSV.
 *
 * Al exportar, cada campo se vuelve una columna con su ETIQUETA como
 * encabezado (lo que la persona reconoce). Al importar se acepta tanto la
 * etiqueta como la clave interna, de modo que un archivo exportado se puede
 * reimportar tal cual.
 */

const VERDADEROS = new Set(["sí", "si", "true", "1", "yes", "x"]);
const FALSOS = new Set(["no", "false", "0", ""]);

/** Valores de una ficha como columnas planas de CSV. */
export const aplanarCamposPersonalizados = (
  campos: CustomFieldDefinition[],
  valores: CustomFieldValues | undefined,
): Record<string, string | number | undefined> =>
  campos.reduce<Record<string, string | number | undefined>>((acc, campo) => {
    const valor = valores?.[campo.value];
    if (valor === undefined || valor === null || valor === "") {
      acc[campo.label] = undefined;
    } else if (campo.type === "checkbox") {
      acc[campo.label] = valor ? "Sí" : "No";
    } else {
      acc[campo.label] = valor as string | number;
    }
    return acc;
  }, {});

/**
 * Valores leídos de una fila de CSV, interpretados según el tipo de cada
 * campo. Devuelve undefined si la fila no trae ninguno, para no escribir un
 * objeto vacío en cada contacto importado.
 */
export const leerCamposPersonalizadosDeFila = (
  campos: CustomFieldDefinition[],
  fila: Record<string, unknown>,
): CustomFieldValues | undefined => {
  const valores: CustomFieldValues = {};

  for (const campo of campos) {
    const bruto = fila[campo.label] ?? fila[campo.value];
    if (bruto === undefined || bruto === null) continue;
    const texto = String(bruto).trim();
    if (texto === "") continue;

    if (campo.type === "number") {
      const numero = Number(texto.replace(",", "."));
      if (Number.isFinite(numero)) valores[campo.value] = numero;
    } else if (campo.type === "checkbox") {
      const normalizado = texto.toLowerCase();
      if (VERDADEROS.has(normalizado)) valores[campo.value] = true;
      else if (FALSOS.has(normalizado)) valores[campo.value] = false;
    } else {
      valores[campo.value] = texto;
    }
  }

  return Object.keys(valores).length > 0 ? valores : undefined;
};

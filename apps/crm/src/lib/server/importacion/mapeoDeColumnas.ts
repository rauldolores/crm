import {
  CAMPOS_DE_CONTACTO,
  SIN_COLUMNA,
} from "../../importacion/camposDeContacto";
import { registrarDecisiones } from "../ia/auditoria";
import type { PreguntaDeJev } from "../ia/clasificador";
import {
  hayClasificador,
  preguntarAlClasificador,
} from "../ia/clasificador";

/**
 * A qué columna del CRM corresponde cada cabecera de un CSV ajeno.
 *
 * Importar contactos exigía que el archivo trajera nuestros nombres en inglés
 * (`first_name`, `email_work`). Un CSV exportado de otro CRM o de un Excel en
 * español trae «Nombre», «Correo», «Teléfono celular», y la importación
 * metía las filas con todo vacío sin decir nada. Emparejar dos listas de
 * nombres es exactamente lo que sabe hacer el modelo de decisión, y una sola
 * llamada resuelve todas las columnas: las preguntas se evalúan en paralelo.
 *
 * Aquí hay una persona delante —acaba de elegir el archivo y va a ver el
 * mapeo antes de importar—, así que no se aplica umbral: se propone, se ve y
 * se corrige. La confianza viaja para poder marcar en la pantalla lo que el
 * modelo no tenía claro.
 */

export interface ColumnaSugerida {
  /** La cabecera tal como viene en el archivo. */
  cabecera: string;
  /** El campo del CRM, o `null` si no se reconoció ninguno. */
  campo: string | null;
  confianza: number | null;
}

/** Tope de columnas por archivo: más que esto no es un CSV de contactos. */
const MAX_COLUMNAS = 60;

/** Una muestra del contenido ayuda más que el nombre cuando este es malo. */
const MAX_MUESTRA = 80;

const criterios = (): Record<string, string> => ({
  ...Object.fromEntries(CAMPOS_DE_CONTACTO.map((c) => [c.value, c.pista])),
  [SIN_COLUMNA]:
    "Ninguna de las anteriores: esta columna no tiene sitio en el CRM",
});

/**
 * Una clave por columna, saneada: el nombre de la pregunta viaja en el JSON y
 * una cabecera puede traer acentos, espacios o repetirse.
 */
const clave = (indice: number) => `c${indice}`;

export async function sugerirMapeo(
  organizacionId: string,
  cabeceras: string[],
  /** Primer valor de cada columna, si se tiene: `{"Correo": "ana@x.mx"}`. */
  muestra: Record<string, string> = {},
): Promise<ColumnaSugerida[]> {
  const columnas = cabeceras
    .map((c) => c.trim())
    .filter((c) => c !== "")
    .slice(0, MAX_COLUMNAS);

  if (!columnas.length || !hayClasificador()) {
    return columnas.map((cabecera) => ({
      cabecera,
      campo: null,
      confianza: null,
    }));
  }

  const preguntas: Record<string, PreguntaDeJev> = {};
  const estado: Record<string, unknown> = {};
  columnas.forEach((cabecera, i) => {
    const ejemplo = (muestra[cabecera] ?? "").trim().slice(0, MAX_MUESTRA);
    estado[clave(i)] = ejemplo
      ? { cabecera, primer_valor: ejemplo }
      : { cabecera };
    preguntas[clave(i)] = {
      type: "choice",
      instructions: `Qué dato del CRM contiene la columna «${cabecera}» de esta hoja de contactos`,
      criteria: criterios(),
    };
  });

  const resultado = await preguntarAlClasificador(estado, preguntas);
  if (!resultado.ok || !resultado.respuestas) {
    return columnas.map((cabecera) => ({
      cabecera,
      campo: null,
      confianza: null,
    }));
  }

  const validos = new Set(CAMPOS_DE_CONTACTO.map((c) => c.value));
  const sugeridas: ColumnaSugerida[] = columnas.map((cabecera, i) => {
    const respuesta = resultado.respuestas?.[clave(i)];
    const elegido = respuesta?.choice;
    return {
      cabecera,
      campo: elegido && validos.has(elegido) ? elegido : null,
      confianza:
        typeof respuesta?.confidence === "number" ? respuesta.confidence : null,
    };
  });

  // Dos columnas no pueden ir al mismo campo: si el modelo repite, se queda
  // la más segura y la otra vuelve sin proponer nada. Es lo que haría una
  // persona, y evita que la pantalla llegue con un conflicto ya puesto.
  const mejorPorCampo = new Map<string, ColumnaSugerida>();
  for (const columna of sugeridas) {
    if (!columna.campo) continue;
    const actual = mejorPorCampo.get(columna.campo);
    if (!actual || (columna.confianza ?? 0) > (actual.confianza ?? 0)) {
      mejorPorCampo.set(columna.campo, columna);
    }
  }
  for (const columna of sugeridas) {
    if (columna.campo && mejorPorCampo.get(columna.campo) !== columna) {
      columna.campo = null;
    }
  }

  await registrarDecisiones(
    organizacionId,
    sugeridas.map((columna) => ({
      kind: "csv_column" as const,
      value: columna.campo,
      confianza: columna.confianza,
      // Propuesto, no aplicado: quien importa confirma el mapeo antes.
      aplicada: false,
      detalle: columna.cabecera,
    })),
  );

  return sugeridas;
}

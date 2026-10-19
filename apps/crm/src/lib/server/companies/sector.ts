import { registrarDecisiones } from "../ia/auditoria";
import {
  hayClasificador,
  preguntarAlClasificador,
} from "../ia/clasificador";

/**
 * Propone el sector de una empresa a partir de su nombre y su sitio web, de
 * entre los sectores que la organización configuró en Ajustes.
 *
 * El sector es el campo por el que después se segmenta («mándale esto a todas
 * las refaccionarias»), y es también el que nadie rellena: quien captura una
 * empresa escribe el nombre, el teléfono y sigue. Un desplegable de veinte
 * opciones que hay que abrir y leer se omite siempre.
 *
 * Aquí hay una persona delante del formulario, así que no hay umbral: se
 * propone, se ve y se cambia si no es eso. Elegir de una lista cerrada es
 * exactamente el trabajo del modelo de decisión, y no se le pide nada más —
 * no se visita el sitio web ni se busca nada: solo se lee lo que ya se
 * escribió.
 */

export interface Opcion {
  value: string;
  label: string;
}

/** Valor reservado: «con esto no se puede saber». */
const NINGUNO = "_ninguno";

export interface DatosDeLaEmpresa {
  nombre: string;
  sitio: string;
}

export interface SectorSugerido {
  sector: string | null;
  confianza: number | null;
}

const SIN_SUGERENCIA: SectorSugerido = { sector: null, confianza: null };

export async function sugerirSector(
  organizacionId: string,
  datos: DatosDeLaEmpresa,
  sectores: Opcion[],
): Promise<SectorSugerido> {
  const nombre = datos.nombre.trim().slice(0, 200);
  if (!nombre || !sectores.length || !hayClasificador()) {
    return { ...SIN_SUGERENCIA };
  }

  const resultado = await preguntarAlClasificador(
    { empresa: nombre, sitio_web: datos.sitio.trim().slice(0, 200) },
    {
      sector: {
        type: "choice",
        instructions: "A qué se dedica esta empresa",
        criteria: {
          ...Object.fromEntries(sectores.map((s) => [s.value, s.label])),
          [NINGUNO]:
            "Con el nombre y el sitio web no se puede saber a qué se dedica",
        },
      },
    },
  );
  if (!resultado.ok || !resultado.respuestas) return { ...SIN_SUGERENCIA };

  const respuesta = resultado.respuestas.sector;
  const elegido = sectores.some((s) => s.value === respuesta?.choice)
    ? (respuesta?.choice as string)
    : null;
  const confianza =
    typeof respuesta?.confidence === "number" ? respuesta.confidence : null;

  if (respuesta) {
    await registrarDecisiones(organizacionId, [
      {
        kind: "company_sector",
        value: respuesta.choice ?? null,
        confianza,
        // Propuesto, no aplicado: lo guarda quien está rellenando la ficha.
        aplicada: false,
      },
    ]);
  }

  return { sector: elegido, confianza };
}

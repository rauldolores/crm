import type { DecisionDelModelo } from "../ia/auditoria";
import {
  hayClasificador,
  preguntarAlClasificador,
} from "../ia/clasificador";

/**
 * Juzga la condición en español que una organización escribió en una regla.
 *
 * Hasta ahora una automatización solo podía mirar campos: «cuando se cree un
 * ticket urgente», «cuando una oportunidad pase a Negociación». Lo que nadie
 * podía expresar es lo que de verdad distingue un caso: «cuando el cliente
 * amenace con irse», «cuando pida una demo», «cuando mencione a la
 * competencia». Eso no es un campo, es lo que dice el texto.
 *
 * Con el modelo de decisión sí se puede: la frase del cliente se manda tal
 * cual como instrucción de una pregunta de sí/no, y lo que se juzga es el
 * texto de la fila que disparó la regla.
 *
 * **Falla hacia NO ACTUAR**, al contrario que el resto del CRM. En los demás
 * sitios el modelo rellena un campo que alguien puede corregir; aquí dispara
 * una acción —crear una tarea, mandarle un correo a un cliente— y una acción
 * no se deshace. Ante la duda, la API caída o la falta de clave, la regla no
 * se cumple y queda constancia de por qué.
 */

/**
 * Probabilidad mínima para dar la condición por cumplida. Alta a propósito:
 * ver el párrafo de arriba sobre lo que cuesta equivocarse en cada sentido.
 */
export const UMBRAL_DE_CONDICION = 0.7;

export interface JuicioDeCondicion {
  /** Si la regla debe actuar. */
  seCumple: boolean;
  /** De 0 a 1; `null` cuando no se pudo preguntar. */
  probabilidad: number | null;
  /** Por qué no se pudo juzgar, para dejarlo dicho en la constancia. */
  motivo?: "sin-clasificador" | "sin-respuesta";
  decision?: DecisionDelModelo;
}

/** Recorte del texto que se juzga: se paga por token de entrada. */
const MAX_TEXTO = 2000;

export async function juzgarCondicion(
  condicion: string,
  texto: string,
): Promise<JuicioDeCondicion> {
  const frase = condicion.trim();
  const contenido = texto.trim().slice(0, MAX_TEXTO);
  if (!frase || !contenido) {
    return { seCumple: false, probabilidad: null, motivo: "sin-respuesta" };
  }
  if (!hayClasificador()) {
    return { seCumple: false, probabilidad: null, motivo: "sin-clasificador" };
  }

  const resultado = await preguntarAlClasificador(
    { texto: contenido },
    {
      condicion: {
        type: "noul",
        // La frase de la organización es la instrucción, sin envolverla en
        // nada: lo que escribió es exactamente lo que se pregunta.
        instructions: frase,
      },
    },
  );
  if (!resultado.ok) {
    return { seCumple: false, probabilidad: null, motivo: "sin-respuesta" };
  }

  const probabilidad = resultado.respuestas?.condicion?.noul;
  if (typeof probabilidad !== "number") {
    return { seCumple: false, probabilidad: null, motivo: "sin-respuesta" };
  }

  const seCumple = probabilidad >= UMBRAL_DE_CONDICION;
  return {
    seCumple,
    probabilidad,
    decision: {
      kind: "automation_condition",
      value: String(seCumple),
      confianza: probabilidad,
      aplicada: seCumple,
    },
  };
}

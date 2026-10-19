import type { DecisionDelModelo } from "../ia/auditoria";
import {
  hayClasificador,
  preguntarAlClasificador,
} from "../ia/clasificador";
import { CONFIANZA_MINIMA_AUTOMATICA } from "./clasificacion";

/**
 * De qué habla el comentario de una encuesta de satisfacción.
 *
 * La nota del 1 al 5 dice que algo va mal; el comentario dice qué. Pero nadie
 * lee trescientos comentarios al mes, así que hoy el informe de soporte
 * muestra una media sin explicación. Con el tema clasificado responde la
 * pregunta que de verdad se hace el dueño del CRM: «de qué se queja la
 * gente».
 *
 * La lista de temas es nuestra, no de cada organización: tiene que significar
 * lo mismo en todos los CRM para que la gráfica se pueda etiquetar y para que
 * la serie no cambie de significado cuando alguien edite Ajustes.
 *
 * Se pregunta al modelo de decisión y nada más: aquí hay un cliente esperando
 * su «gracias» y la organización no debería pagar un modelo de lenguaje por
 * cada encuesta. Sin clave de despliegue no pasa nada — la encuesta se guarda
 * igual, solo sin tema, como antes de que esto existiera.
 */

/** Los temas posibles. El informe los traduce por esta clave. */
export const TEMAS_DE_ENCUESTA = [
  "response_time",
  "solution",
  "treatment",
  "product",
  "price",
  "praise",
  "other",
] as const;

export type TemaDeEncuesta = (typeof TEMAS_DE_ENCUESTA)[number];

const CRITERIOS: Record<TemaDeEncuesta, string> = {
  response_time:
    "Se queja de la espera: tardaron en contestar o en resolverlo, tuvo que insistir",
  solution:
    "Se queja del resultado: no se resolvió, se resolvió a medias o el problema volvió",
  treatment:
    "Se queja del trato o de la comunicación: malos modos, explicaciones confusas, se sintió ignorado",
  product:
    "Se queja del producto en sí: falla, le falta algo o es difícil de usar",
  price: "Habla del precio, del cobro o de la factura",
  praise: "Solo agradece o elogia, sin ninguna queja",
  other: "Ninguno de los anteriores, o el comentario no dice nada concreto",
};

export interface JuicioDelComentario {
  /** `null` si no se pudo clasificar o el modelo no se aclaró. */
  tema: TemaDeEncuesta | null;
  /** Si el cliente sigue con algo sin resolver. `null` si no se pudo saber. */
  seguimiento: boolean | null;
  /** Constancia para la auditoría, antes de aplicar el umbral. */
  decisiones: DecisionDelModelo[];
}

/** Nuevo cada vez: quien lo recibe no debe poder tocar el de la próxima. */
const sinJuicio = (): JuicioDelComentario => ({
  tema: null,
  seguimiento: null,
  decisiones: [],
});

const esTema = (valor: unknown): valor is TemaDeEncuesta =>
  typeof valor === "string" &&
  (TEMAS_DE_ENCUESTA as readonly string[]).includes(valor);

export async function clasificarComentario(
  comentario: string,
  nota: number,
): Promise<JuicioDelComentario> {
  const texto = comentario.trim();
  if (!texto || !hayClasificador()) return sinJuicio();

  const resultado = await preguntarAlClasificador(
    { comentario: texto, nota },
    {
      tema: {
        type: "choice",
        instructions:
          "De qué habla este comentario de un cliente sobre la atención que recibió",
        criteria: CRITERIOS,
      },
      seguimiento: {
        type: "noul",
        instructions:
          "El cliente sigue con un problema sin resolver y alguien debería contactarlo",
        criteria: {
          true: "Describe algo que aún le pasa, pide algo que no ha recibido o avisa de que volverá a ocurrir",
          false:
            "Su asunto quedó resuelto, aunque se queje de cómo fue el camino",
        },
      },
    },
  );
  if (!resultado.ok || !resultado.respuestas) return sinJuicio();

  const tema = resultado.respuestas.tema;
  const seguimiento = resultado.respuestas.seguimiento;

  // El mismo corte que cualquier decisión que se escribe sin que nadie la
  // vea: ver CONFIANZA_MINIMA_AUTOMATICA.
  const bastante = (confianza?: number) =>
    typeof confianza === "number" && confianza >= CONFIANZA_MINIMA_AUTOMATICA;

  const temaElegido =
    esTema(tema?.choice) && bastante(tema?.confidence)
      ? (tema.choice as TemaDeEncuesta)
      : null;

  // En una pregunta de sí/no la propia probabilidad es la respuesta, así que
  // el umbral se aplica a los dos lados: por debajo de 0.3 se afirma que no,
  // por encima de 0.7 que sí, y en medio no se afirma nada.
  const probabilidad = seguimiento?.noul;
  const pideSeguimiento =
    typeof probabilidad !== "number"
      ? null
      : probabilidad >= CONFIANZA_MINIMA_AUTOMATICA
        ? true
        : probabilidad <= 1 - CONFIANZA_MINIMA_AUTOMATICA
          ? false
          : null;

  const decisiones: DecisionDelModelo[] = [];
  if (tema) {
    decisiones.push({
      kind: "survey_topic",
      value: tema.choice ?? null,
      confianza: typeof tema.confidence === "number" ? tema.confidence : null,
      aplicada: temaElegido !== null,
    });
  }
  if (typeof probabilidad === "number") {
    decisiones.push({
      kind: "survey_followup",
      value: pideSeguimiento === null ? null : String(pideSeguimiento),
      confianza: probabilidad,
      aplicada: pideSeguimiento !== null,
    });
  }

  return { tema: temaElegido, seguimiento: pideSeguimiento, decisiones };
}

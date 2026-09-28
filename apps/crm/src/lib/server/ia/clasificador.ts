/**
 * Cliente del modelo de decisión Jev (TypeSafe AI), para uso EXCLUSIVO en
 * servidor: aquí se maneja la clave, que nunca debe llegar al navegador.
 *
 * Jev NO es un modelo de lenguaje y no sustituye al de `proveedores.ts`: no
 * redacta, devuelve valores tipados de una lista cerrada con su
 * probabilidad. Redactar un correo y decidir la prioridad de un ticket son
 * trabajos distintos, así que los dos conviven, cada uno con su clave.
 *
 * Y a diferencia del proveedor de texto, esta clave es del despliegue
 * (`TYPESAFE_API_KEY`), no de cada organización: clasificar cuesta una
 * fracción de céntimo por llamada, y pedirle una clave propia a cada cliente
 * costaría más en soporte que el consumo entero. Sin la variable, todo lo
 * que dependa de esto se salta sin romperse — nunca es un error para quien
 * está rellenando un formulario.
 *
 * Se llama con `fetch`, sin SDK, por el mismo motivo que los proveedores de
 * texto: una dependencia más que auditar y mantener para un POST.
 */

const PUNTO_FINAL = "https://api.typesafe.ai/v1/systemone";
const MODELO = "jev-latest";

// Jev responde en decenas de milisegundos; si tarda más de esto, algo va mal
// y es mejor seguir sin clasificar que hacer esperar a quien envía el
// formulario.
const TIEMPO_LIMITE_MS = 15000;

// La API pide reintentar 429 y 529 con espera creciente. Dos reintentos
// cubren un pico momentáneo sin convertir una saturación en una espera
// larga.
const REINTENTOS = 2;
const ESPERA_BASE_MS = 300;

/** Pregunta de opción múltiple: devuelve una de las claves de `criteria`. */
export interface PreguntaDeEleccion {
  type: "choice";
  instructions: string;
  /** Opción → cuándo elegirla. Hasta 255 opciones. */
  criteria: Record<string, string>;
}

/** Pregunta de sí/no: devuelve la probabilidad de que la afirmación sea cierta. */
export interface PreguntaBinaria {
  type: "noul";
  instructions: string;
  criteria?: { true: string; false: string };
}

export type PreguntaDeJev = PreguntaDeEleccion | PreguntaBinaria;

export interface RespuestaDeJev {
  type: string;
  /** La opción elegida, en las preguntas de tipo `choice`. */
  choice?: string;
  /** Probabilidad de 0 a 1, en las preguntas de tipo `noul`. */
  noul?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
}

export interface ResultadoDelClasificador {
  ok: boolean;
  respuestas?: Record<string, RespuestaDeJev>;
  mensaje?: string;
}

/** Si no hay clave, quien llama se salta la clasificación en silencio. */
export const hayClasificador = (): boolean =>
  Boolean(process.env.TYPESAFE_API_KEY);

const espera = (ms: number) =>
  new Promise((resolver) => setTimeout(resolver, ms));

const mensajeDeError = (estado: number, datos: unknown): string => {
  const c = datos as
    | { error?: { message?: string }; message?: string }
    | null
    | undefined;
  return (
    c?.error?.message ||
    c?.message ||
    `El clasificador respondió ${estado}.`
  );
};

/**
 * Manda un estado y un mapa de preguntas tipadas. Las preguntas se evalúan
 * en paralelo, así que preguntar cinco cosas cuesta lo mismo en tiempo que
 * preguntar una: conviene agruparlas en una sola llamada.
 */
export async function preguntarAlClasificador(
  estado: unknown,
  preguntas: Record<string, PreguntaDeJev>,
): Promise<ResultadoDelClasificador> {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    return { ok: false, mensaje: "Falta configurar TYPESAFE_API_KEY." };
  }
  if (Object.keys(preguntas).length === 0) {
    return { ok: false, mensaje: "No hay ninguna pregunta que hacer." };
  }

  const cuerpo = JSON.stringify({ model: MODELO, state: estado, questions: preguntas });

  for (let intento = 0; ; intento++) {
    const respuesta = await fetch(PUNTO_FINAL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: cuerpo,
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    }).catch(() => null);

    if (!respuesta) {
      return { ok: false, mensaje: "No se pudo contactar con el clasificador." };
    }

    const saturado = respuesta.status === 429 || respuesta.status === 529;
    if (saturado && intento < REINTENTOS) {
      await espera(ESPERA_BASE_MS * 2 ** intento);
      continue;
    }

    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      return { ok: false, mensaje: mensajeDeError(respuesta.status, datos) };
    }

    const respuestas = (datos as {
      answers?: Record<string, RespuestaDeJev>;
    } | null)?.answers;
    if (!respuestas) {
      return { ok: false, mensaje: "El clasificador no devolvió respuestas." };
    }

    return { ok: true, respuestas };
  }
}

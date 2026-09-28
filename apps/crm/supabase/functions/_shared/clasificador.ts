/**
 * Cliente del modelo de decisión Jev (TypeSafe AI) para las funciones edge.
 *
 * Es el gemelo Deno de `src/lib/server/ia/clasificador.ts`. No se comparte
 * código con él a propósito y no por descuido: son dos runtimes distintos
 * (Deno resuelve por URL y con extensión `.ts`, Node por `node_modules`), así
 * que importar el de `src/` desde aquí no compila. Se mantiene a propósito
 * MÁS pequeño que el de Node —una pregunta, un reintento— porque aquí solo
 * hace falta una cosa: clasificar un correo que entra.
 *
 * La clave es del despliegue (`TYPESAFE_API_KEY`), la misma que usa la
 * aplicación, puesta como secreto de las funciones:
 *   npx supabase secrets set TYPESAFE_API_KEY=...
 * Sin ella no se clasifica nada y el webhook se comporta como antes.
 */

const PUNTO_FINAL = "https://api.typesafe.ai/v1/systemone";

export const MODELO_DE_DECISION = "jev-latest";

/** Jev responde en decenas de ms; más de esto es que algo va mal. */
const TIEMPO_LIMITE_MS = 10000;

/** Pregunta de opción múltiple: devuelve una de las claves de `criteria`. */
export interface PreguntaDeEleccion {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
}

export interface RespuestaDeJev {
  type: string;
  choice?: string;
  noul?: number;
  confidence?: number;
}

export interface ResultadoDelClasificador {
  ok: boolean;
  respuestas?: Record<string, RespuestaDeJev>;
}

export const hayClasificador = (): boolean =>
  Boolean(Deno.env.get("TYPESAFE_API_KEY"));

/**
 * Manda un estado y un mapa de preguntas. Nunca lanza: un fallo aquí no debe
 * tumbar el webhook de correo entrante, porque Postmark reintentaría y el
 * mensaje del cliente es lo único irrecuperable de todo esto.
 */
export async function preguntarAlClasificador(
  state: Record<string, unknown>,
  questions: Record<string, PreguntaDeEleccion>,
): Promise<ResultadoDelClasificador> {
  const clave = Deno.env.get("TYPESAFE_API_KEY");
  if (!clave) return { ok: false };

  // Un solo reintento: la API pide esperar y reintentar en 429/529, pero aquí
  // hay un webhook con su propio tiempo límite al otro lado.
  for (let intento = 0; intento <= 1; intento++) {
    const abortar = new AbortController();
    const reloj = setTimeout(() => abortar.abort(), TIEMPO_LIMITE_MS);
    try {
      const respuesta = await fetch(PUNTO_FINAL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clave}`,
        },
        body: JSON.stringify({
          state,
          model: MODELO_DE_DECISION,
          questions,
        }),
        signal: abortar.signal,
      });

      if (respuesta.status === 429 || respuesta.status === 529) {
        if (intento === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        return { ok: false };
      }
      if (!respuesta.ok) return { ok: false };

      const datos = (await respuesta.json()) as {
        answers?: Record<string, RespuestaDeJev>;
      };
      return { ok: true, respuestas: datos.answers ?? {} };
    } catch {
      return { ok: false };
    } finally {
      clearTimeout(reloj);
    }
  }
  return { ok: false };
}

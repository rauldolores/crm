import {
  hayClasificador,
  preguntarAlClasificador,
} from "../_shared/clasificador.ts";

/**
 * Quién escribió el correo que acaba de entrar: una persona o una máquina.
 *
 * Cuando alguien responde a un correo enviado desde el CRM, la respuesta se
 * archiva en su ficha y cuenta como actividad. Por el mismo camino entran las
 * respuestas automáticas («estoy de vacaciones», «recibimos tu mensaje, ticket
 * #123»), los boletines y los rebotes del servidor. Todos ellos adelantaban
 * `last_seen`, que vale 40 puntos de temperatura: un contacto de vacaciones
 * subía a lo más alto del embudo precisamente por no haber leído nada.
 *
 * La nota se guarda siempre, sea quien sea el que escribió. Lo único que
 * cambia es si cuenta como señal de vida.
 *
 * **Falla hacia PERSONA**: sin clave, con la API caída, con la respuesta rara
 * o con poca confianza, se trata como si hubiera escrito alguien. Confundir
 * una respuesta de verdad con una máquina es lo caro — ese contacto deja de
 * contar como vivo y nadie lo vuelve a llamar.
 */

export const INTENCIONES = [
  "human_reply",
  "autoresponder",
  "newsletter",
  "bounce",
] as const;

export type IntencionDelCorreo = (typeof INTENCIONES)[number];

const CRITERIOS: Record<IntencionDelCorreo, string> = {
  human_reply:
    "Lo escribió una persona: contesta, pregunta, se queja, agradece o pide algo concreto",
  autoresponder:
    "Respuesta automática: ausencia u vacaciones, acuse de recibo, número de ticket asignado, «no responda a este correo»",
  newsletter:
    "Envío masivo o aviso de un sistema: boletín, promoción, notificación de una plataforma, factura automática",
  bounce:
    "Aviso del servidor de correo: dirección inexistente, buzón lleno, entrega fallida, mailer-daemon",
};

/**
 * Confianza mínima para NO contar el correo como una persona. Es alta a
 * propósito y en un solo sentido: aquí nadie va a revisar la decisión, y el
 * error que importa es el de marcar de máquina lo que escribió un cliente.
 */
const CONFIANZA_MINIMA = 0.8;

export interface JuicioDelCorreo {
  /** `null` cuando no se pudo clasificar; quien llama lo trata como persona. */
  intencion: IntencionDelCorreo | null;
  /** Si NO lo escribió una persona: la nota se marca como automática. */
  automatico: boolean;
  /** Lo que respondió el modelo, para la constancia de auditoría. */
  valor: string | null;
  confianza: number | null;
}

const esIntencion = (valor: unknown): valor is IntencionDelCorreo =>
  typeof valor === "string" &&
  (INTENCIONES as readonly string[]).includes(valor);

const COMO_PERSONA: JuicioDelCorreo = {
  intencion: null,
  automatico: false,
  valor: null,
  confianza: null,
};

export async function intencionDelCorreo(
  asunto: string,
  cuerpo: string,
): Promise<JuicioDelCorreo> {
  if (!hayClasificador()) return { ...COMO_PERSONA };

  const resultado = await preguntarAlClasificador(
    // Recortado: un correo con veinte respuestas citadas debajo no aporta
    // nada a esta decisión y se paga por token de entrada.
    { asunto: asunto.slice(0, 300), cuerpo: cuerpo.slice(0, 2000) },
    {
      intencion: {
        type: "choice",
        instructions: "Quién escribió este correo que llegó al CRM",
        criteria: CRITERIOS,
      },
    },
  );
  if (!resultado.ok) return { ...COMO_PERSONA };

  const respuesta = resultado.respuestas?.intencion;
  const confianza =
    typeof respuesta?.confidence === "number" ? respuesta.confidence : null;

  if (!esIntencion(respuesta?.choice)) {
    return { ...COMO_PERSONA, valor: respuesta?.choice ?? null, confianza };
  }

  const intencion = respuesta.choice;
  const seguro = confianza !== null && confianza >= CONFIANZA_MINIMA;

  return {
    intencion,
    automatico: seguro && intencion !== "human_reply",
    valor: intencion,
    confianza,
  };
}

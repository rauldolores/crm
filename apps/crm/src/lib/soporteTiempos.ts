import { z } from "zod";

/**
 * Tiempos de soporte (crm.soporte_tiempos): lo que comparten la pantalla del
 * ticket, la ruta /api/tickets/tiempos y la herramienta MCP. Las reglas de
 * verdad las impone la base (ver crm.preparar_soporte_tiempo); esto solo
 * evita mandar algo que la base va a rechazar y da un mensaje claro.
 */

/** Por qué un registro no descuenta de la bolsa. */
export const MOTIVOS_NO_CONSUME = ["FALLA_SISTEMA", "CORTESIA", "OTRO"] as const;
export type MotivoNoConsume = (typeof MOTIVOS_NO_CONSUME)[number];

/** Un día entero: más que eso en un solo registro es un error de dedo. */
export const MINUTOS_MAXIMOS = 1440;

const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo)
    .nullish()
    .transform((valor) => valor || null);

export const registroDeTiempoSchema = z
  .object({
    ticketId: z.number().int().positive(),
    minutos: z
      .number()
      .int("Los minutos van en números enteros.")
      .min(1, "Registra al menos un minuto.")
      .max(MINUTOS_MAXIMOS, "Un registro no puede pasar de 24 horas."),
    descripcionCliente: z
      .string()
      .trim()
      .min(1, "Escribe qué se hizo: es lo que leerá el cliente.")
      .max(2000),
    notaInterna: textoOpcional(4000),
    consume: z.boolean().default(true),
    motivoNoConsume: z.enum(MOTIVOS_NO_CONSUME).nullish(),
    /** AAAA-MM-DD; por omisión, hoy en hora de México. */
    fechaAtencion: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha va como AAAA-MM-DD.")
      .nullish(),
    autorizadoPor: textoOpcional(200),
    autorizadoEn: z.iso.datetime({ offset: true }).nullish(),
  })
  .superRefine((registro, ctx) => {
    if (!registro.consume && !registro.motivoNoConsume) {
      ctx.addIssue({
        code: "custom",
        path: ["motivoNoConsume"],
        message: "Indica por qué no consume horas.",
      });
    }
  })
  .transform((registro) => ({
    ...registro,
    motivoNoConsume: registro.consume ? null : registro.motivoNoConsume!,
    // La autorización va completa o no va: quién y cuándo.
    autorizadoEn: registro.autorizadoPor
      ? (registro.autorizadoEn ?? new Date().toISOString())
      : null,
  }));

export type RegistroDeTiempo = z.infer<typeof registroDeTiempoSchema>;
/** Lo que manda la pantalla, antes de normalizar. */
export type RegistroDeTiempoEntrada = z.input<typeof registroDeTiempoSchema>;

export const correccionDeTiempoSchema = z.object({
  id: z.number().int().positive(),
  motivo: z
    .string()
    .trim()
    .min(1, "Explica por qué se corrige.")
    .max(1000),
  /**
   * La cifra buena. Vacío o 0 = solo anular el registro. Si viene, se guarda
   * un registro nuevo igual al original con estos minutos.
   */
  minutosCorrectos: z
    .number()
    .int()
    .min(0)
    .max(MINUTOS_MAXIMOS)
    .nullish(),
});

export type CorreccionDeTiempo = z.infer<typeof correccionDeTiempoSchema>;

/** Una fila de crm.soporte_resumen: la bolsa de una empresa en un mes. */
export interface ResumenDeSoporte {
  /** Primer día del mes (AAAA-MM-DD). */
  mes: string;
  /** Slugs de los extras de soporte vigentes (soporte-basico…). */
  bolsas: string[];
  minutos_incluidos: number;
  minutos_usados: number;
  minutos_de_mas: number;
  minutos_no_consumen: number;
  precio_hora_de_mas_centavos: number | null;
  registros: number;
}

/** Primer mensaje de error de zod, para devolverlo tal cual. */
export const primerError = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "Datos no válidos.";

/** 90 → «1 h 30 min», 45 → «45 min», -60 → «-1 h». */
export const formatearMinutos = (minutos: number): string => {
  const signo = minutos < 0 ? "-" : "";
  const total = Math.abs(minutos);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${signo}${resto} min`;
  return resto === 0
    ? `${signo}${horas} h`
    : `${signo}${horas} h ${resto} min`;
};

/** Hoy (AAAA-MM-DD) en hora de México: el día que cuenta para la bolsa. */
export const hoyEnMexico = (ahora: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);

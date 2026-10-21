/**
 * Oportunidades de renovación: las abre y las cierra la base
 * (crm.generar_oportunidades_de_renovacion, cada hora por pg_cron). Aquí solo
 * viven las reglas que la pantalla necesita para decir qué va a pasar con
 * cada contrato, con la MISMA lectura de los ajustes que hace la base
 * (crm.ajustes_de_renovaciones): si se cambia una, se cambia la otra.
 *
 * Todo puro y con fechas AAAA-MM-DD en UTC, para probarlo sin red.
 */

/** Ajustes de la organización, en config.renewals. */
export interface AjustesDeRenovaciones {
  active: boolean;
  daysBeforeYearly: number;
  daysBeforeQuarterly: number;
  daysBeforeMonthly: number;
  /** Incluir los contratos que se cobran con tarjeta (se renuevan solos). */
  includeCardContracts: boolean;
  /** Embudo donde se abren (value de un DealPipeline). */
  pipeline: string;
  /** Embudo que agregó el sistema: no cuenta contra el límite del plan. */
  systemPipeline?: string;
}

export const AJUSTES_DE_RENOVACIONES_DE_FABRICA: AjustesDeRenovaciones = {
  active: true,
  daysBeforeYearly: 60,
  daysBeforeQuarterly: 30,
  daysBeforeMonthly: 15,
  includeCardContracts: false,
  pipeline: "renovaciones",
};

/** Motivos de pérdida que pone la base al cerrar una renovación perdida. */
export const MOTIVO_VENCIO_SIN_RENOVAR = "vencio-sin-renovar";
export const MOTIVO_CONTRATO_CANCELADO = "contrato-cancelado";

const MAXIMO_DE_DIAS = 366;

/** Un entero de 0 a 366 (número o texto); lo demás vale lo de fábrica. */
export const diasValidos = (valor: unknown, defecto: number): number => {
  const texto =
    typeof valor === "number" || typeof valor === "string" ? String(valor) : "";
  if (!/^[0-9]{1,4}$/.test(texto)) return defecto;
  return Math.min(Number(texto), MAXIMO_DE_DIAS);
};

/** Los ajustes guardados con los de fábrica donde falten o no sirvan. */
export const ajustesDeRenovaciones = (
  guardados: unknown,
): AjustesDeRenovaciones => {
  const r =
    guardados && typeof guardados === "object" && !Array.isArray(guardados)
      ? (guardados as Record<string, unknown>)
      : {};
  const f = AJUSTES_DE_RENOVACIONES_DE_FABRICA;
  const embudo =
    typeof r.pipeline === "string" && /^[A-Za-z0-9_-]{1,60}$/.test(r.pipeline)
      ? r.pipeline
      : f.pipeline;
  return {
    active: typeof r.active === "boolean" ? r.active : f.active,
    daysBeforeYearly: diasValidos(r.daysBeforeYearly, f.daysBeforeYearly),
    daysBeforeQuarterly: diasValidos(
      r.daysBeforeQuarterly,
      f.daysBeforeQuarterly,
    ),
    daysBeforeMonthly: diasValidos(r.daysBeforeMonthly, f.daysBeforeMonthly),
    includeCardContracts:
      typeof r.includeCardContracts === "boolean"
        ? r.includeCardContracts
        : f.includeCardContracts,
    pipeline: embudo,
    ...(typeof r.systemPipeline === "string"
      ? { systemPipeline: r.systemPipeline }
      : {}),
  };
};

export type PeriodoRecurrente = "monthly" | "quarterly" | "yearly";

export const esPeriodoRecurrente = (
  periodo: unknown,
): periodo is PeriodoRecurrente =>
  periodo === "monthly" || periodo === "quarterly" || periodo === "yearly";

/** Cuántos días antes de la renovación se abre la oportunidad. */
export const diasDeAnticipacion = (
  ajustes: AjustesDeRenovaciones,
  periodo: PeriodoRecurrente,
): number =>
  periodo === "yearly"
    ? ajustes.daysBeforeYearly
    : periodo === "quarterly"
      ? ajustes.daysBeforeQuarterly
      : ajustes.daysBeforeMonthly;

/** Suma días a una fecha AAAA-MM-DD (negativos restan). */
export const sumarDias = (fecha: string, dias: number): string => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

/** Fecha de hoy AAAA-MM-DD (en la zona de quien consulta). */
export const hoyComoFecha = (ahora: Date = new Date()): string => {
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
};

/** Lo mínimo del contrato que hace falta para decidir. */
export interface ContratoParaRenovar {
  status: string;
  billing_period?: string | null;
  renews_on?: string | null;
  provider?: string | null;
}

/** Lo mínimo de la oportunidad de renovación. */
export interface OportunidadDeRenovacion {
  id: string | number;
  stage: string;
  renewal_for?: string | null;
  archived_at?: string | null;
}

export type EstadoDeRenovacion =
  /** Ya hay oportunidad para la renovación que viene. */
  | { tipo: "abierta"; oportunidad: OportunidadDeRenovacion }
  /** Todavía no: se abrirá ese día (o en la próxima corrida, si ya pasó). */
  | { tipo: "programada"; fecha: string }
  /** No aplica: apagado, sin periodicidad, inactivo, con tarjeta… */
  | { tipo: "no_aplica" };

/**
 * Qué decir de la renovación de un contrato: la oportunidad abierta para la
 * fecha que viene, o el día en que se abrirá. Mismas condiciones que la base.
 */
export const estadoDeRenovacion = (
  contrato: ContratoParaRenovar,
  oportunidades: OportunidadDeRenovacion[],
  ajustes: AjustesDeRenovaciones,
  hoy: string,
): EstadoDeRenovacion => {
  const renueva = contrato.renews_on;
  if (!renueva || !esPeriodoRecurrente(contrato.billing_period)) {
    return { tipo: "no_aplica" };
  }
  const propia = oportunidades.find(
    (oportunidad) => oportunidad.renewal_for === renueva,
  );
  if (propia) return { tipo: "abierta", oportunidad: propia };

  if (
    !ajustes.active ||
    contrato.status !== "active" ||
    renueva < hoy ||
    (!ajustes.includeCardContracts && contrato.provider === "stripe")
  ) {
    return { tipo: "no_aplica" };
  }
  const apertura = sumarDias(
    renueva,
    -diasDeAnticipacion(ajustes, contrato.billing_period),
  );
  return { tipo: "programada", fecha: apertura < hoy ? hoy : apertura };
};

/**
 * Lo que el formulario de Ajustes guarda en config.renewals: los valores
 * limpios y, sin tocarlo, el embudo que agregó el sistema.
 */
export const limpiarRenovaciones = (
  formulario: unknown,
  guardados?: unknown,
): AjustesDeRenovaciones => {
  const limpios = ajustesDeRenovaciones(formulario);
  const previos = ajustesDeRenovaciones(guardados);
  const resto: AjustesDeRenovaciones = { ...limpios };
  delete resto.systemPipeline;
  return previos.systemPipeline
    ? { ...resto, systemPipeline: previos.systemPipeline }
    : resto;
};

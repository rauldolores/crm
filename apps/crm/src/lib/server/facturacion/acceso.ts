import { z } from "zod";

import { ErrorDeConector } from "../conectores/tipos";
import { ORIGEN_KONTROLIA_AUTH } from "../integraciones/kontroliaAuth";
import { getServiceClient } from "../supabase-service";
import {
  COLUMNAS_DE_FACTURA,
  exigir,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import { esFecha, esPeriodicidad, MESES_POR_PERIODO } from "./periodos";
import type { EstadoDeAcceso } from "./tipos";

/**
 * Renovar el acceso al pagar.
 *
 * Regla del dueño: el acceso a un producto de KONTROLIA que se cobra por
 * contrato (transferencia) se extiende cuando su factura queda PAGADA, no
 * cuando se timbra. Entonces Vinqulia le pide a KontrolIA Auth que mueva la
 * vigencia de la suscripción al fin del periodo de la factura:
 *
 *   POST {KONTROLIA_AUTH_SERVER_URL}/api/platform/subscriptions/renew
 *   Authorization: Bearer kpk_live_… (KONTROLIA_PLATFORM_API_KEY)
 *
 * Los cobros con tarjeta no aplican: KontrolIA Auth ya renovó al cobrar.
 *
 * Nunca dos veces la misma renovación: KontrolIA Auth es idempotente por
 * `externalRef` (vinqulia:invoice:<id>) y, de este lado, cada intento
 * «toma» la factura con un cambio condicional sobre access_updated_at.
 *
 * Sin la URL o sin la clave no se llama a nadie: la factura queda «con
 * error» con el motivo, y el proceso de cada hora la retoma en cuanto se
 * configure.
 */

/** Intentos automáticos antes de dejarla para que alguien la reintente. */
export const MAX_INTENTOS_DE_ACCESO = 10;
/** Un intento «tomado» hace más de esto se quedó a medias: se retoma. */
const MINUTOS_EN_CURSO = 5;
const TIEMPO_DE_ESPERA_MS = 15_000;
const HORA_MS = 3_600_000;

// ── Configuración ───────────────────────────────────────────────────────

export interface ConfiguracionDeAcceso {
  url: string;
  clave: string;
}

export const configuracionDeAcceso = (): ConfiguracionDeAcceso | null => {
  const url = (
    process.env.KONTROLIA_AUTH_SERVER_URL ||
    process.env.NEXT_PUBLIC_KONTROLIA_AUTH_SERVER_URL ||
    ""
  ).replace(/\/+$/, "");
  const clave = process.env.KONTROLIA_PLATFORM_API_KEY ?? "";
  if (!url || !clave) return null;
  return { url, clave };
};

export const SIN_CONFIGURAR =
  "La renovación del acceso no está configurada: falta KONTROLIA_PLATFORM_API_KEY (o KONTROLIA_AUTH_SERVER_URL) en el servidor.";

// ── Decidir ─────────────────────────────────────────────────────────────

export type FacturaParaAcceso = Pick<
  FacturaDeBandeja,
  | "id"
  | "origin"
  | "billing_status"
  | "payment_status"
  | "period_start"
  | "period_end"
  | "total"
  | "currency"
  | "serie"
  | "folio"
  | "uuid"
  | "paid_at"
  | "payment_reference"
>;

export interface ContratoParaAcceso {
  id: number;
  source: string | null;
  provider: string | null;
  external_id: string | null;
  billing_period: string | null;
  application_slug: string | null;
}

const COLUMNAS_DE_CONTRATO_PARA_ACCESO =
  "id, source, provider, external_id, billing_period, application_slug";

/**
 * ¿Hay que pedir a KontrolIA Auth que renueve? Solo la factura de un
 * contrato de KontrolIA Auth que se cobra por contrato (provider manual),
 * timbrada, pagada y con su periodo.
 */
export const debeRenovarAcceso = (
  factura: FacturaParaAcceso,
  contrato: ContratoParaAcceso | null,
): boolean =>
  factura.origin === "contract" &&
  factura.billing_status === "stamped" &&
  factura.payment_status === "paid" &&
  esFecha(factura.period_start) &&
  esFecha(factura.period_end) &&
  contrato != null &&
  contrato.source === ORIGEN_KONTROLIA_AUTH &&
  contrato.provider === "manual";

/**
 * El estado que le toca a una factura pagada y timbrada que todavía no
 * tiene ninguno: «pendiente» si hay que renovar, «no aplica» si no (tarjeta,
 * créditos o un contrato que no es de KontrolIA Auth por transferencia), o
 * null si todavía no se sabe (sin pagar o sin timbrar).
 */
export const estadoDeAccesoAlPagar = (
  factura: FacturaParaAcceso,
  contrato: ContratoParaAcceso | null,
): EstadoDeAcceso | null => {
  if (
    factura.origin === "card" ||
    factura.origin === "credits" ||
    factura.origin === "overage"
  ) {
    return "not_applicable";
  }
  if (factura.origin !== "contract") return null;
  if (factura.payment_status !== "paid" || factura.billing_status !== "stamped")
    return null;
  return debeRenovarAcceso(factura, contrato) ? "pending" : "not_applicable";
};

// ── Petición ────────────────────────────────────────────────────────────

export interface PeticionDeRenovacion {
  organizationId: string;
  application: string;
  months: number;
  periodStart: string;
  periodEnd: string;
  /** Centavos. */
  amount: number;
  currency: string;
  paymentReference: string;
  paidAt: string;
  notes: string;
  externalRef: string;
}

/** Un problema con los datos: reintentar no lo arregla. */
export class DatosDeRenovacionInvalidos extends Error {}

/** Organización de KontrolIA Auth y producto, de `${org}:${aplicación}`. */
export const separarLlaveDeContrato = (
  externalId: string | null,
): { organizationId: string; application: string } | null => {
  if (!externalId) return null;
  const corte = externalId.indexOf(":");
  if (corte <= 0 || corte === externalId.length - 1) return null;
  return {
    organizationId: externalId.slice(0, corte),
    application: externalId.slice(corte + 1),
  };
};

export const peticionDeRenovacion = (
  factura: FacturaParaAcceso,
  contrato: ContratoParaAcceso,
): PeticionDeRenovacion => {
  const llave = separarLlaveDeContrato(contrato.external_id);
  if (!llave) {
    throw new DatosDeRenovacionInvalidos(
      "El contrato no trae la organización y el producto de KontrolIA Auth.",
    );
  }
  if (!esPeriodicidad(contrato.billing_period)) {
    throw new DatosDeRenovacionInvalidos(
      "El contrato no tiene periodicidad (mensual, trimestral o anual).",
    );
  }
  if (!esFecha(factura.period_start) || !esFecha(factura.period_end)) {
    throw new DatosDeRenovacionInvalidos("La factura no trae su periodo.");
  }
  const folio = [factura.serie, factura.folio].filter(Boolean).join("-");
  const referencia = folio || factura.uuid || `factura ${factura.id}`;
  const notas = [
    `Factura ${referencia} pagada`,
    factura.payment_reference ? `Ref. ${factura.payment_reference}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    organizationId: llave.organizationId,
    application: llave.application,
    months: MESES_POR_PERIODO[contrato.billing_period],
    periodStart: factura.period_start,
    periodEnd: factura.period_end,
    amount: Math.round(Number(factura.total ?? 0) * 100),
    currency: factura.currency || "MXN",
    paymentReference: referencia,
    paidAt: factura.paid_at || new Date().toISOString(),
    notes: notas,
    externalRef: `vinqulia:invoice:${factura.id}`,
  };
};

// ── Respuesta ───────────────────────────────────────────────────────────

const RespuestaDeAuth = z
  .object({
    already: z.boolean().nullish(),
    subscription: z
      .object({
        currentPeriodEnd: z.string().nullish(),
        isLive: z.boolean().nullish(),
        inGrace: z.boolean().nullish(),
        graceUntil: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    error: z.string().nullish(),
  })
  .passthrough();

export type ResultadoDeRenovacion =
  | { tipo: "renovado"; hasta: string | null }
  /** 409: suscripción con tarjeta o terminada. No se reintenta. */
  | { tipo: "omitido"; motivo: string }
  /** Red, 5xx, 429 o clave rechazada: se reintenta con espera. */
  | { tipo: "reintentar"; motivo: string }
  /** Datos rechazados (4xx): reintentar no lo arregla. */
  | { tipo: "rechazado"; motivo: string };

/** Lo que respondió KontrolIA Auth, en lo que hay que hacer. */
export const interpretarRespuesta = (
  estado: number,
  cuerpo: unknown,
): ResultadoDeRenovacion => {
  const leido = RespuestaDeAuth.safeParse(cuerpo ?? {});
  const datos = leido.success ? leido.data : null;
  const mensaje = datos?.error?.trim() || null;

  if (estado >= 200 && estado < 300) {
    return {
      tipo: "renovado",
      hasta: datos?.subscription?.currentPeriodEnd ?? null,
    };
  }
  if (estado === 409) {
    return {
      tipo: "omitido",
      motivo:
        mensaje ??
        "KontrolIA Auth no renueva esta suscripción (se cobra con tarjeta o ya terminó).",
    };
  }
  if (estado === 401 || estado === 403) {
    return {
      tipo: "reintentar",
      motivo: `KontrolIA Auth rechazó la clave de integración (${estado}). Revisa KONTROLIA_PLATFORM_API_KEY.`,
    };
  }
  if (estado === 408 || estado === 429 || estado >= 500) {
    return {
      tipo: "reintentar",
      motivo: mensaje
        ? `KontrolIA Auth respondió ${estado}: ${mensaje}`
        : `KontrolIA Auth no respondió bien (${estado}).`,
    };
  }
  return {
    tipo: "rechazado",
    motivo: mensaje
      ? `KontrolIA Auth rechazó la renovación: ${mensaje}`
      : `KontrolIA Auth rechazó la renovación (${estado}).`,
  };
};

/** Llama a KontrolIA Auth. Un corte de red también es «reintentar». */
export const pedirRenovacion = async (
  configuracion: ConfiguracionDeAcceso,
  peticion: PeticionDeRenovacion,
  llamar: typeof fetch = fetch,
): Promise<ResultadoDeRenovacion> => {
  let respuesta: Response;
  try {
    respuesta = await llamar(
      `${configuracion.url}/api/platform/subscriptions/renew`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${configuracion.clave}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(peticion),
        signal: AbortSignal.timeout(TIEMPO_DE_ESPERA_MS),
      },
    );
  } catch (error) {
    return {
      tipo: "reintentar",
      motivo: `No se pudo hablar con KontrolIA Auth: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
  const cuerpo = await respuesta.json().catch(() => null);
  return interpretarRespuesta(respuesta.status, cuerpo);
};

/** Espera antes del siguiente intento: 1 h, 2 h, 4 h… hasta 24 h. */
export const siguienteIntento = (
  intentos: number,
  ahora: number = Date.now(),
): string | null => {
  if (intentos >= MAX_INTENTOS_DE_ACCESO) return null;
  const horas = Math.min(2 ** Math.max(intentos - 1, 0), 24);
  return new Date(ahora + horas * HORA_MS).toISOString();
};

/** Los cambios a guardar en la factura según el resultado. */
export const cambiosPorResultado = (
  resultado: ResultadoDeRenovacion,
  intentosPrevios: number,
  ahora: number = Date.now(),
): Record<string, unknown> => {
  const base = { access_updated_at: new Date(ahora).toISOString() };
  switch (resultado.tipo) {
    case "renovado":
      return {
        ...base,
        access_status: "renewed",
        access_renewed_until: resultado.hasta,
        access_error: null,
        access_next_attempt_at: null,
        access_attempts: intentosPrevios + 1,
      };
    case "omitido":
      return {
        ...base,
        access_status: "skipped",
        access_error: resultado.motivo,
        access_next_attempt_at: null,
        access_attempts: intentosPrevios + 1,
      };
    case "reintentar": {
      const intentos = intentosPrevios + 1;
      return {
        ...base,
        access_status: "error",
        access_error: resultado.motivo,
        access_next_attempt_at: siguienteIntento(intentos, ahora),
        access_attempts: intentos,
      };
    }
    case "rechazado":
      return {
        ...base,
        access_status: "error",
        access_error: resultado.motivo,
        access_next_attempt_at: null,
        access_attempts: intentosPrevios + 1,
      };
  }
};

// ── Ejecutar ────────────────────────────────────────────────────────────

const leerFactura = async (
  db: Db,
  org: string,
  id: number,
): Promise<FacturaDeBandeja | null> =>
  exigir(
    await db
      .from("invoices")
      .select(COLUMNAS_DE_FACTURA)
      .eq("organization_id", org)
      .eq("id", id)
      .maybeSingle(),
    "Leer la factura",
  ) as FacturaDeBandeja | null;

const leerContratoParaAcceso = async (
  db: Db,
  org: string,
  contractId: number | null,
): Promise<ContratoParaAcceso | null> => {
  if (contractId == null) return null;
  return exigir(
    await db
      .from("contracts")
      .select(COLUMNAS_DE_CONTRATO_PARA_ACCESO)
      .eq("organization_id", org)
      .eq("id", contractId)
      .maybeSingle(),
    "Leer el contrato",
  ) as ContratoParaAcceso | null;
};

/**
 * Le pone a la factura su estado de acceso si todavía no tiene: la llaman
 * quien la marca pagada (aviso de Faqturia, revisión de cada hora,
 * «Registrar pago») y el barrido del proceso de cada hora. Devuelve el
 * estado que quedó.
 */
export const marcarAccesoAlPagar = async (
  db: Db,
  org: string,
  factura: FacturaDeBandeja,
): Promise<EstadoDeAcceso | null> => {
  if (factura.access_status) return factura.access_status;
  const contrato = await leerContratoParaAcceso(db, org, factura.contract_id);
  const estado = estadoDeAccesoAlPagar(factura, contrato);
  if (!estado) return null;
  const fila = exigir(
    await db
      .from("invoices")
      .update({ access_status: estado })
      .eq("organization_id", org)
      .eq("id", factura.id)
      .is("access_status", null)
      .select("access_status")
      .maybeSingle(),
    "Marcar el acceso de la factura",
  ) as { access_status: EstadoDeAcceso } | null;
  // Otra corrida la marcó primero: vale lo que haya quedado.
  return fila?.access_status ?? estado;
};

export interface ResultadoDeAcceso {
  factura: FacturaDeBandeja;
  /** Por qué no quedó renovado, en palabras para la persona. */
  mensaje: string | null;
}

/**
 * Pide la renovación de una factura pendiente o con error.
 *
 * `manual` = un administrador pulsó «Reintentar»: vale también para una
 * omitida (409) o una que ya agotó sus intentos, y los cuenta de cero.
 * Automático (después del aviso o cada hora): solo pendientes y las con
 * error cuyo siguiente intento ya llegó.
 */
export const renovarAcceso = async (
  org: string,
  facturaId: number,
  opciones: {
    manual?: boolean;
    db?: Db;
    configuracion?: ConfiguracionDeAcceso | null;
    llamar?: typeof fetch;
    ahora?: number;
  } = {},
): Promise<ResultadoDeAcceso> => {
  const db = opciones.db ?? getServiceClient();
  const configuracion =
    opciones.configuracion !== undefined
      ? opciones.configuracion
      : configuracionDeAcceso();
  const ahora = opciones.ahora ?? Date.now();
  const manual = opciones.manual === true;

  const factura = await leerFactura(db, org, facturaId);
  if (!factura) throw new ErrorDeConector("Factura no encontrada.", 404);

  const contrato = await leerContratoParaAcceso(db, org, factura.contract_id);
  if (!debeRenovarAcceso(factura, contrato)) {
    return {
      factura,
      mensaje:
        "Esta factura no renueva acceso: solo las de contratos de KontrolIA Auth por transferencia, timbradas y pagadas.",
    };
  }

  const estado = factura.access_status;
  const permitidos: (EstadoDeAcceso | null)[] = manual
    ? [null, "pending", "error", "skipped"]
    : ["pending", "error"];
  if (!permitidos.includes(estado)) {
    return {
      factura,
      mensaje:
        estado === "renewed"
          ? "El acceso de esta factura ya se renovó."
          : "Esta factura no está esperando renovar el acceso.",
    };
  }
  if (
    !manual &&
    estado === "error" &&
    (!factura.access_next_attempt_at ||
      Date.parse(factura.access_next_attempt_at) > ahora)
  ) {
    return { factura, mensaje: null };
  }

  // Tomarla: cambio condicional sobre el estado y la hora del último
  // intento. Si otra corrida (o la otra pestaña) ya la tomó, no encuentra
  // fila y aquí se detiene.
  const marca = new Date(ahora).toISOString();
  const intentosPrevios = manual ? 0 : (factura.access_attempts ?? 0);
  let toma = db
    .from("invoices")
    .update({
      access_updated_at: marca,
      ...(manual
        ? { access_status: "pending", access_attempts: 0, access_error: null }
        : {}),
    })
    .eq("organization_id", org)
    .eq("id", factura.id);
  toma =
    estado == null
      ? toma.is("access_status", null)
      : toma.eq("access_status", estado);
  toma = factura.access_updated_at
    ? toma.eq("access_updated_at", factura.access_updated_at)
    : toma.is("access_updated_at", null);
  const tomada = exigir(
    await toma.select("id").maybeSingle(),
    "Tomar la renovación del acceso",
  );
  if (!tomada) {
    if (manual) {
      throw new ErrorDeConector(
        "La factura cambió mientras tanto. Recarga la página.",
        409,
      );
    }
    return { factura, mensaje: null };
  }

  let cambios: Record<string, unknown>;
  if (!configuracion) {
    // Sin configurar no se gasta un intento: se revisa cada hora hasta que
    // alguien ponga la clave.
    cambios = {
      access_status: "error",
      access_error: SIN_CONFIGURAR,
      access_next_attempt_at: new Date(ahora + HORA_MS).toISOString(),
      access_updated_at: marca,
      access_attempts: intentosPrevios,
    };
  } else {
    let resultado: ResultadoDeRenovacion;
    try {
      resultado = await pedirRenovacion(
        configuracion,
        peticionDeRenovacion(factura, contrato!),
        opciones.llamar,
      );
    } catch (error) {
      if (!(error instanceof DatosDeRenovacionInvalidos)) throw error;
      resultado = { tipo: "rechazado", motivo: error.message };
    }
    cambios = cambiosPorResultado(resultado, intentosPrevios, ahora);
  }

  const guardada = exigir(
    await db
      .from("invoices")
      .update(cambios)
      .eq("organization_id", org)
      .eq("id", factura.id)
      .select(COLUMNAS_DE_FACTURA)
      .single(),
    "Guardar la renovación del acceso",
  ) as FacturaDeBandeja;

  return {
    factura: guardada,
    mensaje:
      guardada.access_status === "renewed"
        ? null
        : (guardada.access_error ?? null),
  };
};

/** Tope por corrida del proceso de cada hora. */
const RENOVADAS_POR_CORRIDA = 20;

/**
 * El paso del proceso de cada hora:
 *   1. barre las facturas de contrato pagadas y timbradas sin estado de
 *      acceso (por si se marcaron pagadas por un camino que no lo anotó, o
 *      se timbraron después de pagarse) y les pone el suyo;
 *   2. pide la renovación de las pendientes que nadie está atendiendo y de
 *      las con error cuyo siguiente intento ya llegó.
 * Sin configuración no hace nada: no hay a quién pedirle.
 */
export const renovarAccesosPendientes = async (
  db: Db,
  org: string,
  ahora: number = Date.now(),
): Promise<{ marcadas: number; renovadas: number; con_error: number }> => {
  const resumen = { marcadas: 0, renovadas: 0, con_error: 0 };
  const configuracion = configuracionDeAcceso();
  if (!configuracion) return resumen;

  const sinEstado = (exigir(
    await db
      .from("invoices")
      .select(COLUMNAS_DE_FACTURA)
      .eq("organization_id", org)
      .eq("origin", "contract")
      .eq("billing_status", "stamped")
      .eq("payment_status", "paid")
      .is("access_status", null)
      .limit(100),
    "Leer las facturas pagadas sin estado de acceso",
  ) ?? []) as FacturaDeBandeja[];
  for (const factura of sinEstado) {
    if ((await marcarAccesoAlPagar(db, org, factura)) === "pending") {
      resumen.marcadas += 1;
    }
  }

  const enCurso = new Date(ahora - MINUTOS_EN_CURSO * 60_000).toISOString();
  const marca = new Date(ahora).toISOString();
  const pendientes = (exigir(
    await db
      .from("invoices")
      .select("id")
      .eq("organization_id", org)
      .or(
        `and(access_status.eq.pending,or(access_updated_at.is.null,access_updated_at.lt."${enCurso}")),and(access_status.eq.error,access_next_attempt_at.lte."${marca}")`,
      )
      .order("access_updated_at", { ascending: true, nullsFirst: true })
      .limit(RENOVADAS_POR_CORRIDA),
    "Leer las renovaciones pendientes",
  ) ?? []) as { id: number }[];

  for (const { id } of pendientes) {
    try {
      const { factura } = await renovarAcceso(org, id, {
        db,
        configuracion,
        ahora,
      });
      if (factura.access_status === "renewed") resumen.renovadas += 1;
      else if (factura.access_status === "error") resumen.con_error += 1;
    } catch (error) {
      console.error("[facturación] renovar acceso", id, error);
      resumen.con_error += 1;
    }
  }
  return resumen;
};

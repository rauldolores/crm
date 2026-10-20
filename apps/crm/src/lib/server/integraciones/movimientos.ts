/**
 * Historial del contrato: de los movimientos de KontrolIA Auth a renglones
 * que una persona entiende.
 *
 * Regla del dueño: solo se enseña lo que dice EN CONCRETO qué cambió. Si un
 * movimiento no permite decirlo (un aviso crudo de Stripe, un ajuste que no
 * cambió nada, un tipo desconocido), no se enseña: `describirMovimiento`
 * devuelve null y no se guarda.
 *
 * Módulo puro, sin base ni red. Importes en CENTAVOS; fechas en hora de
 * México.
 */

export interface MovimientoParaDescribir {
  id: string;
  type: string;
  occurred_at: string;
  provider?: string | null;
  subscription_id?: string | null;
  application_slug?: string | null;
  plan_slug?: string | null;
  plan_name?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface RenovacionParaDescribir {
  id: string;
  previous_period_end?: string | null;
  new_period_end?: string | null;
  amount?: number | null;
  currency?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  covered?: boolean | null;
}

export interface PlanConocido {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
}

export interface ExtraConocido {
  addon_id?: string | null;
  slug?: string | null;
  name?: string | null;
}

export interface ContextoDeMovimiento {
  /** Planes que se conocen (los de la foto y los de las suscripciones). */
  planes?: PlanConocido[];
  /** Extras que se conocen (los de las suscripciones). */
  extras?: ExtraConocido[];
  /** Tipo del renglón anterior que SÍ se enseñó, de la misma suscripción. */
  anterior?: string | null;
}

export interface Descripcion {
  title: string;
  detail: string | null;
}

// ── Formatos ────────────────────────────────────────────────────────────

const ZONA = "America/Mexico_City";
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const esTexto = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";
const esNumero = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const comoObjeto = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;

/** Instante de un valor: ISO, fecha sola o segundos de Unix (Stripe). */
function instante(valor: unknown): Date | null {
  if (esNumero(valor)) return new Date(valor * 1000);
  if (!esTexto(valor)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(`${valor}T12:00:00Z`);
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Día (AAAA-MM-DD) en hora de México; una fecha sola se respeta. */
function diaDe(valor: unknown): string | null {
  if (esTexto(valor) && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const d = instante(valor);
  if (!d) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** «1 nov 2026». */
export function fechaCorta(valor: unknown): string | null {
  const dia = diaDe(valor);
  if (!dia) return null;
  const [anio, mes, d] = dia.split("-").map(Number);
  return `${d} ${MESES[mes - 1]} ${anio}`;
}

/** «12 oct – 11 nov 2026» (o con los dos años si son distintos). */
function rango(desde: unknown, hasta: unknown): string | null {
  const a = diaDe(desde);
  const b = diaDe(hasta);
  if (!a || !b) return null;
  if (a.slice(0, 4) === b.slice(0, 4)) {
    const [, mes, d] = a.split("-").map(Number);
    return `${d} ${MESES[mes - 1]} – ${fechaCorta(b)}`;
  }
  return `${fechaCorta(a)} – ${fechaCorta(b)}`;
}

/** Centavos → «$50,500.00 MXN». */
export function dinero(centavos: unknown, moneda?: unknown): string | null {
  if (!esNumero(centavos)) return null;
  const pesos = Math.round(centavos) / 100;
  const cifra = pesos.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const clave = esTexto(moneda) ? moneda.toUpperCase() : "MXN";
  return `${pesos < 0 ? "-" : ""}$${cifra.replace("-", "")} ${clave}`;
}

const ESTADOS: Record<string, string> = {
  active: "activo",
  trialing: "en prueba",
  past_due: "pago pendiente",
  unpaid: "sin pagar",
  canceled: "cancelado",
  cancelled: "cancelado",
  expired: "vencido",
  suspended: "suspendido",
  paused: "en pausa",
  incomplete: "pago sin completar",
  incomplete_expired: "pago sin completar (vencido)",
};
const estado = (v: unknown) =>
  esTexto(v) ? (ESTADOS[v] ?? v.replace(/_/g, " ")) : "—";

const PERIODICIDAD: Record<string, string> = {
  month: "mensual",
  monthly: "mensual",
  year: "anual",
  yearly: "anual",
  quarter: "trimestral",
  one_time: "pago único",
};
const periodicidad = (v: unknown) =>
  esTexto(v) ? (PERIODICIDAD[v] ?? v) : "—";

const pluralMeses = (n: number) => `${n} ${n === 1 ? "mes" : "meses"}`;

const PARECE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nombre de un plan por id o slug; nunca un uuid crudo. */
function nombreDePlan(
  valor: unknown,
  contexto: ContextoDeMovimiento,
): string | null {
  if (!esTexto(valor)) return null;
  const plan = (contexto.planes ?? []).find(
    (p) => p.id === valor || p.slug === valor,
  );
  if (plan) return plan.name || plan.slug || null;
  return PARECE_UUID.test(valor) ? null : valor;
}

/** Plan del movimiento: el del payload y, si no, el que trae el renglón. */
function planDelMovimiento(
  m: MovimientoParaDescribir,
  contexto: ContextoDeMovimiento,
): string | null {
  const p = m.payload ?? {};
  return (
    nombreDePlan(p.planId, contexto) ??
    nombreDePlan(p.planSlug, contexto) ??
    m.plan_name ??
    nombreDePlan(m.plan_slug, contexto)
  );
}

/** Nombre del extra por slug o id; nunca un uuid crudo. */
function nombreDeExtra(
  payload: Record<string, unknown>,
  contexto: ContextoDeMovimiento,
): string | null {
  const slug = payload.addonSlug ?? payload.addon_slug;
  const id = payload.addonId ?? payload.addon_id;
  const extra = (contexto.extras ?? []).find(
    (e) =>
      (esTexto(slug) && e.slug === slug) || (esTexto(id) && e.addon_id === id),
  );
  if (extra?.name) return extra.name;
  if (extra?.slug) return extra.slug;
  if (esTexto(slug) && !PARECE_UUID.test(slug)) return slug;
  return null;
}

const CREDITOS: Record<string, string> = {
  conversations: "conversaciones",
  conversaciones: "conversaciones",
  messages: "mensajes",
  mensajes: "mensajes",
  invoices: "facturas",
  facturas: "facturas",
  cfdi: "facturas",
  stamps: "timbres",
  timbres: "timbres",
  pedimentos: "pedimentos",
  ctm_paginas: "páginas de constancias",
};

const unir = (partes: (string | null | undefined | false)[], sep = " · ") =>
  partes.filter(esTexto).join(sep);

const describir = (
  title: string | null,
  detail?: string | null,
): Descripcion | null =>
  title ? { title, detail: esTexto(detail) ? detail.trim() : null } : null;

// ── Diferencias ─────────────────────────────────────────────────────────

const UN_DIA = 24 * 60 * 60 * 1000;

/** ¿Cambió una fecha? Solo si cambia el día que se ve. */
function cambioDeFecha(a: unknown, b: unknown, holguraDeUnDia = false) {
  const da = diaDe(a);
  const db = diaDe(b);
  if (da === db) return false;
  if (holguraDeUnDia) {
    const ia = instante(a);
    const ib = instante(b);
    if (ia && ib && Math.abs(ia.getTime() - ib.getTime()) < UN_DIA) {
      return false;
    }
  }
  return true;
}

const fechaODash = (v: unknown, sinValor = "—") => fechaCorta(v) ?? sinValor;

const diasDeGracia = (v: unknown) =>
  esNumero(v) ? String(v) : "los de la aplicación";

/** Lo que cambió entre dos fotos de un contrato manual. */
function diferenciasDeContrato(
  antes: Record<string, unknown>,
  despues: Record<string, unknown>,
): string[] {
  const cambios: string[] = [];
  if (cambioDeFecha(antes.currentPeriodEnd, despues.currentPeriodEnd)) {
    cambios.push(
      `vigencia ${fechaODash(antes.currentPeriodEnd, "sin fecha de fin")} → ${fechaODash(despues.currentPeriodEnd, "sin fecha de fin")}`,
    );
  }
  if (
    cambioDeFecha(antes.currentPeriodStart, despues.currentPeriodStart, true)
  ) {
    cambios.push(
      `inicio ${fechaODash(antes.currentPeriodStart)} → ${fechaODash(despues.currentPeriodStart)}`,
    );
  }
  if ((antes.status ?? null) !== (despues.status ?? null)) {
    cambios.push(`estado ${estado(antes.status)} → ${estado(despues.status)}`);
  }
  if ((antes.billingInterval ?? null) !== (despues.billingInterval ?? null)) {
    cambios.push(
      `periodicidad ${periodicidad(antes.billingInterval)} → ${periodicidad(despues.billingInterval)}`,
    );
  }
  const ca = comoObjeto(antes.contract) ?? {};
  const cd = comoObjeto(despues.contract) ?? {};
  const precioA = esNumero(ca.amount) ? ca.amount : null;
  const precioD = esNumero(cd.amount) ? cd.amount : null;
  if (
    precioA !== precioD ||
    (precioD != null &&
      String(ca.currency ?? "MXN").toUpperCase() !==
        String(cd.currency ?? "MXN").toUpperCase())
  ) {
    cambios.push(
      `precio pactado ${dinero(precioA, ca.currency) ?? "—"} → ${dinero(precioD, cd.currency) ?? "—"}`,
    );
  }
  const refA = esTexto(ca.reference) ? ca.reference.trim() : null;
  const refD = esTexto(cd.reference) ? cd.reference.trim() : null;
  if (refA !== refD) {
    cambios.push(`contrato ${refA ?? "—"} → ${refD ?? "—"}`);
  }
  const graciaA = esNumero(antes.manualGraceDays)
    ? antes.manualGraceDays
    : null;
  const graciaD = esNumero(despues.manualGraceDays)
    ? despues.manualGraceDays
    : null;
  if (graciaA !== graciaD) {
    cambios.push(
      `días de gracia ${diasDeGracia(graciaA)} → ${diasDeGracia(graciaD)}`,
    );
  }
  return cambios;
}

// ── Renovaciones ────────────────────────────────────────────────────────

/** Una renovación pagada, venga del historial o de la lista de renovaciones. */
export function describirRenovacion(r: {
  previous_period_end?: unknown;
  new_period_end?: unknown;
  amount?: unknown;
  currency?: unknown;
  payment_reference?: unknown;
  notes?: unknown;
  covered?: unknown;
}): Descripcion | null {
  const importe = dinero(r.amount, r.currency);
  const ref = esTexto(r.payment_reference)
    ? `ref. ${r.payment_reference.trim()}`
    : null;
  const notas = esTexto(r.notes) ? r.notes : null;
  if (r.covered === true) {
    if (!importe) return null;
    return describir(
      `Pago registrado (el periodo ya estaba cubierto): ${unir([importe, ref])}`,
      notas,
    );
  }
  const vigencia =
    r.previous_period_end || r.new_period_end
      ? `vigencia ${fechaODash(r.previous_period_end)} → ${fechaODash(r.new_period_end)}`
      : null;
  if (!vigencia && !importe) return null;
  const base = importe ? "Renovación pagada" : "Renovación";
  return describir(`${base}: ${unir([vigencia, importe, ref])}`, notas);
}

// ── Un movimiento ───────────────────────────────────────────────────────

/** Tipos que nunca se enseñan: avisos crudos o pasos intermedios. */
const RUIDO = new Set(["checkout.started", "credits.checkout_started"]);

/**
 * Título y detalle de un movimiento, o null si no se puede decir en
 * concreto qué cambió (y entonces no se enseña).
 */
export function describirMovimiento(
  m: MovimientoParaDescribir,
  contexto: ContextoDeMovimiento = {},
): Descripcion | null {
  const p = m.payload ?? {};
  const tipo = m.type;

  // Cortesía antes que el filtro de stripe.*: stripe.courtesy_grant sí cuenta.
  if (tipo.includes("courtesy") || tipo.includes("free_months")) {
    const meses = esNumero(p.months) ? p.months : null;
    if (!meses) return null;
    const hasta = fechaCorta(p.newPeriodEnd);
    const motivo = esTexto(p.reason) ? p.reason.trim() : null;
    return describir(
      `${pluralMeses(meses)} de cortesía${motivo ? `: ${motivo}` : ""}${hasta ? ` · hasta ${hasta}` : ""}`,
    );
  }
  if (tipo.startsWith("stripe.") || RUIDO.has(tipo)) return null;

  if (tipo.startsWith("addon.")) {
    return describirExtra(m, contexto);
  }

  switch (tipo) {
    case "manual.assigned": {
      const plan = planDelMovimiento(m, contexto);
      if (!plan) return null;
      const contrato = comoObjeto(p.contract) ?? {};
      const inicio = fechaCorta(p.currentPeriodStart);
      const fin = fechaCorta(p.currentPeriodEnd);
      const vigencia = inicio
        ? fin
          ? `vigente del ${inicio} al ${fin}`
          : `vigente desde el ${inicio}, sin fecha de fin`
        : fin
          ? `vigente hasta el ${fin}`
          : null;
      const precio = dinero(contrato.amount, contrato.currency);
      return describir(
        `Plan asignado: ${unir([plan, vigencia, precio && `precio pactado ${precio}`])}`,
        unir([
          esTexto(contrato.reference) && `Contrato: ${contrato.reference}`,
          esTexto(contrato.notes) && contrato.notes,
        ]),
      );
    }

    case "manual.updated": {
      const cambios = diferenciasDeContrato(
        comoObjeto(p.before) ?? {},
        comoObjeto(p.after) ?? {},
      );
      return cambios.length
        ? describir(`Contrato editado: ${cambios.join("; ")}`)
        : null;
    }

    case "manual.renewed":
    case "platform.renewed":
      return describirRenovacion(p);

    case "platform.suspended": {
      const motivo = esTexto(p.reason) ? p.reason.trim() : null;
      return describir(
        motivo ? `Acceso suspendido: ${motivo}` : "Acceso suspendido",
      );
    }

    case "manual.plan_changed": {
      const de = nombreDePlan(p.de, contexto);
      const a = nombreDePlan(p.a, contexto);
      if (!a || de === a) return null;
      return describir(
        `Cambio de plan: ${de ?? "—"} → ${a}`,
        esTexto(p.motivo) ? p.motivo : null,
      );
    }

    case "reconciled": {
      const antes = comoObjeto(p.before) ?? {};
      const despues = comoObjeto(p.after) ?? {};
      const cambios: string[] = [];
      if ((antes.status ?? null) !== (despues.status ?? null)) {
        cambios.push(
          `estado ${estado(antes.status)} → ${estado(despues.status)}`,
        );
      }
      if ((antes.planId ?? null) !== (despues.planId ?? null)) {
        cambios.push(
          `plan ${nombreDePlan(antes.planId, contexto) ?? "—"} → ${nombreDePlan(despues.planId, contexto) ?? "—"}`,
        );
      }
      if (
        "currentPeriodEnd" in despues &&
        cambioDeFecha(antes.currentPeriodEnd, despues.currentPeriodEnd)
      ) {
        cambios.push(
          `vigencia ${fechaODash(antes.currentPeriodEnd)} → ${fechaODash(despues.currentPeriodEnd)}`,
        );
      }
      if (
        "cancelAtPeriodEnd" in despues &&
        Boolean(antes.cancelAtPeriodEnd) !== Boolean(despues.cancelAtPeriodEnd)
      ) {
        cambios.push(
          despues.cancelAtPeriodEnd
            ? "se cancela al terminar el periodo"
            : "ya no se cancela al terminar el periodo",
        );
      }
      return cambios.length
        ? describir(`Ajuste con Stripe: ${cambios.join("; ")}`)
        : null;
    }

    case "reconciled.missing":
      // El tipo mismo dice qué pasó: Stripe ya no la tiene y se canceló.
      return describir("Stripe ya no tiene la suscripción: se marcó cancelada");

    case "invoice.paid":
    case "invoice.payment_failed": {
      const centavos = esNumero(p.amountPaid) ? p.amountPaid : p.amountDue;
      if (!esNumero(centavos) || centavos === 0) return null;
      const importe = dinero(centavos, p.currency);
      const periodo = rango(p.periodStart, p.periodEnd);
      const base =
        tipo === "invoice.paid"
          ? "Cobro con tarjeta"
          : "Cobro con tarjeta rechazado";
      return describir(
        `${base}: ${unir([importe, periodo && `periodo ${periodo}`])}`,
        esTexto(p.number) ? `Factura ${p.number}` : null,
      );
    }

    case "subscribed":
    case "purchased": {
      const plan = planDelMovimiento(m, contexto);
      if (!plan) return null;
      const intervalo = esTexto(p.interval)
        ? ` (${periodicidad(p.interval)})`
        : "";
      return describir(`Contrató con tarjeta: ${plan}${intervalo}`);
    }

    case "plan_changed": {
      const plan = planDelMovimiento(m, contexto);
      return plan ? describir(`Cambio de plan con tarjeta: → ${plan}`) : null;
    }

    case "status.trialing": {
      const plan = planDelMovimiento(m, contexto);
      return describir(
        plan ? `Inicia periodo de prueba: ${plan}` : "Inicia periodo de prueba",
      );
    }
    case "status.past_due":
      return describir("Pago con tarjeta pendiente");
    case "status.canceled":
      return describir("Suscripción cancelada");
    case "status.active":
      // Solo dice algo si antes estaba en prueba o con el pago pendiente.
      return contexto.anterior === "status.trialing" ||
        contexto.anterior === "status.past_due"
        ? describir("Suscripción activa (cobro con tarjeta)")
        : null;

    case "credits.purchased": {
      if (!esNumero(p.units) || p.units <= 0) return null;
      const que = esTexto(p.limitKey)
        ? (CREDITOS[p.limitKey] ?? p.limitKey.replace(/_/g, " "))
        : null;
      const importe = dinero(p.amountPaid, p.currency);
      const unidades = p.units.toLocaleString("en-US");
      return describir(
        `Compró ${unidades} créditos${que ? ` de ${que}` : ""}${importe ? `: ${importe}` : ""}`,
      );
    }

    default:
      return null;
  }
}

/** Extras: agregado, quitado, programado para quitarse o editado. */
function describirExtra(
  m: MovimientoParaDescribir,
  contexto: ContextoDeMovimiento,
): Descripcion | null {
  const p = m.payload ?? {};
  const nombre = nombreDeExtra(p, contexto);
  if (!nombre) return null;
  const cambio = comoObjeto(p.change) ?? {};
  const antes = comoObjeto(p.before) ?? {};

  switch (m.type) {
    case "addon.added": {
      const contrato = comoObjeto(p.contract) ?? {};
      const desde = fechaCorta(p.startsAt);
      const hasta = fechaCorta(p.endsAt);
      const precio = dinero(
        contrato.contract_amount ?? contrato.amount,
        contrato.contract_currency ?? contrato.currency,
      );
      return describir(
        `Extra agregado: ${unir([
          nombre,
          desde && `desde el ${desde}`,
          hasta && `hasta el ${hasta}`,
          precio && `precio pactado ${precio}`,
        ])}`,
        esTexto(contrato.contract_notes) ? contrato.contract_notes : null,
      );
    }
    case "addon.removed":
      return describir(`Extra quitado: ${nombre}`);
    case "addon.removal_scheduled": {
      const fin = fechaCorta(cambio.ends_at ?? p.endsAt);
      return describir(
        `Extra programado para quitarse: ${nombre}${fin ? ` · termina el ${fin}` : ""}`,
      );
    }
    case "addon.updated": {
      const cambios: string[] = [];
      if ("ends_at" in cambio && cambioDeFecha(antes.endsAt, cambio.ends_at)) {
        cambios.push(
          `fin ${fechaODash(antes.endsAt, "sin fecha de fin")} → ${fechaODash(cambio.ends_at, "sin fecha de fin")}`,
        );
      }
      if ("contract_amount" in cambio) {
        const precio = dinero(cambio.contract_amount, cambio.contract_currency);
        cambios.push(
          precio
            ? `precio pactado ${precio}`
            : "sin precio pactado (precio de lista)",
        );
      }
      return cambios.length
        ? describir(`Extra editado: ${nombre} · ${cambios.join("; ")}`)
        : null;
    }
    default:
      return null;
  }
}

// ── El historial completo ───────────────────────────────────────────────

export interface RenglonDeHistorial<M, R> {
  movimiento?: M;
  renovacion?: R;
  descripcion: Descripcion;
}

/**
 * Describe el historial y las renovaciones de una foto, del más viejo al
 * más nuevo. Lo que no se puede describir se queda fuera. Una renovación
 * que ya trae el historial (payload.renewal_id) no se repite.
 */
export function describirHistorial<
  M extends MovimientoParaDescribir,
  R extends RenovacionParaDescribir,
>(
  historial: M[],
  renovaciones: R[],
  contexto: Omit<ContextoDeMovimiento, "anterior"> = {},
): RenglonDeHistorial<M, R>[] {
  const renglones: RenglonDeHistorial<M, R>[] = [];
  const anteriorPorSuscripcion = new Map<string, string>();
  const ordenados = historial
    .map((m, i) => ({ m, i }))
    .sort(
      (a, b) =>
        (instante(a.m.occurred_at)?.getTime() ?? 0) -
          (instante(b.m.occurred_at)?.getTime() ?? 0) || a.i - b.i,
    )
    .map(({ m }) => m);

  const renovacionesEnHistorial = new Set<string>();
  for (const m of ordenados) {
    const llave = m.subscription_id ?? m.application_slug ?? "";
    const descripcion = describirMovimiento(m, {
      ...contexto,
      anterior: anteriorPorSuscripcion.get(llave) ?? null,
    });
    const renovacion = m.payload?.renewal_id;
    if (esTexto(renovacion) && m.type.endsWith(".renewed")) {
      renovacionesEnHistorial.add(renovacion);
    }
    if (!descripcion) continue;
    anteriorPorSuscripcion.set(llave, m.type);
    renglones.push({ movimiento: m, descripcion });
  }

  for (const r of renovaciones) {
    if (renovacionesEnHistorial.has(r.id)) continue;
    const descripcion = describirRenovacion(r);
    if (descripcion) renglones.push({ renovacion: r, descripcion });
  }
  return renglones;
}

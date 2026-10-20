import { z } from "zod";

/**
 * Integración con KontrolIA Auth: de la foto de un cliente a filas del CRM.
 *
 * KontrolIA Auth (login y facturación de AduaniaX, Faqturia, Vinqulia y Nodia
 * Agents) avisa cada vez que cambia un cliente y cada aviso trae la foto
 * COMPLETA de la organización (`snapshot`). Este módulo es puro: convierte esa
 * foto en lo que hay que guardar —empresa, contactos, contratos, compras e
 * historial— sin tocar la base. Quien guarda es `aplicarKontroliaAuth.ts`.
 *
 * Contrato del aviso: apps/auth-server/public/platform-webhooks.md del repo
 * de KontrolIA Auth. Importes en CENTAVOS; aquí se pasan a pesos.
 */

export const ORIGEN_KONTROLIA_AUTH = "kontrolia_auth";

/** Clave en custom_fields con la que reconciliarEmpresa también la encuentra. */
export const REF_KONTROLIA_AUTH = `ref_${ORIGEN_KONTROLIA_AUTH}`;

// ── Forma del aviso ─────────────────────────────────────────────────────
// Solo se exige lo que el CRM usa; lo demás se tolera nulo para que un campo
// nuevo o vacío en el origen no tumbe la sincronización.

const texto = z.string().nullish();
const numero = z.number().nullish();

const Miembro = z.object({
  user_id: z.string(),
  email: texto,
  name: texto,
  phone: texto,
  status: z.string(),
  joined_at: texto,
  last_sign_in_at: texto,
});

const Extra = z
  .object({
    addon_id: z.string().nullish(),
    slug: texto,
    name: texto,
    included: z.boolean().nullish(),
    price_amount: numero,
    currency: texto,
    starts_at: texto,
    ends_at: texto,
    contract_amount: numero,
    contract_currency: texto,
  })
  .passthrough();

const Suscripcion = z.object({
  id: z.string(),
  application_slug: z.string(),
  application_name: z.string().nullish(),
  plan: z.object({
    id: z.string().nullish(),
    slug: z.string().nullish(),
    name: z.string().nullish(),
    price_amount: numero,
    yearly_price_amount: numero,
    currency: texto,
  }),
  status: z.string(),
  is_live: z.boolean(),
  provider: texto,
  billing_interval: texto,
  current_period_start: texto,
  current_period_end: texto,
  cancel_at_period_end: z.boolean().nullish(),
  contract: z
    .object({ reference: texto, amount: numero, currency: texto })
    .nullish(),
  courtesy: z.object({ months: numero, until: texto, reason: texto }).nullish(),
  addons: z.array(Extra).nullish(),
  // Días de gracia: venció sin pago y el acceso sigue hasta grace_until.
  // Opcionales: una foto de antes de que KontrolIA Auth los mandara no los
  // trae.
  in_grace: z.boolean().nullish(),
  grace_until: texto,
  manual_grace_days: numero,
});

const Renovacion = z.object({
  id: z.string(),
  subscription_id: texto,
  application_slug: texto,
  previous_period_end: texto,
  new_period_end: texto,
  amount: numero,
  currency: texto,
  payment_reference: texto,
  paid_at: texto,
  notes: texto,
  created_at: texto,
});

const Movimiento = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.string(),
  occurred_at: z.string(),
  provider: texto,
  subscription_id: texto,
  application_slug: texto,
  plan_slug: texto,
  plan_name: texto,
  payload: z.record(z.string(), z.unknown()).nullish(),
});

const Foto = z.object({
  generated_at: z.string(),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    slug: texto,
    created_at: texto,
  }),
  members: z.array(Miembro).default([]),
  subscriptions: z.array(Suscripcion).default([]),
  renewals: z.array(Renovacion).default([]),
  history: z.array(Movimiento).default([]),
});

export const AvisoKontroliaAuth = z.object({
  id: z.string().nullish(),
  type: z.string().nullish(),
  api_version: texto,
  occurred_at: texto,
  organization_id: texto,
  snapshot: Foto,
});

export type AvisoKontroliaAuth = z.infer<typeof AvisoKontroliaAuth>;
export type FotoKontroliaAuth = z.infer<typeof Foto>;
export type MiembroKontroliaAuth = z.infer<typeof Miembro>;
export type SuscripcionKontroliaAuth = z.infer<typeof Suscripcion>;
export type RenovacionKontroliaAuth = z.infer<typeof Renovacion>;
export type MovimientoKontroliaAuth = z.infer<typeof Movimiento>;

// ── Utilidades ──────────────────────────────────────────────────────────

/** Zona de KONTROLIA: las vigencias se leen como fechas de México. */
const ZONA = "America/Mexico_City";

/**
 * Fecha (AAAA-MM-DD) de un instante, en hora de México. Un periodo que
 * termina «2027-01-01T05:59:59Z» vence el 31 de diciembre allá, no el 1 de
 * enero. Una fecha sin hora se respeta tal cual.
 */
export function fechaDe(valor?: string | null): string | null {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const instante = new Date(valor);
  if (Number.isNaN(instante.getTime())) return null;
  // en-CA da exactamente AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** Fecha legible en español («20 de diciembre de 2026»). */
function fechaLegible(valor?: string | null): string | null {
  const dia = fechaDe(valor);
  if (!dia) return null;
  const [anio, mes, d] = dia.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(anio, mes - 1, d)));
}

/** Centavos → pesos, sin errores de coma flotante a la vista. */
export const aPesos = (centavos?: number | null): number | null =>
  centavos == null ? null : Math.round(centavos) / 100;

/**
 * Nombre y apellido a partir del nombre completo: se corta en el primer
 * espacio. Sin nombre, la parte local del correo, para que el contacto no
 * quede en blanco en las listas.
 */
export function dividirNombre(
  nombre?: string | null,
  correo?: string | null,
): { first_name: string | null; last_name: string | null } {
  const limpio = (nombre ?? "").trim().replace(/\s+/g, " ");
  if (limpio) {
    const espacio = limpio.indexOf(" ");
    return espacio < 0
      ? { first_name: limpio, last_name: null }
      : {
          first_name: limpio.slice(0, espacio),
          last_name: limpio.slice(espacio + 1),
        };
  }
  const local = (correo ?? "").split("@")[0]?.trim();
  return { first_name: local || null, last_name: null };
}

// ── Empresa ─────────────────────────────────────────────────────────────

/** Etapas que la integración puede mover sola; el resto las decide alguien. */
const ETAPAS_AUTOMATICAS = new Set(["prospect", "customer", "churned"]);

/**
 * Etapa del cliente según sus suscripciones, o `undefined` si no hay que
 * tocarla.
 *
 * Solo se mueve entre prospecto, cliente y perdido. Si una persona la puso
 * en otra («en riesgo», por ejemplo), se respeta: esa decisión no la sabe
 * KontrolIA Auth.
 */
export function etapaDelCliente(
  actual: string | null | undefined,
  suscripciones: Pick<SuscripcionKontroliaAuth, "is_live">[],
): string | undefined {
  const automatica = actual == null || ETAPAS_AUTOMATICAS.has(actual);
  const hayViva = suscripciones.some((s) => s.is_live);

  if (hayViva) {
    return automatica && actual !== "customer" ? "customer" : undefined;
  }
  if (suscripciones.length) {
    return actual === "customer" ? "churned" : undefined;
  }
  return actual == null ? "prospect" : undefined;
}

// ── Contactos ───────────────────────────────────────────────────────────

export type Correo = { email: string; type: string };
export type Telefono = { number: string; type: string };

/** Agrega el correo del usuario sin perder los demás que ya tenga. */
export function unirCorreos(
  existentes: Correo[] | null | undefined,
  correo?: string | null,
): Correo[] {
  const lista = Array.isArray(existentes) ? [...existentes] : [];
  const limpio = correo?.trim();
  if (!limpio) return lista;
  const ya = lista.some(
    (c) => c?.email?.trim().toLowerCase() === limpio.toLowerCase(),
  );
  return ya ? lista : [{ email: limpio, type: "Work" }, ...lista];
}

/** Igual que unirCorreos, para el teléfono. */
export function unirTelefonos(
  existentes: Telefono[] | null | undefined,
  telefono?: string | null,
): Telefono[] {
  const lista = Array.isArray(existentes) ? [...existentes] : [];
  const limpio = telefono?.trim();
  if (!limpio) return lista;
  const soloDigitos = (v: string) => v.replace(/\D/g, "");
  const ya = lista.some(
    (t) => t?.number && soloDigitos(t.number) === soloDigitos(limpio),
  );
  return ya ? lista : [{ number: limpio, type: "Work" }, ...lista];
}

/** Lo que el contacto debe tener según el miembro (sin ids del CRM). */
export interface ContactoDeseado {
  external_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  last_seen: string | null;
  first_seen: string | null;
  activo: boolean;
}

export function contactoDeMiembro(m: MiembroKontroliaAuth): ContactoDeseado {
  return {
    external_id: m.user_id,
    email: m.email?.trim() || null,
    ...dividirNombre(m.name, m.email),
    phone: m.phone?.trim() || null,
    last_seen: m.last_sign_in_at ?? null,
    first_seen: m.joined_at ?? null,
    activo: m.status === "active",
  };
}

/** Contacto del CRM tal como se lee para fusionarlo con el miembro. */
export interface ContactoExistente {
  id: number;
  email_jsonb: Correo[] | null;
  phone_jsonb: Telefono[] | null;
  archived_at: string | null;
  last_seen: string | null;
}

/**
 * Campos a escribir en un contacto (nuevo o existente). Un usuario activo se
 * desarchiva; uno quitado o suspendido se archiva —conserva su historial—
 * y, si ya estaba archivado, se respeta la fecha original.
 */
export function camposDeContacto(
  deseado: ContactoDeseado,
  existente: ContactoExistente | null,
  ahora: string,
  companyId: number,
): Record<string, unknown> {
  return {
    first_name: deseado.first_name,
    last_name: deseado.last_name,
    email_jsonb: unirCorreos(existente?.email_jsonb, deseado.email),
    phone_jsonb: unirTelefonos(existente?.phone_jsonb, deseado.phone),
    company_id: companyId,
    last_seen: deseado.last_seen ?? existente?.last_seen ?? null,
    archived_at: deseado.activo ? null : (existente?.archived_at ?? ahora),
    source: ORIGEN_KONTROLIA_AUTH,
    external_id: deseado.external_id,
    ...(existente ? {} : { first_seen: deseado.first_seen ?? ahora }),
  };
}

// ── Contratos ───────────────────────────────────────────────────────────

const PERIODOS: Record<string, string> = {
  month: "monthly",
  monthly: "monthly",
  quarter: "quarterly",
  year: "yearly",
  yearly: "yearly",
  one_time: "one_time",
};

/** Llave del contrato: una suscripción por aplicación y organización. */
export const llaveDeContrato = (orgId: string, aplicacion: string) =>
  `${orgId}:${aplicacion}`;

export function estadoDeContrato(
  s: Pick<SuscripcionKontroliaAuth, "is_live" | "status">,
): "active" | "cancelled" | "expired" {
  // Una cancelación programada sigue activa hasta el fin del periodo: lo dice
  // is_live, no cancel_at_period_end.
  if (s.is_live) return "active";
  if (s.status === "canceled" || s.status === "cancelled") return "cancelled";
  return "expired";
}

/**
 * Precio del periodo en pesos: el pactado en el contrato si lo hay; si no, el
 * de lista del plan (anual si se cobra al año: el anual del plan o doce
 * mensualidades).
 */
export function importeDeContrato(s: SuscripcionKontroliaAuth): number | null {
  const pactado = s.contract?.amount;
  if (pactado != null) return aPesos(pactado);
  const { price_amount, yearly_price_amount } = s.plan;
  if (s.billing_interval === "year") {
    return aPesos(
      yearly_price_amount ?? (price_amount != null ? price_amount * 12 : null),
    );
  }
  return aPesos(price_amount);
}

/** Notas del contrato: referencia del contrato y meses de cortesía. */
export function notasDeContrato(s: SuscripcionKontroliaAuth): string | null {
  const partes: string[] = [];
  if (s.contract?.reference) partes.push(`Contrato: ${s.contract.reference}`);
  const meses = s.courtesy?.months;
  if (meses) {
    const hasta = fechaLegible(s.courtesy?.until);
    let cortesia = `${meses} ${meses === 1 ? "mes" : "meses"} de cortesía`;
    if (hasta) cortesia += ` hasta el ${hasta}`;
    if (s.courtesy?.reason) cortesia += ` (${s.courtesy.reason})`;
    partes.push(cortesia);
  }
  return partes.length ? partes.join(" · ") : null;
}

export function contratoDeSuscripcion(
  orgId: string,
  s: SuscripcionKontroliaAuth,
): Record<string, unknown> {
  const vivo = s.is_live;
  const fin = fechaDe(s.current_period_end);
  const nombreProducto = s.application_name || s.application_slug;
  const nombrePlan = s.plan.name || s.plan.slug || "";
  return {
    name: nombrePlan ? `${nombreProducto} · ${nombrePlan}` : nombreProducto,
    status: estadoDeContrato(s),
    billing_period: PERIODOS[s.billing_interval ?? ""] ?? null,
    amount: importeDeContrato(s),
    currency: s.contract?.currency || s.plan.currency || "MXN",
    started_on: fechaDe(s.current_period_start),
    renews_on: vivo ? fin : null,
    ended_on: vivo ? null : fin,
    auto_renew: s.provider === "stripe" && !s.cancel_at_period_end,
    application_slug: s.application_slug,
    plan_slug: s.plan.slug ?? null,
    plan_name: s.plan.name ?? null,
    provider: s.provider ?? null,
    addons: s.addons ?? [],
    in_grace: s.in_grace === true,
    grace_until: s.in_grace === true ? (s.grace_until ?? null) : null,
    notes: notasDeContrato(s),
    source: ORIGEN_KONTROLIA_AUTH,
    external_id: llaveDeContrato(orgId, s.application_slug),
  };
}

// ── Compras (renovaciones pagadas) ──────────────────────────────────────

export interface CompraDeseada {
  application_slug: string | null;
  compra: Record<string, unknown>;
  linea: Record<string, unknown>;
}

export function compraDeRenovacion(
  r: RenovacionKontroliaAuth,
  suscripciones: SuscripcionKontroliaAuth[],
): CompraDeseada | null {
  if (r.amount == null) return null;
  const importe = aPesos(r.amount) ?? 0;
  const suscripcion = suscripciones.find(
    (s) =>
      s.id === r.subscription_id || s.application_slug === r.application_slug,
  );
  const plan =
    suscripcion?.plan.name ?? suscripcion?.plan.slug ?? r.application_slug;
  const antes = fechaDe(r.previous_period_end);
  const despues = fechaDe(r.new_period_end);
  const periodo =
    antes || despues ? ` (${antes ?? "—"} → ${despues ?? "—"})` : "";
  return {
    application_slug: r.application_slug ?? null,
    compra: {
      // Sin ninguna fecha, la base pone la de hoy (undefined no viaja).
      purchased_on: fechaDe(r.paid_at) ?? fechaDe(r.created_at) ?? undefined,
      amount: importe,
      currency: r.currency || "MXN",
      status: "paid",
      reference: r.payment_reference ?? null,
      source: ORIGEN_KONTROLIA_AUTH,
      external_id: r.id,
    },
    linea: {
      description: `Renovación ${plan ?? ""}${periodo}`.replace(/\s+/g, " "),
      product_ref: suscripcion?.plan.slug
        ? `${r.application_slug}:${suscripcion.plan.slug}`
        : (r.application_slug ?? null),
      quantity: 1,
      unit_price: importe,
      amount: importe,
    },
  };
}

// ── Historial ───────────────────────────────────────────────────────────

/** Nombre del extra por su slug, con lo que traen las suscripciones. */
function nombreDeExtra(
  slug: unknown,
  suscripciones: SuscripcionKontroliaAuth[],
): string | null {
  if (typeof slug !== "string" || !slug) return null;
  for (const s of suscripciones) {
    const extra = s.addons?.find((a) => a.slug === slug);
    if (extra?.name) return extra.name;
  }
  return slug;
}

export function tituloDeMovimiento(
  m: MovimientoKontroliaAuth,
  suscripciones: SuscripcionKontroliaAuth[] = [],
): string {
  const payload = m.payload ?? {};
  const extra = nombreDeExtra(
    payload.addonSlug ?? payload.addon_slug,
    suscripciones,
  );
  const conExtra = (base: string) => (extra ? `${base}: ${extra}` : base);

  if (m.type.startsWith("stripe.")) {
    return `Cobro con tarjeta: ${m.type.slice("stripe.".length)}`;
  }
  if (m.type.includes("courtesy") || m.type.includes("free_months")) {
    return "Meses de cortesía";
  }
  switch (m.type) {
    case "manual.assigned": {
      const plan =
        m.plan_name ??
        (typeof payload.planSlug === "string" ? payload.planSlug : null) ??
        m.plan_slug;
      return plan ? `Plan asignado: ${plan}` : "Plan asignado";
    }
    case "manual.updated":
      return "Vigencia o contrato editado";
    case "manual.renewed":
      return "Renovación";
    case "addon.added":
      return conExtra("Extra agregado");
    case "addon.removed":
      return conExtra("Extra quitado");
    case "addon.removal_scheduled":
      return conExtra("Extra programado para quitarse");
    case "addon.updated":
      return conExtra("Extra editado");
    default:
      return m.type;
  }
}

export interface EventoDeseado {
  application_slug: string | null;
  fila: Record<string, unknown>;
}

export function eventosDeLaFoto(foto: FotoKontroliaAuth): EventoDeseado[] {
  const eventos: EventoDeseado[] = foto.history.map((m) => ({
    application_slug: m.application_slug ?? null,
    fila: {
      type: m.type,
      occurred_at: m.occurred_at,
      title: tituloDeMovimiento(m, foto.subscriptions),
      detail: {
        ...(m.payload ?? {}),
        ...(m.provider ? { provider: m.provider } : {}),
        ...(m.plan_slug ? { plan_slug: m.plan_slug } : {}),
      },
      amount: null,
      currency: null,
      source: ORIGEN_KONTROLIA_AUTH,
      external_id: m.id,
    },
  }));

  for (const r of foto.renewals) {
    eventos.push({
      application_slug: r.application_slug ?? null,
      fila: {
        type: "renewal",
        occurred_at:
          r.created_at ??
          (r.paid_at ? `${r.paid_at}T12:00:00Z` : foto.generated_at),
        title: "Renovación pagada",
        detail: {
          previous_period_end: r.previous_period_end ?? null,
          new_period_end: r.new_period_end ?? null,
          payment_reference: r.payment_reference ?? null,
          paid_at: r.paid_at ?? null,
          notes: r.notes ?? null,
        },
        amount: aPesos(r.amount),
        currency: r.amount != null ? r.currency || "MXN" : null,
        source: ORIGEN_KONTROLIA_AUTH,
        external_id: `renewal:${r.id}`,
      },
    });
  }
  return eventos;
}

// ── Plan completo ───────────────────────────────────────────────────────

/** Todo lo que hay que guardar para una foto, sin ids del CRM todavía. */
export interface PlanKontroliaAuth {
  organizacionExterna: { id: string; name: string };
  suscripciones: SuscripcionKontroliaAuth[];
  contactos: ContactoDeseado[];
  contratos: Record<string, unknown>[];
  compras: CompraDeseada[];
  eventos: EventoDeseado[];
}

export function planDeLaFoto(foto: FotoKontroliaAuth): PlanKontroliaAuth {
  const orgId = foto.organization.id;
  return {
    organizacionExterna: { id: orgId, name: foto.organization.name },
    suscripciones: foto.subscriptions,
    contactos: foto.members.map(contactoDeMiembro),
    contratos: foto.subscriptions.map((s) => contratoDeSuscripcion(orgId, s)),
    compras: foto.renewals
      .map((r) => compraDeRenovacion(r, foto.subscriptions))
      .filter((c): c is CompraDeseada => c !== null),
    eventos: eventosDeLaFoto(foto),
  };
}

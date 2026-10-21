import { z } from "zod";
import { describirHistorial } from "./movimientos";

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
  // Pago registrado cuando el periodo ya estaba cubierto (no movió la vigencia).
  covered: z.boolean().nullish(),
  external_ref: texto,
});

// Catálogo de planes para nombrar los ids y slugs que traen los movimientos.
// Opcional: una foto de antes de que KontrolIA Auth lo mandara no lo trae.
const PlanDeLaFoto = z.object({
  id: texto,
  slug: texto,
  name: texto,
  application_slug: texto,
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

// Consumo del mes actual y del anterior por producto y límite. Se valida
// renglón por renglón (usoDeLaFoto): uno mal formado se descarta sin tumbar
// el aviso. Opcional: una foto de antes de que KontrolIA Auth lo mandara no
// lo trae, y entonces el uso guardado no se toca.
export const UsoKontroliaAuth = z.object({
  application_slug: z.string().min(1),
  limit_key: z.string().min(1),
  description: texto,
  period: texto,
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // true = el periodo que corre ahora; falta en fotos viejas.
  current: z.boolean().nullish(),
  used: z.number(),
  // null = sin límite.
  included: numero,
  // Centavos; null = no se cobra aparte.
  overage_price_amount: numero,
  currency: texto,
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
  plans: z.array(PlanDeLaFoto).nullish(),
  usage: z.array(z.unknown()).nullish(),
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
export type UsoKontroliaAuth = z.infer<typeof UsoKontroliaAuth>;

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

/** Etapa que pone crm.revisar_clientes_en_riesgo() a quien deja de entrar. */
export const ETAPA_EN_RIESGO = "at-risk";

/**
 * Etapa del cliente según sus suscripciones, o `undefined` si no hay que
 * tocarla.
 *
 * Solo se mueve entre prospecto, cliente y perdido. Si una persona la puso
 * en otra («en riesgo», por ejemplo), se respeta: esa decisión no la sabe
 * KontrolIA Auth.
 *
 * `riesgoDelSistema`: la empresa está «en riesgo» porque la marcó el sistema
 * (crm.customer_risk), no una persona. Cuenta como cliente: con una
 * suscripción viva NO se regresa a cliente —eso lo hace solo la revisión
 * diaria cuando alguien vuelve a entrar—, y si ya no le queda ninguna pasa a
 * perdido.
 */
export function etapaDelCliente(
  actual: string | null | undefined,
  suscripciones: Pick<SuscripcionKontroliaAuth, "is_live">[],
  riesgoDelSistema = false,
): string | undefined {
  const efectiva =
    actual === ETAPA_EN_RIESGO && riesgoDelSistema ? "customer" : actual;
  const automatica = efectiva == null || ETAPAS_AUTOMATICAS.has(efectiva);
  const hayViva = suscripciones.some((s) => s.is_live);

  if (hayViva) {
    return automatica && efectiva !== "customer" ? "customer" : undefined;
  }
  if (suscripciones.length) {
    return efectiva === "customer" ? "churned" : undefined;
  }
  return efectiva == null ? "prospect" : undefined;
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

export interface EventoDeseado {
  application_slug: string | null;
  fila: Record<string, unknown>;
}

/**
 * Renglones del historial del contrato. Solo lo que dice en concreto qué
 * cambió (ver movimientos.ts): lo demás no se guarda, y quien guarda borra
 * lo que ya no salga aquí. El texto va en `title` y, si hay más, en
 * `detail.texto`; `detail.datos` conserva lo que mandó el origen.
 */
export function eventosDeLaFoto(foto: FotoKontroliaAuth): EventoDeseado[] {
  const planes = [
    ...(foto.plans ?? []),
    ...foto.subscriptions.map((s) => s.plan),
  ];
  const extras = foto.subscriptions.flatMap((s) => s.addons ?? []);
  const renglones = describirHistorial(foto.history, foto.renewals, {
    planes,
    extras,
  });

  return renglones.map(({ movimiento: m, renovacion: r, descripcion }) => {
    if (m) {
      return {
        application_slug: m.application_slug ?? null,
        fila: {
          type: m.type,
          occurred_at: m.occurred_at,
          title: descripcion.title,
          detail: {
            texto: descripcion.detail,
            datos: {
              ...(m.payload ?? {}),
              ...(m.provider ? { provider: m.provider } : {}),
              ...(m.plan_slug ? { plan_slug: m.plan_slug } : {}),
            },
          },
          // El importe ya va en el título; aquí no se repite.
          amount: null,
          currency: null,
          source: ORIGEN_KONTROLIA_AUTH,
          external_id: m.id,
        },
      };
    }
    const ren = r!;
    return {
      application_slug: ren.application_slug ?? null,
      fila: {
        type: "renewal",
        occurred_at:
          ren.created_at ??
          (ren.paid_at ? `${ren.paid_at}T12:00:00Z` : foto.generated_at),
        title: descripcion.title,
        detail: {
          texto: descripcion.detail,
          datos: {
            previous_period_end: ren.previous_period_end ?? null,
            new_period_end: ren.new_period_end ?? null,
            payment_reference: ren.payment_reference ?? null,
            paid_at: ren.paid_at ?? null,
            notes: ren.notes ?? null,
          },
        },
        amount: null,
        currency: null,
        source: ORIGEN_KONTROLIA_AUTH,
        external_id: `renewal:${ren.id}`,
      },
    };
  });
}

// ── Uso ─────────────────────────────────────────────────────────────────

/** Lo que se guarda en crm.customer_usage (sin ids del CRM). */
export interface UsoDeseado {
  application_slug: string;
  limit_key: string;
  description: string | null;
  period_start: string;
  /** month, year, day o lifetime. */
  period: string;
  /** El periodo que corre ahora. */
  is_current: boolean;
  used: number;
  included: number | null;
  /** En pesos. */
  overage_price_amount: number | null;
  currency: string | null;
}

/** Primer día del mes (AAAA-MM-01) de una fecha AAAA-MM-DD. */
const inicioDeMes = (dia: string) => `${dia.slice(0, 7)}-01`;

/** Producto × límite × mes: lo que hace único un renglón de uso. */
export const llaveDeUso = (
  u: Pick<UsoDeseado, "application_slug" | "limit_key" | "period_start">,
) => `${u.application_slug}|${u.limit_key}|${u.period_start}`;

/**
 * El uso de la foto, listo para guardar, o `null` si la foto no lo trae (una
 * foto de antes de que KontrolIA Auth lo mandara: el uso guardado no se
 * toca). Los renglones mal formados se descartan; uno repetido (mismo
 * producto, límite y mes) vale el último.
 */
export function usoDeLaFoto(foto: FotoKontroliaAuth): UsoDeseado[] | null {
  if (!Array.isArray(foto.usage)) return null;
  const porLlave = new Map<string, UsoDeseado>();
  const renglones = foto.usage.flatMap((crudo) => {
    const r = UsoKontroliaAuth.safeParse(crudo);
    return r.success ? [r.data] : [];
  });
  // Sin `current` (foto vieja): en los meses vale el más reciente; los demás
  // periodos solo llegan en curso.
  const ultimoMes = renglones
    .filter((u) => (u.period || "month") === "month")
    .reduce((mayor, u) => {
      const mes = inicioDeMes(u.period_start);
      return mes > mayor ? mes : mayor;
    }, "");
  for (const u of renglones) {
    const periodo = u.period || "month";
    const inicio =
      periodo === "month" ? inicioDeMes(u.period_start) : u.period_start;
    const fila: UsoDeseado = {
      application_slug: u.application_slug,
      limit_key: u.limit_key,
      description: u.description?.trim() || null,
      period_start: inicio,
      period: periodo,
      is_current:
        u.current ?? (periodo === "month" ? inicio === ultimoMes : true),
      used: u.used,
      included: u.included ?? null,
      overage_price_amount: aPesos(u.overage_price_amount),
      currency: u.currency || null,
    };
    porLlave.set(llaveDeUso(fila), fila);
  }
  return [...porLlave.values()];
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
  /** null = la foto no trae uso: no se toca lo guardado. */
  uso: UsoDeseado[] | null;
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
    uso: usoDeLaFoto(foto),
  };
}

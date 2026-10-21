/**
 * Uso de los clientes de KONTROLIA y «cliente en riesgo».
 *
 * El uso (crm.customer_usage) lo escribe la integración con KontrolIA Auth;
 * los usuarios y su último acceso son los contactos de la empresa
 * (last_seen = último inicio de sesión). La marca de riesgo la pone y la
 * quita la base cada día (crm.revisar_clientes_en_riesgo), con la MISMA
 * lectura de los ajustes que ajustesDeRiesgo(): si se cambia una, se cambia
 * la otra.
 *
 * Todo puro, para probarlo sin red.
 */

import type { Contract, CustomerUsage } from "../types";

// ── Ajustes (config.risk) ───────────────────────────────────────────────

export interface AjustesDeRiesgo {
  active: boolean;
  /** Días sin que nadie de la empresa entre para marcarla en riesgo. */
  inactivityDays: number;
}

export const AJUSTES_DE_RIESGO_DE_FABRICA: AjustesDeRiesgo = {
  active: true,
  inactivityDays: 14,
};

const MAXIMO_DE_DIAS = 365;

/**
 * Los ajustes guardados con los de fábrica donde falten o no sirvan. Días:
 * un entero de 1 a 365 (número o texto); lo demás vale 14. Misma regla que
 * crm.ajustes_de_riesgo en la base.
 */
export const ajustesDeRiesgo = (guardados: unknown): AjustesDeRiesgo => {
  const r =
    guardados && typeof guardados === "object" && !Array.isArray(guardados)
      ? (guardados as Record<string, unknown>)
      : {};
  const f = AJUSTES_DE_RIESGO_DE_FABRICA;
  const texto =
    typeof r.inactivityDays === "number" || typeof r.inactivityDays === "string"
      ? String(r.inactivityDays)
      : "";
  let dias = f.inactivityDays;
  if (/^[0-9]{1,4}$/.test(texto)) {
    dias = Number(texto) < 1 ? f.inactivityDays : Number(texto);
    dias = Math.min(dias, MAXIMO_DE_DIAS);
  }
  return {
    active: typeof r.active === "boolean" ? r.active : f.active,
    inactivityDays: dias,
  };
};

// ── Usuarios y último acceso ────────────────────────────────────────────

/** Ventana para contar a un usuario como activo. */
export const DIAS_DE_USUARIO_ACTIVO = 30;

const ORIGEN_KONTROLIA = "kontrolia_auth";
const DIA = 24 * 60 * 60 * 1000;

/** Lo mínimo de un contacto para contar usuarios. */
export interface ContactoConAcceso {
  last_seen?: string | null;
  archived_at?: string | null;
  source?: string | null;
}

/**
 * Los usuarios de la empresa: sus contactos no archivados que llegan de
 * KontrolIA Auth. Si no hay ninguno así (empresa ligada a mano), todos los
 * no archivados.
 */
const usuariosDe = (contactos: ContactoConAcceso[]) => {
  const vigentes = contactos.filter((c) => !c.archived_at);
  const sincronizados = vigentes.filter((c) => c.source === ORIGEN_KONTROLIA);
  return sincronizados.length ? sincronizados : vigentes;
};

const instanteValido = (valor?: string | null): number | null => {
  if (!valor) return null;
  const t = Date.parse(valor);
  return Number.isNaN(t) ? null : t;
};

/** Cuántos usuarios entraron en los últimos `dias` días, de cuántos. */
export const usuariosActivos = (
  contactos: ContactoConAcceso[],
  ahora: Date = new Date(),
  dias: number = DIAS_DE_USUARIO_ACTIVO,
): { activos: number; total: number } => {
  const usuarios = usuariosDe(contactos);
  const desde = ahora.getTime() - dias * DIA;
  const activos = usuarios.filter((c) => {
    const t = instanteValido(c.last_seen);
    return t !== null && t >= desde;
  }).length;
  return { activos, total: usuarios.length };
};

/** El acceso más reciente de alguien de la empresa, o null si nadie entró. */
export const ultimoAcceso = (contactos: ContactoConAcceso[]): string | null => {
  let mayor: { valor: string; t: number } | null = null;
  for (const c of usuariosDe(contactos)) {
    const t = instanteValido(c.last_seen);
    if (t !== null && (!mayor || t > mayor.t)) {
      mayor = { valor: c.last_seen!, t };
    }
  }
  return mayor?.valor ?? null;
};

/** Días de calendario (en la zona de quien consulta) entre un instante y hoy. */
export const diasDesde = (
  instante: string,
  ahora: Date = new Date(),
): number => {
  const antes = new Date(instante);
  const dia = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DIA;
  return Math.max(0, Math.round(dia(ahora) - dia(antes)));
};

const MESES_CORTOS = [
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

/** «19 oct 2026», en la zona de quien consulta (igual que crm.fecha_corta_es). */
export const fechaCorta = (instante: string): string => {
  const d = new Date(instante);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
};

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** «octubre de 2026» para un primer día de mes AAAA-MM-01. */
export const nombreDelMes = (inicio: string): string => {
  const [anio, mes] = inicio.split("-").map(Number);
  return `${MESES[mes - 1] ?? ""} de ${anio}`;
};

/** Primer día del mes anterior a `inicio` (AAAA-MM-01). */
export const mesAnterior = (inicio: string): string => {
  const [anio, mes] = inicio.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 2, 1)).toISOString().slice(0, 10);
};

// ── Consumo ─────────────────────────────────────────────────────────────

export interface Consumo {
  usado: number;
  /** null = sin límite. */
  incluido: number | null;
  /** Ancho de la barra, de 0 a 100; null sin límite. */
  porcentaje: number | null;
  /** Lo que pasó de lo incluido (0 si no pasó o no hay límite). */
  excedente: number;
}

export const consumo = (
  fila: Pick<CustomerUsage, "used" | "included">,
): Consumo => {
  const usado = Number(fila.used ?? 0);
  const incluido = fila.included == null ? null : Number(fila.included);
  if (incluido === null) {
    return { usado, incluido, porcentaje: null, excedente: 0 };
  }
  const porcentaje =
    incluido <= 0
      ? usado > 0
        ? 100
        : 0
      : Math.min(100, Math.round((usado / incluido) * 100));
  return {
    usado,
    incluido,
    porcentaje,
    excedente: Math.max(0, usado - incluido),
  };
};

/** Un límite de un producto: el periodo en curso y, si es mensual, el mes anterior. */
export interface LimiteDeUso {
  limit_key: string;
  descripcion: string;
  /** month, year, day o lifetime. */
  periodo: string;
  actual: CustomerUsage | null;
  anterior: CustomerUsage | null;
}

export interface UsoDeProducto {
  application_slug: string;
  nombre: string;
  limites: LimiteDeUso[];
}

/** Nombre del producto: lo que va antes del « · » en el nombre del contrato. */
const nombreDeProducto = (slug: string, contratos: Contract[]): string => {
  const contrato =
    contratos.find(
      (c) => c.application_slug === slug && c.status === "active",
    ) ?? contratos.find((c) => c.application_slug === slug);
  return contrato?.name.split(" · ")[0] || slug;
};

const periodoDe = (f: CustomerUsage) => f.period || "month";

/**
 * El uso agrupado por producto: cada límite con su consumo del periodo en
 * curso y, en los mensuales, del mes anterior. Los límites de «total» o del
 * año salen solo en curso. Productos por nombre; límites por descripción.
 */
export const agruparUso = (
  filas: CustomerUsage[],
  contratos: Contract[] = [],
): { mesActual: string | null; productos: UsoDeProducto[] } => {
  if (!filas.length) return { mesActual: null, productos: [] };
  const meses = filas.filter((f) => periodoDe(f) === "month");
  const mesActual = meses.length
    ? meses.reduce(
        (mayor, f) => (f.period_start > mayor ? f.period_start : mayor),
        meses[0].period_start,
      )
    : null;
  const previo = mesActual ? mesAnterior(mesActual) : null;

  const porProducto = new Map<string, Map<string, LimiteDeUso>>();
  for (const fila of filas) {
    const periodo = periodoDe(fila);
    const esActual =
      periodo === "month"
        ? fila.period_start === mesActual
        : fila.is_current !== false;
    if (!esActual && (periodo !== "month" || fila.period_start !== previo)) {
      continue;
    }
    const limites =
      porProducto.get(fila.application_slug) ?? new Map<string, LimiteDeUso>();
    porProducto.set(fila.application_slug, limites);
    const limite = limites.get(fila.limit_key) ?? {
      limit_key: fila.limit_key,
      descripcion: fila.description || fila.limit_key,
      periodo,
      actual: null,
      anterior: null,
    };
    if (esActual) {
      limite.actual = fila;
      // La descripción del mes actual manda.
      if (fila.description) limite.descripcion = fila.description;
    } else {
      limite.anterior = fila;
    }
    limites.set(fila.limit_key, limite);
  }

  const productos = [...porProducto.entries()]
    .map(([slug, limites]) => ({
      application_slug: slug,
      nombre: nombreDeProducto(slug, contratos),
      limites: [...limites.values()].sort((a, b) =>
        a.descripcion.localeCompare(b.descripcion, "es"),
      ),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return { mesActual, productos };
};

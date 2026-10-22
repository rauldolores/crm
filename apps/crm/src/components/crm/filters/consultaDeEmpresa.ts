import type { GetListParams } from "ra-core";

import type { CustomFieldDefinition } from "../types";

/**
 * Filtros sobre datos de la empresa —su estado y sus campos personalizados—
 * que comparten la lista de Empresas y el tablero de Oportunidades.
 *
 * Son filtros de PostgREST escritos como claves del filtro de la lista
 * (`campo@operador`), con un prefijo: "" en Empresas, que filtra su propia
 * fila, y "empresa:" en Oportunidades, que filtra la empresa embebida (ver
 * conEmpresaEmbebida). No se usa "companies." directamente porque el
 * formulario de filtros de react-admin lee los puntos como rutas y
 * anidaría la clave.
 */
export type PrefijoDeEmpresa = "" | "empresa:";

export const PREFIJO_EMBEBIDO: PrefijoDeEmpresa = "empresa:";

/** Los 32 estados de la república, como se capturan en `state_abbr`. */
export const ESTADOS_DE_MEXICO = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "CDMX",
  "Chiapas",
  "Chihuahua",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

export const claveDeEstado = (prefijo: PrefijoDeEmpresa) =>
  `${prefijo}state_abbr@eq`;

/**
 * Operador según el tipo del campo. `->>` compara como texto; `->` compara
 * el valor JSON, que es lo que hace falta para números (orden numérico, no
 * alfabético) y casillas (true/false).
 */
const OPERACION_POR_TIPO: Record<
  CustomFieldDefinition["type"],
  { ruta: "->>" | "->"; operador: "eq" | "ilike" | "gte" }
> = {
  text: { ruta: "->>", operador: "ilike" },
  list: { ruta: "->>", operador: "eq" },
  date: { ruta: "->>", operador: "eq" },
  number: { ruta: "->", operador: "gte" },
  checkbox: { ruta: "->", operador: "eq" },
};

const PATRON_DE_CAMPO = /^(.*)custom_fields(->>|->)([^@]+)@\w+$/;

/** El filtro de un campo personalizado, o {} si no hay valor. */
export const filtroDeCampo = (
  prefijo: PrefijoDeEmpresa,
  campo: CustomFieldDefinition,
  valor: string,
): Record<string, string> => {
  const limpio = valor.trim();
  if (!limpio) return {};
  if (campo.type === "number" && Number.isNaN(Number(limpio))) return {};
  const { ruta, operador } = OPERACION_POR_TIPO[campo.type];
  return {
    [`${prefijo}custom_fields${ruta}${campo.value}@${operador}`]: limpio,
  };
};

/** Los filtros sin ningún filtro de campo personalizado de ese prefijo. */
export const sinFiltroDeCampo = (
  filtros: Record<string, unknown>,
  prefijo: PrefijoDeEmpresa,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(filtros).filter(
      ([clave]) => PATRON_DE_CAMPO.exec(clave)?.[1] !== prefijo,
    ),
  );

/** El campo personalizado filtrado ahora (para pintar el control), si hay. */
export const campoFiltrado = (
  filtros: Record<string, unknown>,
  prefijo: PrefijoDeEmpresa,
): { campo: string; valor: string } | null => {
  for (const [clave, valor] of Object.entries(filtros)) {
    const partes = PATRON_DE_CAMPO.exec(clave);
    if (partes && partes[1] === prefijo) {
      return { campo: partes[3], valor: String(valor) };
    }
  }
  return null;
};

/**
 * Para filtrar oportunidades por datos de su empresa, PostgREST necesita la
 * empresa embebida con `!inner` en el select y el filtro sobre
 * `companies.…`: así descarta la oportunidad entera, no solo la empresa
 * embebida. Sin filtros de empresa, la consulta no cambia.
 */
export const conEmpresaEmbebida = (params: GetListParams): GetListParams => {
  const filtros = params.filter ?? {};
  const filtraEmpresa = Object.keys(filtros).some((clave) =>
    clave.startsWith(PREFIJO_EMBEBIDO),
  );
  if (!filtraEmpresa) return params;
  return {
    ...params,
    filter: Object.fromEntries(
      Object.entries(filtros).map(([clave, valor]) => [
        clave.startsWith(PREFIJO_EMBEBIDO)
          ? `companies.${clave.slice(PREFIJO_EMBEBIDO.length)}`
          : clave,
        valor,
      ]),
    ),
    meta: { ...params.meta, columns: "*,companies!inner(id)" },
  };
};

/** Quita la empresa embebida de cada fila: no es una columna de `deals`. */
export const sinEmpresaEmbebida = <T extends object>(fila: T): T => {
  if (!("companies" in fila)) return fila;
  const { companies: _empresa, ...resto } = fila as T & {
    companies: unknown;
  };
  return resto as T;
};

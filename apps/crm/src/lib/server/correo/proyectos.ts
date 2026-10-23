import { getServiceClient } from "../supabase-service";

/**
 * Proyectos de una organización (config.projects): cada producto que vende
 * (Faqturia, AduaniaX…) con su propia dirección de correo. De aquí sale
 * desde qué dirección se escribe a un cliente y a qué proyecto pertenece lo
 * que llega a la bandeja.
 *
 * Las reglas son puras para poder probarlas; solo `proyectosDeOrganizacion`
 * toca la base.
 */

export interface Proyecto {
  value: string;
  label: string;
  /** Su dirección: envía y recibe. Vacía = la del correo saliente general. */
  email?: string | null;
  fromName?: string | null;
}

export interface ProyectosDeOrganizacion {
  proyectos: Proyecto[];
  /** El value del predeterminado; nulo si la organización no tiene proyectos. */
  predeterminado: string | null;
}

export type Eleccion =
  | { tipo: "proyecto"; proyecto: Proyecto | null }
  | { tipo: "preguntar"; opciones: Proyecto[] };

const esTexto = (valor: unknown): valor is string =>
  typeof valor === "string" && valor.trim() !== "";

/** Lee config.projects / config.defaultProject sin fiarse de su forma. */
export const leerProyectos = (config: unknown): ProyectosDeOrganizacion => {
  const c = (config ?? {}) as { projects?: unknown; defaultProject?: unknown };
  const proyectos = (Array.isArray(c.projects) ? c.projects : [])
    .filter(
      (p): p is Proyecto =>
        esTexto((p as Proyecto)?.value) && esTexto((p as Proyecto)?.label),
    )
    .map((p) => ({
      value: p.value,
      label: p.label,
      email: esTexto(p.email) ? p.email.trim().toLowerCase() : null,
      fromName: esTexto(p.fromName) ? p.fromName.trim() : null,
    }));
  const pedido = esTexto(c.defaultProject) ? c.defaultProject : null;
  const predeterminado = proyectos.some((p) => p.value === pedido)
    ? pedido
    : (proyectos[0]?.value ?? null);
  return { proyectos, predeterminado };
};

export interface Pistas {
  /** Lo que eligió la persona que envía. */
  elegido?: string | null;
  /** Lo que ya está decidido: la plantilla, la oportunidad, la conversación. */
  fijo?: (string | null | undefined)[];
  /** Los proyectos de la empresa del destinatario. */
  deLaEmpresa?: string[] | null;
  /** Hay una persona delante a quien preguntar (envío a mano). */
  puedePreguntar?: boolean;
}

/**
 * Desde qué proyecto sale un correo. En orden: lo que eligió quien envía,
 * lo ya decidido (plantilla, oportunidad, conversación), el único proyecto
 * de la empresa y, si tiene varios, se pregunta — o, sin nadie a quien
 * preguntar, el predeterminado.
 */
export const elegirProyecto = (
  { proyectos, predeterminado }: ProyectosDeOrganizacion,
  { elegido, fijo = [], deLaEmpresa = [], puedePreguntar = false }: Pistas,
): Eleccion => {
  const buscar = (value: string | null | undefined) =>
    value ? (proyectos.find((p) => p.value === value) ?? null) : null;
  const predeterminadoODeNinguno: Eleccion = {
    tipo: "proyecto",
    proyecto: buscar(predeterminado),
  };

  const directo = buscar(elegido) ?? fijo.map(buscar).find(Boolean) ?? null;
  if (directo) return { tipo: "proyecto", proyecto: directo };

  const deEmpresa = proyectos.filter((p) =>
    (deLaEmpresa ?? []).includes(p.value),
  );
  if (deEmpresa.length === 1) {
    return { tipo: "proyecto", proyecto: deEmpresa[0] };
  }
  if (deEmpresa.length > 1 && puedePreguntar) {
    return { tipo: "preguntar", opciones: deEmpresa };
  }
  return predeterminadoODeNinguno;
};

/** El proyecto cuya dirección está entre los destinatarios de un correo. */
export const proyectoPorDireccion = (
  proyectos: Proyecto[],
  direcciones: string[],
): Proyecto | null => {
  const buscadas = direcciones.map((d) => d.trim().toLowerCase());
  return proyectos.find((p) => p.email && buscadas.includes(p.email)) ?? null;
};

export async function proyectosDeOrganizacion(
  organizacionId: string,
): Promise<ProyectosDeOrganizacion> {
  const { data } = await getServiceClient()
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  return leerProyectos(data?.config);
}

/** Los proyectos de la empresa de un contacto (vacío si no tiene empresa). */
export async function proyectosDeLaEmpresaDelContacto(
  organizacionId: string,
  contactoId: number,
): Promise<string[]> {
  const db = getServiceClient();
  const { data: contacto } = await db
    .from("contacts")
    .select("company_id")
    .eq("id", contactoId)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!contacto?.company_id) return [];
  const { data: empresa } = await db
    .from("companies")
    .select("projects")
    .eq("id", contacto.company_id)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  return (empresa?.projects as string[] | null) ?? [];
}

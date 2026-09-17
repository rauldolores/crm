/**
 * Organizaciones del usuario contra KontrolIA Auth: listar, crear y
 * renombrar.
 *
 * Listar va por el SDK (getMemberships, contra Supabase con RLS). Crear y
 * renombrar pasan por el servidor de Next del CRM (/api/organizaciones): la
 * ruta /api/organizations del auth-server no tiene CORS —a diferencia de
 * miembros, roles e invitaciones—, y además crear una organización usable
 * es una secuencia de varias llamadas (crear, habilitar la app, asignar el
 * rol de administrador) que conviene orquestar en un solo sitio. El
 * servidor del CRM solo reenvía el token de quien tiene la sesión: la
 * autorización sigue siendo la RLS del auth-server sobre ese token.
 */
import { decodeAccessToken } from "@kontrolia/auth";

import { getKontroliaAccessToken, getKontroliaMemberships } from "./client";

export interface Organizacion {
  id: string;
  nombre: string;
  slug: string;
}

export interface MembresiaConOrganizacion {
  membershipId: string;
  organizacion: Organizacion;
  /** Slugs de rol en esa organización (owner, admin, admin-crm, …). */
  roles: string[];
  estado: string;
}

/** true si los roles dan administración de la organización (Owner o Admin). */
export const esAdministradorDe = (roles: string[]): boolean =>
  roles.includes("owner") || roles.includes("admin");

/** Id de usuario (claim `sub`) de quien tiene la sesión, o null si no hay. */
export async function usuarioActivoId(): Promise<string | null> {
  const token = await getKontroliaAccessToken();
  if (!token) return null;
  return decodeAccessToken(token)?.sub ?? null;
}

/** Todas las organizaciones a las que pertenece quien tiene la sesión. */
export async function listarMisOrganizaciones(): Promise<
  MembresiaConOrganizacion[]
> {
  const membresias = await getKontroliaMemberships();
  return membresias.map((m) => ({
    membershipId: m.id,
    organizacion: {
      id: m.organization.id,
      nombre: m.organization.name,
      slug: m.organization.slug,
    },
    roles: m.roles,
    estado: m.status,
  }));
}

class ErrorDeOrganizacion extends Error {}

async function pedirAlCrm(
  ruta: string,
  init: RequestInit & { generico: string },
): Promise<Response> {
  const token = await getKontroliaAccessToken();
  if (!token) {
    throw new ErrorDeOrganizacion("No hay sesión activa con KontrolIA Auth.");
  }
  const { generico, ...resto } = init;
  const respuesta = await fetch(ruta, {
    ...resto,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    throw new ErrorDeOrganizacion(
      typeof cuerpo?.message === "string" ? cuerpo.message : generico,
    );
  }
  return respuesta;
}

export interface OrganizacionCreada {
  organizacion: Organizacion;
  /** Presente si la organización existe pero algún paso posterior falló. */
  aviso?: string;
}

/**
 * Crea una organización nueva con quien tiene la sesión como Owner y
 * Administrador de esta app, lista para contratarle un plan.
 */
export async function crearOrganizacion(
  nombre: string,
): Promise<OrganizacionCreada> {
  const respuesta = await pedirAlCrm("/api/organizaciones", {
    method: "POST",
    body: JSON.stringify({ nombre }),
    generico: "No se pudo crear la organización.",
  });
  return respuesta.json();
}

/** Cambia el nombre de una organización. Solo Owner/Admin. */
export async function renombrarOrganizacion(
  id: string,
  nombre: string,
): Promise<Organizacion> {
  const respuesta = await pedirAlCrm(
    `/api/organizaciones/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ nombre }),
      generico: "No se pudo renombrar la organización.",
    },
  );
  const cuerpo = (await respuesta.json()) as { organizacion: Organizacion };
  return cuerpo.organizacion;
}

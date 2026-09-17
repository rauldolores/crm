/**
 * Equipo de la organización contra KontrolIA Auth: roles asignables,
 * miembros e invitaciones.
 *
 * A diferencia de facturacion.ts, esto no pasa por el SDK (@kontrolia/auth no
 * expone estos métodos): son las rutas /api/roles, /api/organization-members
 * y /api/invitations del propio auth-server, documentadas en
 * public-signup.md, llamadas con fetch y el token de quien tiene la sesión —
 * nunca con la API key de la aplicación, porque la comprobación de que sea
 * Owner/Admin de su organización vive del lado del servidor (RLS), sobre
 * ESE token.
 */
import { decodeAccessToken } from "@kontrolia/auth";

import { env } from "@/lib/env";
import { getKontroliaAccessToken } from "./client";

export interface RolDisponible {
  id: string;
  name: string;
  slug: string;
  application_id: string | null;
}

export interface Miembro {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  roles: RolDisponible[];
}

export interface Invitacion {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  role: { name: string } | null;
}

class ErrorDeEquipo extends Error {}

async function tokenOFalla(): Promise<string> {
  const token = await getKontroliaAccessToken();
  if (!token) {
    throw new ErrorDeEquipo("No hay sesión activa con KontrolIA Auth.");
  }
  return token;
}

/** Mensaje de error del auth-server (`{ error }`), o el genérico indicado. */
async function mensajeDeError(
  respuesta: Response,
  generico: string,
): Promise<string> {
  const cuerpo = (await respuesta.json().catch(() => null)) as {
    error?: unknown;
  } | null;
  return typeof cuerpo?.error === "string" ? cuerpo.error : generico;
}

async function pedir(
  ruta: string,
  init: RequestInit & { generico: string },
): Promise<Response> {
  const token = await tokenOFalla();
  const { generico, ...resto } = init;
  const respuesta = await fetch(new URL(ruta, env.kontroliaAuthServerUrl), {
    ...resto,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(resto.body ? { "Content-Type": "application/json" } : {}),
      ...resto.headers,
    },
  });
  if (!respuesta.ok) {
    throw new ErrorDeEquipo(await mensajeDeError(respuesta, generico));
  }
  return respuesta;
}

/** organization_id del token actual, o null si no hay sesión. */
export async function organizacionActivaId(): Promise<string | null> {
  const token = await getKontroliaAccessToken();
  if (!token) return null;
  return decodeAccessToken(token)?.organization_id ?? null;
}

/** Los roles que se pueden asignar al invitar a esta organización. */
export async function listarRolesDisponibles(
  organizationId: string,
): Promise<RolDisponible[]> {
  const respuesta = await pedir(
    `/api/roles?organizationId=${encodeURIComponent(organizationId)}`,
    { generico: "No se pudo consultar los roles de tu organización." },
  );
  const cuerpo = (await respuesta.json()) as { roles?: RolDisponible[] };
  return cuerpo.roles ?? [];
}

/** Invita por correo a la organización, con el rol indicado. */
export async function invitarATuOrganizacion(input: {
  organizationId: string;
  email: string;
  roleId: string;
}): Promise<void> {
  await pedir("/api/invitations", {
    method: "POST",
    body: JSON.stringify(input),
    generico: "No se pudo enviar la invitación.",
  });
}

/** Miembros de la organización (correo y nombre resueltos por auth-server). */
export async function listarMiembros(organizationId: string): Promise<Miembro[]> {
  const respuesta = await pedir(
    `/api/organization-members?organizationId=${encodeURIComponent(organizationId)}`,
    { generico: "No se pudieron consultar los miembros de tu organización." },
  );
  const cuerpo = (await respuesta.json()) as { members?: Miembro[] };
  return cuerpo.members ?? [];
}

/** Quita a un miembro de la organización. Solo Owner/Admin; nunca al único Owner. */
export async function quitarMiembro(membershipId: string): Promise<void> {
  await pedir(
    `/api/organization-members?membershipId=${encodeURIComponent(membershipId)}`,
    { method: "DELETE", generico: "No se pudo quitar a este miembro." },
  );
}

/** Invitaciones de la organización, pendientes y ya aceptadas. */
export async function listarInvitaciones(
  organizationId: string,
): Promise<Invitacion[]> {
  const respuesta = await pedir(
    `/api/invitations?organizationId=${encodeURIComponent(organizationId)}`,
    { generico: "No se pudieron consultar las invitaciones." },
  );
  const cuerpo = (await respuesta.json()) as { invitations?: Invitacion[] };
  return cuerpo.invitations ?? [];
}

/** Revoca una invitación pendiente. */
export async function revocarInvitacion(id: string): Promise<void> {
  await pedir(`/api/invitations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    generico: "No se pudo revocar la invitación.",
  });
}

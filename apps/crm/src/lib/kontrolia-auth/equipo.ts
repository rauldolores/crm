/**
 * Invitación de equipo contra KontrolIA Auth: listar los roles disponibles
 * de esta organización e invitar por correo a uno de ellos.
 *
 * A diferencia de facturacion.ts, esto no pasa por el SDK (@kontrolia/auth no
 * expone estos dos métodos): son las rutas /api/roles y /api/invitations del
 * propio auth-server, documentadas en public-signup.md, llamadas con fetch y
 * el token de quien tiene la sesión — nunca con la API key de la aplicación,
 * porque la comprobación de que sea Owner/Admin de su organización vive del
 * lado del servidor, sobre ESE token.
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

class ErrorDeEquipo extends Error {}

async function tokenOFalla(): Promise<string> {
  const token = await getKontroliaAccessToken();
  if (!token) {
    throw new ErrorDeEquipo("No hay sesión activa con KontrolIA Auth.");
  }
  return token;
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
  const token = await tokenOFalla();
  const url = new URL("/api/roles", env.kontroliaAuthServerUrl);
  url.searchParams.set("organizationId", organizationId);
  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuesta.ok) {
    throw new ErrorDeEquipo("No se pudo consultar los roles de tu organización.");
  }
  return respuesta.json();
}

/** Invita por correo a la organización activa, con el rol indicado. */
export async function invitarATuOrganizacion(input: {
  organizationId: string;
  email: string;
  roleId: string;
}): Promise<void> {
  const token = await tokenOFalla();
  const respuesta = await fetch(
    new URL("/api/invitations", env.kontroliaAuthServerUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorDeEquipo(
      cuerpo?.message || "No se pudo enviar la invitación.",
    );
  }
}

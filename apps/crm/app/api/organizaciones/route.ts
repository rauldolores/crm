import { env } from "@/lib/env";
import {
  crearOrganizacionEnKontroliaAuth,
  ErrorDeAuthServer,
  subDelToken,
} from "@/lib/server/organizaciones/crearOrganizacion";

/**
 * Crear una organización nueva en KontrolIA Auth para quien tiene la
 * sesión. NO pasa por requireKontroliaPermission a propósito: esa puerta
 * exige permisos de esta app y cupo del plan de la organización ACTIVA, y
 * quien crea una organización nueva puede no tener nada de eso todavía
 * (justamente para contratar un plan en la nueva). Aquí solo se reenvía su
 * token al auth-server, que decide con su RLS.
 */

const MAX_NOMBRE = 120;

export async function POST(peticion: Request) {
  const autorizacion = peticion.headers.get("authorization") ?? "";
  const token = autorizacion.replace(/^Bearer\s+/i, "");
  const userId = token ? subDelToken(token) : null;
  if (!token || !userId) {
    return Response.json({ message: "Sesión no válida." }, { status: 401 });
  }
  if (!env.kontroliaAuthServerUrl) {
    return Response.json(
      { message: "KontrolIA Auth no está configurado." },
      { status: 503 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    nombre?: unknown;
  } | null;
  const nombre =
    typeof cuerpo?.nombre === "string"
      ? cuerpo.nombre.trim().slice(0, MAX_NOMBRE)
      : "";
  if (!nombre) {
    return Response.json(
      { message: "El nombre de la organización es obligatorio." },
      { status: 400 },
    );
  }

  try {
    const creada = await crearOrganizacionEnKontroliaAuth(nombre, {
      authServerUrl: env.kontroliaAuthServerUrl,
      applicationSlug: env.kontroliaApplicationSlug,
      token,
      userId,
    });
    return Response.json(creada, { status: 201 });
  } catch (e) {
    const estado = e instanceof ErrorDeAuthServer ? e.status : 502;
    return Response.json(
      {
        message:
          e instanceof Error ? e.message : "No se pudo crear la organización.",
      },
      { status: estado },
    );
  }
}

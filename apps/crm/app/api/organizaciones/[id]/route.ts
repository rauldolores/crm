import { env } from "@/lib/env";

/**
 * Renombrar una organización: reenvío directo a PATCH /api/organizations/{id}
 * del auth-server con el token de quien pide (solo Owner/Admin, por su RLS).
 * Pasa por aquí porque esa ruta del auth-server no tiene CORS.
 */

const MAX_NOMBRE = 120;

export async function PATCH(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const autorizacion = peticion.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+/i.test(autorizacion)) {
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

  const base = env.kontroliaAuthServerUrl.replace(/\/$/, "");
  const respuesta = await fetch(
    `${base}/api/organizations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: autorizacion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: nombre }),
    },
  );
  const datos = (await respuesta.json().catch(() => null)) as {
    error?: unknown;
    organization?: { id: string; name: string; slug: string };
  } | null;
  if (!respuesta.ok || !datos?.organization) {
    return Response.json(
      {
        message:
          typeof datos?.error === "string"
            ? datos.error
            : "No se pudo renombrar la organización.",
      },
      { status: respuesta.ok ? 502 : respuesta.status },
    );
  }
  return Response.json({
    organizacion: {
      id: datos.organization.id,
      nombre: datos.organization.name,
      slug: datos.organization.slug,
    },
  });
}

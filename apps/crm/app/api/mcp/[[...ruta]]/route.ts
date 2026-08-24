/**
 * Puente entre un asistente de IA y el servidor MCP del CRM.
 *
 * El servidor MCP real es una función de Supabase Edge Functions, pero un
 * cliente externo nunca debe ver ni conocer ese dominio: se conecta siempre
 * a esta dirección, dentro del propio dominio de la aplicación.
 *
 * A diferencia del puente de datos (`/api/datos`), este NO añade ninguna
 * autenticación propia ni inyecta ninguna clave: el protocolo MCP hace su
 * propia autenticación con el token que envía el cliente, así que aquí solo
 * se reenvía la petición tal cual, incluida su respuesta en streaming
 * (el protocolo puede responder por Server-Sent Events).
 *
 * Se manda `x-forwarded-host` con el dominio real de la aplicación: el
 * servidor MCP lo usa para que sus propias direcciones (la de metadatos
 * OAuth, por ejemplo) también apunten aquí y no al dominio de Supabase.
 */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);

/** Cabeceras que se reenvían tal cual llegan del cliente MCP. */
const CABECERAS_REENVIADAS = [
  "accept",
  "authorization",
  "content-type",
  "mcp-protocol-version",
  "mcp-session-id",
];

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

type Contexto = { params: Promise<{ ruta?: string[] }> };

async function reenviar(peticion: Request, { params }: Contexto) {
  if (!SUPABASE_URL) {
    return esError(
      500,
      "Falta la configuración de la base de datos en el servidor.",
    );
  }

  const { ruta } = await params;
  const origen = new URL(peticion.url);
  const destino = `${SUPABASE_URL}/functions/v1/mcp/${(ruta ?? []).join("/")}${origen.search}`;

  const cabeceras = new Headers();
  for (const nombre of CABECERAS_REENVIADAS) {
    const valor = peticion.headers.get(nombre);
    if (valor) cabeceras.set(nombre, valor);
  }
  cabeceras.set("x-forwarded-host", origen.host);

  const respuesta = await fetch(destino, {
    method: peticion.method,
    headers: cabeceras,
    body:
      peticion.method === "GET" || peticion.method === "HEAD"
        ? undefined
        : peticion.body,
    // @ts-expect-error -- requerido por fetch para reenviar un body en streaming
    duplex: "half",
  });

  // El cuerpo se reenvía sin leerlo entero: el protocolo MCP puede responder
  // con un stream de eventos (SSE) que debe llegar al cliente según se va
  // generando, no de una vez al terminar.
  const cabecerasRespuesta = new Headers(respuesta.headers);
  cabecerasRespuesta.delete("content-encoding");
  cabecerasRespuesta.delete("content-length");

  return new Response(respuesta.body, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabecerasRespuesta,
  });
}

export const GET = reenviar;
export const POST = reenviar;
export const DELETE = reenviar;

export async function OPTIONS(peticion: Request, contexto: Contexto) {
  return reenviar(peticion, contexto);
}

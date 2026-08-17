import {
  firmarTokenInterno,
  validarSesion,
} from "@/lib/server/sesion-kontrolia";

/**
 * Puente entre el navegador y la base de datos del CRM.
 *
 * El cliente de Supabase del navegador apunta aquí en lugar de a la base
 * directamente, así que todas sus peticiones pasan por el servidor. Este
 * verifica el token de KontrolIA Auth, emite un token interno con la
 * organización activa y reenvía la petición.
 *
 * Se reenvía en bloque en lugar de escribir un endpoint por recurso: el data
 * provider del CRM tiene nueve métodos más los propios, y cada endpoint escrito
 * a mano sería una ocasión de olvidar el filtro por organización. Aquí el
 * filtro no depende de recordarlo, porque lo aplica el RLS de la base a partir
 * del token.
 */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);
const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_SB_PUBLISHABLE_KEY ?? "";

/** Cabeceras que no deben viajar tal cual al reenviar. */
const CABECERAS_OMITIDAS = new Set([
  "host",
  "connection",
  "content-length",
  "authorization",
  "apikey",
]);

async function reenviar(peticion: Request, ruta: string[]) {
  if (!SUPABASE_URL) {
    return Response.json(
      { message: "Falta NEXT_PUBLIC_SUPABASE_URL en el servidor." },
      { status: 500 },
    );
  }

  const sesion = await validarSesion(peticion);
  if (!sesion) {
    return Response.json({ message: "Sesión no válida." }, { status: 401 });
  }

  if (!sesion.organizacionId) {
    return Response.json(
      {
        message:
          "Tu cuenta no tiene una organización activa con acceso a Kontrolia CRM. Pídele acceso a quien administre tu organización.",
      },
      { status: 403 },
    );
  }

  const tokenInterno = await firmarTokenInterno(sesion);
  const origen = new URL(peticion.url);
  const destino = `${SUPABASE_URL}/${ruta.join("/")}${origen.search}`;

  const cabeceras = new Headers();
  peticion.headers.forEach((valor, nombre) => {
    if (!CABECERAS_OMITIDAS.has(nombre.toLowerCase())) {
      cabeceras.set(nombre, valor);
    }
  });
  cabeceras.set("Authorization", `Bearer ${tokenInterno}`);
  cabeceras.set("apikey", CLAVE_PUBLICA);

  const cuerpo =
    peticion.method === "GET" || peticion.method === "HEAD"
      ? undefined
      : await peticion.arrayBuffer();

  const respuesta = await fetch(destino, {
    method: peticion.method,
    headers: cabeceras,
    body: cuerpo,
  });

  // Se devuelve el cuerpo y las cabeceras tal cual: el data provider lee
  // `content-range` para la paginación y los códigos de error de PostgREST.
  const cabecerasRespuesta = new Headers(respuesta.headers);
  cabecerasRespuesta.delete("content-encoding");
  cabecerasRespuesta.delete("content-length");

  return new Response(respuesta.body, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabecerasRespuesta,
  });
}

type Contexto = { params: Promise<{ ruta: string[] }> };

const manejar = async (peticion: Request, { params }: Contexto) => {
  const { ruta } = await params;
  return reenviar(peticion, ruta);
};

export const GET = manejar;
export const POST = manejar;
export const PATCH = manejar;
export const PUT = manejar;
export const DELETE = manejar;
export const HEAD = manejar;

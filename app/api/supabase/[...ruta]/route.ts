import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";

/**
 * Puente entre el navegador y la base de datos del CRM.
 *
 * El servidor valida el token de KontrolIA Auth, y consulta la base con la
 * clave de servicio. Como esa clave salta el RLS, el aislamiento entre
 * organizaciones lo impone este archivo.
 *
 * Se hace inyectando el filtro `organization_id` en TODA consulta, en lugar de
 * escribir una ruta por recurso con su comprobación de tenencia. El data
 * provider del CRM tiene nueve métodos sobre siete recursos: serían más de
 * sesenta sitios donde alguien puede olvidarse de comprobar, y basta uno para
 * filtrar datos de otra empresa. Aquí no depende de recordarlo, porque una fila
 * de otra organización no llega a entrar en el resultado, ni siquiera pidiendo
 * un identificador concreto.
 *
 * Para las rutas que en el futuro reciban un recurso por id fuera de este
 * puente, sigue disponible `verificarTenencia()`.
 */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);
const CLAVE_DE_SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Tablas y vistas que pertenecen a una organización. */
const CON_DUENO = new Set([
  "companies",
  "companies_summary",
  "contacts",
  "contacts_summary",
  "contact_notes",
  "deals",
  "deal_notes",
  "sales",
  "tags",
  "tasks",
  "configuration",
  "activity_log",
]);

/**
 * Cabeceras que se reenvian, por lista blanca y no por exclusion.
 *
 * Reenviar todo lo que manda el navegador enviaba tambien sus cookies de
 * sesion a la base de datos —innecesario y poco deseable— y hacia la peticion
 * lo bastante grande como para que Kong la rechazara con 400. Aqui solo viajan
 * las que PostgREST necesita.
 */
const CABECERAS_REENVIADAS = [
  "accept",
  "accept-profile",
  "content-profile",
  "content-type",
  "prefer",
  "range",
  "range-unit",
  "x-client-info",
];

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

async function reenviar(peticion: Request, ruta: string[]) {
  if (!SUPABASE_URL || !CLAVE_DE_SERVICIO) {
    return esError(
      500,
      "Falta la configuración de la base de datos en el servidor.",
    );
  }

  // El permiso fino por recurso llegará cuando se declare en cada ruta; aquí
  // se exige sesión con organización activa, que es lo que decide qué datos
  // son visibles.
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId } = auth.sesion;
  const origen = new URL(peticion.url);
  const recurso = ruta[ruta.length - 1];
  const parametros = new URLSearchParams(origen.search);

  // El filtro de organización se impone, no se acepta del cliente: si viniera
  // uno en la petición se descarta antes de añadir el correcto.
  if (CON_DUENO.has(recurso)) {
    parametros.delete("organization_id");
    parametros.append("organization_id", `eq.${organizacionId}`);
  }

  const cabeceras = new Headers();
  for (const nombre of CABECERAS_REENVIADAS) {
    const valor = peticion.headers.get(nombre);
    if (valor) cabeceras.set(nombre, valor);
  }
  cabeceras.set("Authorization", `Bearer ${CLAVE_DE_SERVICIO}`);
  cabeceras.set("apikey", CLAVE_DE_SERVICIO);

  let cuerpo: string | undefined;
  if (peticion.method !== "GET" && peticion.method !== "HEAD") {
    const texto = await peticion.text();
    cuerpo = texto;

    // En altas y modificaciones la organización tambien se impone, para que no
    // se pueda crear ni mover un registro a otra empresa.
    if (CON_DUENO.has(recurso) && texto) {
      try {
        const datos = JSON.parse(texto);
        const conDueno = (fila: Record<string, unknown>) => ({
          ...fila,
          organization_id: organizacionId,
        });
        cuerpo = JSON.stringify(
          Array.isArray(datos) ? datos.map(conDueno) : conDueno(datos),
        );
      } catch {
        // Cuerpo no JSON: se reenvía tal cual.
      }
    }
  }

  const destino = `${SUPABASE_URL}/${ruta.join("/")}?${parametros.toString()}`;
  const respuesta = await fetch(destino, {
    method: peticion.method,
    headers: cabeceras,
    body: cuerpo,
  });

  // Se conservan las cabeceras: el data provider lee `content-range` para
  // paginar. Se quitan las de codificación porque el cuerpo ya viene
  // descomprimido y anunciarlo lo corrompería.
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

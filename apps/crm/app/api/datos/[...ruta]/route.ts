import { afiliadoDeLaSesion } from "@/lib/server/afiliadoDeLaSesion";
import { autenticarPuente } from "@/lib/server/autenticarPuente";
import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { imponerDueno } from "@/lib/server/imponerDueno";
import {
  contarUso,
  exigirCupo,
  liberarUso,
  LIMITE_CONTACTOS,
  LIMITE_EMBUDOS,
  limitesConfigurados,
} from "@/lib/server/kontrolia-auth/consumo";
import {
  contactosNuevos,
  embudosNuevos,
  embudosQuitados,
  idsDe,
} from "@/lib/server/limitesDelPuente";
import { restringirAPropios } from "@/lib/server/restringirAPropios";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Puente entre el navegador (o una integración externa) y la base de datos
 * del CRM.
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
 *
 * Autenticación: además del token de sesión, se acepta una clave de API
 * (`Authorization: Bearer vnq_...`, ver /api/claves) para integraciones
 * externas. Se resuelve igual la organización y tiene acceso a los mismos
 * recursos que una sesión — la única diferencia es que no puede incrustar
 * relaciones de PostgREST (ver más abajo). Ojo con `webhooks`: una clave que
 * llegue a filtrarse puede crear uno propio y quedarse un canal permanente
 * de lectura de datos aunque luego se revoque para todo lo demás.
 *
 * Módulo Afiliados: si quien hace la petición es un afiliado vinculado (ver
 * afiliadoDeLaSesion), además del filtro de organización se le fuerza el de
 * su propio sales_id en companies/contacts/deals (CON_SOLO_PROPIOS) — mismo
 * mecanismo que CON_DUENO, mismo archivo. Una clave de API nunca es
 * afiliado (no representa a un usuario), así que integraciones como la de
 * diagnóstico de Kontrolia no se ven afectadas.
 *
 * Límites del plan (KontrolIA Auth): como todo alta y toda baja pasan por
 * aquí, es donde se comprueba el cupo antes de crear contactos o embudos,
 * donde se cuenta después (con el id de lo creado, para que un reintento no
 * cuente doble) y donde se libera al borrar. Ver limitesDelPuente.ts (qué
 * se cuenta) y consumo.ts (quién lo reporta).
 */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);
const CLAVE_DE_SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Tablas que este puente NO sirve nunca, pase lo que pase.
 *
 * Consulta con la clave de servicio, que salta el RLS, así que una tabla que
 * no esté aquí acaba siendo legible por cualquiera con sesión —o con clave de
 * API— aunque no tenga ni una política. `email_settings` guarda la clave del
 * proveedor de correo en claro: se gestiona solo desde
 * /api/correos/configuracion, que exige ser administrador y jamás devuelve
 * el secreto.
 */
const RECURSOS_PROHIBIDOS = new Set([
  "email_settings",
  "ai_settings",
  // Guarda el secreto con el que la base autentica el despacho de correos,
  // y ni siquiera tiene organization_id: sin esta linea el puente la
  // serviria ENTERA a cualquiera que la pidiese.
  "internal_settings",
]);

/** Tablas y vistas que pertenecen a una organización. */
const CON_DUENO = new Set([
  "automations",
  "automation_runs",
  "companies",
  "companies_summary",
  "contacts",
  "contacts_summary",
  "contact_notes",
  "deals",
  "deal_notes",
  "sales",
  "public_forms",
  "saved_views",
  "webhooks",
  "tags",
  "tasks",
  "tickets",
  "ticket_notes",
  "configuration",
  "activity_log",
  "affiliates",
  "affiliate_commissions",
  "email_templates",
  "email_outbox",
  "contracts",
  "purchases",
  "purchase_items",
  "customer_summary",
]);

/**
 * Recursos donde, si quien pregunta es un afiliado (módulo Afiliados), solo
 * debe ver y tocar lo que gestiona — su propio `sales_id`, igual que
 * cualquier responsable asignado. Ver afiliadoDeLaSesion().
 */
const CON_SOLO_PROPIOS = new Set(["companies", "contacts", "deals"]);

/**
 * Tablas con columna `sales_id`, donde el alta debe quedar a nombre de quien
 * la hace.
 *
 * La base no puede deducirlo sola: el disparador `set_sales_id_default()` mira
 * `auth.uid()`, y aqui se consulta con la clave de servicio, sin JWT de
 * usuario. Se rellena en el mismo sitio que impone `organization_id`, y por el
 * mismo motivo: este archivo es lo unico que sabe quien esta detras de la
 * peticion.
 */
const CON_RESPONSABLE = new Set([
  "companies",
  "contacts",
  "contact_notes",
  "deals",
  "deal_notes",
  "saved_views",
  "tasks",
  "tickets",
  "ticket_notes",
  "email_templates",
  "contracts",
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

  const auth = await autenticarPuente(peticion);
  if (!auth.ok) return auth.response;

  const { organizacionId, viaClaveDeApi, usuarioId } = auth;
  const origen = new URL(peticion.url);
  const recurso = ruta[ruta.length - 1];

  if (RECURSOS_PROHIBIDOS.has(recurso)) {
    return esError(404, "Recurso no disponible.");
  }

  // PostgREST permite incrustar relaciones (?select=*,sales(*)); una clave
  // de API nunca puede, para que su alcance real sea siempre el recurso de
  // la URL y no dependa de lo que ese recurso tenga como FK.
  if (viaClaveDeApi && origen.searchParams.get("select")?.includes("(")) {
    return esError(
      403,
      "Esta clave de API no puede incrustar relaciones (select con paréntesis).",
    );
  }

  // Si quien pregunta es un afiliado vinculado, además del filtro de
  // organización se le fuerza el de su propio sales_id. Para una sesión o
  // clave normal (el caso de siempre) esto resuelve a null de inmediato.
  const salesIdDelAfiliado = await afiliadoDeLaSesion(
    organizacionId,
    usuarioId,
  );

  const parametros = new URLSearchParams(origen.search);

  // El filtro de organización se impone, no se acepta del cliente: si viniera
  // uno en la petición se descarta antes de añadir el correcto.
  if (CON_DUENO.has(recurso)) {
    parametros.delete("organization_id");
    parametros.append("organization_id", `eq.${organizacionId}`);

    if (salesIdDelAfiliado != null && CON_SOLO_PROPIOS.has(recurso)) {
      parametros.delete("sales_id");
      parametros.append("sales_id", `eq.${salesIdDelAfiliado}`);
    }
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

    // La organización (y en el alta, el responsable) se imponen sobre el
    // cuerpo antes de reenviarlo. Ver imponerDueno.
    if (CON_DUENO.has(recurso) && texto) {
      // Solo en el alta: en una modificacion, quitar el responsable es una
      // decision del usuario y reponerlo aqui la desharia.
      const responsable =
        peticion.method === "POST" && CON_RESPONSABLE.has(recurso)
          ? await comercialDeLaSesion(organizacionId, usuarioId)
          : null;

      cuerpo = imponerDueno(texto, organizacionId, responsable);

      // Un afiliado no puede crear ni mover un registro fuera de lo que
      // gestiona: a diferencia de `responsable` (que solo rellena si viene
      // vacío), aquí se sobrescribe siempre `sales_id`, aunque el cliente
      // mande otro valor.
      if (salesIdDelAfiliado != null && CON_SOLO_PROPIOS.has(recurso)) {
        cuerpo = restringirAPropios(cuerpo, salesIdDelAfiliado);
      }
    }
  }

  // Límites del plan: qué va a crear esta escritura, si es que crea algo
  // cobrable, y si el plan de la organización tiene cupo para ello.
  const alta = await altaCobrable(
    peticion.method,
    recurso,
    cuerpo,
    organizacionId,
    cabeceras.get("prefer"),
  );
  if (alta) {
    const sinCupo = await exigirCupo(organizacionId, alta.clave, alta.cantidad);
    if (sinCupo) return sinCupo;
  }
  // Para contar (o liberar) con el id de cada fila hace falta que PostgREST
  // devuelva las filas. Si el cliente no lo pidió, se pide igual y se le
  // devuelve la respuesta vacía que esperaba.
  const baja = bajaCobrable(peticion.method, recurso, cabeceras.get("prefer"));
  if (
    (alta?.clave === LIMITE_CONTACTOS && !alta.pidioRepresentacion) ||
    (baja && !baja.pidioRepresentacion)
  ) {
    cabeceras.set("prefer", preferConRepresentacion(cabeceras.get("prefer")));
  }

  const destino = `${SUPABASE_URL}/${ruta.join("/")}?${parametros.toString()}`;
  const respuesta = await fetch(destino, {
    method: peticion.method,
    headers: cabeceras,
    body: cuerpo,
  });

  if (alta && respuesta.ok) {
    return contarYResponder(respuesta, alta, organizacionId);
  }
  if (baja && respuesta.ok) {
    return liberarYResponder(respuesta, baja, organizacionId);
  }

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

interface AltaCobrable {
  clave: string;
  /** Unidades que se crean (0 si la escritura solo quita). */
  cantidad: number;
  /** Ids ya conocidos (embudos); los contactos se leen de la respuesta. */
  ids: (string | number)[];
  /** Ids que la escritura libera (embudos quitados). */
  liberados: (string | number)[];
  pidioRepresentacion: boolean;
}

/** Escritura que devuelve cupo: borrar contactos. */
interface BajaCobrable {
  clave: string;
  pidioRepresentacion: boolean;
}

/**
 * Qué límite toca esta escritura y cuántas unidades, o null si ninguno.
 * Solo se molesta en mirar cuando el servidor está configurado para
 * reportar consumo; si no, el puente se comporta exactamente como antes.
 */
async function altaCobrable(
  metodo: string,
  recurso: string,
  cuerpo: string | undefined,
  organizacionId: string,
  prefer: string | null,
): Promise<AltaCobrable | null> {
  if (!limitesConfigurados() || !cuerpo) return null;

  if (metodo === "POST" && recurso === "contacts") {
    const cantidad = contactosNuevos(cuerpo);
    return cantidad > 0
      ? {
          clave: LIMITE_CONTACTOS,
          cantidad,
          ids: [],
          liberados: [],
          pidioRepresentacion: /return=representation/.test(prefer ?? ""),
        }
      : null;
  }

  if (
    (metodo === "POST" || metodo === "PATCH") &&
    recurso === "configuration"
  ) {
    const { data } = await getServiceClient()
      .from("configuration")
      .select("config")
      .eq("organization_id", organizacionId)
      .maybeSingle();
    const nuevos = embudosNuevos(cuerpo, data?.config);
    const quitados = embudosQuitados(cuerpo, data?.config);
    if (nuevos.length === 0 && quitados.length === 0) return null;
    // El embudo no tiene id propio: su valor dentro de la organización es lo
    // que lo identifica, y lo que hace idempotente el conteo.
    const idDe = (valor: string) => `${organizacionId}:${valor}`;
    return {
      clave: LIMITE_EMBUDOS,
      cantidad: nuevos.length,
      ids: nuevos.map(idDe),
      liberados: quitados.map(idDe),
      pidioRepresentacion: true,
    };
  }

  return null;
}

/** Un DELETE de contactos devuelve cupo por cada fila borrada. */
const bajaCobrable = (
  metodo: string,
  recurso: string,
  prefer: string | null,
): BajaCobrable | null =>
  limitesConfigurados() && metodo === "DELETE" && recurso === "contacts"
    ? {
        clave: LIMITE_CONTACTOS,
        pidioRepresentacion: /return=representation/.test(prefer ?? ""),
      }
    : null;

/** Añade `return=representation` a la cabecera Prefer, conservando el resto. */
const preferConRepresentacion = (prefer: string | null): string => {
  const partes = (prefer ?? "")
    .split(",")
    .map((parte) => parte.trim())
    .filter((parte) => parte && !parte.startsWith("return="));
  return [...partes, "return=representation"].join(",");
};

/**
 * Cuenta lo creado y devuelve la respuesta al cliente. Los contactos se
 * cuentan por el id que devolvió PostgREST; si el cliente no había pedido
 * las filas, se le devuelve el cuerpo vacío que esperaba.
 */
async function contarYResponder(
  respuesta: Response,
  alta: AltaCobrable,
  organizacionId: string,
): Promise<Response> {
  const cabecerasRespuesta = new Headers(respuesta.headers);
  cabecerasRespuesta.delete("content-encoding");
  cabecerasRespuesta.delete("content-length");

  const texto = await respuesta.text();
  const ids = alta.ids.length > 0 ? alta.ids : idsDe(texto);
  await Promise.all([
    ...ids.map((id) => contarUso(organizacionId, alta.clave, id)),
    ...alta.liberados.map((id) => liberarUso(organizacionId, alta.clave, id)),
  ]);

  return new Response(alta.pidioRepresentacion ? texto : null, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabecerasRespuesta,
  });
}

/** Libera el cupo de lo borrado, por el id de cada fila que devolvió PostgREST. */
async function liberarYResponder(
  respuesta: Response,
  baja: BajaCobrable,
  organizacionId: string,
): Promise<Response> {
  const cabecerasRespuesta = new Headers(respuesta.headers);
  cabecerasRespuesta.delete("content-encoding");
  cabecerasRespuesta.delete("content-length");

  const texto = await respuesta.text();
  await Promise.all(
    idsDe(texto).map((id) => liberarUso(organizacionId, baja.clave, id)),
  );

  return new Response(baja.pidioRepresentacion ? texto : null, {
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

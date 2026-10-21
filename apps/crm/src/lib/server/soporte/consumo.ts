import type { SupabaseClient } from "@supabase/supabase-js";

import { parseTicketSubject } from "@/components/crm/tickets/parseTicketSubject";
import { ORIGEN_KONTROLIA_AUTH } from "@/lib/server/integraciones/kontroliaAuth";
import { hoyEnMexico, type ResumenDeSoporte } from "@/lib/soporteTiempos";

/**
 * Servicio para que el CLIENTE vea su consumo de horas de soporte
 * (GET /api/soporte/consumo), desde la app que contrató (AduaniaX /billing).
 *
 * Quién pregunta: un usuario de la app del cliente, con SU token de KontrolIA
 * Auth. De ese token sale la organización del cliente en Auth, y con ella se
 * busca la empresa ligada (companies.source = 'kontrolia_auth',
 * external_id = organización) DENTRO de la organización de KONTROLIA en el
 * CRM, que es donde aterrizan los avisos de plataforma. El puente /api/datos
 * no sirve: filtraría por la organización del token, que es la del cliente.
 *
 * Se consulta con la clave de servicio (salta el RLS), así que TODA consulta
 * va filtrada por la organización de KONTROLIA y por esa empresa. La nota
 * interna nunca se pide a la base.
 */

/** Lo que lee AduaniaX: no cambiar sin cambiar el cliente. */
export interface ConsumoDeSoporte {
  mes: string;
  empresa: { nombre: string };
  bolsas: { slug: string; nombre: string }[];
  minutosIncluidos: number;
  minutosUsados: number;
  minutosDeMas: number;
  minutosNoConsumen: number;
  precioHoraDeMasCentavos: number | null;
  registros: RegistroParaElCliente[];
}

export interface RegistroParaElCliente {
  id: number;
  fecha: string;
  ticket: { id: number; asunto: string };
  atendio: string | null;
  descripcion: string;
  minutos: number;
  consume: boolean;
  motivoNoConsume: string | null;
  esCorreccion: boolean;
}

export interface DependenciasDeConsumo {
  /** Verifica el token contra el JWKS de KontrolIA Auth. */
  verificarToken: (
    peticion: Request,
  ) => Promise<{ organizationId?: string } | null>;
  db: SupabaseClient;
  /** Organización de KONTROLIA en el CRM (SOPORTE_ORGANIZACION_CRM_ID). */
  organizacionCrm: string | undefined;
  /** Orígenes que pueden llamar desde el navegador (SOPORTE_ORIGENES_PERMITIDOS). */
  origenesPermitidos: string[];
  ahora?: Date;
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;
const APLICACION = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** «a, b ,c» → ["a", "b", "c"]. */
export const listaDeOrigenes = (valor: string | undefined): string[] =>
  (valor ?? "")
    .split(",")
    .map((origen) => origen.trim().replace(/\/$/, ""))
    .filter(Boolean);

/**
 * CORS solo para los orígenes permitidos: a cualquier otro no se le
 * devuelve Access-Control-Allow-Origin y el navegador bloquea la lectura.
 */
export const cabecerasCors = (
  peticion: Request,
  permitidos: string[],
): Record<string, string> => {
  const origen = peticion.headers.get("origin");
  const base: Record<string, string> = { Vary: "Origin" };
  if (!origen || !permitidos.includes(origen)) return base;
  return {
    ...base,
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "600",
  };
};

export const responderPreflight = (
  peticion: Request,
  permitidos: string[],
): Response =>
  new Response(null, {
    status: 204,
    headers: cabecerasCors(peticion, permitidos),
  });

const json = (
  peticion: Request,
  permitidos: string[],
  cuerpo: unknown,
  estado = 200,
): Response =>
  Response.json(cuerpo, {
    status: estado,
    headers: {
      ...cabecerasCors(peticion, permitidos),
      // Es el consumo de una empresa: nunca en una caché compartida.
      "Cache-Control": "private, no-store",
    },
  });

/** Primer y último día (AAAA-MM-DD) de un mes AAAA-MM. */
export const limitesDelMes = (mes: string): { inicio: string; fin: string } => {
  const [anio, numero] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, numero, 0)).getUTCDate();
  return {
    inicio: `${mes}-01`,
    fin: `${mes}-${String(ultimo).padStart(2, "0")}`,
  };
};

export async function responderConsumo(
  peticion: Request,
  deps: DependenciasDeConsumo,
): Promise<Response> {
  const permitidos = deps.origenesPermitidos;
  const error = (estado: number, mensaje: string) =>
    json(peticion, permitidos, { error: mensaje }, estado);

  const sesion = await deps.verificarToken(peticion);
  if (!sesion) return error(401, "Falta el token de sesión o no es válido.");
  if (!sesion.organizationId) {
    return error(401, "El token no trae una organización activa.");
  }

  const parametros = new URL(peticion.url).searchParams;
  const mes = parametros.get("mes") ?? hoyEnMexico(deps.ahora).slice(0, 7);
  if (!MES.test(mes)) return error(400, "El mes va como AAAA-MM.");
  const aplicacion = parametros.get("aplicacion");
  if (aplicacion != null && !APLICACION.test(aplicacion)) {
    return error(400, "La aplicación no es válida.");
  }

  if (!deps.organizacionCrm) {
    return error(503, "El servicio de consumo de soporte no está configurado.");
  }
  const org = deps.organizacionCrm;
  const { db } = deps;

  const { data: empresa, error: errorEmpresa } = await db
    .from("companies")
    .select("id, name")
    .eq("organization_id", org)
    .eq("source", ORIGEN_KONTROLIA_AUTH)
    .eq("external_id", sesion.organizationId)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (errorEmpresa) return error(500, "No se pudo consultar el consumo.");
  if (!empresa) {
    return error(404, "Tu organización no tiene soporte registrado.");
  }

  const { inicio, fin } = limitesDelMes(mes);
  const [resumen, tiempos] = await Promise.all([
    db
      .rpc("soporte_resumen", { p_company_id: empresa.id, p_mes: inicio })
      .maybeSingle<ResumenDeSoporte>(),
    db
      .from("soporte_tiempos")
      // Sin nota_interna: el cliente nunca la ve.
      .select(
        "id, fecha_atencion, ticket_id, atendio, descripcion_cliente, minutos, consume, motivo_no_consume, corrige_a",
      )
      .eq("organization_id", org)
      .eq("company_id", empresa.id)
      .gte("fecha_atencion", inicio)
      .lte("fecha_atencion", fin)
      .order("fecha_atencion")
      .order("id"),
  ]);
  if (resumen.error || !resumen.data || tiempos.error) {
    return error(500, "No se pudo consultar el consumo.");
  }
  const filas = tiempos.data ?? [];

  const idsDeTickets = [...new Set(filas.map((f) => f.ticket_id))];
  const idsDeQuienAtendio = [
    ...new Set(filas.map((f) => f.atendio).filter((id) => id != null)),
  ];
  const slugs = resumen.data.bolsas ?? [];
  const [tickets, personas, bolsas] = await Promise.all([
    idsDeTickets.length
      ? db
          .from("tickets")
          .select("id, subject")
          .eq("organization_id", org)
          .in("id", idsDeTickets)
      : { data: [], error: null },
    idsDeQuienAtendio.length
      ? db
          .from("sales")
          .select("id, first_name, last_name")
          .eq("organization_id", org)
          .in("id", idsDeQuienAtendio)
      : { data: [], error: null },
    slugs.length
      ? db.from("soporte_bolsas").select("slug, nombre").in("slug", slugs)
      : { data: [], error: null },
  ]);
  if (tickets.error || personas.error || bolsas.error) {
    return error(500, "No se pudo consultar el consumo.");
  }

  const asuntoDe = new Map(
    (tickets.data ?? []).map((t) => [
      t.id as number,
      parseTicketSubject(String(t.subject ?? "")).title,
    ]),
  );
  const nombreDe = new Map(
    (personas.data ?? []).map((s) => [
      s.id as number,
      `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || null,
    ]),
  );
  const nombreDeBolsa = new Map(
    (bolsas.data ?? []).map((b) => [b.slug as string, b.nombre as string]),
  );

  const r = resumen.data;
  const cuerpo: ConsumoDeSoporte = {
    mes,
    empresa: { nombre: empresa.name },
    bolsas: slugs.map((slug) => ({
      slug,
      nombre: nombreDeBolsa.get(slug) ?? slug,
    })),
    minutosIncluidos: r.minutos_incluidos,
    minutosUsados: r.minutos_usados,
    minutosDeMas: r.minutos_de_mas,
    minutosNoConsumen: r.minutos_no_consumen,
    precioHoraDeMasCentavos: r.precio_hora_de_mas_centavos ?? null,
    registros: filas.map((f) => ({
      id: f.id,
      fecha: f.fecha_atencion,
      ticket: { id: f.ticket_id, asunto: asuntoDe.get(f.ticket_id) ?? "" },
      atendio: f.atendio != null ? (nombreDe.get(f.atendio) ?? null) : null,
      descripcion: f.descripcion_cliente,
      minutos: f.minutos,
      consume: f.consume,
      motivoNoConsume: f.motivo_no_consume ?? null,
      esCorreccion: f.corrige_a != null,
    })),
  };
  return json(peticion, permitidos, cuerpo);
}

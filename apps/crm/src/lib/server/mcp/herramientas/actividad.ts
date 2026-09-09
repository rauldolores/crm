import { z } from "zod";

import { acotarLimite, error, responder, texto } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Tareas y notas: el seguimiento del día a día.
 *
 * Las notas de contacto, de oportunidad y de ticket son tres tablas con la
 * misma forma. Se exponen como una sola herramienta con un parámetro `sobre`
 * en vez de tres: mismo alcance, un tercio de peso en el listado que el
 * agente carga en cada petición.
 */

const TABLA_DE_NOTAS: Record<string, { tabla: string; columna: string }> = {
  contacto: { tabla: "contact_notes", columna: "contact_id" },
  oportunidad: { tabla: "deal_notes", columna: "deal_id" },
  ticket: { tabla: "ticket_notes", columna: "ticket_id" },
};

export const registrarActividad: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "listar_tareas",
    {
      title: "Listar tareas",
      description:
        "Tareas de un contacto o del equipo, filtrables por tipo y estado. Responde «qué tengo pendiente», «qué vence esta semana» y «¿hay alguna reunión agendada?» (tipo=meeting). Cada fila trae total_sin_recortar, el número real de tareas que cumplen el filtro aunque la lista venga recortada.",
      inputSchema: z.object({
        estado: z
          .enum(["pendientes", "completadas", "todas"])
          .optional()
          .describe("Por defecto, pendientes."),
        contactoId: z.number().optional(),
        tipo: z
          .string()
          .optional()
          .describe(
            "Tipo de tarea: meeting (reunión), call (llamada), demo, follow-up… Los valores exactos salen de ver_configuracion.",
          ),
        responsableId: z.number().optional(),
        venceAntesDe: z
          .string()
          .optional()
          .describe("Solo las que vencen antes de esta fecha (aaaa-mm-dd)."),
        soloVencidas: z.boolean().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      estado?: "pendientes" | "completadas" | "todas";
      contactoId?: number;
      tipo?: string;
      responsableId?: number;
      venceAntesDe?: string;
      soloVencidas?: boolean;
      limite?: number;
    }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];

      const estado = args.estado ?? "pendientes";
      if (estado === "pendientes") condiciones.push("t.done_date is null");
      if (estado === "completadas") condiciones.push("t.done_date is not null");

      if (args.contactoId) {
        parametros.push(args.contactoId);
        condiciones.push(`t.contact_id = $${parametros.length}`);
      }
      if (args.tipo) {
        parametros.push(args.tipo);
        condiciones.push(`t.type = $${parametros.length}`);
      }
      if (args.responsableId) {
        parametros.push(args.responsableId);
        condiciones.push(`t.sales_id = $${parametros.length}`);
      }
      if (args.venceAntesDe) {
        parametros.push(args.venceAntesDe);
        condiciones.push(`t.due_date < $${parametros.length}::date`);
      }
      if (args.soloVencidas) {
        condiciones.push("t.due_date < now() and t.done_date is null");
      }
      parametros.push(acotarLimite(args.limite));

      return responder(
        ctx,
        `select t.id, t.text as texto, t.type as tipo, t.due_date as vence,
                t.done_date as completada, t.contact_id, t.sales_id,
                c.first_name || ' ' || coalesce(c.last_name,'') as contacto,
                count(*) over () as total_sin_recortar
           from tasks t
           left join contacts c on c.id = t.contact_id
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by t.due_date nulls last
          limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "crear_tarea",
    {
      title: "Crear una tarea",
      description:
        "Crea una tarea de seguimiento para un contacto. Sin fecha de vencimiento si no la indicas.",
      inputSchema: z.object({
        contactoId: z.number(),
        texto: z.string().describe("Qué hay que hacer."),
        tipo: z.string().optional().describe("llamada, reunión, correo…"),
        vence: z.string().optional().describe("Fecha límite, aaaa-mm-dd. Vacío = sin plazo."),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      contactoId: number;
      texto: string;
      tipo?: string;
      vence?: string;
      responsableId?: number;
    }) =>
      responder(
        ctx,
        `insert into tasks (contact_id, text, type, due_date, sales_id)
         values ($1, $2, $3, $4::date, $5)
         returning id, text, due_date`,
        [
          args.contactoId,
          args.texto,
          args.tipo ?? null,
          args.vence ?? null,
          args.responsableId ?? null,
        ],
      ),
  );

  server.registerTool(
    "completar_tarea",
    {
      title: "Completar o reabrir una tarea",
      description:
        "Marca una tarea como hecha. Con completada=false la vuelve a abrir.",
      inputSchema: z.object({
        id: z.number(),
        completada: z.boolean().optional().describe("Por defecto true."),
      }),
    },
    async (args: { id: number; completada?: boolean }) => {
      const hecha = args.completada ?? true;
      const resultado = await responder(
        ctx,
        `update tasks set done_date = ${hecha ? "now()" : "null"}
          where id = $1 returning id, text, done_date`,
        [args.id],
      );
      return resultado.isError
        ? resultado
        : texto(
            hecha
              ? `Tarea ${args.id} completada.`
              : `Tarea ${args.id} reabierta.`,
          );
    },
  );

  server.registerTool(
    "crear_nota",
    {
      title: "Añadir una nota",
      description:
        "Deja una nota de seguimiento en un contacto, una oportunidad o un ticket. Es como se registra una llamada o una reunión.",
      inputSchema: z.object({
        sobre: z
          .enum(["contacto", "oportunidad", "ticket"])
          .describe("A qué se le pone la nota."),
        id: z.number().describe("Id del contacto, oportunidad o ticket."),
        texto: z.string(),
        tipo: z
          .string()
          .optional()
          .describe("note, llamada, reunión, correo… Por defecto note."),
      }),
    },
    async (args: {
      sobre: "contacto" | "oportunidad" | "ticket";
      id: number;
      texto: string;
      tipo?: string;
    }) => {
      const destino = TABLA_DE_NOTAS[args.sobre];
      if (!destino) return error("Tipo de nota no válido.");

      return responder(
        ctx,
        `insert into ${destino.tabla} (${destino.columna}, text, type, date)
         values ($1, $2, coalesce($3, 'note'), now())
         returning id, date`,
        [args.id, args.texto, args.tipo ?? null],
      );
    },
  );

  server.registerTool(
    "listar_notas",
    {
      title: "Listar notas",
      description:
        "Historial de notas de un contacto, una oportunidad o un ticket, de la más reciente a la más antigua.",
      inputSchema: z.object({
        sobre: z.enum(["contacto", "oportunidad", "ticket"]),
        id: z.number(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      sobre: "contacto" | "oportunidad" | "ticket";
      id: number;
      limite?: number;
    }) => {
      const destino = TABLA_DE_NOTAS[args.sobre];
      if (!destino) return error("Tipo de nota no válido.");

      return responder(
        ctx,
        `select id, date as fecha, type as tipo, text as texto, sales_id
           from ${destino.tabla}
          where ${destino.columna} = $1
          order by date desc limit $2`,
        [args.id, acotarLimite(args.limite)],
      );
    },
  );

  server.registerTool(
    "historial_contacto",
    {
      title: "Historial de un contacto",
      description:
        "Todo lo que ha pasado con un contacto en una sola línea de tiempo: notas, llamadas, correos, reuniones, tareas y tickets, de lo más reciente a lo más antiguo. Responde «¿cuándo fue la última vez que hablamos?» y «¿qué ha pasado con este cliente?» sin pedir cada cosa por separado.",
      inputSchema: z.object({
        contactoId: z.number(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { contactoId: number; limite?: number }) =>
      // Se juntan las tres fuentes en la base y no en el agente: pedirlas por
      // separado serían tres viajes y él tendría que ordenarlas a mano.
      responder(
        ctx,
        `select fecha, clase, tipo, detalle, id
           from (
             select n.date as fecha, 'nota' as clase, n.type as tipo,
                    n.text as detalle, n.id
               from contact_notes n where n.contact_id = $1
             union all
             select coalesce(t.done_date, t.due_date) as fecha, 'tarea' as clase,
                    t.type as tipo,
                    t.text || case when t.done_date is null
                                   then ' (pendiente)' else ' (hecha)' end,
                    t.id
               from tasks t where t.contact_id = $1
             union all
             select k.created_at as fecha, 'ticket' as clase, k.status as tipo,
                    k.subject as detalle, k.id
               from tickets k where k.contact_id = $1
           ) historial
          where fecha is not null
          order by fecha desc
          limit $2`,
        [args.contactoId, acotarLimite(args.limite)],
      ),
  );

  server.registerTool(
    "actividad_reciente",
    {
      title: "Actividad reciente",
      description:
        "Lo último que ha pasado en el CRM: altas de contactos y empresas, oportunidades y notas. Para responder «qué se ha movido esta semana».",
      inputSchema: z.object({
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { limite?: number }) =>
      responder(
        ctx,
        `select type as tipo, date as fecha, company_id, sales_id
           from activity_log
          order by date desc limit $1`,
        [acotarLimite(args.limite)],
      ),
  );
};

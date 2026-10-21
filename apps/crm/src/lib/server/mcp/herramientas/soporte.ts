import { z } from "zod";

import {
  MOTIVOS_NO_CONSUME,
  primerError,
  registroDeTiempoSchema,
} from "@/lib/soporteTiempos";
import { acotarLimite, construirSet, error, responder } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/** Tickets de soporte: siempre cuelgan de un contacto y de su empresa. */
export const registrarSoporte: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "buscar_tickets",
    {
      title: "Buscar tickets",
      description:
        "Tickets de soporte por asunto, estado, prioridad, responsable, contacto o empresa, ordenados por última actividad. Los estados, prioridades y categorías los define cada organización (ver_configuracion).",
      inputSchema: z.object({
        texto: z.string().optional().describe("Parte del asunto o la descripción."),
        estado: z.string().optional(),
        prioridad: z.string().optional(),
        responsableId: z.number().optional(),
        contactoId: z.number().optional(),
        empresaId: z.number().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      texto?: string;
      estado?: string;
      prioridad?: string;
      responsableId?: number;
      contactoId?: number;
      empresaId?: number;
      limite?: number;
    }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];

      if (args.texto) {
        parametros.push(`%${args.texto}%`);
        const p = `$${parametros.length}`;
        condiciones.push(`(t.subject ilike ${p} or t.description ilike ${p})`);
      }
      if (args.estado) {
        parametros.push(args.estado);
        condiciones.push(`t.status = $${parametros.length}`);
      }
      if (args.prioridad) {
        parametros.push(args.prioridad);
        condiciones.push(`t.priority = $${parametros.length}`);
      }
      if (args.responsableId) {
        parametros.push(args.responsableId);
        condiciones.push(`t.sales_id = $${parametros.length}`);
      }
      if (args.contactoId) {
        parametros.push(args.contactoId);
        condiciones.push(`t.contact_id = $${parametros.length}`);
      }
      if (args.empresaId) {
        parametros.push(args.empresaId);
        condiciones.push(`t.company_id = $${parametros.length}`);
      }
      parametros.push(acotarLimite(args.limite));

      return responder(
        ctx,
        `select t.id, t.subject as asunto, t.status as estado,
                t.priority as prioridad, t.category as categoria,
                t.contact_id, t.company_id, t.sales_id, t.created_at,
                t.last_activity_at as ultima_actividad, t.closed_at as cerrado_el,
                t.due_at as vence_el, t.first_response_at as primera_respuesta_el,
                (t.status <> 'closed' and t.due_at < now()) as vencido,
                c.first_name || ' ' || coalesce(c.last_name,'') as contacto
           from tickets t
           left join contacts c on c.id = t.contact_id
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by t.last_activity_at desc limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "ver_ticket",
    {
      title: "Ver un ticket",
      description: "Detalle de un ticket con su historial de notas.",
      inputSchema: z.object({ id: z.number() }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: number }) =>
      responder(
        ctx,
        `select to_jsonb(t) as ticket,
                coalesce((
                  select jsonb_agg(jsonb_build_object(
                    'id', n.id, 'fecha', n.date, 'texto', n.text
                  ) order by n.date desc)
                  from ticket_notes n where n.ticket_id = t.id
                ), '[]'::jsonb) as notas,
                coalesce((
                  select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'fecha', s.fecha_atencion, 'minutos', s.minutos,
                    'consume', s.consume, 'motivo_no_consume', s.motivo_no_consume,
                    'descripcion_cliente', s.descripcion_cliente,
                    'nota_interna', s.nota_interna, 'atendio', s.atendio,
                    'corrige_a', s.corrige_a
                  ) order by s.created_at desc)
                  from soporte_tiempos s where s.ticket_id = t.id
                ), '[]'::jsonb) as tiempos
           from tickets t where t.id = $1`,
        [id],
      ),
  );

  server.registerTool(
    "resumen_soporte",
    {
      title: "Bolsa de soporte del mes",
      description:
        "Bolsa de horas de soporte de una empresa en un mes: minutos incluidos, usados, de más y los que no consumen (fallas del sistema, cortesías). El mes cuenta en hora de México.",
      inputSchema: z.object({
        empresaId: z.number(),
        mes: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .describe("AAAA-MM. Por defecto, el mes en curso."),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ empresaId, mes }: { empresaId: number; mes?: string }) =>
      responder(
        ctx,
        `select * from soporte_resumen($1, coalesce($2::date,
           (now() at time zone 'America/Mexico_City')::date))`,
        [empresaId, mes ? `${mes}-01` : null],
      ),
  );

  server.registerTool(
    "registrar_tiempo_soporte",
    {
      title: "Registrar tiempo de soporte",
      description:
        "Registra cuánto tiempo se dedicó a un ticket y qué se hizo. Descuenta de la bolsa de horas del cliente salvo que consume sea false (falla del sistema, cortesía). Quien registra queda como quien atendió. Los registros no se editan ni se borran.",
      inputSchema: z.object({
        ticketId: z.number(),
        minutos: z.number().describe("Minutos enteros, mayor que 0."),
        descripcionCliente: z
          .string()
          .describe("Qué se hizo, en palabras para el cliente: él lo leerá."),
        notaInterna: z
          .string()
          .optional()
          .describe("Detalle interno; el cliente nunca lo ve."),
        consume: z
          .boolean()
          .optional()
          .describe("Si descuenta de la bolsa. Por defecto, true."),
        motivoNoConsume: z
          .enum(MOTIVOS_NO_CONSUME)
          .optional()
          .describe("Obligatorio cuando consume es false."),
        fechaAtencion: z
          .string()
          .optional()
          .describe("AAAA-MM-DD en hora de México. Por defecto, hoy."),
        autorizadoPor: z
          .string()
          .optional()
          .describe("Quién del cliente autorizó la hora de más, si pasa de la bolsa."),
      }),
    },
    async (args: Record<string, unknown>) => {
      const validacion = registroDeTiempoSchema.safeParse(args);
      if (!validacion.success) return error(primerError(validacion.error));
      const r = validacion.data;
      return responder(
        ctx,
        `insert into soporte_tiempos
           (ticket_id, minutos, descripcion_cliente, nota_interna, consume,
            motivo_no_consume, fecha_atencion, autorizado_por, autorizado_en)
         values ($1, $2, $3, $4, $5, $6,
                 coalesce($7::date, (now() at time zone 'America/Mexico_City')::date),
                 $8, $9)
         returning id, ticket_id, company_id, fecha_atencion, minutos, consume`,
        [
          r.ticketId,
          r.minutos,
          r.descripcionCliente,
          r.notaInterna,
          r.consume,
          r.motivoNoConsume,
          r.fechaAtencion ?? null,
          r.autorizadoPor,
          r.autorizadoEn,
        ],
      );
    },
  );

  server.registerTool(
    "crear_ticket",
    {
      title: "Crear un ticket",
      description:
        "Abre un ticket de soporte para un contacto. La empresa se toma de la ficha del contacto si no la indicas.",
      inputSchema: z.object({
        contactoId: z.number(),
        asunto: z.string(),
        descripcion: z.string().optional(),
        estado: z.string().optional().describe("Por defecto, open."),
        prioridad: z
          .string()
          .optional()
          .describe("low | normal | high | urgent (o los valores configurados). Por defecto, normal."),
        categoria: z
          .string()
          .optional()
          .describe("Valor de las categorías configuradas (product, billing, support, sales, other…)."),
        empresaId: z.number().optional(),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      contactoId: number;
      asunto: string;
      descripcion?: string;
      estado?: string;
      prioridad?: string;
      categoria?: string;
      empresaId?: number;
      responsableId?: number;
    }) =>
      responder(
        ctx,
        `insert into tickets
           (contact_id, company_id, subject, description, status, sales_id,
            priority, category, source)
         values (
           $1,
           coalesce($2, (select company_id from contacts where id = $1)),
           $3, $4, coalesce($5, 'open'), $6,
           coalesce($7, 'normal'), $8, 'mcp'
         )
         returning id, subject, status, priority, category`,
        [
          args.contactoId,
          args.empresaId ?? null,
          args.asunto,
          args.descripcion ?? null,
          args.estado ?? null,
          args.responsableId ?? null,
          args.prioridad ?? null,
          args.categoria ?? null,
        ],
      ),
  );

  server.registerTool(
    "editar_ticket",
    {
      title: "Editar un ticket",
      description:
        "Cambia el estado, el asunto o el responsable de un ticket. Manda solo lo que cambia.",
      inputSchema: z.object({
        id: z.number(),
        estado: z.string().optional(),
        asunto: z.string().optional(),
        descripcion: z.string().optional(),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      id: number;
      estado?: string;
      asunto?: string;
      descripcion?: string;
      responsableId?: number;
    }) => {
      const { set, parametros } = construirSet({
        status: args.estado,
        subject: args.asunto,
        description: args.descripcion,
        sales_id: args.responsableId,
      });
      if (!set) return error("No indicaste ningún campo que cambiar.");

      return responder(
        ctx,
        `update tickets set ${set}, updated_at = now()
          where id = $${parametros.length + 1}
         returning id, subject, status`,
        [...parametros, args.id],
      );
    },
  );
};

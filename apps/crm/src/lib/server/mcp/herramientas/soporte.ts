import { z } from "zod";

import { acotarLimite, construirSet, error, responder } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/** Tickets de soporte: siempre cuelgan de un contacto y de su empresa. */
export const registrarSoporte: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "buscar_tickets",
    {
      title: "Buscar tickets",
      description:
        "Tickets de soporte por asunto, estado, contacto o empresa. Los estados los define cada organización (ver_configuracion).",
      inputSchema: z.object({
        texto: z.string().optional().describe("Parte del asunto o la descripción."),
        estado: z.string().optional(),
        contactoId: z.number().optional(),
        empresaId: z.number().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      texto?: string;
      estado?: string;
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
        `select t.id, t.subject as asunto, t.status as estado, t.contact_id,
                t.company_id, t.sales_id, t.created_at,
                c.first_name || ' ' || coalesce(c.last_name,'') as contacto
           from tickets t
           left join contacts c on c.id = t.contact_id
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by t.created_at desc limit $${parametros.length}`,
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
                ), '[]'::jsonb) as notas
           from tickets t where t.id = $1`,
        [id],
      ),
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
        empresaId: z.number().optional(),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      contactoId: number;
      asunto: string;
      descripcion?: string;
      estado?: string;
      empresaId?: number;
      responsableId?: number;
    }) =>
      responder(
        ctx,
        `insert into tickets
           (contact_id, company_id, subject, description, status, sales_id)
         values (
           $1,
           coalesce($2, (select company_id from contacts where id = $1)),
           $3, $4, coalesce($5, 'open'), $6
         )
         returning id, subject, status`,
        [
          args.contactoId,
          args.empresaId ?? null,
          args.asunto,
          args.descripcion ?? null,
          args.estado ?? null,
          args.responsableId ?? null,
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

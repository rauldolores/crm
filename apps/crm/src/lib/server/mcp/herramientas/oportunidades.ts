import { z } from "zod";

import { acotarLimite, construirSet, error, responder, texto } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Oportunidades (deals): el embudo de ventas.
 *
 * Las etapas y los embudos no son fijos, los define cada organización en su
 * configuración. Por eso `ver_configuracion` (en catalogos.ts) es la que le
 * dice al agente qué valores puede usar aquí.
 */

const COLUMNAS_LISTA =
  "id, name, stage, pipeline, amount, category, company_id, contact_ids, expected_closing_date, sales_id, created_at";

export const registrarOportunidades: RegistradorDeHerramientas = (
  server,
  ctx,
) => {
  server.registerTool(
    "buscar_oportunidades",
    {
      title: "Buscar oportunidades",
      description:
        "Busca oportunidades por nombre, etapa, embudo o empresa. Por defecto excluye las archivadas.",
      inputSchema: z.object({
        texto: z.string().optional().describe("Parte del nombre."),
        etapa: z.string().optional().describe("Etapa exacta del embudo."),
        embudo: z.string().optional().describe("Embudo (pipeline)."),
        empresaId: z.number().optional(),
        responsableId: z.number().optional(),
        incluirArchivadas: z.boolean().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      texto?: string;
      etapa?: string;
      embudo?: string;
      empresaId?: number;
      responsableId?: number;
      incluirArchivadas?: boolean;
      limite?: number;
    }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];

      if (!args.incluirArchivadas) condiciones.push("archived_at is null");
      if (args.texto) {
        parametros.push(`%${args.texto}%`);
        condiciones.push(`name ilike $${parametros.length}`);
      }
      if (args.etapa) {
        parametros.push(args.etapa);
        condiciones.push(`stage = $${parametros.length}`);
      }
      if (args.embudo) {
        parametros.push(args.embudo);
        condiciones.push(`pipeline = $${parametros.length}`);
      }
      if (args.empresaId) {
        parametros.push(args.empresaId);
        condiciones.push(`company_id = $${parametros.length}`);
      }
      if (args.responsableId) {
        parametros.push(args.responsableId);
        condiciones.push(`sales_id = $${parametros.length}`);
      }
      parametros.push(acotarLimite(args.limite));

      return responder(
        ctx,
        `select ${COLUMNAS_LISTA} from deals
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by created_at desc limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "ver_oportunidad",
    {
      title: "Ver una oportunidad",
      description:
        "Detalle de una oportunidad con su empresa, sus contactos y sus últimas notas.",
      inputSchema: z.object({ id: z.number() }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: number }) =>
      responder(
        ctx,
        `select
           to_jsonb(d) as oportunidad,
           (select name from companies where id = d.company_id) as empresa,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', c.id, 'nombre', c.first_name || ' ' || coalesce(c.last_name,'')
             ))
             from contacts c where c.id = any(d.contact_ids)
           ), '[]'::jsonb) as contactos,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', n.id, 'fecha', n.date, 'tipo', n.type, 'texto', n.text
             ) order by n.date desc)
             from (select * from deal_notes where deal_id = d.id
                    order by date desc limit 10) n
           ), '[]'::jsonb) as notas
         from deals d where d.id = $1`,
        [id],
      ),
  );

  server.registerTool(
    "crear_oportunidad",
    {
      title: "Crear una oportunidad",
      description:
        "Crea una oportunidad en el embudo. Consulta ver_configuracion para saber qué embudos y etapas existen.",
      inputSchema: z.object({
        nombre: z.string(),
        empresaId: z.number(),
        etapa: z.string().describe("Etapa inicial; debe existir en el embudo."),
        embudo: z.string().optional().describe("Por defecto, el embudo 'ventas'."),
        importe: z.number().optional(),
        contactoIds: z.array(z.number()).optional(),
        categoria: z.string().optional(),
        fechaDeCierre: z.string().optional().describe("Fecha prevista, aaaa-mm-dd."),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      nombre: string;
      empresaId: number;
      etapa: string;
      embudo?: string;
      importe?: number;
      contactoIds?: number[];
      categoria?: string;
      fechaDeCierre?: string;
      responsableId?: number;
    }) =>
      responder(
        ctx,
        `insert into deals
           (name, company_id, stage, pipeline, amount, contact_ids, category,
            expected_closing_date, sales_id, index)
         values ($1, $2, $3, coalesce($4, 'ventas'), coalesce($5, 0),
                 coalesce($6::bigint[], '{}'), $7,
                 coalesce($8::date, current_date), $9, 0)
         returning id, name, stage, pipeline`,
        [
          args.nombre,
          args.empresaId,
          args.etapa,
          args.embudo ?? null,
          args.importe ?? null,
          args.contactoIds ?? null,
          args.categoria ?? null,
          args.fechaDeCierre ?? null,
          args.responsableId ?? null,
        ],
      ),
  );

  server.registerTool(
    "mover_oportunidad",
    {
      title: "Mover una oportunidad de etapa",
      description:
        "Cambia la etapa de una oportunidad. Es lo que dispara las automatizaciones de «llega a una etapa» y, en el módulo Afiliados, la conversión a afiliado.",
      inputSchema: z.object({
        id: z.number(),
        etapa: z.string().describe("Etapa destino."),
        motivoDePerdida: z
          .string()
          .optional()
          .describe("Obligatorio si la etapa destino es de pérdida."),
      }),
    },
    async (args: { id: number; etapa: string; motivoDePerdida?: string }) =>
      responder(
        ctx,
        `update deals set stage = $2, loss_reason = $3, updated_at = now()
          where id = $1
         returning id, name, stage`,
        [args.id, args.etapa, args.motivoDePerdida ?? null],
      ),
  );

  server.registerTool(
    "editar_oportunidad",
    {
      title: "Editar una oportunidad",
      description:
        "Cambia los datos de una oportunidad. Para cambiar de etapa usa mover_oportunidad.",
      inputSchema: z.object({
        id: z.number(),
        nombre: z.string().optional(),
        importe: z.number().optional(),
        categoria: z.string().optional(),
        descripcion: z.string().optional(),
        fechaDeCierre: z.string().optional(),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      id: number;
      nombre?: string;
      importe?: number;
      categoria?: string;
      descripcion?: string;
      fechaDeCierre?: string;
      responsableId?: number;
    }) => {
      const { set, parametros } = construirSet({
        name: args.nombre,
        amount: args.importe,
        category: args.categoria,
        description: args.descripcion,
        expected_closing_date: args.fechaDeCierre,
        sales_id: args.responsableId,
      });
      if (!set) return error("No indicaste ningún campo que cambiar.");

      return responder(
        ctx,
        `update deals set ${set}, updated_at = now()
          where id = $${parametros.length + 1}
         returning id, name`,
        [...parametros, args.id],
      );
    },
  );

  server.registerTool(
    "archivar_oportunidad",
    {
      title: "Archivar o desarchivar una oportunidad",
      description:
        "Saca una oportunidad del tablero sin borrarla. Con archivar=false vuelve al embudo.",
      inputSchema: z.object({
        id: z.number(),
        archivar: z.boolean().optional().describe("Por defecto true."),
      }),
    },
    async (args: { id: number; archivar?: boolean }) => {
      const archivar = args.archivar ?? true;
      const resultado = await responder(
        ctx,
        `update deals set archived_at = ${archivar ? "now()" : "null"}
          where id = $1 returning id, name, archived_at`,
        [args.id],
      );
      return resultado.isError
        ? resultado
        : texto(
            archivar
              ? `Oportunidad ${args.id} archivada.`
              : `Oportunidad ${args.id} devuelta al embudo.`,
          );
    },
  );

  server.registerTool(
    "resumen_del_embudo",
    {
      title: "Resumen del embudo",
      description:
        "Cuántas oportunidades y cuánto importe hay en cada etapa. Para responder «cómo va el embudo» sin traerse las oportunidades una por una.",
      inputSchema: z.object({
        embudo: z.string().optional().describe("Por defecto, todos."),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { embudo?: string }) =>
      responder(
        ctx,
        `select pipeline as embudo, stage as etapa,
                count(*) as oportunidades,
                sum(coalesce(amount, 0)) as importe_total
           from deals
          where archived_at is null
            and ($1::text is null or pipeline = $1)
          group by pipeline, stage
          order by pipeline, importe_total desc`,
        [args.embudo ?? null],
      ),
  );
};

import { z } from "zod";

import { acotarLimite, responder, texto } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Módulo Clientes: lo que ha comprado y tiene contratado cada empresa.
 *
 * Responde «¿cuánto vale este cliente?», «¿a quién le vence algo este
 * mes?» y «¿quién tiene X pero no Y?» — la pregunta que permite vender más.
 */
export const registrarClientes: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "ver_cliente",
    {
      title: "Ver qué ha hecho un cliente",
      description:
        "Resumen comercial de una empresa como cliente: total comprado, compras, contratos activos, importe recurrente y próxima renovación, más la lista de contratos y las últimas compras con sus líneas.",
      inputSchema: z.object({
        empresaId: z.number(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ empresaId }: { empresaId: number }) =>
      responder(
        ctx,
        `select
           to_jsonb(s) as resumen,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', k.id, 'nombre', k.name, 'estado', k.status,
               'periodicidad', k.billing_period, 'importe', k.amount,
               'renueva_el', k.renews_on, 'origen', k.source
             ) order by k.renews_on nulls last)
             from contracts k where k.company_id = s.id
           ), '[]'::jsonb) as contratos,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', p.id, 'fecha', p.purchased_on, 'referencia', p.reference,
               'importe', p.amount, 'estado', p.status, 'origen', p.source,
               'lineas', (
                 select coalesce(jsonb_agg(jsonb_build_object(
                   'descripcion', i.description, 'producto', i.product_ref,
                   'cantidad', i.quantity, 'importe', i.amount
                 )), '[]'::jsonb)
                 from purchase_items i where i.purchase_id = p.id
               )
             ) order by p.purchased_on desc)
             from (select * from purchases where company_id = s.id
                    order by purchased_on desc limit 20) p
           ), '[]'::jsonb) as compras
         from customer_summary s where s.id = $1`,
        [empresaId],
      ),
  );

  server.registerTool(
    "listar_clientes",
    {
      title: "Listar clientes",
      description:
        "Empresas ordenadas por lo que han comprado, con su etapa (prospecto, cliente activo, en riesgo, perdido), total comprado, importe recurrente y próxima renovación.",
      inputSchema: z.object({
        etapa: z.string().optional().describe("prospect, customer, at-risk, churned."),
        soloConContratoActivo: z.boolean().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      etapa?: string;
      soloConContratoActivo?: boolean;
      limite?: number;
    }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];
      if (args.etapa) {
        parametros.push(args.etapa);
        condiciones.push(`lifecycle_stage = $${parametros.length}`);
      }
      if (args.soloConContratoActivo) condiciones.push("nb_active_contracts > 0");
      parametros.push(acotarLimite(args.limite));

      return responder(
        ctx,
        `select id, name as empresa, lifecycle_stage as etapa,
                nb_purchases as compras, total_spent as total_comprado,
                nb_active_contracts as contratos_activos,
                recurring_amount as recurrente, next_renewal_on as proxima_renovacion,
                last_purchase_on as ultima_compra
           from customer_summary
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by total_spent desc
          limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "renovaciones_proximas",
    {
      title: "Renovaciones próximas",
      description:
        "Contratos activos que vencen o renuevan en los próximos N días, con la empresa. Para saber a quién hay que llamar antes de que se le acabe.",
      inputSchema: z.object({
        dias: z.number().optional().describe("Por defecto 30."),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { dias?: number; limite?: number }) =>
      responder(
        ctx,
        `select k.id, k.name as contrato, e.name as empresa, e.id as empresa_id,
                k.amount as importe, k.billing_period as periodicidad,
                k.renews_on as renueva_el, k.auto_renew as renovacion_automatica,
                (k.renews_on - current_date) as dias_restantes
           from contracts k
           join companies e on e.id = k.company_id
          where k.status = 'active'
            and k.renews_on is not null
            and k.renews_on <= current_date + $1
          order by k.renews_on
          limit $2`,
        [args.dias ?? 30, acotarLimite(args.limite)],
      ),
  );

  server.registerTool(
    "clientes_por_producto",
    {
      title: "Quién compró qué",
      description:
        "Empresas que han comprado un producto (por su referencia o parte de su descripción), y opcionalmente las que NO han comprado otro. Es la consulta para vender más: «quién tiene el plan básico pero no el módulo de reportes».",
      inputSchema: z.object({
        compraron: z
          .string()
          .describe("Referencia del producto o parte de la descripción."),
        peroNo: z
          .string()
          .optional()
          .describe("Excluye a quienes también compraron este."),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { compraron: string; peroNo?: string; limite?: number }) =>
      responder(
        ctx,
        `with con as (
           select distinct p.company_id
             from purchase_items i join purchases p on p.id = i.purchase_id
            where p.status <> 'cancelled'
              and (i.product_ref = $1 or i.description ilike '%' || $1 || '%')
         ),
         sin as (
           select distinct p.company_id
             from purchase_items i join purchases p on p.id = i.purchase_id
            where $2::text is not null
              and p.status <> 'cancelled'
              and (i.product_ref = $2 or i.description ilike '%' || $2 || '%')
         )
         select e.id, e.name as empresa, s.lifecycle_stage as etapa,
                s.total_spent as total_comprado, s.last_purchase_on as ultima_compra
           from con
           join companies e on e.id = con.company_id
           left join customer_summary s on s.id = e.id
          where $2::text is null or con.company_id not in (select company_id from sin)
          order by s.total_spent desc nulls last
          limit $3`,
        [args.compraron, args.peroNo ?? null, acotarLimite(args.limite)],
      ),
  );

  server.registerTool(
    "cambiar_etapa_de_cliente",
    {
      title: "Cambiar la etapa de un cliente",
      description:
        "Mueve una empresa entre prospecto, cliente activo, en riesgo y perdido. Los valores exactos están en ver_configuracion (customerStages).",
      inputSchema: z.object({
        empresaId: z.number(),
        etapa: z.string(),
      }),
    },
    async (args: { empresaId: number; etapa: string }) => {
      const resultado = await responder(
        ctx,
        "update companies set lifecycle_stage = $2 where id = $1 returning id, name, lifecycle_stage",
        [args.empresaId, args.etapa],
      );
      return resultado.isError
        ? resultado
        : texto(`Empresa ${args.empresaId} ahora en etapa «${args.etapa}».`);
    },
  );
};

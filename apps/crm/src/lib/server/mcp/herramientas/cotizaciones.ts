import { z } from "zod";

import { cotizacionPorId } from "../../cotizaciones/cotizaciones";
import { enviarCotizacion } from "../../cotizaciones/enviar";
import {
  acotarLimite,
  ejecutar,
  error,
  filas,
  organizacionDelContexto,
  responder,
  texto,
} from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Cotizaciones: crear, ver, listar y enviar el documento comercial de una
 * oportunidad. Las líneas van con su precio e IVA; los totales los calcula
 * la base al insertar las líneas, así que el agente nunca los inventa.
 */

const Linea = z.object({
  concepto: z.string(),
  cantidad: z.number().positive().optional().describe("Por defecto 1."),
  precio: z.number().nonnegative().describe("Precio unitario sin IVA."),
  descuentoPct: z.number().min(0).max(100).optional(),
  ivaPct: z.number().min(0).optional().describe("Por defecto el de la organización (16)."),
});

export const registrarCotizaciones: RegistradorDeHerramientas = (
  server,
  ctx,
) => {
  server.registerTool(
    "listar_cotizaciones",
    {
      title: "Listar cotizaciones",
      description:
        "Cotizaciones de la organización, con folio, estado, total y a qué oportunidad y empresa pertenecen. Filtra por oportunidad o por estado (draft, sent, viewed, accepted, rejected, expired).",
      inputSchema: z.object({
        oportunidadId: z.number().optional(),
        estado: z.string().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { oportunidadId?: number; estado?: string; limite?: number }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];
      if (args.oportunidadId) {
        parametros.push(args.oportunidadId);
        condiciones.push(`q.deal_id = $${parametros.length}`);
      }
      if (args.estado) {
        parametros.push(args.estado);
        condiciones.push(`q.status = $${parametros.length}`);
      }
      parametros.push(acotarLimite(args.limite));
      return responder(
        ctx,
        `select q.id, q.number as folio, q.title as titulo, q.status as estado,
                q.total, q.currency as moneda, q.valid_until as vence,
                q.deal_id, q.company_id, c.name as empresa,
                q.sent_at as enviada, q.viewed_at as vista, q.accepted_at as aceptada
           from quotes q
           left join companies c on c.id = q.company_id
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by q.created_at desc
          limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "ver_cotizacion",
    {
      title: "Ver una cotización",
      description:
        "La cotización completa: cabecera, líneas con importes, totales, condiciones, estado y su enlace público.",
      inputSchema: z.object({ id: z.number() }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: number }) =>
      responder(
        ctx,
        `select to_jsonb(q) as cotizacion,
                coalesce((select jsonb_agg(to_jsonb(i) order by i.position, i.id)
                            from quote_items i where i.quote_id = q.id), '[]'::jsonb) as lineas,
                '/cotizacion/' || q.public_token as enlace_relativo
           from quotes q where q.id = $1`,
        [id],
      ),
  );

  server.registerTool(
    "crear_cotizacion",
    {
      title: "Crear una cotización",
      description:
        "Crea una cotización para una oportunidad, con sus líneas. Toma la empresa y el primer contacto de la oportunidad. Queda en borrador: para mandarla usa enviar_cotizacion. Con periodicidad (monthly, quarterly, yearly), al aceptarse nace un contrato; sin ella, una compra.",
      inputSchema: z.object({
        oportunidadId: z.number(),
        titulo: z.string(),
        lineas: z.array(Linea).min(1),
        vigenciaDias: z.number().int().positive().optional().describe("Por defecto 30."),
        periodicidad: z.enum(["monthly", "quarterly", "yearly"]).optional(),
        condiciones: z.string().optional().describe("Alcance, forma de pago, plazos."),
        moneda: z.string().optional(),
      }),
    },
    async (args: {
      oportunidadId: number;
      titulo: string;
      lineas: z.infer<typeof Linea>[];
      vigenciaDias?: number;
      periodicidad?: "monthly" | "quarterly" | "yearly";
      condiciones?: string;
      moneda?: string;
    }) => {
      const oportunidad = await ejecutar<{
        company_id: number | null;
        contact_ids: number[] | null;
      }>(ctx, `select company_id, contact_ids from deals where id = $1`, [
        args.oportunidadId,
      ]);
      if (!oportunidad.ok) return error(oportunidad.error);
      if (!oportunidad.filas[0]) return error("La oportunidad no existe.");

      const iva = await ejecutar<{ iva: number | null }>(
        ctx,
        `select (config ->> 'quoteTaxRate')::numeric as iva from configuration limit 1`,
      );
      const ivaPorDefecto =
        iva.ok && iva.filas[0]?.iva != null ? Number(iva.filas[0].iva) : 16;

      const creada = await ejecutar<{ id: number; number: string }>(
        ctx,
        `insert into quotes (deal_id, company_id, contact_id, title, currency, valid_until, contract_period, notes)
         values ($1, $2, $3, $4, coalesce($5, 'MXN'),
                 current_date + ($6::int || ' days')::interval, $7, $8)
         returning id, number`,
        [
          args.oportunidadId,
          oportunidad.filas[0].company_id,
          oportunidad.filas[0].contact_ids?.[0] ?? null,
          args.titulo,
          args.moneda ?? null,
          args.vigenciaDias ?? 30,
          args.periodicidad ?? null,
          args.condiciones ?? null,
        ],
      );
      if (!creada.ok) return error(creada.error);
      const cotizacion = creada.filas[0];

      for (const [indice, linea] of args.lineas.entries()) {
        const insertada = await ejecutar(
          ctx,
          `insert into quote_items (quote_id, position, description, quantity, unit_price, discount_pct, tax_rate)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            cotizacion.id,
            indice,
            linea.concepto,
            linea.cantidad ?? 1,
            linea.precio,
            linea.descuentoPct ?? 0,
            linea.ivaPct ?? ivaPorDefecto,
          ],
        );
        if (!insertada.ok) return error(insertada.error);
      }

      const totales = await ejecutar<{ subtotal: number; tax_total: number; total: number }>(
        ctx,
        `select subtotal, tax_total, total from quotes where id = $1`,
        [cotizacion.id],
      );
      return filas([
        {
          id: cotizacion.id,
          folio: cotizacion.number,
          ...(totales.ok ? totales.filas[0] : {}),
        },
      ]);
    },
  );

  server.registerTool(
    "enviar_cotizacion",
    {
      title: "Enviar una cotización por correo",
      description:
        "Manda la cotización con su enlace público para verla y aceptarla. Por defecto al correo del contacto de la oportunidad; con `para` a otra dirección. Requiere correo saliente configurado.",
      inputSchema: z.object({
        id: z.number(),
        para: z.string().email().optional(),
        mensaje: z.string().optional().describe("Un par de líneas que acompañan el enlace."),
      }),
    },
    async (args: { id: number; para?: string; mensaje?: string }) => {
      const organizacion = organizacionDelContexto(ctx);
      if (!organizacion) return error("El token no tiene organización activa.");
      if (!ctx.baseUrl) return error("El servidor no conoce su propia URL.");

      const completa = await cotizacionPorId(organizacion, args.id);
      if (!completa) return error("La cotización no existe.");

      const resultado = await enviarCotizacion(completa, {
        origen: ctx.baseUrl,
        para: args.para,
        mensaje: args.mensaje,
      });
      return resultado.ok
        ? texto(`Cotización ${completa.cotizacion.number} enviada a ${resultado.para}. Enlace: ${resultado.enlace}`)
        : error(resultado.mensaje);
    },
  );
};

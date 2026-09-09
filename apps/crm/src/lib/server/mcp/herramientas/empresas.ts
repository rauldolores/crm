import { z } from "zod";

import { acotarLimite, construirSet, error, responder } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Empresas. Los listados salen de `companies_summary`, que ya trae los
 * recuentos de contactos y oportunidades.
 */

const COLUMNAS_LISTA =
  "id, name, sector, size, city, country, website, phone_number, nb_contacts, nb_deals, sales_id";

export const registrarEmpresas: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "buscar_empresas",
    {
      title: "Buscar empresas",
      description:
        "Busca empresas por nombre, sector o ciudad. Para el detalle con sus contactos y oportunidades usa ver_empresa.",
      inputSchema: z.object({
        texto: z.string().optional().describe("Nombre, sector o ciudad."),
        sector: z.string().optional(),
        responsableId: z.number().optional().describe("Solo las de este comercial."),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      texto?: string;
      sector?: string;
      responsableId?: number;
      limite?: number;
    }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];

      if (args.texto) {
        parametros.push(`%${args.texto}%`);
        const p = `$${parametros.length}`;
        condiciones.push(`(name ilike ${p} or sector ilike ${p} or city ilike ${p})`);
      }
      if (args.sector) {
        parametros.push(args.sector);
        condiciones.push(`sector = $${parametros.length}`);
      }
      if (args.responsableId) {
        parametros.push(args.responsableId);
        condiciones.push(`sales_id = $${parametros.length}`);
      }
      parametros.push(acotarLimite(args.limite));

      return responder(
        ctx,
        `select ${COLUMNAS_LISTA} from companies_summary
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by name limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "ver_empresa",
    {
      title: "Ver una empresa",
      description:
        "Ficha completa de una empresa con sus contactos y sus oportunidades abiertas.",
      inputSchema: z.object({ id: z.number() }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: number }) =>
      responder(
        ctx,
        `select
           to_jsonb(e) as empresa,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', c.id, 'nombre', c.first_name || ' ' || coalesce(c.last_name,''),
               'puesto', c.title, 'estado', c.status
             ))
             from contacts c where c.company_id = e.id
           ), '[]'::jsonb) as contactos,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', d.id, 'nombre', d.name, 'etapa', d.stage,
               'embudo', d.pipeline, 'importe', d.amount
             ))
             from deals d where d.company_id = e.id and d.archived_at is null
           ), '[]'::jsonb) as oportunidades
         from companies_summary e where e.id = $1`,
        [id],
      ),
  );

  server.registerTool(
    "crear_empresa",
    {
      title: "Crear una empresa",
      description: "Da de alta una empresa.",
      inputSchema: z.object({
        nombre: z.string(),
        sector: z.string().optional(),
        sitioWeb: z.string().optional(),
        telefono: z.string().optional(),
        ciudad: z.string().optional(),
        pais: z.string().optional(),
        tamano: z.number().optional().describe("Número de empleados (1, 10, 50, 250, 500)."),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      nombre: string;
      sector?: string;
      sitioWeb?: string;
      telefono?: string;
      ciudad?: string;
      pais?: string;
      tamano?: number;
      responsableId?: number;
    }) =>
      responder(
        ctx,
        `insert into companies
           (name, sector, website, phone_number, city, country, size, sales_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id, name`,
        [
          args.nombre,
          args.sector ?? null,
          args.sitioWeb ?? null,
          args.telefono ?? null,
          args.ciudad ?? null,
          args.pais ?? null,
          args.tamano ?? null,
          args.responsableId ?? null,
        ],
      ),
  );

  server.registerTool(
    "editar_empresa",
    {
      title: "Editar una empresa",
      description: "Cambia los datos de una empresa. Manda solo lo que cambia.",
      inputSchema: z.object({
        id: z.number(),
        nombre: z.string().optional(),
        sector: z.string().optional(),
        sitioWeb: z.string().optional(),
        telefono: z.string().optional(),
        ciudad: z.string().optional(),
        pais: z.string().optional(),
        descripcion: z.string().optional(),
        responsableId: z.number().optional(),
      }),
    },
    async (args: {
      id: number;
      nombre?: string;
      sector?: string;
      sitioWeb?: string;
      telefono?: string;
      ciudad?: string;
      pais?: string;
      descripcion?: string;
      responsableId?: number;
    }) => {
      const { set, parametros } = construirSet({
        name: args.nombre,
        sector: args.sector,
        website: args.sitioWeb,
        phone_number: args.telefono,
        city: args.ciudad,
        country: args.pais,
        description: args.descripcion,
        sales_id: args.responsableId,
      });
      if (!set) return error("No indicaste ningún campo que cambiar.");

      return responder(
        ctx,
        `update companies set ${set} where id = $${parametros.length + 1}
         returning id, name`,
        [...parametros, args.id],
      );
    },
  );
};

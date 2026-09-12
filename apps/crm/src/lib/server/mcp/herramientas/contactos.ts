import { z } from "zod";

import {
  contarUso,
  exigirCupo,
  LIMITE_CONTACTOS,
} from "@/lib/server/kontrolia-auth/consumo";
import {
  acotarLimite,
  construirSet,
  ejecutar,
  error,
  filas,
  organizacionDelContexto,
  responder,
  texto,
} from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Contactos: buscar, ver, crear, editar y etiquetar.
 *
 * Las listas salen de `contacts_summary`, la vista que ya trae el nombre de
 * la empresa y el recuento de tareas: sin ella el agente tendría que hacer
 * el JOIN a mano o pedir dos veces.
 */

/** Columnas de una ficha en un listado. Se acotan a propósito: devolver las
 *  19 columnas de cada contacto multiplica los tokens sin aportar. */
const COLUMNAS_LISTA =
  "id, first_name, last_name, title, company_name, company_id, status, email_fts, phone_fts, last_seen, sales_id";

export const registrarContactos: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "buscar_contactos",
    {
      title: "Buscar contactos",
      description:
        "Busca contactos por nombre, correo, teléfono o empresa. Devuelve los datos principales de cada uno. Para el detalle completo usa ver_contacto.",
      inputSchema: z.object({
        texto: z
          .string()
          .optional()
          .describe("Nombre, correo, teléfono o empresa. Vacío = los más recientes."),
        estado: z
          .string()
          .optional()
          .describe("Filtra por estado del contacto (hot, warm, cold…)."),
        empresaId: z.number().optional().describe("Solo los de esta empresa."),
        responsableId: z
          .number()
          .optional()
          .describe("Solo los que gestiona este comercial (sales_id)."),
        limite: z.number().optional().describe("Máximo de resultados (por defecto 25)."),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: {
      texto?: string;
      estado?: string;
      empresaId?: number;
      responsableId?: number;
      limite?: number;
    }) => {
      const condiciones: string[] = [];
      const parametros: unknown[] = [];

      if (args.texto) {
        parametros.push(`%${args.texto}%`);
        const p = `$${parametros.length}`;
        condiciones.push(
          `(first_name ilike ${p} or last_name ilike ${p} or company_name ilike ${p} or email_fts ilike ${p} or phone_fts ilike ${p})`,
        );
      }
      if (args.estado) {
        parametros.push(args.estado);
        condiciones.push(`status = $${parametros.length}`);
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
        `select ${COLUMNAS_LISTA} from contacts_summary
          ${condiciones.length ? "where " + condiciones.join(" and ") : ""}
          order by last_seen desc nulls last
          limit $${parametros.length}`,
        parametros,
      );
    },
  );

  server.registerTool(
    "ver_contacto",
    {
      title: "Ver un contacto",
      description:
        "Devuelve la ficha completa de un contacto: todos sus datos, campos personalizados, sus últimas notas y sus tareas pendientes.",
      inputSchema: z.object({
        id: z.number().describe("Identificador del contacto."),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: number }) => {
      // Una sola ida a la base: ficha, notas y tareas en un objeto. Pedirlas
      // por separado serían tres viajes para lo que el agente pide como uno.
      return responder(
        ctx,
        `select
           to_jsonb(c) - 'email_fts' - 'phone_fts' as contacto,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', n.id, 'fecha', n.date, 'tipo', n.type, 'texto', n.text
             ) order by n.date desc)
             from (select * from contact_notes where contact_id = c.id
                    order by date desc limit 10) n
           ), '[]'::jsonb) as notas,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'id', t.id, 'texto', t.text, 'tipo', t.type, 'vence', t.due_date
             ) order by t.due_date nulls last)
             from tasks t where t.contact_id = c.id and t.done_date is null
           ), '[]'::jsonb) as tareas_pendientes
         from contacts_summary c
         where c.id = $1`,
        [id],
      );
    },
  );

  server.registerTool(
    "crear_contacto",
    {
      title: "Crear un contacto",
      description:
        "Da de alta un contacto. Si indicas empresa, debe existir: usa buscar_empresas o crear_empresa antes.",
      inputSchema: z.object({
        nombre: z.string().describe("Nombre de pila."),
        apellidos: z.string().optional(),
        correo: z.string().optional().describe("Correo principal."),
        telefono: z.string().optional().describe("Teléfono principal."),
        puesto: z.string().optional(),
        empresaId: z.number().optional(),
        estado: z.string().optional().describe("hot, warm, cold…"),
        responsableId: z.number().optional().describe("Comercial que lo gestiona."),
      }),
    },
    async (args: {
      nombre: string;
      apellidos?: string;
      correo?: string;
      telefono?: string;
      puesto?: string;
      empresaId?: number;
      estado?: string;
      responsableId?: number;
    }) => {
      // Límite del plan: se comprueba antes y se cuenta después, con el id
      // del contacto creado, igual que en el puente /api/datos.
      const organizacion = organizacionDelContexto(ctx);
      if (organizacion) {
        const sinCupo = await exigirCupo(organizacion, LIMITE_CONTACTOS);
        if (sinCupo) {
          const { message } = (await sinCupo.json()) as { message: string };
          return error(message);
        }
      }

      const resultado = await ejecutar<{ id: number }>(
        ctx,
        `insert into contacts
           (first_name, last_name, title, company_id, status, sales_id,
            email_jsonb, phone_jsonb, first_seen, last_seen)
         values ($1, $2, $3, $4, $5, $6,
            case when $7::text is null then '[]'::jsonb
                 else jsonb_build_array(jsonb_build_object('email', $7::text, 'type', 'Work')) end,
            case when $8::text is null then '[]'::jsonb
                 else jsonb_build_array(jsonb_build_object('number', $8::text, 'type', 'Work')) end,
            now(), now())
         returning id, first_name, last_name, company_id`,
        [
          args.nombre,
          args.apellidos ?? null,
          args.puesto ?? null,
          args.empresaId ?? null,
          args.estado ?? null,
          args.responsableId ?? null,
          args.correo ?? null,
          args.telefono ?? null,
        ],
      );
      if (!resultado.ok) return error(resultado.error);

      if (organizacion && resultado.filas[0]) {
        await contarUso(organizacion, LIMITE_CONTACTOS, resultado.filas[0].id);
      }
      return filas(resultado.filas);
    },
  );

  server.registerTool(
    "editar_contacto",
    {
      title: "Editar un contacto",
      description:
        "Cambia los datos de un contacto. Manda solo los campos que quieras cambiar; el resto se queda como está.",
      inputSchema: z.object({
        id: z.number(),
        nombre: z.string().optional(),
        apellidos: z.string().optional(),
        puesto: z.string().optional(),
        empresaId: z.number().optional(),
        estado: z.string().optional(),
        responsableId: z.number().optional(),
        antecedentes: z.string().optional().describe("Notas de contexto de la ficha."),
      }),
    },
    async (args: {
      id: number;
      nombre?: string;
      apellidos?: string;
      puesto?: string;
      empresaId?: number;
      estado?: string;
      responsableId?: number;
      antecedentes?: string;
    }) => {
      const { set, parametros } = construirSet({
        first_name: args.nombre,
        last_name: args.apellidos,
        title: args.puesto,
        company_id: args.empresaId,
        status: args.estado,
        sales_id: args.responsableId,
        background: args.antecedentes,
      });

      if (!set) return error("No indicaste ningún campo que cambiar.");

      return responder(
        ctx,
        `update contacts set ${set} where id = $${parametros.length + 1}
         returning id, first_name, last_name`,
        [...parametros, args.id],
      );
    },
  );

  server.registerTool(
    "etiquetar_contacto",
    {
      title: "Etiquetar un contacto",
      description:
        "Añade o quita etiquetas de un contacto. Las etiquetas se listan con listar_etiquetas.",
      inputSchema: z.object({
        id: z.number(),
        anadir: z.array(z.number()).optional().describe("Ids de etiqueta a añadir."),
        quitar: z.array(z.number()).optional().describe("Ids de etiqueta a quitar."),
      }),
    },
    async (args: { id: number; anadir?: number[]; quitar?: number[] }) => {
      if (!args.anadir?.length && !args.quitar?.length) {
        return error("Indica qué etiquetas añadir o quitar.");
      }
      // Se recalcula el arreglo entero en la base para no perder cambios de
      // otro usuario entre la lectura y la escritura.
      return responder(
        ctx,
        `update contacts
            set tags = (
              select coalesce(array_agg(distinct t), '{}')
                from unnest(
                  coalesce(tags, '{}') || coalesce($2::bigint[], '{}')
                ) as t
               where t <> all(coalesce($3::bigint[], '{}'))
            )
          where id = $1
          returning id, tags`,
        [args.id, args.anadir ?? null, args.quitar ?? null],
      );
    },
  );

  server.registerTool(
    "fusionar_contactos",
    {
      title: "Fusionar dos contactos",
      description:
        "Fusiona un contacto duplicado dentro de otro. El primero se ELIMINA y sus notas, tareas y oportunidades pasan al segundo. No se puede deshacer.",
      inputSchema: z.object({
        idQueDesaparece: z.number().describe("Contacto duplicado; se elimina."),
        idQueSeQueda: z.number().describe("Contacto que conserva todo."),
      }),
      annotations: { destructiveHint: true },
    },
    async (args: { idQueDesaparece: number; idQueSeQueda: number }) => {
      if (args.idQueDesaparece === args.idQueSeQueda) {
        return error("Son el mismo contacto.");
      }
      const resultado = await responder(
        ctx,
        "select crm.merge_contacts($1, $2) as resultado",
        [args.idQueDesaparece, args.idQueSeQueda],
      );
      return resultado.isError
        ? resultado
        : texto(`Contactos fusionados en el ${args.idQueSeQueda}.`);
    },
  );
};

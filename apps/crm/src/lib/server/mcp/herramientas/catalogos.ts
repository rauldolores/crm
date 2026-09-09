import { z } from "zod";

import { responder } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Catálogos: lo que el agente necesita saber ANTES de escribir.
 *
 * Las etapas, los embudos, los estados de ticket y los campos personalizados
 * no son fijos: cada organización los define en `configuration.config`. Sin
 * esta información, el agente inventaría una etapa que no existe. Es el
 * sustituto acotado de `get_schema`: unos cientos de tokens en vez de cuatro
 * mil, y solo lo que de verdad hace falta para operar.
 */
export const registrarCatalogos: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "ver_configuracion",
    {
      title: "Ver la configuración del CRM",
      description:
        "Qué embudos y etapas existen, los estados de contacto y de ticket, los tipos de tarea y los campos personalizados definidos. Consúltalo antes de crear o mover una oportunidad, o de rellenar un campo personalizado.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () =>
      responder(
        ctx,
        `select
           config -> 'dealPipelines' as embudos,
           config -> 'dealCategories' as categorias_de_oportunidad,
           config -> 'dealLossReasons' as motivos_de_perdida,
           config -> 'contactStatuses' as estados_de_contacto,
           config -> 'ticketStatuses' as estados_de_ticket,
           config -> 'taskTypes' as tipos_de_tarea,
           config -> 'noteTypes' as tipos_de_nota,
           config -> 'companySectors' as sectores,
           config -> 'contactCustomFields' as campos_de_contacto,
           config -> 'companyCustomFields' as campos_de_empresa,
           config -> 'dealCustomFields' as campos_de_oportunidad,
           config -> 'modules' as modulos
         from configuration limit 1`,
      ),
  );

  server.registerTool(
    "listar_equipo",
    {
      title: "Listar el equipo",
      description:
        "Comerciales de la organización con su id, que es el que piden los campos «responsable» del resto de herramientas.",
      inputSchema: z.object({
        incluirDesactivados: z.boolean().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { incluirDesactivados?: boolean }) =>
      responder(
        ctx,
        `select id, first_name as nombre, last_name as apellidos, email,
                administrator as es_administrador, disabled as desactivado
           from sales
          ${args.incluirDesactivados ? "" : "where disabled = false"}
          order by last_name`,
      ),
  );

  server.registerTool(
    "listar_etiquetas",
    {
      title: "Listar etiquetas",
      description:
        "Etiquetas disponibles para los contactos, con su id y su color.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => responder(ctx, "select id, name as nombre, color from tags order by name"),
  );

  server.registerTool(
    "crear_etiqueta",
    {
      title: "Crear una etiqueta",
      description: "Crea una etiqueta nueva para poder aplicarla a contactos.",
      inputSchema: z.object({
        nombre: z.string(),
        color: z.string().optional().describe("Color hexadecimal, por ejemplo #f59e0b."),
      }),
    },
    async (args: { nombre: string; color?: string }) =>
      responder(
        ctx,
        `insert into tags (name, color) values ($1, coalesce($2, '#94a3b8'))
         returning id, name, color`,
        [args.nombre, args.color ?? null],
      ),
  );
};

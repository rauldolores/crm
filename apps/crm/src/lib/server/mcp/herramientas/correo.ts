import { z } from "zod";

import { acotarLimite, responder, texto } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Correo: plantillas y estado de los envíos.
 *
 * Enviar un correo NO se hace aquí. El envío pasa por el proveedor
 * configurado de la organización y por el armazón de diseño, que viven en la
 * aplicación (/api/correos/enviar y plantillaBase.ts). Desde SQL solo se
 * puede encolar, así que `encolar_correo_de_plantilla` deja la fila en
 * `email_outbox` y el despachador de siempre lo manda en menos de un minuto,
 * con sus reintentos y su nota en la ficha. Duplicar el envío aquí daría dos
 * caminos que se comportan distinto.
 */
export const registrarCorreo: RegistradorDeHerramientas = (server, ctx) => {
  server.registerTool(
    "listar_plantillas_de_correo",
    {
      title: "Listar plantillas de correo",
      description:
        "Plantillas disponibles, con su asunto. El id es el que pide encolar_correo_de_plantilla y la acción de correo de las automatizaciones.",
      inputSchema: z.object({
        incluirInactivas: z.boolean().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { incluirInactivas?: boolean }) =>
      responder(
        ctx,
        `select id, name as nombre, subject as asunto, active as activa,
                cta_text as texto_del_boton, updated_at
           from email_templates
          ${args.incluirInactivas ? "" : "where active = true"}
          order by name`,
      ),
  );

  server.registerTool(
    "ver_plantilla_de_correo",
    {
      title: "Ver una plantilla de correo",
      description:
        "Contenido completo de una plantilla, incluidos los campos de fusión que usa y su diseño.",
      inputSchema: z.object({ id: z.number() }),
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: number }) =>
      responder(
        ctx,
        `select id, name as nombre, subject as asunto, body_html as cuerpo,
                logo_url, accent_color as color, cta_text as texto_del_boton,
                cta_url as destino_del_boton, footer_text as pie, active as activa
           from email_templates where id = $1`,
        [id],
      ),
  );

  server.registerTool(
    "crear_plantilla_de_correo",
    {
      title: "Crear una plantilla de correo",
      description:
        "Crea una plantilla. El cuerpo es HTML sencillo (<p>, <h2>, <ul>, <a>, <strong>): el diseño —tarjeta, cabecera con logo, botón— lo pone el CRM al enviar, no lo escribas tú. Para insertar datos del destinatario usa campos entre dobles llaves, por ejemplo {{contacto.nombre}}; los disponibles salen de ver_configuracion (campos personalizados) más contacto.*, empresa.* y oportunidad.*.",
      inputSchema: z.object({
        nombre: z.string().describe("Nombre interno de la plantilla."),
        asunto: z.string().describe("Admite campos de fusión."),
        cuerpo: z.string().describe("HTML sencillo del cuerpo."),
        textoDelBoton: z.string().optional(),
        destinoDelBoton: z
          .string()
          .optional()
          .describe("URL, o un campo de fusión como {{contacto.campo.diagnostico}}."),
        color: z.string().optional().describe("Color principal en hexadecimal."),
        pie: z.string().optional(),
      }),
    },
    async (args: {
      nombre: string;
      asunto: string;
      cuerpo: string;
      textoDelBoton?: string;
      destinoDelBoton?: string;
      color?: string;
      pie?: string;
    }) =>
      responder(
        ctx,
        `insert into email_templates
           (name, subject, body_html, cta_text, cta_url, accent_color, footer_text, active)
         values ($1, $2, $3, $4, $5, $6, $7, true)
         returning id, name, subject`,
        [
          args.nombre,
          args.asunto,
          args.cuerpo,
          args.textoDelBoton ?? null,
          args.destinoDelBoton ?? null,
          args.color ?? null,
          args.pie ?? null,
        ],
      ),
  );

  server.registerTool(
    "encolar_correo_de_plantilla",
    {
      title: "Enviar un correo con una plantilla",
      description:
        "Manda a un contacto el correo de una plantilla. Se envía en menos de un minuto por el proveedor configurado, con los campos de fusión ya resueltos, y queda registrado en la ficha del contacto. Consulta estado_de_envios para ver si salió.",
      inputSchema: z.object({
        contactoId: z.number(),
        plantillaId: z.number(),
        oportunidadId: z
          .number()
          .optional()
          .describe("Si la plantilla usa campos {{oportunidad.*}}."),
      }),
    },
    async (args: {
      contactoId: number;
      plantillaId: number;
      oportunidadId?: number;
    }) => {
      const resultado = await responder(
        ctx,
        `insert into email_outbox
           (organization_id, template_id, contact_id, deal_id)
         select t.organization_id, t.id, $1, $3
           from email_templates t
          where t.id = $2 and t.active
         returning id`,
        [args.contactoId, args.plantillaId, args.oportunidadId ?? null],
      );
      if (resultado.isError) return resultado;
      // Sin filas devueltas, la plantilla no existía o estaba desactivada:
      // decirlo es más útil que un "Sin resultados" que el agente no sabría
      // interpretar.
      const salio = resultado.content[0]?.text !== "Sin resultados.";
      return salio
        ? texto("Correo encolado. Sale en menos de un minuto.")
        : texto(
            "No se encoló: la plantilla no existe o está desactivada. Comprueba con listar_plantillas_de_correo.",
          );
    },
  );

  server.registerTool(
    "estado_de_envios",
    {
      title: "Estado de los correos enviados",
      description:
        "Últimos correos que el CRM ha mandado o intentado mandar, con su error si falló. Para comprobar que una automatización de correo está funcionando.",
      inputSchema: z.object({
        soloFallidos: z.boolean().optional(),
        limite: z.number().optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args: { soloFallidos?: boolean; limite?: number }) =>
      responder(
        ctx,
        `select o.id, o.contact_id, t.name as plantilla, o.attempts as intentos,
                o.sent_at as enviado, o.last_error as error, o.created_at
           from email_outbox o
           left join email_templates t on t.id = o.template_id
          ${args.soloFallidos ? "where o.sent_at is null and o.last_error is not null" : ""}
          order by o.created_at desc limit $1`,
        [acotarLimite(args.limite)],
      ),
  );
};

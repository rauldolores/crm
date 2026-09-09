import { z } from "zod";

import { acotarLimite, error, responder, texto } from "./nucleo";
import type { RegistradorDeHerramientas } from "./registro";

/**
 * Automatizaciones y módulos: la configuración que hace que el CRM actúe solo.
 *
 * Aquí también viven los afiliados, porque son un módulo activable y no una
 * entidad de siempre: separarlos en su propio archivo daría un módulo de tres
 * herramientas que nadie encuentra.
 */
export const registrarAutomatizaciones: RegistradorDeHerramientas = (
  server,
  ctx,
) => {
  server.registerTool(
    "listar_automatizaciones",
    {
      title: "Listar automatizaciones",
      description:
        "Reglas «cuando pase X, haz Y» de la organización, con su disparador y su acción.",
      inputSchema: z.object({ incluirInactivas: z.boolean().optional() }),
      annotations: { readOnlyHint: true },
    },
    async (args: { incluirInactivas?: boolean }) =>
      responder(
        ctx,
        `select id, name as nombre, active as activa,
                trigger_resource as sobre, trigger_event as cuando,
                trigger_params as condiciones,
                action_type as accion, action_params as parametros
           from automations
          ${args.incluirInactivas ? "" : "where active = true"}
          order by name`,
      ),
  );

  server.registerTool(
    "crear_automatizacion",
    {
      title: "Crear una automatización",
      description:
        "Crea una regla automática. Acciones: create_task (crea una tarea), assign_owner (asigna responsable) o send_email (manda una plantilla). Para send_email pasa plantillaId; para create_task, texto y opcionalmente venceEnDias — sin él la tarea queda sin fecha límite.",
      inputSchema: z.object({
        nombre: z.string(),
        sobre: z.enum(["contacts", "deals"]).describe("Qué se vigila."),
        cuando: z
          .enum(["created", "stage_changed"])
          .describe("stage_changed solo aplica a deals."),
        etapa: z
          .string()
          .optional()
          .describe("Con stage_changed, acota la regla a esta etapa."),
        accion: z.enum(["create_task", "assign_owner", "send_email"]),
        texto: z.string().optional().describe("create_task: qué dice la tarea."),
        tipoDeTarea: z.string().optional(),
        venceEnDias: z
          .number()
          .optional()
          .describe("create_task: vacío = tarea sin fecha límite."),
        responsableId: z.number().optional().describe("assign_owner: a quién."),
        plantillaId: z.number().optional().describe("send_email: qué plantilla."),
      }),
    },
    async (args: {
      nombre: string;
      sobre: "contacts" | "deals";
      cuando: "created" | "stage_changed";
      etapa?: string;
      accion: "create_task" | "assign_owner" | "send_email";
      texto?: string;
      tipoDeTarea?: string;
      venceEnDias?: number;
      responsableId?: number;
      plantillaId?: number;
    }) => {
      if (args.accion === "send_email" && !args.plantillaId) {
        return error("Para send_email hace falta plantillaId.");
      }
      if (args.accion === "assign_owner" && !args.responsableId) {
        return error("Para assign_owner hace falta responsableId.");
      }
      if (args.accion === "create_task" && !args.texto) {
        return error("Para create_task hace falta el texto de la tarea.");
      }

      const parametros: Record<string, unknown> =
        args.accion === "send_email"
          ? { templateId: args.plantillaId }
          : args.accion === "assign_owner"
            ? { salesId: args.responsableId }
            : {
                text: args.texto,
                ...(args.tipoDeTarea ? { taskType: args.tipoDeTarea } : {}),
                // Se omite la clave cuando no hay días: el disparador la
                // interpreta como «sin fecha límite».
                ...(args.venceEnDias === undefined
                  ? {}
                  : { dueInDays: args.venceEnDias }),
              };

      return responder(
        ctx,
        `insert into automations
           (name, trigger_resource, trigger_event, trigger_params,
            action_type, action_params, active)
         values ($1, $2, $3, $4::jsonb, $5, $6::jsonb, true)
         returning id, name`,
        [
          args.nombre,
          args.sobre,
          args.cuando,
          JSON.stringify(args.etapa ? { stage: args.etapa } : {}),
          args.accion,
          JSON.stringify(parametros),
        ],
      );
    },
  );

  server.registerTool(
    "activar_automatizacion",
    {
      title: "Activar o desactivar una automatización",
      description: "Enciende o apaga una regla sin borrarla.",
      inputSchema: z.object({ id: z.number(), activa: z.boolean() }),
    },
    async (args: { id: number; activa: boolean }) => {
      const resultado = await responder(
        ctx,
        "update automations set active = $2 where id = $1 returning id, name, active",
        [args.id, args.activa],
      );
      return resultado.isError
        ? resultado
        : texto(
            `Automatización ${args.id} ${args.activa ? "activada" : "desactivada"}.`,
          );
    },
  );

  server.registerTool(
    "listar_afiliados",
    {
      title: "Listar afiliados",
      description:
        "Afiliados del módulo Afiliados, con su código de referido, su comisión y el negocio que han traído. Solo aplica si el módulo está activo (ver_configuracion lo dice).",
      inputSchema: z.object({ limite: z.number().optional() }),
      annotations: { readOnlyHint: true },
    },
    async (args: { limite?: number }) =>
      responder(
        ctx,
        `select a.id, a.referral_code as codigo, a.commission_percentage as comision,
                a.active as activo, a.contact_id, a.company_id,
                c.first_name || ' ' || coalesce(c.last_name,'') as contacto,
                v.nb_referred_companies as clientes_referidos,
                v.won_amount as negocio_ganado,
                v.commission_amount as comision_devengada
           from affiliates a
           left join contacts c on c.id = a.contact_id
           left join affiliate_commissions v on v.id = a.id
          order by v.commission_amount desc nulls last
          limit $1`,
        [acotarLimite(args.limite)],
      ),
  );
};

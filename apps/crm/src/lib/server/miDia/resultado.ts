import { getServiceClient } from "../supabase-service";
import {
  errorDelResultado,
  etapaDeDescarte,
  repartirEnFechas,
  type ResultadoDeMiDia,
} from "@/lib/miDia/etapas";
import type { PeticionDeResultado } from "@/lib/miDia/tipos";
import { leerEmbudos } from "./cola";

/**
 * Registra lo que pasó con un prospecto de «Mi día», en una sola llamada:
 * mueve la oportunidad (por crm.move_deal, así disparan las automatizaciones
 * del embudo igual que al arrastrar la tarjeta), deja la nota en la
 * oportunidad y cierra o reprograma la tarea.
 *
 * Se mueve primero porque es lo que puede fallar por reglas de la base (un
 * disparador puede rechazar el cambio de etapa): si falla, no queda una nota
 * que diga que pasó algo que no pasó.
 */

/** Canales que se aceptan sin estar en la lista de tipos de nota. */
const CANALES_BASICOS = ["note", "whatsapp", "email", "call"];
const MAXIMO_DE_NOTA = 4000;

export class ErrorDeResultado extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
  ) {
    super(mensaje);
  }
}

const textoDeLaNota = (
  resultado: ResultadoDeMiDia,
  nota: string,
  etiquetas: { etapa?: string; motivo?: string },
): string | null => {
  const resumen =
    resultado.tipo === "mover"
      ? `Pasa a «${etiquetas.etapa}».`
      : resultado.tipo === "descartar"
        ? `Descartado: ${etiquetas.motivo}.`
        : resultado.tipo === "quedarse"
          ? "Seguimiento hecho."
          : null;
  // Posponer sin decir nada no es haber trabajado el prospecto.
  if (!resumen) return nota || null;
  return nota ? `${nota}\n\n${resumen}` : resumen;
};

export async function registrarResultado(
  organizacionId: string,
  comercialId: number,
  peticion: PeticionDeResultado,
): Promise<void> {
  const supabase = getServiceClient();
  const { resultado } = peticion;
  const nota = (peticion.nota ?? "").trim().slice(0, MAXIMO_DE_NOTA);

  const [{ data: tarea }, { data: oportunidad }, ajustes] = await Promise.all([
    peticion.tareaId
      ? supabase
          .from("tasks")
          .select("id, contact_id, done_date")
          .eq("organization_id", organizacionId)
          .eq("id", peticion.tareaId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    peticion.dealId
      ? supabase
          .from("deals")
          .select("id, name, stage, pipeline, contact_ids")
          .eq("organization_id", organizacionId)
          .eq("id", peticion.dealId)
          .is("archived_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    leerEmbudos(organizacionId),
  ]);
  if (peticion.tareaId && !tarea) {
    throw new ErrorDeResultado("Tarea no encontrada.", 404);
  }
  if (tarea?.done_date) {
    throw new ErrorDeResultado("Esa tarea ya estaba hecha.", 409);
  }
  if (peticion.dealId && !oportunidad) {
    throw new ErrorDeResultado("Oportunidad no encontrada.", 404);
  }

  // El contacto sale de la tarea o de la oportunidad, nunca solo del cuerpo:
  // así no se le deja una tarea a un contacto de otra organización.
  const contactoId =
    (tarea?.contact_id as number | undefined) ??
    (oportunidad?.contact_ids as number[] | null)?.find(
      (id) => id === peticion.contactId,
    ) ??
    (oportunidad?.contact_ids as number[] | null)?.[0] ??
    null;

  const embudo =
    ajustes.embudos.find((e) => e.value === oportunidad?.pipeline) ?? null;
  const error = errorDelResultado(resultado, {
    embudo,
    etapaActual: (oportunidad?.stage as string | undefined) ?? null,
    exigirIngresoParaGanar: ajustes.exigirIngresoParaGanar,
    motivosDePerdida: ajustes.motivosDePerdida.map((m) => m.value),
    tieneTarea: Boolean(tarea),
    tieneContacto: contactoId != null,
  });
  if (error) throw new ErrorDeResultado(error, 400);

  const destino =
    resultado.tipo === "mover"
      ? resultado.etapa
      : resultado.tipo === "descartar" && embudo
        ? etapaDeDescarte(embudo)
        : null;
  if (oportunidad && destino) {
    const { error: errorAlMover } = await supabase.rpc("move_deal", {
      p_deal_id: oportunidad.id,
      p_stage: destino,
      // Arriba de la columna: es lo último que se trabajó.
      p_index: 0,
      p_loss_reason:
        resultado.tipo === "descartar" ? resultado.motivo : null,
      p_actor: comercialId,
    });
    if (errorAlMover) {
      throw new ErrorDeResultado(
        "No se pudo mover la oportunidad.",
        500,
      );
    }
  }

  const canal =
    peticion.canal &&
    (CANALES_BASICOS.includes(peticion.canal) ||
      ajustes.tiposDeNota.includes(peticion.canal))
      ? peticion.canal
      : "note";
  const ahora = new Date().toISOString();
  const texto = textoDeLaNota(resultado, nota, {
    etapa: embudo?.stages.find((e) => e.value === destino)?.label,
    motivo:
      resultado.tipo === "descartar"
        ? ajustes.motivosDePerdida.find((m) => m.value === resultado.motivo)
            ?.label
        : undefined,
  });

  const escrituras: PromiseLike<{ error: unknown }>[] = [];
  if (texto && oportunidad) {
    escrituras.push(
      supabase.from("deal_notes").insert({
        organization_id: organizacionId,
        deal_id: oportunidad.id,
        type: canal,
        text: texto,
        date: ahora,
        sales_id: comercialId,
      }),
    );
  } else if (texto && contactoId) {
    escrituras.push(
      supabase.from("contact_notes").insert({
        organization_id: organizacionId,
        contact_id: contactoId,
        type: canal,
        text: texto,
        date: ahora,
        sales_id: comercialId,
      }),
    );
  }

  if (resultado.tipo === "posponer") {
    escrituras.push(
      tarea
        ? supabase
            .from("tasks")
            .update({ due_date: resultado.fecha })
            .eq("id", tarea.id)
        : supabase.from("tasks").insert({
            organization_id: organizacionId,
            contact_id: contactoId,
            text: oportunidad
              ? `Retomar «${oportunidad.name}»`
              : "Retomar el contacto",
            type: canal === "note" ? "none" : canal,
            due_date: resultado.fecha,
            sales_id: comercialId,
          }),
    );
  } else if (tarea) {
    escrituras.push(
      supabase.from("tasks").update({ done_date: ahora }).eq("id", tarea.id),
    );
  }

  if (contactoId && resultado.tipo !== "posponer") {
    escrituras.push(
      supabase
        .from("contacts")
        .update({ last_seen: ahora })
        .eq("id", contactoId)
        .eq("organization_id", organizacionId),
    );
  }

  const fallos = (await Promise.all(escrituras)).filter((r) => r.error);
  if (fallos.length) {
    console.error("mi-dia: escrituras fallidas", {
      organizacionId,
      dealId: oportunidad?.id,
      tareaId: tarea?.id,
      errores: fallos.map((f) => String((f.error as Error)?.message ?? f.error)),
    });
    throw new ErrorDeResultado(
      "Se registró solo una parte del resultado. Revisa la oportunidad.",
      500,
    );
  }
}

/**
 * Reparte las tareas vencidas del comercial en las fechas dadas, `porDia`
 * en cada una, empezando por las más antiguas.
 */
export async function repartirVencidas(
  organizacionId: string,
  comercialId: number,
  antesDe: string,
  fechas: string[],
  porDia: number,
): Promise<number> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("tasks")
    .select("id")
    .eq("organization_id", organizacionId)
    .eq("sales_id", comercialId)
    .is("done_date", null)
    .lt("due_date", antesDe)
    .order("due_date", { ascending: true })
    .limit(1000);
  const ids = ((data ?? []) as { id: number }[]).map((t) => t.id);

  const porFecha = new Map<string, number[]>();
  for (const { elemento, fecha } of repartirEnFechas(ids, fechas, porDia)) {
    porFecha.set(fecha, [...(porFecha.get(fecha) ?? []), elemento]);
  }

  const resultados = await Promise.all(
    [...porFecha].map(([fecha, grupo]) =>
      supabase
        .from("tasks")
        .update({ due_date: fecha })
        .eq("organization_id", organizacionId)
        .in("id", grupo),
    ),
  );
  if (resultados.some((r) => r.error)) {
    throw new ErrorDeResultado("No se pudieron reprogramar todas.", 500);
  }
  return ids.length;
}

import { getServiceClient } from "../supabase-service";
import { primeraEtapa, type EmbudoDeMiDia } from "@/lib/miDia/etapas";
import type {
  ColaDeMiDia,
  ContactoDeMiDia,
  FilaDeMiDia,
} from "@/lib/miDia/tipos";

/**
 * La cola de «Mi día» de un comercial: sus tareas abiertas que vencen hasta
 * hoy y, después, `cuota` prospectos de la primera etapa del embudo que
 * todavía no tienen ninguna tarea abierta (los que la tienen ya están en su
 * día, el de hoy o el que se pospuso).
 */

/** Cuántas tareas como mucho: más que esto no se trabaja en un día. */
const MAXIMO_DE_TAREAS = 300;
/**
 * Cuántos prospectos de la primera etapa se miran para llenar la cuota. Los
 * que tienen una tarea abierta se saltan, así que se piden de más.
 */
const CANDIDATOS_POR_CUOTA = 5;
const MAXIMO_DE_CANDIDATOS = 500;

const COLUMNAS_DE_CONTACTO =
  "id, first_name, last_name, title, company_id, email_jsonb, phone_jsonb, archived_at";

interface OportunidadLeida {
  id: number;
  name: string;
  stage: string;
  pipeline: string;
  contact_ids: number[] | null;
  company_id: number | null;
  sales_id: number | null;
  updated_at: string | null;
}

export async function leerEmbudos(
  organizacionId: string,
): Promise<{
  embudos: EmbudoDeMiDia[];
  exigirIngresoParaGanar: boolean;
  motivosDePerdida: { value: string; label: string }[];
  tiposDeNota: string[];
}> {
  const { data } = await getServiceClient()
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const config = (data?.config ?? {}) as {
    dealPipelines?: EmbudoDeMiDia[];
    requireIncomeToWin?: boolean;
    dealLossReasons?: { value: string; label: string }[];
    noteTypes?: { value: string }[];
  };
  return {
    embudos: (config.dealPipelines ?? []).map((embudo) => ({
      ...embudo,
      // Igual que en el navegador (ConfigurationContext): sin lista
      // explícita, la etapa de pérdida es «lost».
      lostStages: embudo.lostStages ?? ["lost"],
    })),
    exigirIngresoParaGanar: config.requireIncomeToWin ?? true,
    motivosDePerdida: config.dealLossReasons ?? [],
    tiposDeNota: (config.noteTypes ?? []).map((t) => t.value),
  };
}

/** El embudo con más prospectos sin tocar de este comercial. */
async function embudoSugerido(
  organizacionId: string,
  comercialId: number,
  embudos: EmbudoDeMiDia[],
): Promise<EmbudoDeMiDia | null> {
  const conteos = await Promise.all(
    embudos.map(async (embudo) => {
      const etapa = primeraEtapa(embudo);
      if (!etapa) return 0;
      const { count } = await getServiceClient()
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizacionId)
        .eq("sales_id", comercialId)
        .eq("pipeline", embudo.value)
        .eq("stage", etapa.value)
        .is("archived_at", null);
      return count ?? 0;
    }),
  );
  const mayor = Math.max(0, ...conteos);
  return mayor > 0 ? embudos[conteos.indexOf(mayor)] : (embudos[0] ?? null);
}

const sinRepetir = <T>(valores: (T | null | undefined)[]): T[] => [
  ...new Set(valores.filter((v): v is T => v != null)),
];

export async function leerColaDeMiDia(parametros: {
  organizacionId: string;
  comercialId: number;
  embudo: string | null;
  cuota: number;
  /** Fin del día de quien mira, en su zona: lo que vence hasta ahí. */
  hasta: string;
  /** Inicio de su día: desde ahí se cuenta lo trabajado hoy. */
  desde: string;
}): Promise<ColaDeMiDia> {
  const { organizacionId, comercialId, cuota, hasta, desde } = parametros;
  const supabase = getServiceClient();

  const { embudos } = await leerEmbudos(organizacionId);
  const embudo =
    embudos.find((candidato) => candidato.value === parametros.embudo) ??
    (await embudoSugerido(organizacionId, comercialId, embudos));
  const etapaInicial = embudo ? primeraEtapa(embudo) : null;

  const deLaPrimeraEtapa = () =>
    supabase
      .from("deals")
      .select(
        "id, name, stage, pipeline, contact_ids, company_id, sales_id, updated_at",
        { count: "exact" },
      )
      .eq("organization_id", organizacionId)
      .eq("sales_id", comercialId)
      .eq("pipeline", embudo?.value ?? "")
      .eq("stage", etapaInicial?.value ?? "")
      .is("archived_at", null);

  const [
    { data: tareasLeidas },
    { count: trabajadosHoy },
    { data: candidatosLeidos, count: porContactar },
    { count: vencidas },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, text, type, due_date, contact_id")
      .eq("organization_id", organizacionId)
      .eq("sales_id", comercialId)
      .is("done_date", null)
      .lte("due_date", hasta)
      .order("due_date", { ascending: true })
      .limit(MAXIMO_DE_TAREAS),
    supabase
      .from("deal_notes")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizacionId)
      .eq("sales_id", comercialId)
      .gte("date", desde),
    etapaInicial && cuota > 0
      ? deLaPrimeraEtapa()
          .order("index", { ascending: true, nullsFirst: false })
          .order("id", { ascending: true })
          .limit(Math.min(cuota * CANDIDATOS_POR_CUOTA, MAXIMO_DE_CANDIDATOS))
      : Promise.resolve({ data: [], count: 0 }),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizacionId)
      .eq("sales_id", comercialId)
      .is("done_date", null)
      .lt("due_date", desde),
  ]);

  const tareas = (tareasLeidas ?? []) as {
    id: number;
    text: string | null;
    type: string | null;
    due_date: string | null;
    contact_id: number;
  }[];
  const candidatos = (candidatosLeidos ?? []) as OportunidadLeida[];

  const contactosDeTareas = sinRepetir(tareas.map((t) => t.contact_id));
  const contactosDeCandidatos = sinRepetir(
    candidatos.map((c) => c.contact_ids?.[0]),
  );

  const [
    { data: contactosLeidos },
    { data: abiertasDeCandidatos },
    { data: oportunidadesDeTareas },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select(COLUMNAS_DE_CONTACTO)
      .eq("organization_id", organizacionId)
      .in("id", sinRepetir([...contactosDeTareas, ...contactosDeCandidatos])),
    supabase
      .from("tasks")
      .select("contact_id")
      .eq("organization_id", organizacionId)
      .is("done_date", null)
      .in("contact_id", contactosDeCandidatos),
    contactosDeTareas.length
      ? supabase
          .from("deals")
          .select(
            "id, name, stage, pipeline, contact_ids, company_id, sales_id, updated_at",
          )
          .eq("organization_id", organizacionId)
          .is("archived_at", null)
          .overlaps("contact_ids", contactosDeTareas)
      : Promise.resolve({ data: [] }),
  ]);

  const contactos = new Map(
    ((contactosLeidos ?? []) as (ContactoDeMiDia & {
      archived_at: string | null;
    })[]).map(({ archived_at, ...contacto }) => [
      contacto.id,
      { ...contacto, archivado: Boolean(archived_at) },
    ]),
  );
  const conTareaAbierta = new Set(
    ((abiertasDeCandidatos ?? []) as { contact_id: number }[]).map(
      (t) => t.contact_id,
    ),
  );

  // La oportunidad de cada contacto con tarea: la suya antes que la de otro
  // comercial, y la que se movió más recientemente.
  const oportunidadDe = new Map<number, OportunidadLeida>();
  const ordenadas = [...((oportunidadesDeTareas ?? []) as OportunidadLeida[])]
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .sort(
      (a, b) =>
        Number(b.sales_id === comercialId) - Number(a.sales_id === comercialId),
    );
  for (const oportunidad of ordenadas) {
    for (const contactoId of oportunidad.contact_ids ?? []) {
      if (!oportunidadDe.has(contactoId)) {
        oportunidadDe.set(contactoId, oportunidad);
      }
    }
  }

  const nuevos = candidatos
    .filter((candidato) => {
      const contactoId = candidato.contact_ids?.[0];
      return contactoId == null || !conTareaAbierta.has(contactoId);
    })
    .slice(0, cuota);

  const idsDeEmpresa = sinRepetir([
    ...[...contactos.values()].map((c) => c.company_id),
    ...nuevos.map((n) => n.company_id),
    ...[...oportunidadDe.values()].map((o) => o.company_id),
  ]);
  const { data: empresasLeidas } = idsDeEmpresa.length
    ? await supabase
        .from("companies")
        .select("id, name")
        .eq("organization_id", organizacionId)
        .in("id", idsDeEmpresa)
    : { data: [] };
  const empresas = new Map(
    ((empresasLeidas ?? []) as { id: number; name: string }[]).map((e) => [
      e.id,
      e,
    ]),
  );

  const resumen = (oportunidad: OportunidadLeida | undefined) =>
    oportunidad
      ? {
          id: oportunidad.id,
          name: oportunidad.name,
          stage: oportunidad.stage,
          pipeline: oportunidad.pipeline,
        }
      : null;
  const contactoVisible = (id: number | null | undefined) => {
    const contacto = id == null ? undefined : contactos.get(id);
    if (!contacto) return null;
    const { archivado: _archivado, ...visible } = contacto;
    return visible;
  };

  const filasDeTareas: FilaDeMiDia[] = tareas
    .filter((tarea) => !contactos.get(tarea.contact_id)?.archivado)
    .map((tarea) => {
      const contacto = contactoVisible(tarea.contact_id);
      const oportunidad = oportunidadDe.get(tarea.contact_id);
      const empresaId = contacto?.company_id ?? oportunidad?.company_id;
      return {
        clave: `tarea-${tarea.id}`,
        tarea: {
          id: tarea.id,
          text: tarea.text,
          type: tarea.type,
          due_date: tarea.due_date,
        },
        contacto,
        empresa: (empresaId && empresas.get(empresaId)) || null,
        oportunidad: resumen(oportunidad),
      };
    });

  const filasNuevas: FilaDeMiDia[] = nuevos.map((oportunidad) => {
    const contacto = contactoVisible(oportunidad.contact_ids?.[0]);
    const empresaId = oportunidad.company_id ?? contacto?.company_id;
    return {
      clave: `oportunidad-${oportunidad.id}`,
      tarea: null,
      contacto,
      empresa: (empresaId && empresas.get(empresaId)) || null,
      oportunidad: resumen(oportunidad),
    };
  });

  return {
    embudo: embudo?.value ?? null,
    tareas: filasDeTareas,
    nuevos: filasNuevas,
    vencidas: vencidas ?? 0,
    porContactar: porContactar ?? 0,
    trabajadosHoy: trabajadosHoy ?? 0,
  };
}

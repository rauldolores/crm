import type { getServiceClient } from "../supabase-service";
import {
  camposDeContacto,
  etapaDelCliente,
  ORIGEN_KONTROLIA_AUTH,
  planDeLaFoto,
  REF_KONTROLIA_AUTH,
  type ContactoExistente,
  type FotoKontroliaAuth,
} from "./kontroliaAuth";

/**
 * Ejecutor de la integración con KontrolIA Auth: guarda en la base lo que
 * `planDeLaFoto()` calculó. Corre con la clave de servicio, que salta el RLS,
 * así que TODA consulta lleva el filtro de la organización del CRM que
 * recibe el aviso (`org`) — es lo único que aísla a una organización de otra.
 *
 * Todo es idempotente: cada fila se reconoce por `source = 'kontrolia_auth'`
 * + `external_id`, y aplicar la misma foto dos veces deja la base igual.
 */

type Db = ReturnType<typeof getServiceClient>;

export interface ResultadoKontroliaAuth {
  company_id: number;
  contacts: number;
  contracts: number;
  purchases: number;
  events: number;
}

const exigir = <T>(
  resultado: { data: T; error: { message: string } | null },
  que: string,
): T => {
  if (resultado.error) {
    throw new Error(`${que}: ${resultado.error.message}`);
  }
  return resultado.data;
};

/** Escapa los comodines de LIKE para buscar un nombre exacto con ilike. */
const literalLike = (valor: string) =>
  valor.replace(/[\\%_]/g, (c) => `\\${c}`);

interface EmpresaLeida {
  id: number;
  lifecycle_stage: string | null;
  custom_fields: Record<string, unknown> | null;
  external_id?: string | null;
}

const COLUMNAS_EMPRESA = "id, lifecycle_stage, custom_fields, external_id";

/**
 * La empresa del CRM que corresponde a la organización de KontrolIA Auth.
 *
 * Antes de crear una nueva busca una dada de alta a mano, para no duplicarla:
 * por la referencia en custom_fields (la misma que usa reconciliarEmpresa) o
 * por nombre exacto sin distinguir mayúsculas — solo si hay UNA y no está
 * ligada ya a otra organización de KontrolIA.
 */
async function buscarEmpresa(
  db: Db,
  org: string,
  externa: { id: string; name: string },
): Promise<EmpresaLeida | null> {
  const porId = exigir(
    await db
      .from("companies")
      .select(COLUMNAS_EMPRESA)
      .eq("organization_id", org)
      .eq("source", ORIGEN_KONTROLIA_AUTH)
      .eq("external_id", externa.id)
      .maybeSingle(),
    "Buscar la empresa",
  );
  if (porId) return porId as EmpresaLeida;

  const porReferencia = exigir(
    await db
      .from("companies")
      .select(COLUMNAS_EMPRESA)
      .eq("organization_id", org)
      .contains("custom_fields", { [REF_KONTROLIA_AUTH]: externa.id })
      .is("external_id", null)
      .limit(1),
    "Buscar la empresa por referencia",
  ) as EmpresaLeida[] | null;
  if (porReferencia?.length) return porReferencia[0];

  const porNombre = exigir(
    await db
      .from("companies")
      .select(COLUMNAS_EMPRESA)
      .eq("organization_id", org)
      .is("external_id", null)
      .ilike("name", literalLike(externa.name.trim()))
      .limit(2),
    "Buscar la empresa por nombre",
  ) as EmpresaLeida[] | null;
  // Dos con el mismo nombre: no se adivina; se crea una nueva y una persona
  // las fusiona si son la misma.
  return porNombre?.length === 1 ? porNombre[0] : null;
}

async function guardarEmpresa(
  db: Db,
  org: string,
  foto: FotoKontroliaAuth,
): Promise<number> {
  const externa = { id: foto.organization.id, name: foto.organization.name };

  for (let intento = 0; intento < 2; intento++) {
    const existente = await buscarEmpresa(db, org, externa);
    if (existente) {
      const etapa = etapaDelCliente(
        existente.lifecycle_stage,
        foto.subscriptions,
      );
      exigir(
        await db
          .from("companies")
          .update({
            name: externa.name,
            source: ORIGEN_KONTROLIA_AUTH,
            external_id: externa.id,
            custom_fields: {
              ...(existente.custom_fields ?? {}),
              [REF_KONTROLIA_AUTH]: externa.id,
            },
            ...(etapa !== undefined ? { lifecycle_stage: etapa } : {}),
          })
          .eq("id", existente.id)
          .eq("organization_id", org),
        "Actualizar la empresa",
      );
      return existente.id;
    }

    const alta = await db
      .from("companies")
      .insert({
        organization_id: org,
        name: externa.name,
        source: ORIGEN_KONTROLIA_AUTH,
        external_id: externa.id,
        custom_fields: { [REF_KONTROLIA_AUTH]: externa.id },
        lifecycle_stage: etapaDelCliente(null, foto.subscriptions) ?? null,
      })
      .select("id")
      .single();
    // Dos avisos de la misma organización nueva a la vez: el segundo choca
    // con el índice único y vuelve a buscar la que creó el primero.
    if (alta.error?.code === "23505" && intento === 0) continue;
    return (exigir(alta, "Crear la empresa") as { id: number }).id;
  }
  throw new Error("No se pudo crear ni encontrar la empresa.");
}

async function guardarContactos(
  db: Db,
  org: string,
  companyId: number,
  plan: ReturnType<typeof planDeLaFoto>,
  ahora: string,
): Promise<number> {
  const ids = plan.contactos.map((c) => c.external_id);
  const columnas =
    "id, email_jsonb, phone_jsonb, archived_at, last_seen, external_id";

  const ligados = ids.length
    ? ((exigir(
        await db
          .from("contacts")
          .select(columnas)
          .eq("organization_id", org)
          .eq("source", ORIGEN_KONTROLIA_AUTH)
          .in("external_id", ids),
        "Leer los contactos",
      ) ?? []) as (ContactoExistente & { external_id: string })[])
    : [];
  const porExterno = new Map(ligados.map((c) => [c.external_id, c]));

  // Contactos de la empresa capturados a mano: si uno tiene el correo del
  // usuario, es la misma persona y se adopta en vez de duplicarla.
  const sueltos = (exigir(
    await db
      .from("contacts")
      .select(columnas)
      .eq("organization_id", org)
      .eq("company_id", companyId)
      .is("external_id", null),
    "Leer los contactos de la empresa",
  ) ?? []) as ContactoExistente[];
  const adoptados = new Set<number>();
  const adoptable = (correo: string | null) => {
    if (!correo) return null;
    const buscado = correo.toLowerCase();
    return (
      sueltos.find(
        (c) =>
          !adoptados.has(c.id) &&
          (c.email_jsonb ?? []).some(
            (e) => e?.email?.trim().toLowerCase() === buscado,
          ),
      ) ?? null
    );
  };

  const altas: Record<string, unknown>[] = [];
  for (const deseado of plan.contactos) {
    const existente =
      porExterno.get(deseado.external_id) ?? adoptable(deseado.email);
    const campos = camposDeContacto(deseado, existente, ahora, companyId);
    if (existente) {
      adoptados.add(existente.id);
      exigir(
        await db
          .from("contacts")
          .update(campos)
          .eq("id", existente.id)
          .eq("organization_id", org),
        "Actualizar un contacto",
      );
    } else {
      altas.push({ organization_id: org, ...campos });
    }
  }
  if (altas.length) {
    exigir(await db.from("contacts").insert(altas), "Crear los contactos");
  }

  // Quien ya no aparece entre los usuarios de la organización se archiva
  // (conserva su historial); no se borra.
  let sobrantes = db
    .from("contacts")
    .update({ archived_at: ahora })
    .eq("organization_id", org)
    .eq("company_id", companyId)
    .eq("source", ORIGEN_KONTROLIA_AUTH)
    .is("archived_at", null);
  if (ids.length) {
    sobrantes = sobrantes.not(
      "external_id",
      "in",
      `(${ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",")})`,
    );
  }
  exigir(await sobrantes, "Archivar contactos que ya no están");

  return plan.contactos.length;
}

async function guardarContratos(
  db: Db,
  org: string,
  companyId: number,
  plan: ReturnType<typeof planDeLaFoto>,
  ahora: string,
): Promise<Map<string, number>> {
  const porAplicacion = new Map<string, number>();
  if (!plan.contratos.length) return porAplicacion;
  const filas = exigir(
    await db
      .from("contracts")
      .upsert(
        plan.contratos.map((c) => ({
          ...c,
          organization_id: org,
          company_id: companyId,
          updated_at: ahora,
        })),
        { onConflict: "organization_id,source,external_id" },
      )
      .select("id, application_slug"),
    "Guardar los contratos",
  ) as { id: number; application_slug: string }[] | null;
  for (const fila of filas ?? []) {
    porAplicacion.set(fila.application_slug, fila.id);
  }
  return porAplicacion;
}

async function guardarCompras(
  db: Db,
  org: string,
  companyId: number,
  plan: ReturnType<typeof planDeLaFoto>,
  contratos: Map<string, number>,
): Promise<number> {
  for (const { application_slug, compra, linea } of plan.compras) {
    const guardada = exigir(
      await db
        .from("purchases")
        .upsert(
          {
            ...compra,
            organization_id: org,
            company_id: companyId,
            contract_id: application_slug
              ? (contratos.get(application_slug) ?? null)
              : null,
          },
          { onConflict: "organization_id,source,external_id" },
        )
        .select("id")
        .single(),
      "Guardar una renovación",
    ) as { id: number };

    // La línea se reemplaza entera, como en /api/clientes/compras: lo que
    // manda el origen es la verdad.
    exigir(
      await db
        .from("purchase_items")
        .delete()
        .eq("purchase_id", guardada.id)
        .eq("organization_id", org),
      "Limpiar la línea de la renovación",
    );
    exigir(
      await db.from("purchase_items").insert({
        ...linea,
        organization_id: org,
        purchase_id: guardada.id,
      }),
      "Guardar la línea de la renovación",
    );
  }
  return plan.compras.length;
}

async function guardarEventos(
  db: Db,
  org: string,
  companyId: number,
  plan: ReturnType<typeof planDeLaFoto>,
  contratos: Map<string, number>,
): Promise<number> {
  const filas = plan.eventos.map(({ application_slug, fila }) => ({
    ...fila,
    organization_id: org,
    company_id: companyId,
    contract_id: application_slug
      ? (contratos.get(application_slug) ?? null)
      : null,
  }));
  for (let i = 0; i < filas.length; i += 200) {
    exigir(
      await db.from("contract_events").upsert(filas.slice(i, i + 200), {
        onConflict: "organization_id,source,external_id",
      }),
      "Guardar el historial",
    );
  }

  // Lo que ya no sale en la foto (ruido de versiones anteriores, renglones
  // que no dicen qué cambió) se quita. Solo de esta empresa y de esta
  // integración: lo demás del historial no se toca.
  const vigentes = new Set(
    plan.eventos.map(({ fila }) => String(fila.external_id)),
  );
  const guardadas = (exigir(
    await db
      .from("contract_events")
      .select("external_id")
      .eq("organization_id", org)
      .eq("company_id", companyId)
      .eq("source", ORIGEN_KONTROLIA_AUTH),
    "Leer el historial guardado",
  ) ?? []) as { external_id: string }[];
  const sobrantes = guardadas
    .map((g) => g.external_id)
    .filter((id) => !vigentes.has(id));
  for (let i = 0; i < sobrantes.length; i += 100) {
    exigir(
      await db
        .from("contract_events")
        .delete()
        .eq("organization_id", org)
        .eq("company_id", companyId)
        .eq("source", ORIGEN_KONTROLIA_AUTH)
        .in("external_id", sobrantes.slice(i, i + 100)),
      "Quitar del historial lo que ya no va",
    );
  }
  return filas.length;
}

/** Aplica la foto completa de un cliente a la organización `org` del CRM. */
export async function aplicarKontroliaAuth(
  db: Db,
  org: string,
  foto: FotoKontroliaAuth,
  ahora = new Date().toISOString(),
): Promise<ResultadoKontroliaAuth> {
  const plan = planDeLaFoto(foto);
  const companyId = await guardarEmpresa(db, org, foto);
  const contacts = await guardarContactos(db, org, companyId, plan, ahora);
  const contratos = await guardarContratos(db, org, companyId, plan, ahora);
  const purchases = await guardarCompras(db, org, companyId, plan, contratos);
  const events = await guardarEventos(db, org, companyId, plan, contratos);
  return {
    company_id: companyId,
    contacts,
    contracts: contratos.size,
    purchases,
    events,
  };
}

// ── Bitácora de avisos (crm.integration_events) ─────────────────────────

/**
 * Fecha de la foto más nueva ya aplicada de esa organización de KontrolIA.
 * Los reintentos llegan fuera de orden; una foto más vieja no debe pisar
 * a una más nueva.
 */
export async function ultimaFotoAplicada(
  db: Db,
  org: string,
  organizacionExterna: string,
): Promise<string | null> {
  const fila = exigir(
    await db
      .from("integration_events")
      .select("snapshot_generated_at")
      .eq("organization_id", org)
      .eq("source", ORIGEN_KONTROLIA_AUTH)
      .eq("external_organization_id", organizacionExterna)
      .eq("status", "ok")
      .not("snapshot_generated_at", "is", null)
      .order("snapshot_generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Leer la bitácora de avisos",
  ) as { snapshot_generated_at: string } | null;
  return fila?.snapshot_generated_at ?? null;
}

export async function registrarAviso(
  db: Db,
  fila: {
    organization_id: string;
    event_id: string;
    type: string | null;
    external_organization_id: string | null;
    snapshot_generated_at: string | null;
    status: "ok" | "error";
    error: string | null;
  },
): Promise<void> {
  // Un reintento del mismo evento actualiza su renglón en vez de duplicarlo.
  const { error } = await db.from("integration_events").upsert(
    {
      ...fila,
      source: ORIGEN_KONTROLIA_AUTH,
      received_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,source,event_id" },
  );
  if (error) {
    console.error(
      "No se pudo anotar el aviso de KontrolIA Auth",
      error.message,
    );
  }
}

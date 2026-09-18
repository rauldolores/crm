import jsonExport from "jsonexport/dist";
import { downloadCSV, type Exporter } from "ra-core";

import type {
  Company,
  CustomFieldDefinition,
  Deal,
  DealPipeline,
  Sale,
  Tag,
} from "../types";
import { aplanarCamposPersonalizados } from "./camposPersonalizadosCsv";

/** Nombres de etiqueta separados por coma, o vacío. */
const nombresDeEtiquetas = (
  ids: number[] | null | undefined,
  tags: Record<string, Tag>,
) =>
  (ids ?? [])
    .map((id) => tags[id]?.name)
    .filter(Boolean)
    .join(", ");

const nombreDeComercial = (
  id: string | number | null | undefined,
  sales: Record<string, Sale>,
) =>
  id != null && sales[id]
    ? `${sales[id].first_name} ${sales[id].last_name}`
    : undefined;

/**
 * Una empresa como fila de CSV legible: responsable y etiquetas por nombre
 * (no por id), campos personalizados como columnas con su etiqueta, y sin
 * las columnas internas (logo, contadores de la vista).
 */
export const filaDeEmpresa = (
  empresa: Company,
  relacionados: { sales: Record<string, Sale>; tags: Record<string, Tag> },
  camposPersonalizados: CustomFieldDefinition[],
) => {
  const {
    logo: _logo,
    custom_fields,
    nb_contacts: _c,
    nb_deals: _d,
    nb_tickets: _t,
    nb_tickets_open: _to,
    ...resto
  } = empresa;
  return {
    ...resto,
    sales: nombreDeComercial(empresa.sales_id, relacionados.sales),
    tags: nombresDeEtiquetas(empresa.tags, relacionados.tags),
    ...aplanarCamposPersonalizados(camposPersonalizados, custom_fields),
  };
};

export const exportadorDeEmpresas =
  (camposPersonalizados: CustomFieldDefinition[]): Exporter<Company> =>
  async (records, fetchRelatedRecords) => {
    const [sales, tags] = await Promise.all([
      fetchRelatedRecords<Sale>(records, "sales_id", "sales"),
      fetchRelatedRecords<Tag>(records, "tags", "tags"),
    ]);
    const filas = records.map((empresa) =>
      filaDeEmpresa(empresa, { sales, tags }, camposPersonalizados),
    );
    return jsonExport(filas, {}, (_err: unknown, csv: string) => {
      downloadCSV(csv, "empresas");
    });
  };

/**
 * Una oportunidad como fila de CSV legible: empresa, responsable, embudo,
 * etapa y etiquetas por nombre, campos personalizados como columnas.
 */
export const filaDeOportunidad = (
  oportunidad: Deal,
  relacionados: {
    companies: Record<string, Company>;
    sales: Record<string, Sale>;
    tags: Record<string, Tag>;
  },
  camposPersonalizados: CustomFieldDefinition[],
  embudos: DealPipeline[],
) => {
  const { custom_fields, ...resto } = oportunidad;
  const embudo = embudos.find((e) => e.value === oportunidad.pipeline);
  return {
    ...resto,
    pipeline: embudo?.label ?? oportunidad.pipeline,
    stage:
      embudo?.stages.find((s) => s.value === oportunidad.stage)?.label ??
      oportunidad.stage,
    company:
      oportunidad.company_id != null
        ? relacionados.companies[oportunidad.company_id]?.name
        : undefined,
    sales: nombreDeComercial(oportunidad.sales_id, relacionados.sales),
    tags: nombresDeEtiquetas(oportunidad.tags, relacionados.tags),
    ...aplanarCamposPersonalizados(camposPersonalizados, custom_fields),
  };
};

export const exportadorDeOportunidades =
  (
    camposPersonalizados: CustomFieldDefinition[],
    embudos: DealPipeline[],
  ): Exporter<Deal> =>
  async (records, fetchRelatedRecords) => {
    const [companies, sales, tags] = await Promise.all([
      fetchRelatedRecords<Company>(records, "company_id", "companies"),
      fetchRelatedRecords<Sale>(records, "sales_id", "sales"),
      fetchRelatedRecords<Tag>(records, "tags", "tags"),
    ]);
    const filas = records.map((oportunidad) =>
      filaDeOportunidad(
        oportunidad,
        { companies, sales, tags },
        camposPersonalizados,
        embudos,
      ),
    );
    return jsonExport(filas, {}, (_err: unknown, csv: string) => {
      downloadCSV(csv, "oportunidades");
    });
  };

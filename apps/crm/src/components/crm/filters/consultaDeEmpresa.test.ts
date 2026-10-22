import { describe, expect, it } from "vitest";

import type { CustomFieldDefinition } from "../types";
import {
  campoFiltrado,
  conEmpresaEmbebida,
  filtroDeCampo,
  sinEmpresaEmbebida,
  sinFiltroDeCampo,
} from "./consultaDeEmpresa";

const campo = (
  type: CustomFieldDefinition["type"],
  value = "score_padron",
): CustomFieldDefinition => ({ type, value, label: value });

describe("filtroDeCampo", () => {
  it("filtra números como mínimo sobre el valor JSON, no como texto", () => {
    expect(filtroDeCampo("", campo("number"), "50")).toEqual({
      "custom_fields->score_padron@gte": "50",
    });
  });

  it("filtra listas por igualdad de texto y textos por contenido", () => {
    expect(
      filtroDeCampo("", campo("list", "estatus_immex"), "Autorizado"),
    ).toEqual({ "custom_fields->>estatus_immex@eq": "Autorizado" });
    expect(
      filtroDeCampo("", campo("text", "actividad_immex"), " textil "),
    ).toEqual({ "custom_fields->>actividad_immex@ilike": "textil" });
  });

  it("antepone el prefijo de la empresa embebida en oportunidades", () => {
    expect(filtroDeCampo("empresa:", campo("checkbox", "vip"), "true")).toEqual(
      { "empresa:custom_fields->vip@eq": "true" },
    );
  });

  it("no filtra con un valor vacío ni con un número inválido", () => {
    expect(filtroDeCampo("", campo("text"), "  ")).toEqual({});
    expect(filtroDeCampo("", campo("number"), "abc")).toEqual({});
  });
});

describe("sinFiltroDeCampo y campoFiltrado", () => {
  const filtros = {
    pipeline: "ventas",
    "empresa:state_abbr@eq": "Jalisco",
    "empresa:custom_fields->score_padron@gte": "50",
  };

  it("encuentra el campo filtrado del prefijo indicado", () => {
    expect(campoFiltrado(filtros, "empresa:")).toEqual({
      campo: "score_padron",
      valor: "50",
    });
    expect(campoFiltrado(filtros, "")).toBeNull();
  });

  it("quita solo el filtro de campo, y conserva el resto", () => {
    expect(sinFiltroDeCampo(filtros, "empresa:")).toEqual({
      pipeline: "ventas",
      "empresa:state_abbr@eq": "Jalisco",
    });
  });
});

describe("conEmpresaEmbebida", () => {
  const base = {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "id", order: "ASC" as const },
  };

  it("embebe la empresa con !inner y traduce sus filtros a companies.", () => {
    const resultado = conEmpresaEmbebida({
      ...base,
      filter: { pipeline: "ventas", "empresa:state_abbr@eq": "Jalisco" },
    });

    expect(resultado.meta).toEqual({ columns: "*,companies!inner(id)" });
    expect(resultado.filter).toEqual({
      pipeline: "ventas",
      "companies.state_abbr@eq": "Jalisco",
    });
  });

  it("no cambia la consulta sin filtros de empresa", () => {
    expect(
      conEmpresaEmbebida({ ...base, filter: { pipeline: "ventas" } }).meta,
    ).toBeUndefined();
  });

  it("quita la empresa embebida de las filas devueltas", () => {
    expect(sinEmpresaEmbebida({ id: 1, companies: { id: 2 } })).toEqual({
      id: 1,
    });
  });
});

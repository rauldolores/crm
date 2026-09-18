import { describe, expect, it } from "vitest";

import { aplicarFiltroDeArchivados } from "./filtroDeArchivados";

const params = (filter: Record<string, unknown>) => ({
  filter,
  pagination: { page: 1, perPage: 10 },
  sort: { field: "id", order: "ASC" as const },
});

describe("aplicarFiltroDeArchivados", () => {
  it("sin pedir nada, deja solo los activos", () => {
    expect(aplicarFiltroDeArchivados(params({ q: "ana" })).filter).toEqual({
      q: "ana",
      "archived_at@is": null,
    });
  });

  it("con «archivados», deja solo los archivados y no cuela la clave a la base", () => {
    expect(
      aplicarFiltroDeArchivados(params({ archivados: true })).filter,
    ).toEqual({ "archived_at@not.is": null });
  });

  it("respeta un filtro explícito sobre archived_at", () => {
    expect(
      aplicarFiltroDeArchivados(params({ "archived_at@not.is": null })).filter,
    ).toEqual({ "archived_at@not.is": null });
  });
});

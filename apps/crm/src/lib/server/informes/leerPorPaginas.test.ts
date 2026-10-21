import { describe, expect, it, vi } from "vitest";

import { leerPorPaginas, TAMANO_DE_PAGINA } from "./leerPorPaginas";

/** Simula PostgREST: una tabla de `total` filas servida en rangos. */
const tablaDe = (total: number) =>
  vi.fn(async (desde: number, hasta: number) => ({
    data: Array.from(
      { length: Math.max(0, Math.min(hasta, total - 1) - desde + 1) },
      (_, i) => ({ id: desde + i }),
    ),
    error: null,
  }));

describe("leerPorPaginas", () => {
  it("trae la tabla entera aunque pase del tope de filas por respuesta", async () => {
    const pedir = tablaDe(2 * TAMANO_DE_PAGINA + 345);

    const filas = await leerPorPaginas(pedir);

    expect(filas).toHaveLength(2 * TAMANO_DE_PAGINA + 345);
    expect(filas.at(-1)).toEqual({ id: 2 * TAMANO_DE_PAGINA + 344 });
  });

  it("pide una página más cuando el total es múltiplo exacto del tamaño", async () => {
    const pedir = tablaDe(TAMANO_DE_PAGINA);

    const filas = await leerPorPaginas(pedir);

    expect(filas).toHaveLength(TAMANO_DE_PAGINA);
    expect(pedir).toHaveBeenCalledTimes(2);
  });

  it("lanza con el mensaje de la base si una página falla", async () => {
    const pedir = vi.fn(async () => ({
      data: null,
      error: { message: "permiso denegado" },
    }));

    await expect(leerPorPaginas(pedir)).rejects.toThrow("permiso denegado");
  });
});

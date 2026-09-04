import { beforeEach, describe, expect, it, vi } from "vitest";

import { afiliadoDeLaSesion } from "./afiliadoDeLaSesion";

const maybeSingle = vi.fn();

// vi.mock se iza (hoisting) por encima de los imports, así que
// afiliadoDeLaSesion.ts recibe esta versión de supabase-service incluso
// importado de forma estática arriba.
vi.mock("./supabase-service", () => ({
  getServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle }),
          }),
        }),
      }),
    }),
  }),
}));

// Cada test usa un id de organización distinto para que la caché por
// proceso de afiliadoDeLaSesion no contamine los resultados entre pruebas.

describe("afiliadoDeLaSesion", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  it("devuelve null sin consultar la base cuando no hay usuario (clave de API)", async () => {
    const resultado = await afiliadoDeLaSesion("org-1", null);

    expect(resultado).toBeNull();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("devuelve el sales_id cuando existe un afiliado vinculado activo", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { sales_id: 42 } });

    const resultado = await afiliadoDeLaSesion("org-2", "usuario-a");

    expect(resultado).toBe(42);
  });

  it("devuelve null cuando el usuario no está vinculado a ningún afiliado", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null });

    const resultado = await afiliadoDeLaSesion("org-3", "usuario-b");

    expect(resultado).toBeNull();
  });

  it("cachea un resultado positivo: la segunda llamada no vuelve a consultar", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { sales_id: 7 } });

    const primero = await afiliadoDeLaSesion("org-4", "usuario-c");
    const segundo = await afiliadoDeLaSesion("org-4", "usuario-c");

    expect(primero).toBe(7);
    expect(segundo).toBe(7);
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });
});

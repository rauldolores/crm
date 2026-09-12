import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEntitlements } from "@/lib/kontrolia-auth/facturacion";

import { olvidarDerechos, recargarDerechos } from "./useDerechos";

vi.mock("@/lib/env", () => ({
  env: { kontroliaApplicationSlug: "crm" },
}));

vi.mock("@/lib/kontrolia-auth/facturacion", () => ({
  facturacionDisponible: vi.fn(() => true),
  getEntitlements: vi.fn(),
}));

const getEntitlementsMock = vi.mocked(getEntitlements);

/**
 * `useDerechos.ts` guarda su estado en variables de módulo (una caché
 * compartida por toda la app, no un contexto de React — ver el comentario en
 * el propio archivo). `olvidarDerechos()` es la forma que el propio módulo
 * ya ofrece de volver a un estado limpio, así que se usa aquí para aislar
 * cada prueba en vez de intentar resetear el módulo entero.
 */
describe("recargarDerechos: reintentos automáticos tras un fallo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getEntitlementsMock.mockReset();
    olvidarDerechos();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reintenta solo tras la espera programada, sin que nadie lo pida de nuevo", async () => {
    // Arrange
    getEntitlementsMock
      .mockRejectedValueOnce(new Error("hipo transitorio"))
      .mockResolvedValueOnce({ access: "ok" } as never);

    // Act
    await recargarDerechos();

    // Assert: todavía no hay segundo intento
    expect(getEntitlementsMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    expect(getEntitlementsMock).toHaveBeenCalledTimes(2);
  });

  it("deja de reintentar tras el máximo de fallos seguidos", async () => {
    getEntitlementsMock.mockRejectedValue(new Error("siempre falla"));

    await recargarDerechos();
    for (const espera of [3000, 8000, 20000, 45000]) {
      await vi.advanceTimersByTimeAsync(espera);
    }
    // 1 intento inicial + 4 reintentos programados
    expect(getEntitlementsMock).toHaveBeenCalledTimes(5);

    await vi.advanceTimersByTimeAsync(200000);
    expect(getEntitlementsMock).toHaveBeenCalledTimes(5);
  });

  it("un éxito reinicia el contador: un fallo posterior vuelve a reintentar desde cero", async () => {
    getEntitlementsMock.mockResolvedValueOnce({ access: "ok" } as never);

    await recargarDerechos();
    await vi.advanceTimersByTimeAsync(200000);
    // Sin fallo, no se programó ningún reintento.
    expect(getEntitlementsMock).toHaveBeenCalledTimes(1);

    getEntitlementsMock
      .mockRejectedValueOnce(new Error("ahora sí falla"))
      .mockResolvedValueOnce({ access: "ok" } as never);
    await recargarDerechos();
    await vi.advanceTimersByTimeAsync(3000);
    // 1 (éxito) + 1 (fallo) + 1 (reintento a los 3s, la primera espera de la
    // escalera) = 3. Si el contador no se hubiera reiniciado, la espera
    // usada habría sido la segunda (8s) en vez de la primera.
    expect(getEntitlementsMock).toHaveBeenCalledTimes(3);
  });

  it("olvidarDerechos cancela un reintento que estaba programado", async () => {
    getEntitlementsMock.mockRejectedValue(new Error("falla"));

    await recargarDerechos();
    expect(getEntitlementsMock).toHaveBeenCalledTimes(1);

    olvidarDerechos();
    await vi.advanceTimersByTimeAsync(200000);
    // El reintento programado tras el primer fallo se canceló: no hay
    // segunda llamada.
    expect(getEntitlementsMock).toHaveBeenCalledTimes(1);
  });
});

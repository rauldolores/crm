import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    kontroliaAuthServerUrl: "https://auth.kontrolia.io",
    kontroliaAuthUrl: "https://x.supabase.co",
  },
}));

vi.mock("./client", () => ({
  getKontroliaAccessToken: vi.fn().mockResolvedValue("token-de-usuario"),
  getKontroliaClient: () => ({}),
}));

import { ErrorDeFacturacion, startCheckout } from "./facturacion";

const capturar = (respuesta: Partial<Response>) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ url: "https://checkout.stripe.com/s" }),
    ...respuesta,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

const entrada = {
  applicationSlug: "crm",
  planSlug: "pro",
  successUrl: "https://app.vinqulia.com/#/facturacion/ok",
  cancelUrl: "https://app.vinqulia.com/#/facturacion",
};

describe("startCheckout", () => {
  it("manda el intervalo elegido con el contrato de /api/billing/checkout y el token del usuario", async () => {
    const fetchMock = capturar({});

    const { url } = await startCheckout({ ...entrada, interval: "year" });

    const [destino, init] = fetchMock.mock.calls[0];
    expect(destino).toBe("https://auth.kontrolia.io/api/billing/checkout");
    expect(init.headers.Authorization).toBe("Bearer token-de-usuario");
    expect(JSON.parse(init.body)).toEqual({
      application: "crm",
      plan: "pro",
      interval: "year",
      successUrl: entrada.successUrl,
      cancelUrl: entrada.cancelUrl,
    });
    expect(url).toBe("https://checkout.stripe.com/s");
  });

  it("sin intervalo cobra mensual", async () => {
    const fetchMock = capturar({});

    await startCheckout(entrada);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).interval).toBe("month");
  });

  it("conserva el código HTTP y el texto de auth-server en el error", async () => {
    capturar({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Tu organización ya tiene este plan activo.",
      }),
    });

    const fallo = await startCheckout(entrada).catch((e: unknown) => e);

    expect(fallo).toBeInstanceOf(ErrorDeFacturacion);
    expect((fallo as ErrorDeFacturacion).status).toBe(409);
    expect((fallo as ErrorDeFacturacion).message).toBe(
      "Tu organización ya tiene este plan activo.",
    );
  });
});

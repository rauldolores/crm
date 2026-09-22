import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@kontrolia/auth/server", () => ({
  reportUsage: vi.fn(),
}));
vi.mock("./configuracionDeUso", () => ({
  configuracionDeUso: () => ({
    authServerUrl: "https://auth.kontrolia.io",
    apiKey: "kapp_prueba",
    applicationSlug: "crm",
  }),
}));

import { reportUsage, type UsageReport } from "@kontrolia/auth/server";

import {
  CABECERA_EXCEDENTE,
  cabeceraDeExcedente,
  conAvisoDeExcedente,
  contarUso,
  exigirCupo,
} from "./consumo";

const reportUsageMock = vi.mocked(reportUsage);

/** Un reporte de KontrolIA Auth ≥ 2.5, con los campos de excedente. */
const reporte = (overrides: Partial<UsageReport> = {}): UsageReport => ({
  key: "contactos.registrados",
  used: 150,
  limit: 150,
  remaining: 0,
  period: "month",
  periodStart: "2026-09-01",
  exceeded: false,
  planSlug: "plan-pro",
  overagePriceAmount: null,
  overageUnits: 0,
  overageAmount: 0,
  currency: "MXN",
  ...overrides,
});

describe("exigirCupo", () => {
  beforeEach(() => {
    reportUsageMock.mockReset();
  });

  it("(a) límite agotado sin precio por excedente → 402, como siempre", async () => {
    // Arrange
    reportUsageMock.mockResolvedValue(reporte({ overagePriceAmount: null }));

    // Act
    const bloqueo = await exigirCupo("org-1", "contactos.registrados");

    // Assert
    expect(bloqueo?.status).toBe(402);
    const cuerpo = (await bloqueo!.json()) as { message: string };
    expect(cuerpo.message).toContain("150 de 150 este mes");
  });

  it("(b) límite agotado con precio por excedente → deja pasar", async () => {
    reportUsageMock.mockResolvedValue(
      reporte({ exceeded: true, overagePriceAmount: 350 }),
    );

    const bloqueo = await exigirCupo("org-1", "contactos.registrados");

    expect(bloqueo).toBeNull();
    // Y sigue sin consumir nada al comprobar (amount 0).
    expect(reportUsageMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amount: 0 }),
    );
  });

  it("con precio, tampoco corta una alta múltiple que se pasa del cupo", async () => {
    reportUsageMock.mockResolvedValue(
      reporte({ used: 148, remaining: 2, overagePriceAmount: 350 }),
    );

    expect(await exigirCupo("org-1", "contactos.registrados", 50)).toBeNull();
  });

  it("(d) sin precio, una alta múltiple que no cabe sigue rechazándose entera", async () => {
    reportUsageMock.mockResolvedValue(reporte({ used: 148, remaining: 2 }));

    const bloqueo = await exigirCupo("org-1", "contactos.registrados", 50);

    expect(bloqueo?.status).toBe(402);
  });

  it("con cupo de sobra deja pasar aunque haya precio", async () => {
    reportUsageMock.mockResolvedValue(
      reporte({ used: 10, remaining: 140, overagePriceAmount: 350 }),
    );
    expect(await exigirCupo("org-1", "contactos.registrados")).toBeNull();
  });
});

describe("aviso de excedente", () => {
  beforeEach(() => {
    reportUsageMock.mockReset();
  });

  it("(c) contar por encima del límite devuelve el acumulado y la respuesta lo lleva en la cabecera", async () => {
    // Arrange: KontrolIA ya cuenta 12 unidades extra a $3.50.
    reportUsageMock.mockResolvedValue(
      reporte({
        used: 162,
        exceeded: true,
        overagePriceAmount: 350,
        overageUnits: 12,
        overageAmount: 4200,
      }),
    );

    // Act
    const uso = await contarUso("org-1", "contactos.registrados", 162);
    const respuesta = conAvisoDeExcedente(Response.json({ ok: true }), [uso]);

    // Assert
    expect(uso).toMatchObject({ overageUnits: 12, overageAmount: 4200 });
    const cabecera = respuesta.headers.get(CABECERA_EXCEDENTE);
    expect(cabecera).not.toBeNull();
    expect(JSON.parse(cabecera!)).toMatchObject({
      key: "contactos.registrados",
      limit: 150,
      overagePriceAmount: 350,
      overageUnits: 12,
      overageAmount: 4200,
      currency: "MXN",
    });
    expect(await respuesta.json()).toEqual({ ok: true });
  });

  it("sin precio por excedente no hay cabecera, aunque se haya pasado", () => {
    expect(
      cabeceraDeExcedente(
        reporte({ used: 160, exceeded: true, overagePriceAmount: null }),
      ),
    ).toBeNull();
    expect(cabeceraDeExcedente(null)).toBeNull();
  });

  it("con cupo no hay cabecera, aunque haya precio", () => {
    const respuesta = conAvisoDeExcedente(Response.json({}), [
      reporte({ used: 10, remaining: 140, overagePriceAmount: 350 }),
    ]);
    expect(respuesta.headers.get(CABECERA_EXCEDENTE)).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registrarDecisiones } from "./auditoria";

const insert = vi.fn();

vi.mock("../supabase-service", () => ({
  getServiceClient: () => ({ from: () => ({ insert }) }),
}));

const ORG = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("registrarDecisiones", () => {
  it("guarda la decisión con su confianza, el modelo y la fila afectada", async () => {
    await registrarDecisiones(ORG, [
      {
        kind: "ticket_priority",
        value: "urgent",
        confianza: 0.912,
        aplicada: true,
        entidad: { tabla: "tickets", id: 42 },
      },
    ]);

    expect(insert).toHaveBeenCalledWith([
      {
        organization_id: ORG,
        kind: "ticket_priority",
        value: "urgent",
        confidence: 0.912,
        applied: true,
        model: "jev-latest",
        entity_table: "tickets",
        entity_id: 42,
        detalle: null,
      },
    ]);
  });

  it("apunta varias decisiones de una sola pregunta en una sola inserción", async () => {
    await registrarDecisiones(ORG, [
      { kind: "ticket_priority", value: "high", confianza: 0.8, aplicada: true },
      {
        kind: "ticket_category",
        value: "billing",
        confianza: 0.5,
        aplicada: false,
      },
    ]);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toHaveLength(2);
  });

  it("redondea la confianza a tres decimales, que es lo que cabe en la columna", async () => {
    await registrarDecisiones(ORG, [
      {
        kind: "form_spam",
        value: "true",
        confianza: 0.96745231,
        aplicada: true,
      },
    ]);

    expect(insert.mock.calls[0][0][0].confidence).toBe(0.967);
  });

  it("recorta el extracto: es una muestra para revisar, no una copia del mensaje", async () => {
    await registrarDecisiones(ORG, [
      {
        kind: "form_spam",
        value: "true",
        confianza: 0.99,
        aplicada: true,
        detalle: "x".repeat(2000),
      },
    ]);

    expect(insert.mock.calls[0][0][0].detalle).toHaveLength(500);
  });

  it("no va a la base de datos si no hay nada que apuntar", async () => {
    await registrarDecisiones(ORG, []);
    await registrarDecisiones("", [
      { kind: "form_spam", value: "true", confianza: 1, aplicada: true },
    ]);

    expect(insert).not.toHaveBeenCalled();
  });

  it("nunca hace fallar la operación de la que da constancia", async () => {
    insert.mockRejectedValue(new Error("base caída"));

    // Perder una estadística es un problema pequeño; romper por ella el
    // ticket de un cliente sería un problema grande.
    await expect(
      registrarDecisiones(ORG, [
        {
          kind: "ticket_priority",
          value: "urgent",
          confianza: 0.9,
          aplicada: true,
        },
      ]),
    ).resolves.toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  correccionDeTiempoSchema,
  formatearMinutos,
  hoyEnMexico,
  registroDeTiempoSchema,
} from "./soporteTiempos";

const base = {
  ticketId: 7,
  minutos: 45,
  descripcionCliente: "Se configuró el certificado de sello digital.",
};

describe("registroDeTiempoSchema", () => {
  it("acepta un registro mínimo y lo deja descontando de la bolsa", () => {
    const resultado = registroDeTiempoSchema.parse(base);

    expect(resultado.consume).toBe(true);
    expect(resultado.motivoNoConsume).toBeNull();
    expect(resultado.notaInterna).toBeNull();
    expect(resultado.autorizadoEn).toBeNull();
  });

  it("rechaza minutos en cero, negativos o con decimales", () => {
    for (const minutos of [0, -10, 12.5]) {
      expect(
        registroDeTiempoSchema.safeParse({ ...base, minutos }).success,
      ).toBe(false);
    }
  });

  it("rechaza más de 24 horas en un solo registro", () => {
    expect(
      registroDeTiempoSchema.safeParse({ ...base, minutos: 1441 }).success,
    ).toBe(false);
  });

  it("exige una descripción para el cliente que no sea solo espacios", () => {
    const resultado = registroDeTiempoSchema.safeParse({
      ...base,
      descripcionCliente: "   ",
    });

    expect(resultado.success).toBe(false);
  });

  it("exige el motivo cuando el tiempo no descuenta de la bolsa", () => {
    const sinMotivo = registroDeTiempoSchema.safeParse({
      ...base,
      consume: false,
    });
    const conMotivo = registroDeTiempoSchema.parse({
      ...base,
      consume: false,
      motivoNoConsume: "FALLA_SISTEMA",
    });

    expect(sinMotivo.success).toBe(false);
    expect(conMotivo.motivoNoConsume).toBe("FALLA_SISTEMA");
  });

  it("descarta el motivo si el tiempo sí descuenta", () => {
    const resultado = registroDeTiempoSchema.parse({
      ...base,
      consume: true,
      motivoNoConsume: "CORTESIA",
    });

    expect(resultado.motivoNoConsume).toBeNull();
  });

  it("pone la hora de la autorización cuando se indica quién autorizó", () => {
    const resultado = registroDeTiempoSchema.parse({
      ...base,
      autorizadoPor: "Ana López, por correo",
    });

    expect(resultado.autorizadoPor).toBe("Ana López, por correo");
    expect(resultado.autorizadoEn).not.toBeNull();
  });

  it("rechaza una fecha que no sea AAAA-MM-DD", () => {
    expect(
      registroDeTiempoSchema.safeParse({ ...base, fechaAtencion: "20/10/2026" })
        .success,
    ).toBe(false);
  });
});

describe("correccionDeTiempoSchema", () => {
  it("exige el motivo de la corrección", () => {
    expect(
      correccionDeTiempoSchema.safeParse({ id: 3, motivo: "" }).success,
    ).toBe(false);
  });

  it("permite solo anular, sin minutos correctos", () => {
    const resultado = correccionDeTiempoSchema.parse({
      id: 3,
      motivo: "Se registró en el ticket equivocado",
    });

    expect(resultado.minutosCorrectos).toBeUndefined();
  });
});

describe("formatearMinutos", () => {
  it("muestra horas y minutos de forma legible", () => {
    expect(formatearMinutos(45)).toBe("45 min");
    expect(formatearMinutos(60)).toBe("1 h");
    expect(formatearMinutos(90)).toBe("1 h 30 min");
    expect(formatearMinutos(-75)).toBe("-1 h 15 min");
  });
});

describe("hoyEnMexico", () => {
  it("usa el día de México y no el de UTC", () => {
    // 1 de noviembre a las 02:00 UTC = 31 de octubre a las 20:00 en México.
    expect(hoyEnMexico(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10-31");
  });
});

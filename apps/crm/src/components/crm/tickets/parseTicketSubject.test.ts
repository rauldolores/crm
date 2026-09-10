import { describe, it, expect } from "vitest";

import { parseTicketSubject } from "./parseTicketSubject";

describe("parseTicketSubject", () => {
  it("extrae categoría y motivo de un ticket abierto por el agente de voz", () => {
    // Arrange
    const subject =
      "[other] [Preferencia por asistencia directa] Zuriel prefiere ayuda de un humano para cuestiones del diagnóstico.";

    // Act
    const result = parseTicketSubject(subject);

    // Assert
    expect(result).toEqual({
      tags: ["other", "Preferencia por asistencia directa"],
      title:
        "Zuriel prefiere ayuda de un humano para cuestiones del diagnóstico.",
    });
  });

  it("devuelve el asunto tal cual cuando no lleva prefijos", () => {
    const subject = "No puedo acceder a mi cuenta";

    expect(parseTicketSubject(subject)).toEqual({
      tags: [],
      title: "No puedo acceder a mi cuenta",
    });
  });

  it("admite un solo prefijo", () => {
    expect(parseTicketSubject("[product] No carga el dashboard")).toEqual({
      tags: ["product"],
      title: "No carga el dashboard",
    });
  });

  it("conserva el asunto original si solo quedan corchetes vacíos de contenido", () => {
    expect(parseTicketSubject("[other] [urgente]")).toEqual({
      tags: ["other", "urgente"],
      title: "[other] [urgente]",
    });
  });

  it("no deja que un asunto degenerado genere etiquetas sin límite", () => {
    const subject = Array.from({ length: 20 }, (_, i) => `[t${i}]`).join(" ");

    const result = parseTicketSubject(subject);

    expect(result.tags.length).toBeLessThanOrEqual(6);
  });
});

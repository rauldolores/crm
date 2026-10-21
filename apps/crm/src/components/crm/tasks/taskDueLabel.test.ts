import { describe, expect, it } from "vitest";

import { formatDueLabel } from "./taskDueLabel";

const now = new Date(2026, 9, 21, 12, 0);

describe("formatDueLabel", () => {
  it("dice cuántos días lleva vencida una tarea", () => {
    expect(formatDueLabel(new Date(2026, 9, 12, 9, 0).toISOString(), now)).toBe(
      "hace 9 d",
    );
  });

  it("muestra la hora cuando la tarea vence hoy a una hora concreta", () => {
    expect(
      formatDueLabel(new Date(2026, 9, 21, 9, 30).toISOString(), now),
    ).toBe("hoy, 9:30");
  });

  it("omite la hora cuando la tarea vence hoy sin hora", () => {
    expect(formatDueLabel(new Date(2026, 9, 21).toISOString(), now)).toBe(
      "hoy",
    );
  });

  it("usa ayer y mañana para los días contiguos", () => {
    expect(formatDueLabel(new Date(2026, 9, 20).toISOString(), now)).toBe(
      "ayer",
    );
    expect(formatDueLabel(new Date(2026, 9, 22).toISOString(), now)).toBe(
      "mañana",
    );
  });

  it("cuenta los días que faltan dentro de la semana y da la fecha después", () => {
    expect(formatDueLabel(new Date(2026, 9, 25).toISOString(), now)).toBe(
      "en 4 d",
    );
    expect(formatDueLabel(new Date(2026, 10, 3).toISOString(), now)).toBe(
      "3 nov",
    );
  });
});

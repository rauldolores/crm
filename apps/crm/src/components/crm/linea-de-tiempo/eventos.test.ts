import { describe, expect, it } from "vitest";

import {
  agruparPorMes,
  claveDeEtiqueta,
  fragmentoCon,
  iconoDelEvento,
  resumenDe,
} from "./eventos";
import { getActivityTypeIcon } from "../notes/noteModel";

describe("resumenDe", () => {
  it("toma la primera línea con contenido, sin marcas de Markdown", () => {
    expect(
      resumenDe("\n\n## Llamada con **Ana**\n- Pidió [precio](http://x) anual"),
    ).toBe("Llamada con Ana");
  });

  it("recorta a una línea legible con puntos suspensivos", () => {
    const largo = "a".repeat(200);
    const resumen = resumenDe(largo);
    expect(resumen.length).toBeLessThanOrEqual(161);
    expect(resumen.endsWith("…")).toBe(true);
  });

  it("es vacío sin texto", () => {
    expect(resumenDe(null)).toBe("");
    expect(resumenDe("   \n  ")).toBe("");
  });
});

describe("fragmentoCon", () => {
  it("enseña el trozo de la nota donde aparece lo buscado, con contexto a cada lado", () => {
    // Arrange: la coincidencia está en el tercer párrafo, lejos del inicio.
    const nota = [
      "## Reunión de seguimiento",
      "Primer párrafo con muchas palabras que no vienen al caso ".repeat(3),
      "Al final preguntó por la **garantía** extendida del equipo y quedó en avisar.",
    ].join("\n\n");

    // Act
    const fragmento = fragmentoCon(nota, "GARANTÍA");

    // Assert: contexto por delante y por detrás, sin Markdown, con elipsis.
    expect(fragmento).toMatch(/^…\S+ /); // empieza en palabra entera
    expect(fragmento).toContain("preguntó por la garantía extendida");
    expect(fragmento).not.toContain("**");
    expect(fragmento.length).toBeLessThan(nota.length);
  });

  it("sin coincidencia cae en el resumen normal", () => {
    expect(fragmentoCon("## Solo la primera línea\nOtra", "zzz")).toBe(
      "Solo la primera línea",
    );
    expect(fragmentoCon(null, "algo")).toBe("");
  });
});

describe("agruparPorMes", () => {
  it("agrupa eventos consecutivos del mismo mes, en el orden recibido", () => {
    const grupos = agruparPorMes([
      { id: 1, date: "2026-09-15T10:00:00Z" },
      { id: 2, date: "2026-09-02T10:00:00Z" },
      { id: 3, date: "2026-07-20T10:00:00Z" },
    ]);
    expect(grupos.map((g) => [g.mes, g.eventos.length])).toEqual([
      ["Septiembre de 2026", 2],
      ["Julio de 2026", 1],
    ]);
  });
});

describe("claveDeEtiqueta e iconoDelEvento", () => {
  it("distingue una oportunidad ganada de una archivada por otra razón", () => {
    expect(
      claveDeEtiqueta({ kind: "deal", type: "deal_archived", status: "won" }),
    ).toBe("crm.timeline.events.deal_won");
    expect(
      claveDeEtiqueta({ kind: "deal", type: "deal_archived", status: "lost" }),
    ).toBe("crm.timeline.events.deal_archived");
    expect(
      claveDeEtiqueta({ kind: "ticket", type: "ticket_closed", status: null }),
    ).toBe("crm.timeline.events.ticket_closed");
  });

  it("las notas usan el icono de su tipo de actividad", () => {
    expect(iconoDelEvento({ kind: "note", type: "call" })).toBe(
      getActivityTypeIcon("call"),
    );
    expect(iconoDelEvento({ kind: "task", type: "task_done" })).not.toBe(
      getActivityTypeIcon("note"),
    );
  });
});

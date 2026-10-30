import {
  destinosPosibles,
  diasHabiles,
  errorDelResultado,
  etapaSugerida,
  primeraEtapa,
  repartirEnFechas,
  siguienteEtapa,
  tareaEnElEmbudo,
  type EmbudoDeMiDia,
} from "./etapas";

const prospeccion: EmbudoDeMiDia = {
  value: "prospeccion-fria",
  label: "Prospección fría",
  stages: [
    { value: "opportunity", label: "Por contactar" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "correo", label: "Correo" },
    { value: "llamada", label: "Llamada" },
    { value: "lost", label: "Descartado" },
  ],
  lostStages: ["lost"],
  pipelineStatuses: [],
};

const ventas: EmbudoDeMiDia = {
  value: "ventas",
  label: "Ventas",
  stages: [
    { value: "opportunity", label: "Oportunidad" },
    { value: "won", label: "Ganada" },
    { value: "lost", label: "Perdida" },
    { value: "delayed", label: "Aplazada" },
  ],
  lostStages: ["lost"],
  pipelineStatuses: ["won"],
};

const contextoBase = {
  embudo: prospeccion,
  etapaActual: "opportunity",
  exigirIngresoParaGanar: true,
  motivosDePerdida: ["price", "no-response"],
  tieneTarea: false,
  tieneContacto: true,
};

describe("siguienteEtapa", () => {
  it("avanza al siguiente canal de la cadencia", () => {
    expect(siguienteEtapa(prospeccion, "opportunity")?.label).toBe("WhatsApp");
    expect(siguienteEtapa(prospeccion, "correo")?.label).toBe("Llamada");
  });

  it("no propone descartar al llegar al final de la cadencia", () => {
    expect(siguienteEtapa(prospeccion, "llamada")).toBeNull();
  });

  it("salta las etapas ganadas y de pérdida", () => {
    expect(siguienteEtapa(ventas, "opportunity")?.value).toBe("delayed");
  });

  it("no avanza desde una etapa que no es del embudo", () => {
    expect(siguienteEtapa(prospeccion, "inexistente")).toBeNull();
  });
});

describe("etapaSugerida", () => {
  it("lleva a la etapa que se llama como el canal usado", () => {
    expect(etapaSugerida(prospeccion, "opportunity", "Llamada")?.value).toBe(
      "llamada",
    );
  });

  it("no distingue mayúsculas ni acentos", () => {
    expect(etapaSugerida(prospeccion, "opportunity", "whatsápp")?.value).toBe(
      "whatsapp",
    );
  });

  it("nunca regresa a una etapa anterior", () => {
    expect(etapaSugerida(prospeccion, "llamada", "WhatsApp")).toBeNull();
  });

  it("sin canal o sin etapa del canal, avanza a la siguiente", () => {
    expect(etapaSugerida(prospeccion, "opportunity", null)?.value).toBe(
      "whatsapp",
    );
    expect(etapaSugerida(prospeccion, "opportunity", "Reunión")?.value).toBe(
      "whatsapp",
    );
  });
});

describe("primeraEtapa", () => {
  it("es donde esperan los prospectos sin tocar", () => {
    expect(primeraEtapa(prospeccion)?.value).toBe("opportunity");
  });
});

describe("destinosPosibles", () => {
  it("deja fuera la etapa actual y las de pérdida", () => {
    const valores = destinosPosibles(prospeccion, "whatsapp", true).map(
      (etapa) => etapa.value,
    );
    expect(valores).toEqual(["opportunity", "correo", "llamada"]);
  });

  it("solo ofrece ganar si no se exige un ingreso", () => {
    expect(
      destinosPosibles(ventas, "opportunity", true).map((e) => e.value),
    ).toEqual(["delayed"]);
    expect(
      destinosPosibles(ventas, "opportunity", false).map((e) => e.value),
    ).toEqual(["won", "delayed"]);
  });
});

describe("errorDelResultado", () => {
  it("acepta mover a una etapa de trabajo del embudo", () => {
    expect(
      errorDelResultado({ tipo: "mover", etapa: "whatsapp" }, contextoBase),
    ).toBeNull();
  });

  it("rechaza mover a una etapa de pérdida sin pasar por descartar", () => {
    expect(
      errorDelResultado({ tipo: "mover", etapa: "lost" }, contextoBase),
    ).not.toBeNull();
  });

  it("rechaza ganar cuando se exige un ingreso", () => {
    expect(
      errorDelResultado(
        { tipo: "mover", etapa: "won" },
        { ...contextoBase, embudo: ventas },
      ),
    ).not.toBeNull();
  });

  it("rechaza mover cuando no hay oportunidad", () => {
    expect(
      errorDelResultado(
        { tipo: "mover", etapa: "whatsapp" },
        { ...contextoBase, embudo: null, etapaActual: null },
      ),
    ).not.toBeNull();
  });

  it("exige un motivo de la lista para descartar", () => {
    expect(
      errorDelResultado({ tipo: "descartar", motivo: "price" }, contextoBase),
    ).toBeNull();
    expect(
      errorDelResultado({ tipo: "descartar", motivo: "otro" }, contextoBase),
    ).not.toBeNull();
  });

  it("rechaza descartar en un embudo sin etapa de pérdida", () => {
    expect(
      errorDelResultado(
        { tipo: "descartar", motivo: "price" },
        { ...contextoBase, embudo: { ...prospeccion, lostStages: [] } },
      ),
    ).not.toBeNull();
  });

  it("rechaza posponer con una fecha inválida o sin contacto ni tarea", () => {
    expect(
      errorDelResultado({ tipo: "posponer", fecha: "mañana" }, contextoBase),
    ).not.toBeNull();
    expect(
      errorDelResultado(
        { tipo: "posponer", fecha: "2026-10-27T15:00:00.000Z" },
        { ...contextoBase, tieneContacto: false },
      ),
    ).not.toBeNull();
    expect(
      errorDelResultado(
        { tipo: "posponer", fecha: "2026-10-27T15:00:00.000Z" },
        contextoBase,
      ),
    ).toBeNull();
  });
});

describe("diasHabiles", () => {
  it("salta el fin de semana", () => {
    // Viernes 30 de octubre de 2026.
    const viernes = new Date(2026, 9, 30, 18, 0);
    const dias = diasHabiles(viernes, 2).map((dia) => [
      dia.getDate(),
      dia.getHours(),
    ]);
    expect(dias).toEqual([
      [2, 9],
      [3, 9],
    ]);
  });
});

describe("repartirEnFechas", () => {
  it("pone `porDia` en cada fecha y lo que sobra en la última", () => {
    const reparto = repartirEnFechas([1, 2, 3, 4, 5], ["a", "b"], 2);
    expect(reparto.map((r) => r.fecha)).toEqual(["a", "a", "b", "b", "b"]);
  });

  it("no reparte sin fechas", () => {
    expect(repartirEnFechas([1], [], 2)).toEqual([]);
  });
});

describe("tareaEnElEmbudo", () => {
  it("deja fuera la tarea de un contacto que solo está en otro embudo", () => {
    expect(tareaEnElEmbudo(["prospeccion-fria"], "faqturia")).toBe(false);
  });

  it("incluye la tarea si el contacto tiene una oportunidad en el embudo", () => {
    expect(tareaEnElEmbudo(["prospeccion-fria", "faqturia"], "faqturia")).toBe(
      true,
    );
  });

  it("incluye en todos los embudos la tarea de un contacto sin oportunidades", () => {
    expect(tareaEnElEmbudo([], "faqturia")).toBe(true);
  });
});

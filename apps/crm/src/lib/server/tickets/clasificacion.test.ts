import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONFIANZA_MINIMA_AUTOMATICA,
  PRIORIDADES_DE_FABRICA,
  sugerirConModeloDeDecision,
} from "./clasificacion";

const CATEGORIAS = [
  { value: "billing", label: "Facturación" },
  { value: "bug", label: "Fallo del sistema" },
];

const TEXTO = {
  subject: "No puedo timbrar facturas",
  description: "Llevo dos días sin poder facturar y estoy perdiendo ventas.",
};

const responder = (answers: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ answers }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const cuerpoDeLaLlamada = (fetchMock: ReturnType<typeof vi.fn>) =>
  JSON.parse(fetchMock.mock.calls[0][1].body);

beforeEach(() => {
  vi.stubEnv("TYPESAFE_API_KEY", "clave-secreta");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sugerirConModeloDeDecision", () => {
  it("pregunta prioridad y categoría en una sola llamada", async () => {
    const fetchMock = responder({
      prioridad: { type: "choice", choice: "urgent", confidence: 0.91 },
      categoria: { type: "choice", choice: "billing" },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sugerencia).toEqual({
      priority: "urgent",
      category: "billing",
      confianza: 0.91,
      motivo: null,
      decisiones: [
        {
          kind: "ticket_priority",
          value: "urgent",
          confianza: 0.91,
          aplicada: true,
        },
        {
          kind: "ticket_category",
          value: "billing",
          confianza: null,
          aplicada: true,
        },
      ],
    });
  });

  it("ofrece las opciones de Ajustes como criterios, con sus etiquetas", async () => {
    const fetchMock = responder({
      prioridad: { type: "choice", choice: "low" },
    });

    await sugerirConModeloDeDecision(TEXTO, PRIORIDADES_DE_FABRICA, CATEGORIAS);

    const { questions, state } = cuerpoDeLaLlamada(fetchMock);
    expect(Object.keys(questions.prioridad.criteria)).toEqual([
      "low",
      "normal",
      "high",
      "urgent",
    ]);
    expect(questions.categoria.criteria.billing).toBe("Facturación");
    expect(state).toEqual({
      asunto: TEXTO.subject,
      descripcion: TEXTO.description,
    });
  });

  it("no pregunta por la categoría si la organización no tiene ninguna", async () => {
    const fetchMock = responder({ prioridad: { type: "choice", choice: "normal" } });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      [],
    );

    expect(cuerpoDeLaLlamada(fetchMock).questions.categoria).toBeUndefined();
    expect(sugerencia?.category).toBeNull();
  });

  it("deja la categoría vacía cuando ninguna encaja", async () => {
    responder({
      prioridad: { type: "choice", choice: "normal" },
      categoria: { type: "choice", choice: "_ninguna" },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
    );

    expect(sugerencia?.category).toBeNull();
    expect(sugerencia?.priority).toBe("normal");
  });

  it("descarta un valor que no esté en las listas de Ajustes", async () => {
    responder({
      prioridad: { type: "choice", choice: "catastrofico" },
      categoria: { type: "choice", choice: "inventada" },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
    );

    expect(sugerencia?.priority).toBeNull();
    expect(sugerencia?.category).toBeNull();
  });

  it("no llama a la API sin clave del despliegue", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({});

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
    );

    expect(sugerencia).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve null si el clasificador falla, para que el llamante decida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(
      await sugerirConModeloDeDecision(TEXTO, PRIORIDADES_DE_FABRICA, CATEGORIAS),
    ).toBeNull();
  });
});

describe("umbral de confianza del camino automático", () => {
  it("con confianza suficiente escribe la clasificación", async () => {
    responder({
      prioridad: { type: "choice", choice: "urgent", confidence: 0.95 },
      categoria: { type: "choice", choice: "billing", confidence: 0.9 },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
      CONFIANZA_MINIMA_AUTOMATICA,
    );

    expect(sugerencia).toMatchObject({ priority: "urgent", category: "billing" });
  });

  it("deja vacío lo que no alcanza el umbral, campo por campo", async () => {
    responder({
      prioridad: { type: "choice", choice: "urgent", confidence: 0.95 },
      categoria: { type: "choice", choice: "billing", confidence: 0.4 },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
      CONFIANZA_MINIMA_AUTOMATICA,
    );

    // La prioridad pasa; la categoría dudosa se queda sin poner, que es
    // visible y cualquiera puede llenarla.
    expect(sugerencia).toMatchObject({ priority: "urgent", category: null });
  });

  it("una respuesta sin confianza no pasa el corte", async () => {
    responder({ prioridad: { type: "choice", choice: "urgent" } });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      [],
      CONFIANZA_MINIMA_AUTOMATICA,
    );

    expect(sugerencia?.priority).toBeNull();
  });

  it("sin umbral (botón manual) devuelve la sugerencia tal cual", async () => {
    responder({
      prioridad: { type: "choice", choice: "urgent", confidence: 0.3 },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      [],
    );

    // Ahí hay una persona mirando: ve el valor y lo corrige si no cuadra.
    expect(sugerencia).toMatchObject({ priority: "urgent", confianza: 0.3 });
  });
});

describe("constancia para la auditoría", () => {
  it("apunta lo que el modelo eligió aunque el umbral lo tire", async () => {
    responder({
      prioridad: { type: "choice", choice: "urgent", confidence: 0.95 },
      categoria: { type: "choice", choice: "billing", confidence: 0.4 },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      CATEGORIAS,
      CONFIANZA_MINIMA_AUTOMATICA,
    );

    // Sin esto, un campo vacío no distinguiría «no supo» de «supo y no se le
    // creyó», que es justo lo que hace falta para mover el umbral.
    expect(sugerencia?.decisiones).toEqual([
      {
        kind: "ticket_priority",
        value: "urgent",
        confianza: 0.95,
        aplicada: true,
      },
      {
        kind: "ticket_category",
        value: "billing",
        confianza: 0.4,
        aplicada: false,
      },
    ]);
  });

  it("no inventa una constancia de lo que no se preguntó", async () => {
    responder({ prioridad: { type: "choice", choice: "normal" } });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      [],
    );

    expect(sugerencia?.decisiones).toEqual([
      {
        kind: "ticket_priority",
        value: "normal",
        confianza: null,
        aplicada: true,
      },
    ]);
  });

  it("marca como no aplicada una elección que no está en Ajustes", async () => {
    responder({
      prioridad: { type: "choice", choice: "catastrofico", confidence: 0.99 },
    });

    const sugerencia = await sugerirConModeloDeDecision(
      TEXTO,
      PRIORIDADES_DE_FABRICA,
      [],
    );

    // Confianza altísima en un valor que no existe: la constancia lo guarda
    // tal cual, porque una racha de estas significa que las listas de esa
    // organización y los criterios ya no cuadran.
    expect(sugerencia?.decisiones).toEqual([
      {
        kind: "ticket_priority",
        value: "catastrofico",
        confianza: 0.99,
        aplicada: false,
      },
    ]);
  });
});

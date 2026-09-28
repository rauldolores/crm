import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  hayClasificador,
  preguntarAlClasificador,
} from "./clasificador";

const responder = (datos: unknown, ok = true, status = 200) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => datos,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const PREGUNTA_DE_PRIORIDAD = {
  prioridad: {
    type: "choice" as const,
    instructions: "Con qué urgencia hay que atenderlo",
    criteria: { urgent: "No puede operar", low: "Puede esperar" },
  },
};

beforeEach(() => {
  vi.stubEnv("TYPESAFE_API_KEY", "clave-secreta");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("hayClasificador", () => {
  it("es falso sin clave en el entorno", () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    expect(hayClasificador()).toBe(false);
  });

  it("es cierto con clave", () => {
    expect(hayClasificador()).toBe(true);
  });
});

describe("preguntarAlClasificador", () => {
  it("manda el modelo, el estado y las preguntas con la clave en Bearer", async () => {
    const fetchMock = responder({
      model: "jev-1.13.0",
      answers: { prioridad: { type: "choice", choice: "urgent" } },
    });

    await preguntarAlClasificador(
      { asunto: "No puedo cobrar" },
      PREGUNTA_DE_PRIORIDAD,
    );

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(opciones.headers.Authorization).toBe("Bearer clave-secreta");
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.model).toBe("jev-latest");
    expect(cuerpo.state).toEqual({ asunto: "No puedo cobrar" });
    expect(cuerpo.questions.prioridad.type).toBe("choice");
  });

  it("devuelve las respuestas con su probabilidad", async () => {
    responder({
      answers: {
        prioridad: {
          type: "choice",
          choice: "urgent",
          confidence: 0.78,
          probabilities: { urgent: 0.85, low: 0.15 },
        },
      },
    });

    const resultado = await preguntarAlClasificador({}, PREGUNTA_DE_PRIORIDAD);

    expect(resultado.ok).toBe(true);
    expect(resultado.respuestas?.prioridad.choice).toBe("urgent");
    expect(resultado.respuestas?.prioridad.confidence).toBe(0.78);
  });

  it("no llama a la API si no hay clave", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({});

    const resultado = await preguntarAlClasificador({}, PREGUNTA_DE_PRIORIDAD);

    expect(resultado.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no llama a la API sin preguntas que hacer", async () => {
    const fetchMock = responder({});

    const resultado = await preguntarAlClasificador({}, {});

    expect(resultado.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve el mensaje de la API cuando rechaza la clave", async () => {
    responder({ error: { message: "Invalid API key" } }, false, 401);

    const resultado = await preguntarAlClasificador({}, PREGUNTA_DE_PRIORIDAD);

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toBe("Invalid API key");
  });

  it("reintenta cuando la API está saturada y se queda con la respuesta buena", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 529, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          answers: { prioridad: { type: "choice", choice: "low" } },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await preguntarAlClasificador({}, PREGUNTA_DE_PRIORIDAD);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(resultado.respuestas?.prioridad.choice).toBe("low");
  });

  it("se rinde tras los reintentos si la saturación no pasa", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await preguntarAlClasificador({}, PREGUNTA_DE_PRIORIDAD);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(resultado.ok).toBe(false);
  });

  it("no revienta si la red falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const resultado = await preguntarAlClasificador({}, PREGUNTA_DE_PRIORIDAD);

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toContain("No se pudo contactar");
  });
});

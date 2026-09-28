import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clasificarComentario } from "./temaDeEncuesta";

const responder = (answers: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ answers }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  vi.stubEnv("TYPESAFE_API_KEY", "clave-secreta");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("clasificarComentario", () => {
  it("clasifica el tema y detecta que el cliente sigue esperando", async () => {
    const fetchMock = responder({
      tema: { type: "choice", choice: "response_time", confidence: 0.88 },
      seguimiento: { type: "noul", noul: 0.93 },
    });

    const juicio = await clasificarComentario(
      "Tardaron cuatro días y sigo sin poder facturar.",
      2,
    );

    expect(juicio.tema).toBe("response_time");
    expect(juicio.seguimiento).toBe(true);
    // Una sola llamada: las dos preguntas viajan juntas.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("afirma que no hace falta seguimiento solo cuando la probabilidad es baja", async () => {
    responder({
      tema: { type: "choice", choice: "praise", confidence: 0.95 },
      seguimiento: { type: "noul", noul: 0.05 },
    });

    const juicio = await clasificarComentario("Todo excelente, gracias.", 5);

    expect(juicio).toMatchObject({ tema: "praise", seguimiento: false });
  });

  it("no afirma nada cuando la probabilidad se queda en medio", async () => {
    responder({
      tema: { type: "choice", choice: "solution", confidence: 0.9 },
      seguimiento: { type: "noul", noul: 0.5 },
    });

    const juicio = await clasificarComentario("Bueno, ya veremos.", 3);

    // Ni sí ni no: la columna se queda vacía en vez de inventar una alarma o
    // de tranquilizar a nadie.
    expect(juicio.seguimiento).toBeNull();
    expect(juicio.decisiones).toContainEqual({
      kind: "survey_followup",
      value: null,
      confianza: 0.5,
      aplicada: false,
    });
  });

  it("descarta un tema dudoso, y lo deja apuntado", async () => {
    responder({
      tema: { type: "choice", choice: "price", confidence: 0.4 },
    });

    const juicio = await clasificarComentario("Meh.", 3);

    expect(juicio.tema).toBeNull();
    expect(juicio.decisiones).toEqual([
      {
        kind: "survey_topic",
        value: "price",
        confianza: 0.4,
        aplicada: false,
      },
    ]);
  });

  it("descarta un tema que no está en la lista", async () => {
    responder({
      tema: { type: "choice", choice: "inventado", confidence: 0.99 },
    });

    expect((await clasificarComentario("Algo.", 3)).tema).toBeNull();
  });

  it("no pregunta nada si no hay comentario que leer", async () => {
    const fetchMock = responder({});

    const juicio = await clasificarComentario("   ", 5);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(juicio).toEqual({ tema: null, seguimiento: null, decisiones: [] });
  });

  it("no pregunta nada sin clave del despliegue", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({});

    await clasificarComentario("Un comentario cualquiera.", 4);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la API falla, la encuesta se guarda sin tema", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    // Perder el tema es un problema pequeño; perder la respuesta de la única
    // encuesta que este cliente va a contestar, no.
    expect(await clasificarComentario("Muy mal servicio.", 1)).toEqual({
      tema: null,
      seguimiento: null,
      decisiones: [],
    });
  });
});

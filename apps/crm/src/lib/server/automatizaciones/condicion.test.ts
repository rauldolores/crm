import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { juzgarCondicion } from "./condicion";

const TEXTO =
  "No podemos timbrar desde ayer y ya estamos viendo otras opciones en el mercado.";

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

describe("juzgarCondicion", () => {
  it("manda la frase de la organización tal cual como instrucción", async () => {
    const fetchMock = responder({ condicion: { type: "noul", noul: 0.94 } });

    await juzgarCondicion("el cliente amenaza con irse", TEXTO);

    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.questions.condicion).toEqual({
      type: "noul",
      instructions: "el cliente amenaza con irse",
    });
    expect(cuerpo.state).toEqual({ texto: TEXTO });
  });

  it("se cumple cuando el modelo lo ve claro, y lo deja apuntado", async () => {
    responder({ condicion: { type: "noul", noul: 0.94 } });

    const juicio = await juzgarCondicion("el cliente amenaza con irse", TEXTO);

    expect(juicio.seCumple).toBe(true);
    expect(juicio.decision).toEqual({
      kind: "automation_condition",
      value: "true",
      confianza: 0.94,
      aplicada: true,
    });
  });

  it("no actúa con una probabilidad a medias", async () => {
    responder({ condicion: { type: "noul", noul: 0.55 } });

    const juicio = await juzgarCondicion("el cliente amenaza con irse", TEXTO);

    // Aquí no se rellena un campo que alguien pueda corregir: se crea una
    // tarea o se le manda un correo a un cliente. Ante la duda, no.
    expect(juicio.seCumple).toBe(false);
    expect(juicio.probabilidad).toBe(0.55);
    expect(juicio.decision).toMatchObject({ value: "false", aplicada: false });
  });

  it("no actúa si la API falla, y dice por qué para que se reintente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await juzgarCondicion("pide una demo", TEXTO)).toEqual({
      seCumple: false,
      probabilidad: null,
      motivo: "sin-respuesta",
    });
  });

  it("no actúa si la respuesta no trae la probabilidad esperada", async () => {
    responder({ condicion: { type: "noul" } });

    const juicio = await juzgarCondicion("pide una demo", TEXTO);

    expect(juicio).toMatchObject({ seCumple: false, motivo: "sin-respuesta" });
  });

  it("distingue «no hay clave» de «no contestó», porque se tratan distinto", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({ condicion: { type: "noul", noul: 0.99 } });

    const juicio = await juzgarCondicion("pide una demo", TEXTO);

    // Sin clave no se reintenta —no va a aparecer sola—, así que el motivo
    // tiene que poder distinguirse de una caída pasajera.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(juicio.motivo).toBe("sin-clasificador");
  });

  it("no pregunta nada sin frase o sin texto que juzgar", async () => {
    const fetchMock = responder({});

    expect((await juzgarCondicion("   ", TEXTO)).motivo).toBe("sin-respuesta");
    expect((await juzgarCondicion("pide una demo", "  ")).motivo).toBe(
      "sin-respuesta",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recorta el texto: se paga por token de entrada", async () => {
    const fetchMock = responder({ condicion: { type: "noul", noul: 0.1 } });

    await juzgarCondicion("pide una demo", "a".repeat(5000));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).state.texto).toHaveLength(
      2000,
    );
  });
});

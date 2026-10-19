import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sugerirMapeo } from "./mapeoDeColumnas";

const ORG = "11111111-1111-1111-1111-111111111111";

const decisiones = vi.fn();

vi.mock("../ia/auditoria", () => ({
  registrarDecisiones: (...args: unknown[]) => {
    decisiones(...args);
    return Promise.resolve();
  },
}));

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
  decisiones.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sugerirMapeo", () => {
  it("pregunta por todas las columnas en una sola llamada", async () => {
    const fetchMock = responder({
      c0: { type: "choice", choice: "first_name", confidence: 0.98 },
      c1: { type: "choice", choice: "email_work", confidence: 0.95 },
    });

    const mapeo = await sugerirMapeo(ORG, ["Nombre", "Correo"], {
      Correo: "ana@panaderia.mx",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mapeo).toEqual([
      { cabecera: "Nombre", campo: "first_name", confianza: 0.98 },
      { cabecera: "Correo", campo: "email_work", confianza: 0.95 },
    ]);
  });

  it("manda el primer valor de la columna, que a veces dice más que el nombre", async () => {
    const fetchMock = responder({
      c0: { type: "choice", choice: "email_work", confidence: 0.9 },
    });

    await sugerirMapeo(ORG, ["Col3"], { Col3: "ana@panaderia.mx" });

    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.state.c0).toEqual({
      cabecera: "Col3",
      primer_valor: "ana@panaderia.mx",
    });
  });

  it("deja sin proponer la columna que no encaja en ningún campo", async () => {
    responder({
      c0: { type: "choice", choice: "_ninguna", confidence: 0.93 },
    });

    const mapeo = await sugerirMapeo(ORG, ["Folio interno"]);

    expect(mapeo[0]).toMatchObject({ campo: null, confianza: 0.93 });
  });

  it("no acepta un campo que no existe", async () => {
    responder({
      c0: { type: "choice", choice: "telefono_movil", confidence: 0.99 },
    });

    expect((await sugerirMapeo(ORG, ["Celular"]))[0].campo).toBeNull();
  });

  it("no manda dos columnas al mismo campo: se queda la más segura", async () => {
    responder({
      c0: { type: "choice", choice: "first_name", confidence: 0.6 },
      c1: { type: "choice", choice: "first_name", confidence: 0.95 },
    });

    const mapeo = await sugerirMapeo(ORG, ["Nombre completo", "Nombre"]);

    // Dos columnas al mismo campo harían que una pisara a la otra sin avisar.
    expect(mapeo[0].campo).toBeNull();
    expect(mapeo[1].campo).toBe("first_name");
  });

  it("apunta cada columna con su cabecera, para saber qué nombres falla", async () => {
    responder({
      c0: { type: "choice", choice: "first_name", confidence: 0.98 },
    });

    await sugerirMapeo(ORG, ["Nombre"]);

    expect(decisiones).toHaveBeenCalledWith(ORG, [
      {
        kind: "csv_column",
        value: "first_name",
        confianza: 0.98,
        aplicada: false,
        detalle: "Nombre",
      },
    ]);
  });

  it("descarta cabeceras vacías y no pregunta si no queda ninguna", async () => {
    const fetchMock = responder({});

    expect(await sugerirMapeo(ORG, ["", "   "])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sin clave devuelve las columnas sin proponer, no un error", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({});

    const mapeo = await sugerirMapeo(ORG, ["Nombre", "Correo"]);

    // La pantalla tiene que poder pedir el mapeo a mano igual.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mapeo).toEqual([
      { cabecera: "Nombre", campo: null, confianza: null },
      { cabecera: "Correo", campo: null, confianza: null },
    ]);
    expect(decisiones).not.toHaveBeenCalled();
  });

  it("si la API falla, tampoco propone nada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect((await sugerirMapeo(ORG, ["Nombre"]))[0]).toEqual({
      cabecera: "Nombre",
      campo: null,
      confianza: null,
    });
  });
});
